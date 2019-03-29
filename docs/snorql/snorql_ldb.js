//Snorql plugin


/** Simplified version of Linked Data Browser (masaka)
 * created 2018-12-08
 * modified 2019-02-20
 * @param {Object} snorql	calling object, i.e. instance of Snorql class
 * @param {String} target_uri	URI of the described resource (value of describe)
 * @param {String} is_home_uri	flag to indicate the uri to describe is a resource in this triple store
 */
var JsonRDFFormatter = function(snorql, target_uri, is_home_uri){
	this.snorql = snorql;
	this.ns = snorql._namespaces;
	this.endpoint = snorql._endpoint;
	this.target_uri = target_uri;	//main target URI for SPARQL describe
	this.is_home_uri = is_home_uri;	//whether the target is home resource's uri of this endpoint
	this.sq_formatter = new SPARQLResultFormatter(null, this.ns, snorql);	//reuse _formatNode
	this.rdfjson = null;	//RDF/JSON (Talis) = object {uri1 : {p1: [o1, o2...], p2: ...}, uri2: ...}
	this.title = null;
	this.img_uri = null;
	this.proced_uris = [];	//URIs already processed to format a table
	if(Snorqldef.ldb){
		var ldbdef = Snorqldef.ldb;
		this.label_prop = set_uri(ldbdef.label_prop);	//this.ns.rdfs + "label";
		this.img_prop = set_uri(ldbdef.img_prop);
		this.geo = {
			prop: set_uri(ldbdef.geo.prop),
			strctprop : set_uri(ldbdef.geo.strctprop),
			valprop : set_uri(ldbdef.geo.valprop),
			count: 0,
			cand: []
		};
		this.use_iiif = ldbdef.use_iiif;
		this.link_sfx = ldbdef.link_sfx;	//suffix mapping for external links
		//propety based class attribute
		this.propclass = ldbdef.propclass || {};
		//preferred order of properties
		if(ldbdef.proporder){
			var actions = {showup: "unshift", showdown: "push"};
			this.proporder = {};
			for(var type in actions){
				this.proporder[actions[type]] = [];
				ldbdef.proporder[type].forEach(function(map){
					this.proporder[actions[type]].push(set_uri(map));
				}, this);
			}
		}
	}else{
		this.label_prop = null;
		this.img_prop = null;
		this.geo = {prop: null, strctprop: null, valprop: null};
		this.link_sfx = null;
		this.propclass = {};
	}
	if(this.link_sfx) this.link_sfx.forEach(function(def){
		def.len = def.ns.length;
	});
	function set_uri(nslocal){
		return snorql._namespaces[nslocal[0]] + nslocal[1];
	}
};
JsonRDFFormatter.prototype = {
    /** display results using RDF/JSON (Talis)
     * @param {Object} json	SPARQL results in JSON format
     * @param {String} heading	heading in the result display section
     * @param {String} qtype	query type
     */
    display_result: function(json, heading, qtype){
		var that = this,
    	is_error = false,
		div = Util.dom.element("div"),
		h2 = Util.dom.element("h2");
		h2.appendChild(Util.dom.text(heading));
		div.appendChild(h2);
		//error handling
		if(!json){
			this.__msg(div, "[query error: no response]", "p");
			is_error = true;
		}else if(json.status && json.status === "error"){
			this.snorql.__msg(div, "ajax error: " + json.response , "pre");
			is_error = true;
		}else if(json.head && json.head.status === "error"){
			this.snorql.__msg(div, "query error: " + json.head.msg , "pre");
			is_error = true;
		}else if (json.results.bindings.length === 0) {
			this.snorql.__msg(div, "[no results for " + qtype + "]", "p");
			if(qtype === "DESCRIBE"){
				var msgarea = Util.dom.element("p");
				div.appendChild(msgarea);
				this.add_osp(div, msgarea);
			}
			is_error = true;
		}
		if(is_error){
			this.snorql._display(div, "result");
			return;
		}else if(this.is_home_uri){
			//get labels for objects of the resource and merge
			this.add_labels(this.target_uri, json.results).then(proc_json);
		}else{
			//if not, simply proc the results set
			proc_json();
		}
		
		function proc_json(){
			div.appendChild(that.proc(json));
			this.snorql._display(div, "result");
			if(that.geo.count === 0 && that.geo.cand.length){
				//if no direct geo value found and has spatial value
				var cand = that.geo.cand[0];
				//console.log(that.geo);
				//get geocoord of spatial value and display map
				cand.otd.appendChild(that.add_later_table(cand.value, that.geo.prop, true));
			};
	    	Util.set_title(that, qtype);
			//2019-02-11
			that.set_osp_btn(div);
		}
	},
	/**
	 * processes the results set
	 * @param {Object} json	SPARQL results in JSON format
	 * @return {DOMNode}	div element node that has the description table
	 */
	proc: function(json){
		this.rdfjson = this.toRDFJson(json);
		return this.format();
	},
	/**
	* converts SPARQL result JSON to RDF/JSON (Talis)
	 * @param {Object} json	SPARQL results in JSON format
	 * @return {Object}	RDF/JSON (Talis)
	 */
	toRDFJson: function(json){
		var res = {};
		json.results.bindings.forEach(function(binding){
			var sv = binding.s.value,
			pv = binding.p.value;
			o = binding.o;
			if(!res[sv]) res[sv] = {};
			if(!res[sv][pv]) res[sv][pv] = [];
			res[sv][pv].push(o);
		});
		return res;
	},
	/**
	 * generates description table from RDF/JSON
	 * @return {DOMNode}	div element node that has the description table
	 */
	format: function(){
		var div = Util.dom.element('div'),
		uris = Object.keys(this.rdfjson);
		if(this.target_uri) uris = this.reorder_item(uris, this.target_uri, "unshift");
		uris.forEach(function(uri){
			if(this.proced_uris.indexOf(uri) === -1)
			div.appendChild(this.format_one_uri(uri));
			//test
			if(uri.match(new RegExp("^http://purl.org/net/ns/ext/nt#kbgj-(\\d+)-(\\d+)$"))){
				this.img_uri = "https://kunishitei.bunka.go.jp/bsys/photo/" + RegExp.$1 + "_P"
				+ (RegExp.$2 < 150 ? (RegExp.$2 + "000000000") : ("00000000" + RegExp.$2).slice(-8))
				+ "01.jpg";
			}
		}, this);
		if(this.img_uri){
			var imgelt = Util.dom.element("img");
			imgelt.src = this.img_uri;
			imgelt.className = "primimage";
			div.insertBefore(imgelt, div.firstChild);
		}
		return div;
	},
	/**
	 * format a table for one URI
	 * @param {String} uri	subject URI of the resource to process
	 * @param {String} pprop	parent property URI of the current resource (null if top level)
	 * @return {DOMNode}	table element node that describes one resource
	 */
	format_one_uri: function(uri, pprop, table){
		if(!table){
			table = Util.dom.element("table");
			this.set_table_caption(table, uri);
		}
		var col = [Util.dom.element("col"), Util.dom.element("col")],
		po = this.rdfjson[uri];	//property:object of this URI
		table.className = "describe";
		col[0].className = "term";
		col.forEach(function(c){table.appendChild(c);});
		this.proced_uris.push(uri);	//avoid re-format for nested URI
		//for each property of subject URI
		this.order_props(po).forEach(function(p){
			table.appendChild(this.format_one_prop(po, p, uri, pprop));
		}, this);
		return table;
		
	},
	//add a table caption only for non describe and non bnode
	set_table_caption: function(table, uri){
		if(uri !== this.target_uri && !uri.match(/^_:/)){
			var caption = Util.dom.element("caption");
			caption.appendChild(Util.dom.text(Util.trim_str(uri, 128, [60, 40])));
			table.appendChild(caption);
		}
	},
	/**
	 * process one property (multiple object values)
	 * @param {Object} po	property-object set of current resource
	 * @param {String} prop	property to process
	 * @param {String} subj	subject URI of this property
	 * @param {String} pprop	parent property URI of the current resource (null if top level)
	 * @return {DOMNode}	tbody element node that group up description of this property
	 */
	format_one_prop: function(po, prop, subj, pprop){
		if(!po[prop]) console.log(subj, prop, po);
		var obj = po[prop].sort(
			function(a, b){return (a.value < b.value) ? -1 : 1;}	//order by obj[i].value
		),	//RDF object array of this property-object set
		numobj = obj.length,	//object count of this array
		pclass = null,	//HTML class attr for this property
		tbody = Util.dom.element('tbody');	//HTML tbody element to group up rows for this property
		//hilite agential, temporal, spatial
		if((pclass = this.propclass[this.sq_formatter._toQName(prop)])){
			tbody.className = pclass + " ats";
		}else if(prop === this.label_prop){
			this.title = obj[0].value;
		}else if(prop === this.img_prop){
			this.img_uri = obj[0].value;
		}
		if(subj === obj[0].value && this.proced_uris.indexOf(subj) !== -1){
			//loop error in nested uri (which was already formatted)
			console.warn("same subj, obj", subj, "for", prop);
			return tbody;
		}
		obj.forEach(one_object, this);
		return tbody;
		//i,o,img
		//process one object value.
		function one_object(obj, i){
			var row = Util.dom.element('tr'),	//HTML tr element to include this one prop-obj pair
			ptd = Util.dom.element('td');	//HTML td element for property
			if(i === 0){
				//property cell is generated only for the first value
				var pv = this.sq_formatter._formatURI({"value": prop}, "p", 1, false);
				ptd.appendChild(pv);
				if(numobj > 1) ptd.setAttribute("rowspan", numobj);
			}else{
				//no show, but need for CSS :nth-child
				ptd.className = "repeated";
			}
			row.appendChild(ptd);
			var otd = Util.dom.element('td'),
			otdv = this.set_object_td(obj, prop, subj);
			otd.appendChild(otdv);
			row.appendChild(otd);
			tbody.appendChild(row);
			if(prop === (this.ns.schema + "latitude")){
				//if there is a geocoordinate
				this.geo.count++;
				if(this.geo.count > 10){
					throw new Error("too much");
				}
				//show a map
				Util.map.setup(otd, obj.value, po, this.ns);
			}else if(pprop === this.geo.strctprop && prop === this.geo.valprop && i===0){
				//if a spatial relationship found, save info for possible map disp
				this.add_geo_cand(otd, po, obj.value);
			}
		}
	},
	/**
	 * setup the td element of the object, according to its type
	 * @param {Object} obj	RDF object to process
	 * @param {String} prop	property URI of this object
	 * @param {String} subj	subject URI of this object
	 * @return {DOMNode}	DOM node to be the content of the td element for this object
	 */
	set_object_td: function(obj, prop, subj){
		var stype;
		if(obj.type === "literal"){
			return this.sq_formatter._formatNode(obj, "o");
		}else if(this.rdfjson[obj.value]){
			//URI that is also a subject in this graph
			if(!this.is_home_uri) return this.format_one_uri(obj.value, prop) ;
			
			//special for home resource
			var po = this.rdfjson[obj.value],	//Resources of this URI
			keys = Object.keys(po);
			//if object is a label fetched by add_labels()
			if(keys.length === 1 && keys[0] === this.ns.rdfs + "label") return this.set_label_wrapper(obj, po, keys);
			else return this.format_one_uri(obj.value, prop);
			
		}else if(prop === this.geo.prop){
			this.geo.count++;
			return this.add_later_table(obj.value, prop);
		}else{
			//external URI
			var sfxoption;
			if(this.link_sfx) this.link_sfx.forEach(function(def){
				//eg. add geohash parameter
				if(obj.value.substr(0, def.len) === def.ns){
					sfxoption = def.sfx;
					return;
				}
			});
			var span = this.sq_formatter._formatURI(obj, "o", 2, sfxoption);
			//IIIF
			if(obj.value.match(/\/manifest(\.json)?$/) && this.use_iiif){
				this.add_iiif_link(span, obj.value, subj);
			}else if(obj.value === "http://iiif.io/api/presentation/2#Manifest" && prop === (this.ns.rdf + "type")){
				this.add_iiif_link(span, subj);
			}else if((prop === this.ns.schema + "isPartOf") &&
				(stype = this.rdfjson[subj][this.ns.rdf + "type"]) &&
				stype[0].value === "http://iiif.io/api/presentation/2#Canvas"
			){
				this.add_iiif_link(span, obj.value, subj);
			}else if(obj.value.match(/\/canvas\/.*/)){
				this.test_iiif(span, obj.value);
			}
			return span;
		}
	},
	//setup a wrapper element for the post fetched label
	set_label_wrapper: function(obj, po, keys){
		var wrapper = Util.dom.element("span"),	//wrap the object desc and its label
		link = this.sq_formatter._formatURI(obj, "o", 2),
		label = Util.dom.element("span");
		label.appendChild(Util.dom.text(" (" + po[keys[0]][0].value + ")"));
		label.className = "subtext";
		wrapper.appendChild(link);
		wrapper.appendChild(label);
		this.proced_uris.push(obj.value);
		return wrapper;
	},
	//save spatial relation for later map disp
	add_geo_cand: function(otd, po, val){
		var rel = po[this.ns.jps + "relationType"][0].value,
		cand = {"rel": rel, "value": val, "otd": otd};
		//prioritize creation place
		if(rel.match(/\/制作/)) this.geo.cand.unshift(cand);
		else this.geo.cand.push(cand);
	},
	//try to find IIIF manifest (asynchronous)
	test_iiif: function(span, canvas){
		var that = this,
		query = "SELECT ?type ?manifest WHERE {<" + canvas + "> a ?type ; " +
		"<" + this.ns.schema + "isPartOf> ?manifest .}",
		service = new SPARQL.Service(this.endpoint),
		add_link = function(res){
			if(res.results){
				var bind = res.results.bindings[0];
				if(!bind.manifest.value) console.log("no manifest found", res);
				else that.add_iiif_link(span, bind.manifest.value, canvas);
			}else{
				console.log("no manifest found", res);
			}
		},
		nogood = function(res){console.log("failed", res);};
		service.setMethod("GET");
		service.setRequestHeader('Accept', 'application/sparql-results+json,*/*'); //*/
		service.setOutput('json');
		//console.log("additional query", query);
		service.query(query, {success: add_link, failure: nogood});
	},
	//add IIIF viewer link and logo
	add_iiif_link: function(span, manifest, canvas){
		var iiif_link = Util.dom.element("a");
		iiif_link.href = Util.iiif.set_viewer_link(manifest, canvas, true);
		if(!Util.iiif.logo) Util.iiif.logo = Util.iiif.gen(16);
		iiif_link.appendChild(Util.iiif.logo.cloneNode(true));
		span.appendChild(Util.dom.text(" "));
		span.appendChild(iiif_link);
	},
	/**
	 * get p/o of a URI (e.g. geo which is not bnode and cannot get p/o as CBD) and generate nested table asynchronously
	 * @param {String} uri	URI of (the parent node of) the subject to fetch further p/o
	 * @param {String} prop	target property (parent of uri, or prop of uri if via_bnode)
	 * @param {Boolean} via_bnode	set if to obtain target p/o as prop [?p ?o] . Use when fetch geocoord of an entity
	 */
	add_later_table: function(uri, prop, via_bnode){
		var that = this,
		table = Util.dom.element("table"),
		query = "SELECT DISTINCT ?p ?o WHERE {<" + uri + "> " + (
			//if the uri is of a location, then query is <uri> schema:geo [?p ?o]
			via_bnode ? "<" + prop + "> [ ?p ?o ]" 
			//else the uri is of a geohash (=geocoord) ie query is <uri> [?p ?o]
			: "?p ?o"
		) + " .}",
		service = new SPARQL.Service(this.endpoint),
		add_tbl = function(newres){
			if(newres.results){
				that.rdfjson[uri] = {};
				//console.log(newres.results.bindings);
				//add result p/o to RDFJson object
				newres.results.bindings.forEach(function(bind){
					if(!that.rdfjson[uri][bind.p.value]) that.rdfjson[uri][bind.p.value] = [];
					bind.o.type = bind.o.value.match(/^http/) ? "uri" : "literal";
					that.rdfjson[uri][bind.p.value].push(bind.o);
				});
				//then generate a nested table
				that.format_one_uri(uri, prop, table);
				Util.map.refresh();
			}else{
				console.log("no po found for", uri, newres);
			}
		},
		nogood = function(newres){console.log("failed query for", uri, newres);};
		//set caption first
		this.set_table_caption(table, uri + (via_bnode ? " → " + prop : ""));
		//query asynchronous
		service.setMethod("GET");
		service.setRequestHeader('Accept', 'application/sparql-results+json,*/*'); //*/
		service.setOutput('json');
		service.query(query, {success: add_tbl, failure: nogood});
		//return table (and display) not waiting query result
		return table;
	},
	/**
	 * change display order of properties
	 * @param {Object} po	JSON object of RDF prop-object set
	 * return {Array}	list of property in the order of processing
	 */
	order_props: function(po){
		var props = Object.keys(po).sort();
		if(this.proporder) for(var action in this.proporder){
			this.proporder[action].forEach(function(p){
				props = this.reorder_item(props, p, action);
			}, this);
		}
		return props;
	},
	/**
	 * re-order an array item
	 * @param {Array} items	array to re-order
	 * @param {String} element	the element of the array to move
	 * @param {String} action	unshift (move the key to first position) or pop (to the last position)
	 * @return {Array}	re-ordered array
	 */
	reorder_item: function(items, element, action){
		var pos;
		if((pos = items.indexOf(element)) !==-1){
			var trimed = items.splice(pos, 1);
			items[action](trimed[0]);
		}
		return items;
	},
	//////////////// experimental
	/**
	 * add labels for object resourece
	 * @param {String} uri	subject URI of the described resource
	 * @param {Object} jsonres	'results' node of SPARQL JSON result, to add the label resources
	 */
	add_labels: function(uri, jsonres){
		document.querySelector(".busy").innerText = "Getting labels ... ";
		//setup another query to get labels for each RDF object
		var that = this,
		query = "SELECT DISTINCT ?s ?o ?en WHERE { {<" + uri +"> ?q ?s .} "+
		"UNION {<" + uri +"> ?p ?po . ?po <" + this.ns.jps + "relationType> ?s } "+ 
		"?s <" + this.ns.rdfs + "label> ?o ." +	//use rdfs:label for Japanese
		"OPTIONAL {?s <" + this.ns.schema + "name> ?en . FILTER(lang(?en)=\"en\")}"	//use schema:name label@en for other lang if available
		+ "}",
		set_labels = function(newres){
			//merge bindings to the described results, after getting labels
			if(newres.head.status && newres.head.status === "error") console.log(newres.head.msg);
			var binds = newres.results.bindings || null;
			if(typeof(binds)==="string"){
				//not sure why but JSON.stringify makes newres.results.bindings quoted text (for saved labels)
				binds = JSON.parse(binds);
			}
			if(binds) binds.forEach(function(bind){
				//makes it as if the result from DESCRIBE
				if(Util.ulang !== "ja" && bind.en) bind.o.value = bind.en.value;	//if name@en available
				bind.p = {"type": "uri", "value": that.ns.rdfs + "label"};
				jsonres.bindings.push(bind);
			});
		},
		done = function(){return true;},
		failed =function(newres){
			console.log("label fetche failed", newres);
			return false;
		};
		//call another query, wait for response, and then merge the result
		return new Promise(function(done, failed){
			var saved_label;
			if((saved_label = that.checke_saved_label(uri + "_" + Util.ulang))){
				//Chrome dosen't use cache for promise ?
				set_labels(saved_label);
				done();
			}else that.get_labels(query).then(function(newres){
				//call label query, then merge
				set_labels(newres);
				if(window.navigator.userAgent.match(/Chrome/)) that.save_labels(uri + "_" + Util.ulang, newres);
				//ensure to promise resolved
				done();
			}).catch(failed);
		});
	},
	/**
	 * call SPARQL query, and wait for the result
	 * @param {Object} query	query to get labels
	 */
	get_labels: function(query){
		var that = this,
		OK = function(){return true;},
		NG = function(){return false;};
		return new Promise(function(OK, NG){
			var service = new SPARQL.Service(that.endpoint);
			service.setMethod("GET");
			service.setRequestHeader('Accept', 'application/sparql-results+json,*/*'); //*/
			service.setOutput('json');
			service.query(query, {success: OK, failure: NG});
		});
	},
	/**
	 * save labels for reuse (not happy).
	 * firefox uses cache and no cookie needed (even worse, bad cookie is gererated and cause 400 error)
	 * @param {String} urisig	URI signature to distinguish the cookie
	 * @param {Object} newres	JSON object of SPARQL result (for label query)
	 */
	save_labels: function(urisig, newres){
		document.cookie = "setlabeluri=" + urisig;
		document.cookie = "labelres=" + JSON.stringify(newres);
	},
	/**
	 * load saved labels if available
	 * @param {String} urisig	URI signature to distinguish the cookie
	 * @return {Object}	saved JSON result
	 */
	checke_saved_label: function(urisig){
		var m = document.cookie.match(/setlabeluri=([^;]+)/);
		if(m && m[1] === urisig){
			if((m = document.cookie.match(/labelres=([^;]+)/))) return JSON.parse(m[1]);
		}
		return null;
	},
	//2019-02-11
	set_osp_btn: function(div){
		var that = this,
		btn = Util.dom.element("span", "get resources that relate to this URI");
		btn.addEventListener("click", function(ev){
			that.add_osp(div, btn);
		}, false);
		btn.className = "pseudolink";
		div.appendChild(btn);
	},
	add_osp: function(div, msgarea){
		var that = this,
		query = "SELECT DISTINCT ?s ?label ?p ?p2 WHERE { " +
			"{?s ?p <" + this.target_uri + ">  FILTER(isIRI(?s))} UNION " +
			"{?s ?p ?o . ?o ?p2 <" + this.target_uri + "> FILTER(isBLANK(?o)) " +
				"MINUS {?s ?p3 <" + this.target_uri + ">}}" +
		" OPTIONAL {?s rdfs:label ?label}} LIMIT 500",
		service = new SPARQL.Service(this.endpoint);
		service.setMethod("GET");
		service.setRequestHeader('Accept', 'application/sparql-results+json,*/*'); //*/
		service.setOutput('json');
		msgarea.innerText = "asking ... ";
		msgarea.className = "busy";
		service.query(query, {
			success: function(json){success(json);},
			failure: function(){error_msg("query request failed");}
		});
		
		function success(json){
			var disp_uri = "<" + Util.trim_str(that.target_uri, 80, [50, 20]) +">";
			if(!json){
				error_msg("[query error: no response]");
			}else if(json.status && json.status === "error"){
				error_msg("ajax error: " + json.response);
				console.log(json);
			}else if(json.head && json.head.status === "error"){
				error_msg("query error: " + json.head.msg);
			}else if (json.results.bindings.length === 0){
				error_msg("No resource found that relates to " + disp_uri);
			}else{
				new SPARQLSelectTableFormatter(json, that.ns, that).toDOM(div, true);
				msgarea.innerText = "Resources that relate to " + disp_uri;
				msgarea.className = "";
			}
		}
		function error_msg(msg){
			msgarea.innerText = msg;
			msgarea.className = "";
		}
	}
};

//a better table formatter for SPARQL select result
function SPARQLSelectTableFormatter(json, namespaces){
	this.sq_formatter = new SPARQLResultFormatter(json, namespaces, snorql);
	this.tbody = [];
	this.std_tbl_rows = 20;
	this.row_count = 0;
	this.inc = null;
	this.ns = namespaces;
}
SPARQLSelectTableFormatter.prototype = {
	toDOM: function(div, noTitle) {
		this.table = Util.dom.element('table');
		this.table.className = 'queryresults';
		this.table.appendChild(this.sq_formatter._createTableHeader());
    	this.create_tbody(this.table, this);
		this.inc_ctrl = this.setup_inc_ctrl(this.table);
		if(this.inc_ctrl){
			div.appendChild(this.inc_ctrl[0]);
			div.appendChild(this.table);
			div.appendChild(this.inc_ctrl[1]);
		}else div.appendChild(this.table);
		if(!noTitle) Util.set_title(this.ns, "SELECT");
	},
	/**
	 * create tbody element to group up some result rows (in order to show/hide each group)
	 * to be called from toDOM() function
	 * @param {DOMNode} table	table element node to append tbody's
	 */
	create_tbody: function(table){
		var tbpos = -1;
		this.row_count = this.sq_formatter._results.length;
		for(var i=0; i <this.row_count ; i++) {
			if(i % this.std_tbl_rows === 0){
				this.tbody.push(Util.dom.element("tbody"));
				tbpos++;
				table.appendChild(this.tbody[tbpos]);
				if(tbpos) this.tbody[tbpos].className = "wait";
			}
			this.tbody[tbpos].appendChild(this.sq_formatter._createTableRow(this.sq_formatter._results[i], i));
		}
	},
	/**
	 * setup increment controls for table view, to be called from displayJSONResult() function
	 * @param {DOMNode} table	target table node
	 * @param {Integer} offset	SPARQL offset modifier value
	 * @return {Array}	a pair of increment control <p> node
	 */
	setup_inc_ctrl: function(table,offset) {
		//if number of result rows is smaller than view rows, no need to create the control
		if(typeof offset === 'undefined') offset = 0;
		if(this.row_count <= this.std_tbl_rows) return null;
		var that = this,
		ctrlparam = {
			left: {text: "<< rev", dir: -1, inistate: "wait"},
			right: {text: "next >>", dir: +1, inistate: "active"},
			unit: this.std_tbl_rows,
			from: offset + 1,
			to: offset + this.std_tbl_rows,
			all: offset + this.row_count
		},
		ctrls = this.create_inc_ctrl(ctrlparam),
		switcher = Util.dom.element("span", "show all");
		this.inc = {
			ctrl: ctrls,
			showpos: 0,
			maxpos: Math.floor((this.row_count - 1) / ctrlparam.unit),
			unit: ctrlparam.unit,
			all: ctrlparam.all,
			offset: 0
		};
		//2019-02-11
		switcher.className = "switcher";
		switcher.addEventListener("click", function(ev){
			if(table.classList.contains("showall")){
				table.classList.remove("showall");
				ev.target.innerText = "show all";
			}else{
				table.classList.add("showall");
				ev.target.innerText = "collapse";
			}
		}, false);
		ctrls[1].p.appendChild(this.gen_tbrchanger());
		ctrls[1].p.appendChild(switcher);
		return [ctrls[0].p, ctrls[1].p];
	},
	/**
	 * create actual increment conrol elements
	 * @param {Object} param	setup parameters
	 * @return {Array}	a pair of increment control objects
	 */
	create_inc_ctrl: function(param){
		var that = this, ctrls = [];
		//creates two controls both for the above and the below table
		for(var i=0; i<2; i++){
			var ctrl = {
				p: Util.dom.element("p"),
				status: Util.dom.element("span")
			};
			ctrl.p.className = "incCtrl ctrl" + i;
			ctrl.status.appendChild(
				Util.dom.text(" " + param.from + " - " + param.to + " / " + param.all + " ")
			);
			["left", "right"].forEach(function(key){
				ctrl[key] = Util.dom.element("span");
				ctrl[key].appendChild(Util.dom.text(param[key].text));
				ctrl[key].className = "pseudolink " + param[key].inistate;
				ctrl[key].addEventListener("click", function(){that.set_view(param[key].dir);}, false);
			});
			ctrl.p.appendChild(ctrl.left);
			ctrl.p.appendChild(ctrl.status);
			ctrl.p.appendChild(ctrl.right);
			ctrls.push(ctrl);
		}
		return ctrls;
	},
	//generates select element to change number of rows to display
	gen_tbrchanger: function(){
		var that = this,
		sel = Util.dom.element("select");
		[20, 50, 100].forEach(function(num){
			var opt = Util.dom.element("option", num);
			if(that.std_tbl_rows === num) opt.setAttribute("selected", "selected");
			sel.appendChild(opt);
		});
		sel.addEventListener("change", function(ev){
			var formatter = that,
			selnum = Number(ev.target.value);
			if(selnum !== that.std_tbl_rows) that.reset_tbody(selnum);
			//console.log(ev, that.table);
		});
		return sel;
	},
	/**
	 * change table view (displayed rows), called by increment control elements
	 * @param {Integer} direction	increment the disp rows if +1, decrement if -1
	 */
	set_view: function(direction){
		if(direction < 0 && this.inc.showpos > 0){
			this.tbody[this.inc.showpos--].classList.add("wait");
			this.tbody[this.inc.showpos].classList.remove("wait");
			for(var i=0; i<2; i++){
				if(this.inc.showpos === 0) this.inc.ctrl[i].left.classList.add("wait");
				if(this.inc.showpos === this.inc.maxpos - 1){
					this.inc.ctrl[i].right.classList.remove("wait");
				}
			}
		}else if(direction > 0 && this.inc.showpos < this.inc.maxpos){
			this.tbody[this.inc.showpos++].classList.add("wait");
			this.tbody[this.inc.showpos].classList.remove("wait");
			for(var i=0; i<2; i++){
				if(this.inc.showpos === 1) this.inc.ctrl[i].left.classList.remove("wait");
				if(this.inc.showpos === this.inc.maxpos){
					this.inc.ctrl[i].right.classList.add("wait");
				}
			}
		}else return;
		
		for(var i=0; i<2; i++) this.inc.ctrl[i].status.innerText = " " + 
		(this.inc.showpos * this.inc.unit + this.inc.offset + 1) + " - "
		+ (Math.min((this.inc.showpos+1) * this.inc.unit, this.row_count) + this.inc.offset)
		+ " / " + this.inc.all + " ";
	},
	//changes the number of rows to display
	reset_tbody: function(numrows){
		this.std_tbl_rows = numrows;
		var table = this.table,
		trs = [],
		tbpos = -1;
		//remove current rows
		for(var tb=0, tbn=this.tbody.length; tb<tbn; tb++){
			if(this.tbody[tb].parentNode === table){
				table.removeChild(this.tbody[tb]);
				var tr;
				while((tr = this.tbody[tb].firstChild)) trs.push(this.tbody[tb].removeChild(tr));
			}
		}
		//reorganize tbodies
		this.row_count = trs.length;
		for(var i=0; i <this.row_count ; i++) {
			if(i % this.std_tbl_rows === 0){
				if(!this.tbody[++tbpos]) this.tbody.push(Util.dom.element("tbody"));
				table.appendChild(this.tbody[tbpos]);
				if(tbpos === 0) this.tbody[tbpos].classList.remove("wait");
				else this.tbody[tbpos].className = "wait";
			}
			this.tbody[tbpos].appendChild(trs[i]);
		}
		//reset controls
		var inc_ctrl = this.setup_inc_ctrl(table);
		if(inc_ctrl){
			var div = this.inc_ctrl[0].parentNode;
			div.replaceChild(inc_ctrl[0], this.inc_ctrl[0]);
			div.replaceChild(inc_ctrl[1], this.inc_ctrl[1]);
			this.inc_ctrl = inc_ctrl;
		}
	}
};

//Utilities to be called from any class
var Util = {
	//snorql_def.jsに記述しておき、Snorql.init_homedefで設定する
	homelabel: null,
	defaulturi: "",
	//easy DOM handlers
	dom: {
		byid: function(id){
			return document.getElementById(id);
		},
		element: function(elt, str){
			var node = document.createElement(elt);
			if(str) node.appendChild(this.text(str));	//2019-02-11
			return node;
		},
		text: function(str){
			return document.createTextNode(str);
		},
		sve: function(elt, attrs){
			var e = document.createElementNS("http://www.w3.org/2000/svg", elt);
			if(attrs) attrs.forEach(function(attr){e.setAttribute(attr[0], attr[1]);});
			return e;
		}
	},
	ulang: (navigator.userLanguage || navigator.language).substr(0, 2).toLowerCase(),
	lang_limit: [50, 100, 70, 60],
	lang_trim_offset: [[34, 12], [50, 40], [40, 20], [36, 16]],
	/**
	 * trim long URI for display purpose
	 * @param {String} dispuri	URI to be displayed
	 * @param {Integer} numvars	number of select variables (more vars, shorter disp)
	 */
	url_disp: function(dispuri, numvars){
		var limit = this.lang_limit[numvars] || this.lang_limit[0],
		offset = this.lang_trim_offset[numvars] || this.lang_trim_offset[0];
		return this.trim_str(dispuri, limit, offset);
	},
	trim_str: function(str, limit, offset){
		if((len = str.length) > limit){
			str = str.substr(0, offset[0])
			+ " ... " + str.substr((len - offset[1]), offset[1]);
		}
		return str;
	},
	set_title: function(app, qtype){
		if(!this.current_query) this.current_query = this.example.textarea.value;
		var title;
		if(qtype === "SELECT"){
			var matched = this.current_query.match(/(SELECT .*)(FROM|WHERE|\x7B)/i);
			title = matched[1];
		}else if(qtype === "DESCRIBE"){
			var qname,
			matched = this.current_query.match(/DESCRIBE ([^ ]+)/i);
			if(matched[1].match(/^<(.*?)([^\/#]+)>/)){
				var pfx, local = RegExp.$2;
				if(this.defaulturi === RegExp.$1) pfx = ":";
				else for(var pfxc in app.ns){
					if(app.ns[pfxc] === RegExp.$1){
						pfx = pfxc + ":";
						break;
					}
				}
				qname = (pfx || "ns01:") + local;
			}else qname = matched;
			title = "DESCRIBE " + (app.title ? "\"" + app.title + "\" " : "") + Util.trim_str(qname, 50, [20, 20]);
		}else title = qtype;
		document.title = title + " - Snorql" + (this.homelabel ? " for " + this.homelabel : "");
		this.map.refresh();
	},
	queries: {
		current_q: null,
		replace_template: null,
		maxres: 1000,
		replace_q: function(uri){
			if(!this.current_query) this.current_q = Util.example.textarea.value;
			if(!this.replace_template){
				this.replace_template = this.current_q
				.replace(/\s*GROUP BY.*/i, "LIMIT " + this.maxres)
				.replace(/SELECT (distinct )?\?([\w\d]+) \(count\(.*?\?(\w+)\) as \?count\)/i, "SELECT DISTINCT __$3 ?label");
				var v = [RegExp.$2, RegExp.$3];
				this.replace_template = this.replace_template
				.replace(new RegExp("\\?" + v[0], "g"), "%uri%")
				.replace(new RegExp("(\\?" + v[1] + ")"), "$1 rdfs:label ?label ; ")
				.replace(new RegExp("__" + v[1]), "?" + v[1]);
			}
			var query = this.replace_template.replace(/%uri%/g, "<" + uri +">");
			return "?query=" + encodeURIComponent(query);
		},
		image_q: function(uri){
			var img = Util.dom.element("img");
			img.src = uri;
			img.title = uri;
			img.className = "thumb";
			return img;
		},
		preamble: function(query, qtype){
			if(qtype === "DESCRIBE"){
				query = "define sql:describe-mode \"CBD\"\n" + query;
			}else if(qtype === "SELECT" && query.match(/SELECT \?type \(count.*\)/i)){
				var exclude = "";
				["http://www.w3.org/2002/07/owl#",
				"http://www.w3.org/ns/ldp#",
				"http://www.openlinksw.com/schemas/virtrdf#"
				].forEach(function(uri){
					exclude += "define input:default-graph-exclude <" + uri + ">\n";
				});
				query = exclude + query;
			}
			return query;
		},
	},
	"iiif": {
		logo: null,
		viewer: "https://www.kanzaki.com/works/2016/pub/image-annotator?u=",
		set_viewer_link: function(manifest, canvas, indv){
			 return manifest;
			//return this.viewer + manifest + (canvas ? "&canvas=" + canvas : "") + (indv ? "&vhint=individuals" : "");
		},
		ld: {p:[["b","M 65.2422,2178.75 775.242,1915 773.992,15 65.2422,276.25 v 1902.5"],["b","m 804.145,2640.09 c 81.441,-240.91 -26.473,-436.2 -241.04,-436.2 -214.558,0 -454.511,195.29 -535.9527,436.2 -81.4335,240.89 26.4805,436.18 241.0387,436.18 214.567,0 454.512,-195.29 535.954,-436.18"],["r","M 1678.58,2178.75 968.578,1915 969.828,15 1678.58,276.25 v 1902.5"],["r","m 935.082,2640.09 c -81.437,-240.91 26.477,-436.2 241.038,-436.2 214.56,0 454.51,195.29 535.96,436.2 81.43,240.89 -26.48,436.18 -241.04,436.18 -214.57,0 -454.52,-195.29 -535.958,-436.18"],["b","m 1860.24,2178.75 710,-263.75 -1.25,-1900 -708.75,261.25 v 1902.5"],["b","m 2603.74,2640.09 c 81.45,-240.91 -26.47,-436.2 -241.03,-436.2 -214.58,0 -454.52,195.29 -535.96,436.2 -81.44,240.89 26.48,436.18 241.03,436.18 214.57,0 454.51,-195.29 535.96,-436.18"],["r","m 3700.24,3310 v -652.5 c 0,0 -230,90 -257.5,-142.5 -2.5,-247.5 0,-336.25 0,-336.25 l 257.5,83.75 V 1690 l -258.61,-92.5 V 262.5 L 2735.24,0 v 2360 c 0,0 -15,850 965,950"]],vb:"0 0 493.35999 441.33334",tm:"matrix(1.3333333,0,0,-1.3333333,0,441.33333) scale(0.1)",c:{"b":"2873ab","r":"ed1d33"}},gen: function(h){var elt=Util.dom.sve("svg",[["viewBox",this.ld.vb],["height",h]]),g=Util.dom.sve("g",[["transform",this.ld.tm]]);this.ld.p.forEach(function(pa){g.appendChild(Util.dom.sve("path",[["d",pa[1]],["style","fill:#"+this.ld.c[pa[0]]]]));},this);elt.appendChild(g);return elt;}
	},
	//add map w/ Leaflet
	map: {
		mymaps: [],
		def: Snorqldef.ldb ? Snorqldef.ldb.map : {
			template: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
		},
		setup: function(tgobj, lat, po, ns){
			//requires Leaflet
			if(!window.L) return false;
			var long = this.getval(po, ns.schema + "longitude");
			//var key = lat + "-" + long;
			//if(this.mymaps[key]) return true;
			var zlevel = 10,
			geohash = this.getval(po, ns.jps + "within"),
			mapdiv = Util.dom.element("div");
			if(geohash){
				//determine precision according to geohash URI's hash length (JPS uses shorter hash for vague geocoord)
				var m = geohash.match(/geohash\.org\/(.*)$/),
				precision = m[1].length;
				zlevel = precision < 5 ? 6 : precision + 4;
				if(precision >= 5 && m[1].match(/^xn7(6[c-t]|7[3-9a-j])/)) zlevel += 2;	//tokyo
				else if(precision < 5 && !m[1].match(/^(w[u-z]|x[n-p])/)) zlevel -= 3;	//not japan
				//console.log(geohash, zlevel);
			};
			tgobj.appendChild(mapdiv);
			tgobj.classList.add("map");
			var mymap = L.map(mapdiv, {center: [lat, long], zoom: zlevel, zoomControl: false});
			L.tileLayer(this.def.template, {
				attribution: this.def.attribution,
			}).addTo(mymap);
			if(zlevel > 6) L.marker([lat, long]).addTo(mymap);
			else L.circle([lat, long], {stroke: false, fillColor: "blue", fillOpacity: 0.15, radius: 1800000 / (zlevel*zlevel) }).addTo(mymap); 
			this.mymaps.push(mymap);
		},
		getval: function(po, prop){
			var o = po[prop];
			return o ? o[0].value : null;
		},
		//need refresh for late appended map
		refresh: function(){
			if(this.mymaps.length) this.mymaps.forEach(function(m){m.invalidateSize();});
		}
	},
	//query example setter. provide examples in snoral_def.js
	example: {
		queries: [],
		ns: {},
		textarea: null,
		prepare: function(textareaid){
			if(!Snorqldef.example) return null;
			if(Snorqldef.example_ns) this.ns = Snorqldef.example_ns;
			this.textarea = Util.dom.byid(textareaid);
			var that = this,
			labelkey,
			sel = Util.dom.element("select");
			if(Util.ulang === "ja"){
				add_option("― クエリ例 ―", "");
				labelkey = "label";
			}else{
				add_option("=== Query Examples ===", "");
				labelkey = "label_en";
			}
			Snorqldef.example.forEach(function(ex){
				var prolog = "";
				ex.ns.forEach(function(pfx){
					if(this.ns[pfx]) prolog += "PREFIX " + pfx + ": <" + this.ns[pfx] + ">\n";
				}, this);
				add_option(ex[labelkey], prolog + ex.query);
			}, this);
			sel.addEventListener("change", function(ev){Util.example.set(ev.target.selectedIndex);});
			this.textarea.parentNode.appendChild(sel);
			
			function add_option(label, query){
				var opt = Util.dom.element("option");
				opt.appendChild(Util.dom.text(label));
				sel.appendChild(opt);
				that.queries.push(query);
			}
		},
		set: function(i){
			if(i===0) return;
			this.textarea.value = this.queries[i];
			if(CMEditor) CMEditor.setValue(this.queries[i]);
		}
	}
};
