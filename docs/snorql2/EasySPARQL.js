/**
EasySPARQL Query API Wrapper for Japan Search
created:  2018-12-08
modified: 2018-12-27
usage:
//初期化
var sqapi = new EasySPARQL(
	{"schema": "http://schema.org/", ...},	//名前空間マッピング。Snorqlのnamespaces.jsでOK
	100	//結果取得最大数
);
//SPARQLクエリ生成。引数なしならURLパラメータから取得。
var query = sqapi.gen_query();
//オブジェクトとして検索パラメータを与えても可
var query2 = sqapi.gen_query({"where": "三重県", "who": "小林一茶"});
*/

/**
 * EasySPARQLクラス
 * @param {Object} namespaces	名前空間マッピングオブジェクト
 * @param {Integer} limit	結果セットの最大数指定
 */
var EasySPARQL = function(namespaces, limit){
	//PREFIXとして宣言するための名前空間マッピングオブジェクト
	this.ns = namespaces;
	//共通の基本的なSELECT句変数
	this.base_select = "?s ?label ?creator ?type ";
	//共通の基本的なWHERE句
	//this.base_pattern = "?s rdfs:label ?label ; a/rdfs:label ?type .\n" +
	//	"\tOPTIONAL {?s schema:creator/rdfs:label ?creator .}";
	this.base_pattern = "?s rdfs:label ?label ; a ?type .\n" +
		"\tOPTIONAL {?s schema:creator ?creator .}";
	//結果セットの最大数指定（ユーザ指定で上書き）
	this.limit = limit;
	//結果セットの上限値（ユーザ指定を制限）
	this.max_limit = 500;
	//共通で用いる接頭辞
	this.base_pfx = ["jps", "schema", "rdfs"];
	var bp = this.base_pfx[0] + ":";	//jps:
	//クエリ記述に用いるプロパティQName
	this.prop = {
		agential: bp + "agential",
		spatial: bp + "spatial",
		temporal: bp + "temporal",
		era: bp + "era",
		start: bp + "start",
		end: bp + "end",
		value: bp + "value",
		within: bp + "within",
		sourceInfo: bp + "sourceInfo"
	};
	//メソッドごとの定義：{pfx: 追加で用いる接頭辞の配列, distinct: SELECT句にDISTINCTを加える場合true, select_more: 基本SELECTに追加する結果取得変数}
	this.defs = {
		when: {pfx: ["time"], distinct: true, select_more: "?when"},
		where: {pfx: ["place"], distinct: true, select_more: "?lat ?long"},
		who: {pfx: ["owl", "chname"], distinct: true, select_more: null},
		what: {pfx: ["type"], distinct: false, select_more: null},
		title: {pfx: null, distinct: false, select_more: null},
		keyword: {pfx: ["keyword"], distinct: true, select_more: "?class"},
		text: {pfx: [], distinct: true, select_more: null}
	};
	//Virtuosoのバグに対応するためのメソッド使用フラグ
	this.used = {when: false, where: false};
	//都道府県名の末尾"都""府""県"なし
	this.prefectures = ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "郡馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
};

EasySPARQL.prototype = {
	/**
	 * 実行メソッド
	 * @param {Object} qvars	{key: value}オブジェクト。省略するとURLパラメータから取得
	 * @return {String}	キー：値から生成したSPARQLクエリ
	 */
	gen_query: function(qvars){
		if(!qvars) qvars = this.parse_uri_param();
		var param = {
			triple_patterns: [],	//各変数メソッドが生成するトリプルパターンを格納
			pfx: this.base_pfx,	//クエリで用いる名前空間接頭辞配列
			select: this.base_select,	//SELECT句で選択する変数
			use_distinct: false,	//SELECT句でDISTINCTを用いるかどうかのフラグ
			limit: (qvars.limit && qvars.limit < this.max_limt)	//クエリの取得件数
				? qvars.limit : (this.limit || this.max_limit)
		};
		//処理の都合上、指定順に変数を確認して処理する
		for(var key in this.defs){
			var val;
			if((val = qvars[key])) this.prepare_one_tp(key, val, param);
		}
		//Snorqlからの呼び出し時など、URLパラメータに該当する変数がなければnullを返す
		if(param.triple_patterns.length === 0) return null;
	
		//各変数処理メソッドで設定したパラメータからSPARQLクエリを生成
		var query = this.prolog(param.pfx) +
		"SELECT " + (param.use_distinct ? "DISTINCT " : "") + param.select +
		"WHERE {\n\t" + this.base_pattern + "\n\t" + 
		param.triple_patterns.join("\n\t") +
		"\n} " + (param.limit ? "LIMIT " + param.limit : "");
		return query;
	},
	/**
	 * 一つの変数についてWHERE句のトリプルパターンを生成
	 * @param {String} key	クエリ生成変数のキー
	 * @param {String} val	変数の値
	 * @param {Object} param	クエリ設定のためのパラメータ
	 */
	prepare_one_tp: function(key, val, param){
		var def = this.defs[key];
		//接頭辞、DISTINCT、選択変数のパラメータ確認
		if(def.pfx) def.pfx.forEach(function(pfx){param.pfx.push(pfx);});
		if(def.distinct) param.use_distinct = true;
		if(def.select_more) param.select += def.select_more + " ";
		//キーに従ってthis[key]で変数処理メソッドを呼び出し、triple_patternsを設定
		param.triple_patterns.push(this[key](val));
	},
	/**
	 * クエリの名前空間URI宣言生成
	 * @param {Object} pfxs	名前空間の{pfx: URI}オブジェクト
	 * @return {String}	クエリのPREFIX句
	 */
	prolog: function(pfxs){
		var clause = "";
		pfxs.forEach(function(pfx){
			clause += "PREFIX " + pfx + ": <" + this.ns[pfx] + ">\n";
		}, this);
		return clause;
	},
	/**
	 * URLパラメータから{key: value}オブジェクトを生成
	 * @param {String} qstr	URLパラメータ（クエリ）文字列。与えなければブラウザの値を取得
	 * @return {Object} 	{key: value}オブジェクト
	 */
	parse_uri_param: function(qstr){
		if(!qstr) qstr = location.search.substr(1);
		var qvars = {};
		qstr.split(/[&;]/).forEach(function(kvs){
			var kfld,
			kv = kvs.match(/^([^=]+)=(.*)$/);	//who==漱石→["who==漱石", "who", "=漱石"]
			if(kv){
				qvars[kv[1]] = decodeURIComponent(kv[2].replace(/\+/g, " "));
				if((kfld = document.querySelector("input[name="+kv[1]+"]"))) kfld.value = qvars[kv[1]];
			}
		});
		return qvars;
	},
	/**
	 * 文字列の言語を簡易判定して（schema:nameの値を）言語タグ付き文字列にする
	 * @param {String} str	対象文字列
	 * @return {String}	引用符＋言語タグ付き文字列
	 */
	langstr: function(str){
		return "\"" + str + "\"@" + (str.match(/^[A-Z][a-z]+/) ? "en" : "ja");
	},
	
	//////////////////////////////// クエリパターン生成メソッド  ////////////////////////////////
	/**
	 * 時間をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	when: function(val){
		var matched,
		query = "?s ";
		if((matched = val.match(/^([\d\-]+)(,([\d\-]+))?$/))){
			//数字による年指定。カンマで区切ると年範囲
			var st = matched[1], ed = matched[3] || null;
			if(ed !== null && ed < st){
				//開始、終了年が逆転している場合
				st = matched[3]; ed = matched[1];
			}
			query += (ed === null)
			? "schema:temporal time:" + st + " . time:" + st + " rdfs:label ?when ."
			: "schema:temporal [" + this.prop.start + " ?start ; " + this.prop.end + " ?end ; rdfs:label ?when ].\n" +
				"\t\tFILTER(?start >= " + st + " && ?end <= " + ed + ")";
			
		}else if((matched = val.match(/^(~?)(明治|大正|昭和|平成|.*?時代)$/))){
			//時代名による指定
			var submatch = matched[2].match(/^(明治|大正|昭和|平成)時代$/),	//明治～平成は「時代」を加えない
			era = submatch ? submatch[1] : matched[2];
			if(matched[1]){
				//パラメータ値の先頭に~を付けると、時代の開始、終了年の範囲のtemporalを持つデータを検索。
				//これは日本以外のデータがマッチする可能性あり
				query += "schema:temporal [" + this.prop.start + " ?start ; " + this.prop.end + " ?end ; rdfs:label ?when ] .\n" +
				"\tFILTER(?start >= ?st && ?end <= ?ed)\n" +
				"\t{SELECT ?st ?ed WHERE {time:" + era + " " + this.prop.start + " ?st ; " + this.prop.end + " ?ed}}";
				
			}else{
				//そうでなければ、時代名が明示されたデータを検索
				//URLパラメータなら ?when=~江戸時代 という形
				query += this.prop.temporal + " [" + this.prop.era + " time:" + era + " ] . " +
				"time:" + era + " rdfs:label ?when .";
			}
			
		}else{
			//数字でも時代名でもないときは、値をrdfs:labelに持つもの（世紀など）
			query += "schema:temporal/rdfs:label \"" + val + "\" .";
		}
		this.used.when = true;
		return query;
	},
	/**
	 * 場所をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン。緯度経度も加える
	 */
	where: function(val){
		var matched,
		query = "?s ",
		geopat = "schema:geo [schema:latitude ?lat; schema:longitude ?long ] ";
		if((matched = val.match(/^(.{2,3}?)[都府県]?$/))	//{2,3}のみだと"京都府"は"府"も含めてマッチする
			&& (this.prefectures.indexOf(matched[1]) !== -1)
		){
			//JPSのplace:は都道府県なし（place:三重 など）
			query += this.prop.spatial + " ?place . ?place " + this.prop.value + " place:" + matched[1] + " .\n" +
			"\tOPTIONAL {?place " + geopat + "}";
			
		}else if((matched = val.match(/^([\d\-\.]+),([\d\-\.]+)$/))){
			//カンマ区切りの数値で緯度経度を指定すると、Geohashを計算してメッシュ内のデータを検索
			geohash = new Geohash();
			hash = geohash.encode(matched[1], matched[2]);
			query += this.prop.spatial + " ?sr . ?sr " + this.prop.within + "* <http://geohash.org/" +
			hash.substr(0, 5) + "> ;\n" + "\t\t" + geopat + ".";
			
		}else{
			//それ以外は値をラベルに持つ場所を検索
			//query =  + "\n\t" +
			query += this.prop.spatial + " ?sr . ?sr " + this.prop.value + "/schema:name " + 
			this.langstr(val) +" .\n" + "\tOPTIONAL {?sr " + geopat + "}";
		}
		this.used.where = true;
		return query;
	},
	/**
	 * 人をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	who: function(val){
		var matched;
		if((matched = val.match(/^~(.*)$/))){
			//パラメータ値の先頭に~を付けると、別名も含め名前を検索
			return "?s " + this.prop.agential + "/" + this.prop.value + "/owl:sameAs*/schema:name " + this.langstr(matched[1]) + " .";
			
		}else{
			//それ以外は辞書正規化名として検索
			return "?s " + this.prop.agential + "/" + this.prop.value + "/owl:sameAs* chname:" + val + " .";
		}
	},
	/**
	 * 型をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	what: function(val){
		var matched;
		if((matched = val.match(/^~(.*)$/))){
			//パラメータ値の先頭に~を付けると、上位クラスも含めて検索
			if(this.used.when || this.used.where){
				//＠＠when, whereがあるとa/rdfs:subClassOf*がa/rdfs:subClassOfのように解釈されてしまう
				return "{?s a type:" + val + " } UNION {?s a/rdfs:subClassOf type:" + matched[1] + " } ";
			}else{
				return "?s a/rdfs:subClassOf* type:" + matched[1] + " .";
			
			}
		}else{
			//それ以外はその型として検索
			return "?s a type:" + val + " .";
		}
	},
	/**
	 * タイトルの文字列をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	title: function(val){
		var matched;
		if((matched = val.match(/^=(.*)$/))){
			//パラメータ値の先頭に=を付けると、タイトルの完全一致
			query = "?s rdfs:label \"" + matched[1] + "\" .";
			
		}else{
			//それ以外はタイトルに文字列を含むものを検索
			query = "?s schema:name ?title.\n" +
			"\tFILTER(bif:contains(?title, '\"" + val + "\"')) .";
			
		}
		return query + "\n\t?s " + this.prop.sourceInfo + " ?source .";
	},
	/**
	 * キーワード（about）をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	keyword: function(val){
		var matched;
		if((matched = val.match(/^=(.*)$/))){
			//パラメータ値の先頭に=を付けると、辞書キーワードもしくは値が件名ラベルに完全一致するものを検索
			query += "{?s schema:about keyword:" + matched[1] + " .} UNION\n" +
			"\t{?s schema:about ?class. ?class rdfs:seeAlso*/rdfs:label \"" + matched[1] + "\" .}";
			
		}else{
			//それ以外は、辞書キーワードもしくは値が件名ラベルに含まれるものを検索
			query = "{?s schema:about keyword:" + val + " .} UNION\n" +
			"\t{?s schema:about ?class. ?class rdfs:seeAlso*/rdfs:label ?clabel .\n" +
			"\t\tFILTER(contains(?clabel, \"" + val + "\"))}";
		}
		return query;
	},
	/**
	 * 名前とdescriptionの文字列をキーにしたクエリ生成
	 * @param {String} val	変数値
	 * @return {String}	WHERE句のトリプルパターン
	 */
	text: function(val){
		var matched;
		return "?s ?p ?value.\n" +
		"\tFILTER(bif:contains(?value, '\"" + val + "\"')) .\n" +
		"\t?s " + this.prop.sourceInfo + " ?source .";
	},
	
	//// execute from Snorql
	doit: function(endpoint, qparam){
		var qvars = this.parse_uri_param();
		if(!(qparam.text = this.gen_query(qvars))) return true;
		var format = qvars.format || null;
		if(format && format.match(/(json|xml|turtle)/)){
			location.href = endpoint + "?query=" + encodeURIComponent(qparam.text) + "&format=" + format;
			return false;
		}
		qparam.query = qparam.urlstring = qparam.text;
		return true;
		//resultTitle = 'SPARQL results:';
	}
};

// Based on geohash.js by (c) 2008 David Troy
// Distributed under the MIT License
// https://github.com/davetroy/geohash-js/
var Geohash = function(){
	this.BITS = [16, 8, 4, 2, 1];
	this.BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
};
Geohash.prototype = {
	encode: function(latitude, longitude) {
		var is_even = 1, i = 0,
		lat = [], lon = [],
		bit = 0, ch = 0,
		precision = 12,
		geohash = "";

		lat[0] = -90.0;  lat[1] = 90.0;
		lon[0] = -180.0; lon[1] = 180.0;
		
		while (geohash.length < precision) {
			if (is_even) {
				mid = (lon[0] + lon[1]) / 2;
				if (longitude > mid) {
					ch |= this.BITS[bit];
					lon[0] = mid;
				} else
					lon[1] = mid;
			} else {
				mid = (lat[0] + lat[1]) / 2;
				if (latitude > mid) {
					ch |= this.BITS[bit];
					lat[0] = mid;
				} else
					lat[1] = mid;
			}
			is_even = !is_even;
			if (bit < 4)
				bit++;
			else {
				geohash += this.BASE32[ch];
				bit = 0;
				ch = 0;
			}
		}
		return geohash;
	}
};
