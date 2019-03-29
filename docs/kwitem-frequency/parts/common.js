function langset(lang){
	document.documentElement.setAttribute("lang", lang);
	ge.lang.current = lang;
}
function toggle_langbtn(){
	var to_active = ge.lang.current === "ja" ? "en" : "ja";
	ge.lang.btn[to_active].classList.add("active") ;
	ge.lang.btn[ge.lang.current].classList.remove("active") ;
}
function langtoggle(obj){
	var lang = obj.innerText;
	if(lang === ge.lang.current) return;
	else{
		toggle_langbtn();
		langset(lang);
	}
}
Util = {
	jps: {
		endpoint: "https://sparql.dl.itc.u-tokyo.ac.jp",
		snorql: "https://nakamura196.github.io/portal_pro/snorql2/",
		query: function(qstr){
			return this.snorql + "?query=" + encodeURIComponent(qstr);
		}
	},
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
			if(attrs) attrs.forEach(function(attr){e.setAttribute(attr[0], attr[1])});
			return e;
		}
	}
}
function postinit(){
	var bar = document.createElement("span"),
	main = document.querySelector(".main");
	bar.className = "langbar";
	["ja", "en"].forEach(function(lang){
		var btn = document.createElement("span");
		btn.innerText = lang;
		btn.onclick = function(){langtoggle(this);};
		if(ge.lang.current === lang) btn.className = "active";
		bar.appendChild(btn);
		ge.lang.btn[lang] = btn;
	});
	main.insertBefore(bar, main.firstChild);
}
(function(){
	ge.lang = {current:null, btn: {}};
	if(!ge.usrLang.match(/^ja/i)){
		langset("en");
	}else{
		ge.lang.current = "ja";
	}
})();
