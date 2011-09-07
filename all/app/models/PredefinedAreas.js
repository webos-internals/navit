// vim: ts=4 sw=4
var PredefinedAreas = Class.create({
    initialize: function(){
		this.AjaxCall = null;
		this.AreaDefinitionsUrl = 'http://maps.navit-project.org/download/download.html';
        this.CallbackQueue = [];
		this.AreaDefinitions = [];
		this.fetchAreas();
    },
    
    getAreas: function(callback){
        if (callback) {
            this.CallbackQueue.push(callback);
            if (this.AjaxCall === null) {
				this.pushAreas();
            }
        }
        else 
            return this.AreaDefinitions;
    },
    
    pushAreas: function(){
        while (this.CallbackQueue.length > 0) {
	        var cb = this.CallbackQueue.shift();
            cb(this.AreaDefinitions);
        }
    },
    
    prepareList: function(list){
        var new_list = [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (item.Maps) {
                item.Class = "mapDir";
                item.Maps = this.prepareList(item.Maps);
            }
            else {
                item.Class = "mapDownload";
            }
            new_list.push(item);
        }
        return new_list;
    },

	fetchAreas: function(){
		this.AjaxCall = 1;
		new Ajax.Request(this.AreaDefinitionsUrl, {
			method: 'get',
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response){
				//Mojo.Log.info("fetchAreas",response.responseText);
				var l = response.responseText.split("\n");
				var l2 = [];
				for (var i=0, len=l.length; line=l[i], i<len; i++) {
					if (line.slice(0,10) === "<!-- AREA ") {
						line = line.slice(10, line.lastIndexOf(" -->"));
						if (line !== "" && line !== " ") {
							//Mojo.Log.info("'%s'",line);
							l2.push(line);
						}
					}
				}
				this.AreaDefinitions = this.parseAreas(l2, 0, l2.length, 0);
				this.pushAreas();
				this.AjaxCall = null;
			}.bind(this),
			onFailure: function(response) {
				Mojo.Log.error("AJAX call to get areas failed: %s", response.statusText);
				Mojo.Controller.errorDialog("Could not fetch list of available map areas.");
			}.bind(this)
		});
	},

	parseAreas: function(lines, start, stop, level){
		var maps = [];
		Mojo.Log.info(lines.length, start, stop, level);	
		for (var i=start; line=lines[i], i<stop; i++) {
			var delim = line.indexOf("\t");
			var c = 1;
			while (i+c < stop && lines[i+c].charAt(level) === " ") {
				c++;
			}
			//Mojo.Log.info("%i %i %i '%s'",level,delim-1,c,line);
			var map = {
				Name: line.slice(level, delim),
				BBox: line.slice(delim+1),
				Class: ((c > 1) ? "mapDir" : "mapDownload")
			};
			
			if (c > 1) {
				map.Maps = this.parseAreas(lines, i+1, i+c, level+1);
				i += c-1;
			}

			Mojo.Log.info(map.Name, map.BBox, map.Class, map.Maps, line);
			maps.push(map);
		}

		return maps;
	}

});
