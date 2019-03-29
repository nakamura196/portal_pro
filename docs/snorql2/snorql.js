/** SNORQL - an AJAXy front-end for exploring RDF SPARQL endpoints
 * based on SNORQL http://www4.wiwiss.fu-berlin.de/bizer/d2r-server/
 * originally created by Richard Cyganaik
 * adopted by kurtjx https://github.com/kurtjx/SNORQL
 * Apache-2 license
 * modified for Japan Search 2018-12-08 by masaka
 - removed graph browse / named graph and xslt to make things simple
 - removed dependencies on prototype.js and scriptaculous.js
 - added support of CodeMirror, if it is instantiated as CMEditor
 - works better if used with snorql_ldb.js, but not necessary
*/
var snorql = new Snorql();
//@@added 2018-12-13
var SPARQL, D2R_namespacePrefixes, CMEditor, Snorqldef, Util,
EasySPARQL, JsonRDFFormatter, SPARQLSelectTableFormatter;

String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
};

String.prototype.startsWith = function(str) {
	return (this.match("^"+str) === str);
};

function Snorql() {
    // modify this._endpoint to point to your SPARQL endpoint
    this._endpoint = null;
    // modify these to your likeing
    this._poweredByLink = 'http://www4.wiwiss.fu-berlin.de/bizer/d2r-server/';
    this._poweredByLabel = 'D2R Server';

    this._browserBase = null;
    this._namespaces = {};
    this._graph = "portal";
    //removed here: graph, xslt related
	this.default_query = 'SELECT DISTINCT * WHERE {\n  ?s ?p ?o\n}\nLIMIT 10';
    this.homedef = null;	//@@added 2018-12-13
	this.use_browsecp = false;	//flag to activate browse=class|property param
	this.link_img = 'link.png';	//2019-01-20

    this.start = function() {
		if(Snorqldef) this.init_homedef(Snorqldef);
        //this._enableNamedGraphs = false;
        // TODO: Extract a QueryType class
		if(!this._endpoint) this._endpoint = document.location.href.match(/^([^?]*)snorql/)[1] + 'sparql';
        this.setBrowserBase(document.location.href.replace(/\?.*/, ''));
        this._displayEndpointURL(this.homedef.label || null);
        this._displayPoweredBy();
        this.setNamespaces(D2R_namespacePrefixes);
    	if(document.querySelector("a.graph-link")) this.use_browsecp = true;
        //this.updateOutputMode();
    	var qparam = {
    		text: null,	//querytext = sparql query (from user) -> text area default value
    		query: null,	//sparql query to send to endpoint
    		urlstring: document.location.search.substr(1), //queryString = url encoded query string
    	},
    	ressec = document.getElementById('ressection'),	//section to display the results
    	resultTitle;	//heading in the result display section
    	if(Util.example) Util.example.prepare("querytext");

        if (!qparam.urlstring) {
        	//@@ modified 2018-12-08
        	this.prepare_default(ressec);
        	return;
        }
    	ressec.style.display = "block";
    	// no graph related
		//@@ easysql 2018-12-08
    	if(EasySPARQL){
    		if(!(new EasySPARQL(this._namespaces, 200).doit(this._endpoint, qparam))) return;
    		if(qparam.query) resultTitle = "EasySPARQL results:";
    		if(qparam.endpoint) this._endpoint = qparam.endpoint;
    	}
    	//removed here: browse graph. also, browse class / property are moved to this.original_class_prop_query
    	//@@modified 2018-12-07
        var matched,	//regex match results array
    	desc_uri,	//URI to describe
    	is_home_uri;	//flag to indicate the uri to describe is a resource in this triple store
		if ((matched = qparam.urlstring.match(/describe.([^&]*)/))) {
			desc_uri = decodeURIComponent(matched[1]);
			//in case describe as query (not api param)
			if((matched = desc_uri.match(/<([^>]+)>/))) desc_uri = matched[1];
			resultTitle = 'Description of <' +
			(Util.trim_str ? Util.trim_str(desc_uri, 100, [60, 30]) : desc_uri) + ">";
			qparam.text = "DESCRIBE <" + desc_uri + ">";
			if(this.homedef.duri_pat && desc_uri.match(this.homedef.duri_pat)
				//this.homedef.datauri &&
				//desc_uri.substr(0, this.homedef.datauri_len) === this.homedef.datauri &&
				//! desc_uri.match(/#/)
			){
				//special treatment to describe subresourece
				if(this.homedef.data_frags){
					if(! desc_uri.match(/#/)) this.homedef.data_frags.forEach(function(frag){
						qparam.text += "\n\t<" + desc_uri + "#" + frag + ">";
					});
					else if(matched = desc_uri.match(this.homedef.dfrag_pat)){
						qparam.text += "\n\t<" + matched[1] + ">";
						this.homedef.data_frags.forEach(function(frag){
							if(matched[2] !== frag) qparam.text += "\n\t<" + matched[1] + "#" + frag + ">";
						});
					}
					is_home_uri = true;
				}else if(! desc_uri.match(/#/)) is_home_uri = true;
			}else if(this.homedef.workuri_pat && desc_uri.match(this.homedef.workuri_pat)){
				is_home_uri = true;
			}
			qparam.query = qparam.text;
		}else if ((matched = qparam.urlstring.match(/query=([^&]*)/))) {
            resultTitle = 'SPARQL results:',
            qparam.text = this._betterUnescape(matched[1]);
        	qparam.query = this._getPrefixes() + qparam.text;

		}else if(this.use_browsecp){
			//browse class / property works iiif "Browse" section presents
			resultTitle = this.original_class_prop_query(qparam);
		}
        if (!qparam.text) {
        	//@@ modified 2018-12-08
        	this.prepare_default(ressec);
        	return;
        }
        document.getElementById('querytext').value = qparam.text;
    	if(CMEditor) CMEditor.setValue(qparam.text);	//@@ CodeMirror support 2018-12-09

        this.displayBusyMessage();
        var service = new SPARQL.Service(this._endpoint);
    	// removed here: if (this._graph)
    	service.setMethod("GET");

        // AndyL changed MIME type and success callback depending on query form...
        var dummy = this;

   	    var exp = /^\s*(?:PREFIX\s+\w*:\s+<[^>]*>\s*)*(\w+)\s*.*/i;
   	    if ((matched = exp.exec(qparam.text))) {
   	    	var successFunc,
   	    	qtype = matched[1].toUpperCase();
   	    	this.qtype = qtype;
   	    	//if(Util.query_preamble) qparam.query = Util.query_preamble(qparam.query, qtype);
   	    	if(Util.queries) qparam.query = Util.queries.preamble(qparam.query, qtype);
	        if (qtype === 'ASK') {
	        	service.setOutput('boolean');
	        	successFunc = function(value) {
	                dummy.displayBooleanResult(value, resultTitle);
	            };
	        } else if (qtype === 'CONSTRUCT' || qtype === 'DESCRIBE'){
				if(JsonRDFFormatter){
					//@@ modified 2018-12-08
					var jrdf = new JsonRDFFormatter(this, desc_uri, is_home_uri);
					successFunc = function(model) {
						jrdf.display_result(model, resultTitle, qtype);
					};
				}else{
	                service.setOutput('rdf'); // !json
		            var successFunc = function(model) {
		                dummy.displayRDFResult(model, resultTitle);
		            };
				}
	        } else {
	        	//SELECT query
	        	service.setRequestHeader('Accept', 'application/sparql-results+json,*/*'); //*/
	        	service.setOutput('json');
	        	successFunc = function(json) {
	        		dummy.displayJSONResult(json, resultTitle);
	        	};
	        }
   	    }

        service.query(qparam.query, {
            success: successFunc,
            failure: function(report) {
                var message = report.responseText.match(/<pre>([\s\S]*)<\/pre>/);
                if (message) {
                    dummy.displayErrorMessage(message[1]);
                } else {
                    dummy.displayErrorMessage(report.responseText);
                }
            }
        });
    };

    this.setBrowserBase = function(url) {
        this._browserBase = url;
    };

    this._displayEndpointURL = function(label) {
    	//@@modified 2018-12-08
    	var newTitle = "Snorql" + (label ? " for " + label : ": Exploring " + this._endpoint);
        this._display(document.createTextNode(newTitle), 'title');
        document.title = newTitle;
    };

    this._displayPoweredBy = function() {
    	//removed dependencies on prototype.js
        //$('poweredby').href = this._poweredByLink;
        //$('poweredby').update(this._poweredByLabel);
        var pwb = document.getElementById("poweredby");
    	pwb.href = this._poweredByLink;
        pwb.innerText = this._poweredByLabel;
    };

    this.setNamespaces = function(namespaces) {
        this._namespaces = namespaces;
        this._display(document.createTextNode(this._getPrefixes()), 'prefixestext');
    };

	//removed here: switchToGraph, switchToDefaultGraph, _updateGraph, updateOutputMode, resetQuery

	//called from HTML form button (onclick)
    this.submitQuery = function() {
        var mode = this._selectedOutputMode();
    	if(CMEditor) document.getElementById('querytext').value = CMEditor.getValue();	//@@ CodeMirror support 2018-12-09
        if (mode === 'browse') {
            document.getElementById('queryform').action = this._browserBase;
            document.getElementById('query').value = document.getElementById('querytext').value;
        } else {
            document.getElementById('query').value = this._getPrefixes() + document.getElementById('querytext').value;
            document.getElementById('queryform').action = this._endpoint;
        }
        document.getElementById('jsonoutput').disabled = (mode !== 'json');
       /* deleted xslt check */
        document.getElementById('queryform').submit();
    };

    this.displayBusyMessage = function() {
        var busy = document.createElement('div');
        busy.className = 'busy';
        busy.appendChild(document.createTextNode('Executing query ... '));
        this._display(busy, 'result');
    };

    this.displayErrorMessage = function(message) {
        var pre = document.createElement('pre');
        pre.innerHTML = message;
        this._display(pre, 'result');
    };

    this.displayBooleanResult = function(value, resultTitle) {
        var div = document.createElement('div');
        var title = document.createElement('h2');
        title.appendChild(document.createTextNode(resultTitle));
        div.appendChild(title);
        if (value)
        	div.appendChild(document.createTextNode("TRUE"));
        else
        	div.appendChild(document.createTextNode("FALSE"));
        this._display(div, 'result');
    };

    this.displayRDFResult = function(model, resultTitle) {
        var div = document.createElement('div');
        var title = document.createElement('h2');
        title.appendChild(document.createTextNode(resultTitle));
        div.appendChild(title);
        div.appendChild(new RDFXMLFormatter(model));
        this._display(div, 'result');
        this._updateGraph(this._graph); // refresh links in new result - necessary for boolean?
    }

    this.displayJSONResult = function(json, resultTitle) {
        var div = document.createElement('div');
        var title = document.createElement('h2');
        title.appendChild(document.createTextNode(resultTitle));
        div.appendChild(title);
    	//@@added error check 2018-12-09
    	if(!json){
    		this.__msg(div, "[query error: no response]", "p") ;
    	}else if(json.status && json.status === "error"){
    		this.__msg(div, "ajax error: " + json.response , "pre") ;
    		console.log(json);
    	}else if(json.head && json.head.status === "error"){
    		this.__msg(div, "query error: " + json.head.msg , "pre") ;
    	}else if (json.results.bindings.length === 0) {
    		this.__msg(div, "[no results]", "p") ;
        } else {
        	if(SPARQLSelectTableFormatter){
        		//@@modified 2018-12-12
	        	new SPARQLSelectTableFormatter(json, this._namespaces, this).toDOM(div);
        	}else{
        		div.appendChild(new SPARQLResultFormatter(json, this._namespaces, this).toDOM());
        	}
        }
        this._display(div, 'result');
    };
	//@@2018-12-09
	this.__msg = function(div, msg, elt){
            var p = document.createElement(elt);
            p.className = 'empty';
            p.appendChild(document.createTextNode(msg));
            div.appendChild(p);
		//@@added 2018-12-14
		document.title = this.qtype + " " + msg + " - Snorql"
		+ (this.homedef.label ? " for " + this.homedef.label : "");
	};

    this._display = function(node, whereID) {
        var where = document.getElementById(whereID);
        if (!where) {
            alert('ID not found: ' + whereID);
            return;
        }
        while (where.firstChild) {
            where.removeChild(where.firstChild);
        }
        if (node === null) return;
        where.appendChild(node);
    };

    this._selectedOutputMode = function() {
        return document.getElementById('selectoutput').value;
    };

    this._getPrefixes = function() {
        var prefix, prefixes = '';
        for (prefix in this._namespaces) {
            var uri = this._namespaces[prefix];
            prefixes = prefixes + 'PREFIX ' + prefix + ': <' + uri + '>\n';
        }
        return prefixes;
    };

    this._betterUnescape = function(s) {
        //return unescape(s.replace(/\+/g, ' '));
    	//@@modified 2018-12-07
        return decodeURIComponent(s.replace(/\+/g, ' '));
    };

	//@@ moved here and works iif "Browse" section presents
	this.original_class_prop_query = function(qparam){
        var browse = qparam.urlstring.match(/browse=([^&]*)/);
        qparam.text = null;
        if (browse && browse[1] == 'superclasses') {
            var resultTitle = 'List of all super classes:';
            qparam.text = 'SELECT DISTINCT ?class\n' +
                    'WHERE { [] rdfs:subClassOf ?class }\n' +
                    'ORDER BY ?class';
            qparam.query = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' + qparam.text;
        }
        if (browse && browse[1] == 'classes') {
            var resultTitle = 'List of all classes:';
            qparam.query = 'SELECT DISTINCT ?class\n' +
                    'WHERE { [] a ?class }\n' +
                    'ORDER BY ?class';
        }
        if (browse && browse[1] == 'properties') {
            var resultTitle = 'List of all properties:';
            qparam.query = 'SELECT DISTINCT ?property\n' +
                    'WHERE { [] ?property [] }\n' +
                    'ORDER BY ?property';
        }
        if (browse && browse[1] == 'graphs') {
            var resultTitle = 'List of all named graphs:';
            qparam.text = 'SELECT DISTINCT ?namedgraph ?label\n' +
                    'WHERE {\n' +
                    '  GRAPH ?namedgraph { ?s ?p ?o }\n' +
                    '  OPTIONAL { ?namedgraph rdfs:label ?label }\n' +
                    '}\n' +
                    'ORDER BY ?namedgraph';
            qparam.query = 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n' + qparam.text;
        }
        var match = qparam.urlstring.match(/property=([^&]*)/);
        if (match) {
            var resultTitle = 'All uses of property ' + decodeURIComponent(match[1]) + ':';
            qparam.query = 'SELECT DISTINCT ?resource ?value\n' +
                    'WHERE { ?resource <' + decodeURIComponent(match[1]) + '> ?value }\n' +
                    'ORDER BY ?resource ?value';
        }
        var match = qparam.urlstring.match(/class=([^&]*)/);
        if (match) {
            var resultTitle = 'All instances of class ' + decodeURIComponent(match[1]) + ':';
            qparam.query = 'SELECT DISTINCT ?instance\n' +
                    'WHERE { ?instance a <' + decodeURIComponent(match[1]) + '> }\n' +
                    'ORDER BY ?instance';
        }
		if (!qparam.text) qparam.text = qparam.query;
		return resultTitle;
	};

	//@@added
	this.prepare_default = function(ressec){
		document.getElementById('querytext').value = this.default_query;
		if(CMEditor) CMEditor.setValue(this.default_query);
		ressec.style.display = "none";
	};
	this.init_homedef = function(def){
		//@@added for flexible customization. Can declare any variable in other place
		for(var key in def.vars) this[key] = def.vars[key];
		if(def.home){
			this.homedef = def.home;
			if(def.home.datauri) this.homedef.datauri_len = def.home.datauri.length;
			if(def.home.datauri_pat) this.homedef.duri_pat = new RegExp(def.home.datauri_pat);
			if(def.home.data_frags) this.homedef.dfrag_pat = new RegExp("^(.*)#(" + def.home.data_frags.join("|") + ")$");
			if(def.home.workuri){
				this.homedef.workuri_pat = new RegExp("^(" + def.home.workuri.join("|") + ")");
			}
			if(def.home.submit_label){
				var pos = Util.ulang ? (Util.ulang === "ja" ? 0 : 1) : 0,
				btn = document.querySelector("input[value='Go!']");
				if(btn) btn.value = " " + def.home.submit_label[pos] + " ";
			}
			Util.defaulturi = def.home.datauri;
			if(def.home.label) Util.homelabel = def.home.label;
		}
	}
}


/*
 * RDFXMLFormatter
 *
 * maybe improve...
 */
function RDFXMLFormatter(string) {
	var pre = document.createElement('pre');
	pre.appendChild(document.createTextNode(string));
	return pre;
}


/*
===========================================================================
SPARQLResultFormatter: Renders a SPARQL/JSON result set into an HTML table.

var namespaces = { 'xsd': '', 'foaf': 'http://xmlns.com/foaf/0.1' };
var formatter = new SPARQLResultFormatter(json, namespaces);
var tableObject = formatter.toDOM();
*/
function SPARQLResultFormatter(json, namespaces, app) {
	if(json){	//@@added in order to call without result json (from other formatter)
	    this._json = json;
	    this._variables = this._json.head.vars;
	    this._results = this._json.results.bindings;
	}
    this._namespaces = namespaces;
	this.use_browsecp = app.use_browsecp || false;	//flag to activate browse=class|property param
	this.app = app;	//2019-01-20 points to Snorql

    this.toDOM = function() {
        var table = document.createElement('table');
        table.className = 'queryresults';
        table.appendChild(this._createTableHeader());
        for (var i = 0; i < this._results.length; i++) {
            table.appendChild(this._createTableRow(this._results[i], i));
        }
        return table;
    };

    // TODO: Refactor; non-standard link makers should be passed into the class by the caller
    this._getLinkMaker = function(varName) {
        if (varName === 'property' && this.use_browsecp) {
            return function(uri) { return '?property=' + encodeURIComponent(uri); };
        } else if (varName === 'class' && this.use_browsecp) {
            return function(uri) { return '?class=' + encodeURIComponent(uri); };
        } else if (varName === '_replace' && Util.queries) {
        	//@@2018-12-13
            return function(uri) { return Util.queries.replace_q(uri); };
        } else if (varName.match(/^(thumb(nail)|image)$/) && Util.queries) {
        	//@@2018-12-13
            return function(uri) { return Util.queries.image_q(uri); };
        } /* else if (varName === '_replace' && Util.replace_query) {
        	//@@2018-12-13
            return function(uri) { return Util.replace_query(uri); };
        } else if (varName.match(/^(thumb(nail)|image)$/) && Util.image_query) {
        	//@@2018-12-13
            return function(uri) { return Util.image_query(uri); };
        }*/ else {
            return function(uri) { return '?describe=' + encodeURIComponent(uri); };
        }
    };

    this._createTableHeader = function() {
        var tr = document.createElement('tr');
        var hasNamedGraph = false;
        for (var i = 0; i < this._variables.length; i++) {
            var th = document.createElement('th');
            th.appendChild(document.createTextNode(this._variables[i]));
            tr.appendChild(th);
            if (this._variables[i] === 'namedgraph') {
                hasNamedGraph = true;
            }
        }
        if (hasNamedGraph) {
            var th = document.createElement('th');
            th.appendChild(document.createTextNode(' '));
            tr.insertBefore(th, tr.firstChild);
        }
        return tr;
    };

    this._createTableRow = function(binding, rowNumber) {
        var tr = document.createElement('tr');
        if (rowNumber % 2) {
            tr.className = 'odd';
        } else {
            tr.className = 'even';
        }
        var namedGraph = null;
    	var numvars = this._variables.length;	//@@added 2018-12-07
        for (var i = 0; i < numvars; i++) {
            var varName = this._variables[i];
            var td = document.createElement('td');
        	//@@modified 2018-12-07
        	var node = binding[varName];
        	if(i===0 && numvars <= 3 && this._variables[1]==="count") varName = "_replace";
        	var nodeval = this._formatNode(node, varName, numvars);
            td.appendChild(nodeval);
        	if(nodeval.className === "unbound") td.className = "unbound";
            tr.appendChild(td);
            if (this._variables[i] === 'namedgraph') {
                namedGraph = binding[varName];
            }
        }
        if (namedGraph) {
            var link = document.createElement('a');
            link.href = 'javascript:snorql.switchToGraph(\'' + namedGraph.value + '\')';
            link.appendChild(document.createTextNode('Switch'));
            var td = document.createElement('td');
            td.appendChild(link);
            tr.insertBefore(td, tr.firstChild);
        }
        return tr;
    };

    this._formatNode = function(node, varName, numvars) {
        if (!node) {
            return this._formatUnbound(node, varName);
        }
        if (node.type === 'uri') {
            return this._formatURI(node, varName, numvars);
        }
        if (node.type === 'bnode') {
            return this._formatBlankNode(node, varName);
        }
        if (node.type === 'literal') {
        	if(node.datatype) return this._formatTypedLiteral(node, varName);
            else return this._formatPlainLiteral(node, varName);
        }
        if (node.type === 'typed-literal') {
            return this._formatTypedLiteral(node, varName);
        }
        return document.createTextNode('???');
    };

    this._formatURI = function(node, varName, numvars, dlinkoption) {
    	//@@added 3rd, 4th arg: variable length (=column count), no direct link flag 2018-12-10
    	var link = this._getLinkMaker(varName)(node.value);
    	if(typeof(link) === "object") return link;
        var span = document.createElement('span');
        span.className = 'uri';
        var a = document.createElement('a');
        a.href = link;
    	a.title = '<' + node.value + '>';
        a.className = 'graph-link';
        var qname = this._toQName(node.value);
        if (qname) {
            a.appendChild(document.createTextNode(qname));
            span.appendChild(a);
        } else {
	    	//@@modified 2018-12-08 to trim long URI for display purpose
            a.appendChild(document.createTextNode(Util.url_disp(node.value, numvars)));
            //a.appendChild(document.createTextNode(node.value));
            span.appendChild(document.createTextNode('<'));
            span.appendChild(a);
            span.appendChild(document.createTextNode('>'));
        }
        match = node.value.match(/^(https?|ftp|mailto|irc|gopher|news):/);
        if (match && dlinkoption !== false) {
        	//@@ added dlinkoption condition in order not to add direct link for property cell
            span.appendChild(document.createTextNode(' '));
            var externalLink = document.createElement('a');
        	//add dlinkoption as URI parameter
        	externalLink.href = node.value + (typeof(dlinkoption)==="string" ? dlinkoption : "");
            img = document.createElement('img');
            //img.src = this.app.link_img;	//'link.png';	//2019-01-20
            img.src = 'link.png';	//2019-01-20
            img.alt = "";	//'[' + match[1] + ']';
            img.title = "to this URI itself";	//'Go to Web page';
            externalLink.appendChild(img);
            span.appendChild(externalLink);
        }
        return span;
    };

    this._formatPlainLiteral = function(node, varName) {
    	//@@2018-12-09 added node.lang
        var text = '"' + node.value + '"', lang;
        if ((lang = node['xml:lang'] || node.lang)) {
            text += '@' + lang;
        }
        return document.createTextNode(text);
    };

    this._formatTypedLiteral = function(node, varName) {
        var text = '"' + node.value + '"';
        if (node.datatype) {
            text += '^^' + this._toQNameOrURI(node.datatype);
        }
        if (this._isNumericXSDType(node.datatype)) {
            var span = document.createElement('span');
            span.title = text;
            span.appendChild(document.createTextNode(node.value));
            return span;
        }
        return document.createTextNode(text);
    };

    this._formatBlankNode = function(node, varName) {
        return document.createTextNode('_:' + node.value);
    };

    this._formatUnbound = function(node, varName) {
        var span = document.createElement('span');
        span.className = 'unbound';
        span.title = 'Unbound';
        span.appendChild(document.createTextNode('-'));
        return span;
    };

    this._toQName = function(uri) {
        for (var prefix in this._namespaces) {
            var nsURI = this._namespaces[prefix];
            if (uri.indexOf(nsURI) === 0) {
                return prefix + ':' + uri.substring(nsURI.length);
            }
        }
        return null;
    };

    this._toQNameOrURI = function(uri) {
        var qName = this._toQName(uri);
        return (qName === null) ? '<' + uri + '>' : qName;
    };

    this._isNumericXSDType = function(datatypeURI) {
        for (i = 0; i < this._numericXSDTypes.length; i++) {
            if (datatypeURI === this._xsdNamespace + this._numericXSDTypes[i]) {
                return true;
            }
        }
        return false;
    };
    this._xsdNamespace = 'http://www.w3.org/2001/XMLSchema#';
    this._numericXSDTypes = ['long', 'decimal', 'float', 'double', 'int',
        'short', 'byte', 'integer', 'nonPositiveInteger', 'negativeInteger',
        'nonNegativeInteger', 'positiveInteger', 'unsignedLong',
        'unsignedInt', 'unsignedShort', 'unsignedByte'];
}
/*
 * RDFXMLFormatter
 *
 * maybe improve...
 */
function RDFXMLFormatter(string) {
	var pre = document.createElement('pre');
	pre.appendChild(document.createTextNode(string));
	return pre;
}

//will be overridden by snorql_ldb.js
Util = {
	url_disp: function(str){return str;}
}
