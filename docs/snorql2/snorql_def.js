//snorql.js / snorql_ldb.js custom configuration
var Snorqldef = {
	//overrides Snorql class variables
	vars: {
		_endpoint: "https://sparql.dl.itc.u-tokyo.ac.jp",
		_poweredByLink: "https://da.dl.itc.u-tokyo.ac.jp/portal",
		_poweredByLabel: "UTokyo Academic Archives Portal",
		default_query: "SELECT DISTINCT * WHERE {\n  ?s dcterms:title ?title \n}\nLIMIT 100",
		link_img: "snorql/link.png"	//relative position 2019-01-20
	},
	//home setting properties: this is for Japan Search
	home: {
    	label: "UTokyo Academic Archives Portal",
		uri: "https://da.dl.itc.u-tokyo.ac.jp/portal",
		datauri: "https://jpsearch.go.jp/data/",	//basic 'record' namespace
		datauri_pat: "^(https://jpsearch.go.jp|http://purl.org/net/ld/jpsearch)/data/",	//basic 'record' namespace
		data_frags: ["accessinfo", "sourceinfo"],
		workuri: ["https://jpsearch.go.jp/entity/work/"],	//additional 'record' namespaces
		submit_label: ["クエリ実行", "Run Query"]	//display label for the submit button [ja, en]
	},
	//snoral_ldb configuration
	ldb: {
		//special treatment properties
		//[pfx, localname] where pfx is defined in namespaces.js
		label_prop: ["rdfs", "label"],
		img_prop: ["schema", "image"],
		geo: {
			prop: ["schema", "geo"],
			strctprop : ["jps", "spatial"],
			valprop : ["jps", "value"]
		},
		use_iiif: true,
		//preferred order of properties. used in JsonRDFFormatter
		proporder: {
			showup: [
				["schema", "datePublished"],
				["schema", "dateCreated"],
				["schema", "temporal"],
				["schema", "spatial"],
				["schema", "publisher"],
				["schema", "contributor"],
				["schema", "creator"],
				["schema", "name"],
				["rdfs", "label"],
				["rdf", "type"]
			],
			showdown: [
				["jps", "accessInfo"],
				["jps", "sourceInfo"]
			]
		},
		//propety based class attribute. used in JsonRDFFormatter
		propclass: {
			"rdf:type" : "type",
			"schema:publisher" : "agential",
			"schema:contributor" : "agential",
			"schema:creator" : "agential",
			"jps:agential" : "agential",
			"schema:datePublished" : "temporal",
			"schema:dateCreated" : "temporal",
			"schema:temporal" : "temporal",
			"jps:temporal" : "temporal",
			"schema:spatial" : "spatial",
			"jps:spatial" : "spatial"
		},
		//suffix mapping for external links. used in JsonRDFFormatter
		link_sfx: [{ns: "http://geohash.org/", sfx: "?format=text"}],
		//leaftet template information. used in Util.map.setup
		map: {
			template: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
			attribution: '<a href="http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html">国土地理院</a>'
		}
	},
	//additional namespaces (not defined in namespaces.js) to use in examples
	example_ns: {
		"edm": "http://www.europeana.eu/schemas/edm/",
		"ore": "http://www.openarchives.org/ore/terms/",
		"wdt": "http://www.wikidata.org/prop/direct/",
		"crm": "http://www.cidoc-crm.org/cidoc-crm/",
		//"foaf"=>"http://xmlns.com/foaf/0.1/",
		"dc": "http://purl.org/dc/elements/1.1/",
	},
	//list of example queries. each object represents one example: {label: Japanese label for select option, label_en: English label for select option, ns: [prefixes to use in query], query: SPARQL query (escaped)}
	example: [
   {
      "label" : "クラス（型）別コンテンツ数",
      "label_en" : "Count works by type",
      "ns" : [ ],
      "query" : "SELECT ?type (count(?cho) as ?count) WHERE {\r\n\t?cho a ?type ;\r\n\t\tjps:sourceInfo ?source .\r\n} GROUP BY ?type"
   },
   {
       "label": "データセット別件数",
       "label_en": "Count works by Dataset (source)",
       "ns": ["schema", "jps", "rdfs"],
       "query": "SELECT ?provider (count(?cho) as ?count) WHERE {\r\n\t?cho jps:sourceInfo/schema:provider ?provider .\r\n}GROUP BY ?provider ORDER BY desc(?count)"
   },
   {
      "label" : "歌麿の作品",
      "label_en" : "Works by 喜多川歌麿",
      "ns" : [ "schema", "rdfs", "owl", "chname" ],
      "query" : "SELECT ?cho ?label ?thumbnail WHERE {\r\n\t?cho rdfs:label ?label;\r\n\t\tschema:creator/owl:sameAs? chname:喜多川歌麿 .\r\n\tOPTIONAL {?cho schema:image ?thumbnail}\r\n}"
   },
   {
      "label" : "サムネイル画像の多い作者トップ100件",
      "label_en" : "Top 100 creators of # thumbnail images",
      "ns" : [ "schema", "rdfs", "type" ],
      "query" : "SELECT ?who (count(?cho) as ?count) WHERE {\r\n\t?cho schema:image ?image ;\r\n\t\tschema:creator ?who .\r\n} GROUP BY ?who ORDER BY desc(?count) LIMIT 100 \r\n"
   },
   {
      "label" : "Europeanaとの統合クエリ（歌川豊国）",
      "label_en" : "Cross search (fed. query) Europeana",
      "ns" : [ "schema", "rdfs", "chname", "owl", "dc", "edm", "ore" ],
      "query" : "SELECT ?uri ?label ?thumbnail WHERE {\r\n\tBIND(chname:歌川豊国 as ?cname)\r\n\t{\r\n\t\t?cname schema:name ?ename. FILTER(lang(?ename)=\"en\")\r\n\t\tBIND(replace(?ename, \", \", \" \") as ?name)\r\n\t\tSERVICE <http://sparql.europeana.eu/> {\r\n\t\t\t?uri dc:title ?label ; dc:creator ?name .\r\n\t\t\tOPTIONAL{?uri ore:proxyIn [edm:isShownBy ?thumbnail ]}\r\n\t\t}\r\n\t} UNION {\r\n\t\t?uri rdfs:label ?label;\r\n\t\t\tschema:creator/owl:sameAs? ?cname .\r\n\t\tOPTIONAL{?uri schema:image ?thumbnail}\r\n\t}\r\n}"
   },
   {
      "label" : "LODACとの統合クエリ（安藤＝歌川広重）",
      "label_en" : "Cross search (fed. query) LODAC",
      "ns" : [ "schema", "jps", "type", "rdfs", "owl" ],
      "query" : "SELECT distinct ?uri ?label ?who ?provider ?thumbnail WHERE {\r\n\t?jpswho a type:Agent ; schema:name \"安藤広重\"@ja .\r\n\t{\r\n\t\t?jpswho owl:sameAs ?lodacwho . FILTER(strstarts(str(?lodacwho), \"http://lod.ac\"))\r\n\t\tSERVICE <http://lod.ac/sparql> {\r\n\t\t\t?lodacwho rdfs:label ?who ; <http://lod.ac/ns/lodac#creates> ?uri .\r\n\t\t\t?uri rdfs:label ?label .\r\n\t\t\tOPTIONAL {?uri <http://purl.org/NET/cidoc-crm/core#P55_has_current_location> [rdfs:label ?provider] }\r\n\t\t}\r\n\t} UNION {\r\n\t\t?uri rdfs:label ?label;\r\n\t\t\tjps:agential [ schema:description ?who ; jps:value/(owl:sameAs)? ?jpswho ] ;\r\n\t\t\tjps:accessInfo/schema:provider/rdfs:label ?provider .\r\n\t\tOPTIONAL{?uri schema:image ?thumbnail}\r\n\t}\r\n}"
   },
   {
      "label" : "スミソニアンSAAMとの統合クエリ（国吉康雄）",
      "label_en" : "Cross search (fed. query) SAMM",
      "ns" : [ "schema", "rdfs", "chname", "owl", "crm", "owl" ],
      "query" : "SELECT distinct ?uri ?label ?thumbnail WHERE {\r\n\t?cname rdfs:label \"国吉康雄\" ; owl:sameAs ?saamid .\r\n\tFILTER(strstarts(str(?saamid), \"http://edan.si.edu/\"))\r\n\t{\r\n\t\tSERVICE <http://edan.si.edu/saam/sparql> {\r\n\t\t\t?production crm:P14_carried_out_by ?saamid ;\r\n\t\t\t\tcrm:P108_has_produced ?uri .\r\n\t\t\t?uri crm:P102_has_title [rdfs:label ?label ] .\r\n\t\t\tOPTIONAL {?uri crm:P138i_has_representation ?thumbnail }\r\n\t\t}\r\n\t} UNION {\r\n\t\t?uri rdfs:label ?label;\r\n\t\t\tschema:creator/owl:sameAs? ?cname .\r\n\t\tOPTIONAL{?uri schema:image ?thumbnail}\r\n\t}\r\n}"
   },
   {
       "label": "能・高砂の年別上演数",
       "label_en": "# of perf. of Takasago Noh by year",
       "ns": [ "schema" ],
       "query": "SELECT ?when (count(?cho) as ?count) WHERE {\r\n\t?cho schema:workPerformed <https://jpsearch.go.jp/entity/work/高砂_(能楽)> ;\r\n\t\tschema:temporal ?when .\r\n} GROUP BY ?when ORDER BY ?when"
    },
    {
        "label": "源氏物語きりつぼの各行",
        "label_en": "Lines from Tale of Genji Chap.1 (Japanese)",
        "ns": [
            "schema",
            "rdfs",
            "jps"
        ],
        "query": "SELECT ?cho ?label ?position WHERE {\r\n\t?cho rdfs:label ?label ; \r\n\t\tjps:partOf [ jps:selector ?position ;\r\n\t\t\tjps:source/schema:isPartOf/rdfs:label \"きりつぼ\"\r\n\t\t] .\r\n} ORDER BY ?cho"
    },
   {
      "label" : "フランス詩（英語ラベルから）",
      "label_en" : "Classification: French poetry",
      "ns" : [ "schema", "rdfs" ],
      "query" : "SELECT distinct ?cho ?label ?ndc WHERE {\r\n\t?cho schema:about ?class ;\r\n\t\trdfs:label ?label.\r\n\t?class rdfs:seeAlso*/schema:name \"French poetry\"@en\r\nBIND (replace(str(?class), \"^.*ndc.{0,2}/\", \"\") as ?ndc)\r\n}"
   },
   {
      "label" : "国宝タイプ別（別リスト使用）",
      "label_en" : "Count national treasures by type",
      "ns" : [ "schema", "rdfs" ],
      "query" : "SELECT ?type (count(?cho) as ?count) WHERE {\r\n\t?cho a ?type .\r\n\t?nt schema:genre <http://ja.dbpedia.org/resource/国宝> ;\r\n\t\trdfs:seeAlso ?cho .\r\n} GROUP BY ?type",
      "[15]" : {
         "label" : "作者Hokusaiの作品",
         "label_en" : "Works by 'Hokusai'",
         "ns" : [ "schema", "rdfs" ],
         "query" : "SELECT ?cho ?label ?thumbnail WHERE {\r\n\t?cho rdfs:label ?label;\r\n\t\tschema:creator [schema:name ?creator ].\r\n\tFILTER bif:contains(?creator, '\"Hokusai\"')\r\n\tOPTIONAL {?cho schema:image ?thumbnail}\r\n}"
      }
   },
   {
      "label" : "東大寺近辺の文化財など（geohash）",
      "label_en" : "Resources near Todaiji (東大寺)",
      "ns" : [ "schema", "jps", "rdfs" ],
      "query" : "SELECT DISTINCT ?cho ?label WHERE {\r\n\t?cho rdfs:label ?label ;\r\n\tjps:spatial/jps:within+ <http://geohash.org/xn0t7>\r\n}"
   },
   {
      "label" : "作者Hokusaiの作品",
      "label_en" : "Works by 'Hokusai'",
      "ns" : [ "schema", "rdfs" ],
      "query" : "SELECT ?cho ?label ?thumbnail WHERE {\r\n\t?cho rdfs:label ?label;\r\n\t\tschema:creator [schema:name ?creator ].\r\n\tFILTER bif:contains(?creator, '\"Hokusai\"')\r\n\tOPTIONAL {?cho schema:image ?thumbnail}\r\n}"
   },
   {
      "label" : "タイトルにmatsuriを含む作品",
      "label_en" : "Works with title including 'matsuri'",
      "ns" : [ "schema", "rdfs" ],
      "query" : "SELECT distinct ?cho ?label WHERE {\r\n\t?cho rdfs:label ?label;\r\n\t\tschema:name ?name.\r\n\tFILTER bif:contains(?name, '\"matsuri*\"')\r\n}"
   },
   {
      "label" : "タイトルにkodomoを含む絵画",
      "label_en" : "Paintings with title including 'kodomo'",
      "ns" : [ "schema", "rdfs", "type" ],
      "query" : "SELECT distinct ?cho ?label ?thumbnail WHERE {\r\n\t?cho a/rdfs:subClassOf* type:絵画 ;\r\n\t\trdfs:label ?label;\r\n\t\tschema:name ?name.\r\n\tFILTER bif:contains(?name, '\"kodomo*\"')\r\n\tOPTIONAL {?cho schema:image ?thumbnail}\r\n}"
   },
   {
      "label" : "1810年代の絵画",
      "label_en" : "Paintings in 1810s",
      "ns" : [ "schema", "rdfs", "type", "jps" ],
      "query" : "SELECT DISTINCT ?cho ?label ?dt ?thumbnail WHERE {\r\n\t?cho a/rdfs:subClassOf* type:絵画 ; \r\n\t\trdfs:label ?label;\r\n\t\tschema:temporal [\r\n\t\t\trdfs:label ?dt ;\r\n\t\t\tjps:start ?start; \r\n\t\t\tjps:end ?end \r\n\t].\r\n\tFILTER(?start >= 1810 && ?end < 1820)\r\n\tOPTIONAL {?cho schema:image ?thumbnail}\r\n} ORDER BY ?start"
   },
   {
      "label" : "三重県のコンテンツ型別",
      "label_en" : "Works in 三重県 (Mie prefecture) by type",
      "ns" : [ "schema", "place" ],
      "query" : "SELECT ?type (count(?cho) as ?count) WHERE {\r\n\t?cho a ?type ;\r\n\t\tschema:spatial place:三重 .\r\n} GROUP by ?type ORDER BY desc(?count)\r\n"
   },
   {
      "label" : "言語（情報のあるもの）トップ100件",
      "label_en" : "Top 100 contents languages (if available)",
      "ns" : [ "schema", "rdfs", "type" ],
      "query" : "SELECT ?lang (count(?cho) as ?count) ?name WHERE {\r\n\t?cho\n\t\tschema:inLanguage ?lang .\r\n\t?lang rdfs:label ?name\r\n} GROUP BY ?lang ?name ORDER BY desc(?count) LIMIT 100\r\n"
   },
   {
      "label" : "標本の採集地トップ100件",
      "label_en" : "Top 100 places to collect specimen",
      "ns" : [ "jps", "role", "skos" ],
      "query" : "SELECT ?where (count(?cho) as ?count) WHERE {\r\n\t?cho a/rdfs:subClassOf? type:標本 ;\r\n\t\tschema:spatial ?where .\r\n} GROUP BY ?where ORDER BY desc(?count) LIMIT 100"
   },
   {
      "label" : "刀剣の作者トップ100件",
      "label_en" : "Top 100 creators of Swards",
      "ns" : [ "schema", "rdfs", "type" ],
      "query" : "SELECT ?who (count(distinct ?cho) as ?count) ?name WHERE {\r\n\t?cho a type:刀剣 ;\r\n\t\tschema:creator ?who .\r\n\t\t?who rdfs:label ?name\r\n} GROUP BY ?who ?name ORDER BY desc(?count) LIMIT 100 \r\n"
   },
   {
      "label" : "芸術・美術の提供者別件数",
      "label_en" : "Count art works by access provider",
      "ns" : [ "schema", "jps", "rdfs", "type" ],
      "query" : "SELECT ?provider (count(?cho) as ?count) WHERE {\r\n\t?cho a/rdfs:subClassOf* type:芸術・美術 ;\r\n\t\tjps:accessInfo/schema:provider ?provider .\r\n}GROUP BY ?provider ORDER BY desc(?count)"
   },
   {
      "label" : "東京国立博物館の彫刻",
      "label_en" : "Sculptures in Tokyo National Museum",
      "ns" : [ "schema", "jps", "chname", "type", "role" ],
      "query" : "SELECT DISTINCT ?cho ?label ?where ?when WHERE {\r\n\t?cho a type:彫刻 ; rdfs:label ?label ;\r\n\t\tjps:accessInfo/schema:provider chname:東京国立博物館 .\r\n\tOPTIONAL {?cho jps:spatial [jps:relationType role:制作 ; jps:value/rdfs:label ?where ]}\r\n\tOPTIONAL {?cho jps:temporal [jps:relationType role:制作 ; jps:value/rdfs:label ?when ]}\r\n}"
   },
   {
      "label" : "版欧州所在日本古書目録の著者",
      "label_en" : "Authors in Early Japanese Books in Europe",
      "ns" : [ "schema", "jps", "chname", "type", "role" ],
      "query" : "SELECT ?who (count(?cho) as ?count) WHERE {\r\n\t?cho jps:sourceInfo/schema:provider chname:欧州所在日本古書総合目録 ;\r\n\t\tschema:creator ?who .\r\n} GROUP BY ?who ORDER BY desc(?count)"
   }
]
}
