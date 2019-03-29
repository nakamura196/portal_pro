//2019-03-07
var WF = {
	service: new SPARQL.Service(Util.jps.endpoint),
	canvas: document.getElementById("wchart"),
	frm: document.getElementById("freqform"),
	ctx: null,
	cvpos: null,
	ttip: document.getElementById("chartjs-tooltip"),
	tipa: null,
	//sty: 1868,
	sty: 500,
	edy: (new Date()).getFullYear(),
	charts: [],
	regd: [],
	comb: {chid: null, dsids: []},
	current_id: null,
	init: function(){
		this.ctx = this.canvas.getContext("2d");
		this.cvpos = this.canvas.getBoundingClientRect();
	},
	go_chart: function(f){
		if(!f.word.value) alert("キーワードを入力してください");
		else this.freq_chart(f.word.value, f.sty.value, f.incdesc.checked);
		return false;
	},
	freq_chart: function(word, sty, incdesc){
		var that = this,
		sig = word + ":" + sty + "～:" + (incdesc ? "テキスト" : "タイトル"),
		rchid = null;
		if((rchid = this.regd.indexOf(sig)) !== -1){
			this.reuse_chart(rchid);
			return;
		}
		var label = word + (incdesc ? "（テキスト）" : ""),
		query = this.get_count_query(word, sty, incdesc),
		doit = function(res){
			if(res.results){
				var chid = that.reg_reuse(sig, Number(sty));
				that.draw_chart(res.results.bindings, label, word, Number(sty), incdesc, chid);
			}else{
				that.canvas.classList.remove("loading");
				console.log("no results", query, res);
			}
		},
		nogood = function(res){
			that.canvas.classList.remove("loading");
			console.log("failed", query, res);
		};
		this.canvas.classList.add("loading");
		this.service.setMethod("GET");
		this.service.setRequestHeader("Accept", "application/sparql-results+json,*/*"); //*/
		this.service.setOutput("json");
		this.service.query(query, {success: doit, failure: nogood});
	},
	//gerenate a new chart using the result bindings
	draw_chart: function(bindings, wlabel, sword, sty, incdesc, chid){
		//setup data array for new chart
		var d = {}, ds = {};	//data, data span
		bindings.forEach(function(bind){
			var val = Number(bind.count.value),
			sy = bind.sy.value,
			ey = bind.ey.value;
			if(sy == ey){
				//single year
				d[sy] = d[sy] ? d[sy] + val : val;
			}else{
				//year range = distribute the value to all years in the range
				var veach = Math.ceil(val / ((ey - sy) + 1));
				for(var y=sy; y<=ey; y++){
					ds[y] = ds[y] ? ds[y] + veach : veach;
				}
			}
		});
		var lb = [], dt = [], dst = [];
		for(var y=sty; y<this.edy; y++){	//今年は含めないでおく
			lb.push(String(y));
			dt.push(d[y] || 0);
			dst.push(ds[y] || 0);
		}
		this.canvas.classList.remove("ready", "loading");
		//generate a new chart
		var that = this,
		colors = ["255, 99, 132","54, 162, 235", "255, 206, 86", "75, 192, 192", "153, 102, 255", "255, 159, 64"],
		c = colors[chid % 6],
		chrt = new Chart(this.ctx, {
			type: "line",
			data: {
				labels: lb,
				datasets: [
					{label: wlabel, data: dt, backgroundColor: "rgba("+c+", 0.2)", borderColor: "rgba("+c+", 1)"},
					{label: wlabel + "(年範囲分)", data: dst, backgroundColor: "rgba("+c+", 0.1)", borderColor: "rgba("+c+", 0.8)", borderDash: [2,2]},
				]
			},
			options: {
				events: ["click"],
				tooltips: {
					enabled: false,
					custom: function(model){that.tooltip(model, chid);}
				},
				scales: {
					yAxes: [{
						stacked: true
					}]
				}
			}
		});
		//register generated chart
		this.charts.push({
			"chart": chrt,
			"word": sword,
			"styr": sty,
			"incdesc": incdesc
		});
	},
	//show tooptip at data points and link each year/item query
	tooltip: function(model, chid){
		if(chid !== this.current_id) this.reuse_chart(chid, true);
		if(model.opacity === 0){
			this.ttip.style.opacity = 0;
			return;
		}
		this.ttip.classList.remove("above", "below", "no-transform");
		if(model.yAlign){
			this.ttip.classList.add(model.yAlign);
		}else{
			this.ttip.classList.add('no-transform');
		}
		//console.log(model);
		if(model.body){
			if(!this.tipa){
				this.tipa = document.createElement("a");
				this.tipa.setAttribute("target", "jps-snorql");
			}
			var year = model.title[0],
			displabel = model.body[0].lines[0],
			m = displabel.match(/^(.+?)(（.+）)?: (\d+)/),
			text = year + ": " + m[1] + " = " + m[3] + "件";
			if(model.dataPoints[0].datasetIndex === 0){
				this.ttip.innerHTML = "";
				this.tipa.setAttribute("href", Util.jps.query(this.get_one_query(m[1], year, m[2])));
				this.tipa.innerText = text;
				this.ttip.appendChild(this.tipa);
			}else{
				this.ttip.innerHTML = text;
			}
		}
		this.ttip.style.opacity = 1;
		this.ttip.style.left = this.cvpos.left + window.pageXOffset + model.caretX + 'px';
		this.ttip.style.top = this.cvpos.top + window.pageYOffset + model.caretY + 'px';
		this.ttip.classList.remove("ready");
	},
	//combine existing datasets (whose styr is same as styr of the 1st chart)
	combine: function(btn){
		var c0 = this.charts[0],
		comb = this.comb.chid ? this.charts[this.comb.chid].chart : null,
		dset = comb ? comb.config.data.datasets : [],
		dslen = dset.length;
		this.charts.forEach(function(c, i){
			if(this.comb.dsids.indexOf(i) !== -1) return;	//if already added to comb chart
			if(c.styr === c0.styr){
				//only same year range (labels) can be combined
				dset.push(c.chart.config.data.datasets[0]);
				this.comb.dsids.push(i);
			}
		}, this);
		if(comb){
			//if comb chart already generated
			if(dset.length > dslen) comb.update();
			this.reuse_chart(this.comb.chid);
			return;
		}else{
			//new comb chart
			var idpos = this.regd.length,	//before register new
			chrt = new Chart(this.ctx, {
				type: "line",
				data: {
					labels: c0.chart.config.data.labels,
					datasets: dset
				},
				options: {events: []}
			});
			this.charts.push({
				"chart": chrt,
				"word": "",
				"styr": c0.sty,
				"incdesc": c0.incdesc
			});
			this.reg_reuse("combined", 0);
			//btn.style.display = "none";
			this.reuse_chart(idpos);
			this.comb.chid = idpos;
		}
	},
	//keyword count query
	get_count_query: function (word, sty, incdesc){
		return "PREFIX dcterms: <http://purl.org/dc/terms/> SELECT ?sy ?ey (count(DISTINCT ?s) as ?count) WHERE {\n" +
			"?s dcterms:issued ?sy . \n" +
			"filter (datatype(?sy) = dcterms:W3CDTF) . \n" +
			"?s dcterms:issued ?ey . \n" +
			"filter (datatype(?ey) = dcterms:W3CDTF) . \n" +
			"?s " +
			(incdesc ? "?p" : "dcterms:title") + " ?target .\n" +
			//"FILTER(?sy >= " + sty + ") " +
			"FILTER(bif:contains(?target, '\"" + word +"\"')) .\n" +
		"} GROUP BY ?sy ?ey ORDER BY ?sy" ;;/*"SELECT ?sy ?ey (count(DISTINCT ?s) as ?count) WHERE {\n" +
			"?s schema:temporal [jps:start ?sy; jps:end ?ey ] ;\n" +
			(incdesc ? "?p" : "rdfs:label") + " ?target .\n" +
			"FILTER(?sy >= " + sty + ") " +
			"FILTER(bif:contains(?target, '\"" + word +"\"')) .\n" +
		"} GROUP BY ?sy ?ey ORDER BY ?sy" ;;*/


	},
	//keyword item listup query for the year
	get_one_query: function (word, sty, incdesc){

		return "SELECT DISTINCT ?s ?label WHERE {\n\t" +
			"?s dcterms:issued '" + sty + "'^^dcterms:W3CDTF ;\n\t\t" +
				"dcterms:title ?label " +
			(incdesc ? ";\n\t\t?p ?target " : "") + ".\n\t" +
			"FILTER(bif:contains(?" + (incdesc ? "target" : "label") + ", '\"" + word +"\"')) .\n" +
		"}";

	},
	//render existing chart and update form accordingly
	reuse_chart: function(chrtindex, no_render){
		var chdef = this.charts[chrtindex];
		if(!no_render) chdef.chart.render();	//form update only (when accidentaly chart changed)
		this.frm.word.value = chdef.word;
		this.frm.sty.value = chdef.styr;
		this.frm.incdesc.checked = chdef.incdesc;
		this.frm.reuse.selectedIndex = this.current_id = chrtindex;
	},
	//retisiter chart signature to reuse
	reg_reuse: function(sig, sty){
		this.regd.push(sig);
		if(!this.frm.reuse) this.setup_reuse_selector();
		var myid = this.regd.length - 1,
		opt = document.createElement("option");
		opt.innerText = sig;
		this.frm.reuse.appendChild(opt);
		this.frm.reuse.selectedIndex = this.current_id = myid;
		if(this.regd.length > 1 && !this.frm.combine) this.setup_combine_btn(sty);
		return myid;
	},
	//selector to indicate chat to show
	setup_reuse_selector: function(){
		var that = this,
		sel = document.createElement("select");
		sel.setAttribute("name", "reuse");
		sel.addEventListener("change", function(ev){
			that.reuse_chart(ev.target.selectedIndex);
		}, false);
		this.frm.appendChild(sel);
	},
	//button to excute combine
	setup_combine_btn: function(sty){
		if(sty !== this.charts[0].styr) return;	//needs same time range
		var that = this,
		btn = document.createElement("button");
		btn.setAttribute("name", "combine");
		btn.innerHTML = "<span lang=\"ja\">合成</span><span lang=\"en\">combine</span>";
		btn.addEventListener("click", function(ev){
			ev.preventDefault();
			that.combine(ev.target);
		}, false);
		this.frm.insertBefore(btn, this.frm.reuse);
	}
};
WF.init();
