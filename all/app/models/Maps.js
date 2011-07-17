// vim: sw=4 ts=8

var Maps = Class.create({
    initialize: function(){
        this.MapDir = "/media/internal/appdata/org.webosinternals.navit/maps";
        this.ApiUrl = "http://maps.navit-project.org/api/map/?bbox=";
        this.Downloads = {};
        this.CBQ_updateMaps = [];
        this.RenameQueue = [];
        this.Path2Index = {};
        this.ActiveMap = null;
        
        this.updateMaps();
    },
    
    DumpXMLMapSet: function(){
        var xml = "<mapset enabled=\"yes\">\n";
        for (var i = 0; i < this.Maps.length; i++) {
            var map = this.Maps[i];
            xml += "\t<map type=\"" + map.Type + "\" enabled=\"" + (map.Active ? "yes" : "no") + "\" description=\"" + map.Name + "\" data=\"" + map.Path + "\"";
	    if (map.Type == "csv") {
		xml += " item_type=\"" + map.ItemType + "\" attr_types=\"" + map.AttrTypes + "\"";
	    }
	    xml += "/>\n";
        }
        xml += "</mapset>\n";
        new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
            method: "write",
            parameters: {
                file: this.MapDir + "/mapset.xml",
                append: false,
                text: xml
            }
        });
    },
    
    LoadXMLMapSet: function(){
        
	if (this.Maps) {
	    this.loadMapDir();
	}
	else {
	    this.ActiveMap = null;
       	   
	    new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
            	method: "read",
            	parameters: {
                    file: this.MapDir + "/mapset.xml"
            	},
            	onSuccess: function(payload){
                    //Mojo.Log.info(Object.toJSON(payload));
                    var xml = (new DOMParser()).parseFromString(payload.data, "text/xml");
                    this.Maps = [];
                    var elements = xml.getElementsByTagName("map");
                    for (var i = 0; i < elements.length; i++) {
                    	var element = elements[i];
                    	var map = {
                            Name: element.getAttribute("description"),
                            Path: element.getAttribute("data"),
                            Type: element.getAttribute("type"),
                            Active: element.getAttribute("enabled") == "yes" ? true : false,
                            ItemType: element.getAttribute("item_type"),
                            AttrTypes: element.getAttribute("attr_types"),
                            Class: element.getAttribute("enabled") == "yes" ? "active" : "",
                            Index: this.Maps.length,
                    	};
                    	this.Maps.push(map);
                    	this.Path2Index[map.Path] = map.Index;
                    }
                    //Mojo.Log.error("X: " + Object.toJSON(this.Maps));
                    //Mojo.Log.error("X: " + Object.toJSON(this.Path2Index));
                    this.loadMapDir();
            	}.bind(this),
            	onFailure: function(err){
                    if (err.errorText == "File does not exist.") {
                    	this.Maps = [];
                    	this.loadMapDir();
                    }
                    else 
                    	Mojo.Log.error(Object.toJSON(err));
            	}.bind(this)
            });
	}
    },
    
    loadMapDir: function(){
        this.ListMapsSvc = new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
            method: 'listFiles',
            parameters: {
                path: this.MapDir
            },
            onSuccess: function(payload){
                var items = payload.items
                
                // Use temporary variables, so we can loose stale entries from the map-set.
                var maps = this.Maps;
                var path2index = this.Path2Index;
                
                this.Maps = [];
                this.Path2Index = [];
                
                var new_maps = [];
                
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    
		    if (item.type == "bin" || item.type == "bin_new") {
                        switch (item.type) {
                            case "bin_new":
                                new_maps.push(item.path);
                                item.path = item.path.substring(0, item.path.lastIndexOf("_new"));
                                break;
                        }
                        
                        var map = maps[path2index[item.path]];
                        if (!map) {
                            map = {};
			    map.Active = true;
			    map.Type = "binfile";
			}
                        
                        var name = item.name.substring(0, item.name.lastIndexOf("."));
                        map.Name = name.substring(0, name.lastIndexOf("_"));
                        map.BBox = name.substring(name.lastIndexOf("_") + 1);
                        map.Path = item.path;
                        map.Size = item.size;
                        map.Bytes = item.bytes;
			map.Class = map.Active ? "active" : "";
                        map.Index = this.Maps.length;
                        
			if (map.Active && map.Type == "binfile") 
                            this.ActiveMap = map.Index;

                        this.Maps.push(map);
                        this.Path2Index[map.Path] = map.Index;
                    }
                }
                if (!this.ActiveMap && this.Maps.length > 0) {
                    this.ActiveMap = 0;
                    this.Maps[0].Active = true;
                    this.Maps[0].Class = "active";
                }
		for (var i = 0; i < maps.length; i++) {
		    var map = maps[i];
		    if (map.Type != "binfile") {
			map.Index = this.Maps.length;
			this.Path2Index[map.Path] = map.Index;
			this.Maps.push(maps[i]);
		    }
		}
                if (new_maps.length > 0) {
                    var q = [];
                    for (var i = 0; i < new_maps.length; i++) {
                        var map = new_maps[i];
                        q.push({
                            from: map,
                            to: map.replace(/\.bin_new$/, ".bin"),
                        });
                    }
                    q[q.length - 1].cb = this.pushMaps.bind(this);
                    //Mojo.Log.info("BatchRename: " + Object.toJSON(q));
                    this.batchRename(q);
                }
                else 
                    this.pushMaps();
                delete this.ListMapsSvc;
            }.bind(this),
            onFailure: function(err){
                Mojo.Controller.errorDialog(err.errorText);
                delete this.ListMapsSvc;
            }.bind(this)
        });
    },
    
    updateMaps: function(callback){
        if (callback) 
            this.CBQ_updateMaps.push(callback);
        if (!this.ListMapsSvc) {
            this.ListMapsSvc = 1;
            this.LoadXMLMapSet();
        }
    },

    getMaps: function() {
        var my_maps = [];
	for (var i = 0; i < this.Maps.length; i++) {
	    if (this.Maps[i].Type == "binfile")
		my_maps.push(this.Maps[i]);
	}
    	return my_maps;
    },

    pushMaps: function(){
        this.DumpXMLMapSet();

	var my_maps = this.getMaps();

        while (this.CBQ_updateMaps.length > 0) {
            var cb = this.CBQ_updateMaps.shift();
            cb(my_maps);
        }
    },
    
    makeActive: function(map, callback){
/*        var active_map = this.Maps[this.ActiveMap];
        if (active_map) {
            if (active_map.Index == map.Index) 
                return;
            active_map.Active = false;
            active_map.Class = "";
        }
*/
        map.Active = true;
        map.Class = "active";
	this.Maps[map.Index] = map;
        this.ActiveMap = map.Index;
        this.DumpXMLMapSet();
        callback(this.getMaps());
    },

    toggleActive: function(map, callback){
        map.Active = map.Active ? false : true;
        map.Class = map.Active ? "active" : "";
	this.Maps[map.Index] = map;
        this.DumpXMLMapSet();
        callback(this.getMaps());
    },
    
    batchRename: function(queue){
        if (queue != 1 && this.RenameQueue.length > 0) {
            if (queue) 
                this.RenameQueue = this.RenameQueue.concat(queue);
        }
        else {
            if (queue && queue != 1) 
                this.RenameQueue = this.RenameQueue.concat(queue);
            
            if (this.RenameQueue.length == 0) 
                return;
            
            this.RenameTask = this.RenameQueue.shift();
            
            Mojo.Log.info(Object.toJSON(this.RenameTask));
            
            new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
                method: 'rename',
                parameters: {
                    from: this.RenameTask.from,
                    to: this.RenameTask.to
                },
                onSuccess: function(e){
                    Mojo.Log.info(Object.toJSON(e));
                    if (this.RenameTask.msg) {
                        var appController = Mojo.Controller.getAppController();
                        appController.showBanner({
                            messageText: this.RenameTask.msg
                        }, {}, "batchRename");
                    }
                    if (this.RenameTask.cb) 
                        this.updateMaps(this.RenameTask.cb);
                    
                    this.batchRename(1);
                }.bind(this),
                onFailure: function(e){
                    Mojo.Log.error(Object.toJSON(e))
                }
            });
        }
    },
    
    removeMap: function(map, callback){
        new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
            method: 'delete',
            parameters: {
                file: map.Path
            },
            onSuccess: function(e){
                var appController = Mojo.Controller.getAppController();
                appController.showBanner({
                    messageText: map.Name + " " + $L("deleted")
                }, {}, "Delete Map");
                this.updateMaps(callback);
            }.bind(this),
            onFailure: function(e){
                Mojo.Log.error(Object.toJSON(e))
            }
        });
    },
    
    download: function(item, callback){
        this.Callback = callback;
        this.DownloadRequest = new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
            method: 'download',
            parameters: {
                target: this.ApiUrl + item.BBox,
                mime: "application/octet-stream",
                targetDir: this.MapDir,
                targetFilename: item.Name + "_" + item.BBox + ".bin",
                keepFilenameOnRedirect: true,
                subscribe: true
            },
            onSuccess: this.downloadSuccess.bind(this),
            onFailure: function(e){
                Mojo.Log.error(Object.toJSON(e))
            }
        });
    },
    
    cancelDownload: function(){
        if (this.DownloadRequest) {
            new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
                method: 'cancelDownload',
                parameters: {
                    ticket: this.Ticket
                },
                onSuccess: this.cancelDownload2,
                onFailure: function(e){
                    Mojo.Log.error(Object.toJSON(e))
                }
            });
            var appController = Mojo.Controller.getAppController();
            appController.showBanner({
                messageText: $L("Download cancelled")
            }, {}, "Map Download");
            this.Ticket = null;
            this.DownloadRequest.cancel();
            this.DownloadRequest = null;
        }
    },
    cancelDownload2: function(x){
        new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
            method: 'deleteDownloadedFile',
            parameters: {
                ticket: x.ticket
            },
            onFailure: function(e){
                Mojo.Log.error(Object.toJSON(e))
            }
        });
    },
    
    downloadSuccess: function(resp){
        if (!resp) 
            return;
        if (!this.Ticket && resp.ticket) {
            this.Ticket = resp.ticket;
        }
        
        this.Callback(resp.amountReceived, resp.amountTotal, resp.completed);

        //Mojo.Log.info(Object.toJSON(resp));
        if (resp.completed) {
            var appController = Mojo.Controller.getAppController();
            appController.showBanner({
                messageText: $L("Finished download of") + " \"" + resp.destFile + "\""
            }, {}, "Map Download");
            this.Ticket = null;
            this.DownloadRequest = null;

	    var map = [];
	    var name = resp.destFile.substring(0, resp.destFile.lastIndexOf("."));
            map.Name = name.substring(0, name.lastIndexOf("_"));
            map.BBox = name.substring(name.lastIndexOf("_") + 1);
            map.Path = resp.destPath + resp.destFile;
	    map.Type = "binfile";
	    map.Active = true;
	    map.Class = "active";
            map.Index = this.Maps.length;
	    
	    this.Maps.push(map);
	    this.Path2Index[map.Path] = map.Index;

	    this.updateMaps();
        }
    }
});
