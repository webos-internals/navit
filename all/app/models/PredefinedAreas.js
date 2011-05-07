var PredefinedAreas = Class.create({
    initialize: function(){
        this.FileMgrSvc = new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
            method: 'read',
            parameters: {
                file: "/media/cryptofs/apps/usr/palm/applications/" + Mojo.Controller.appInfo.id + "/PredefinedAreas.json"
            },
            onSuccess: function(payload){
                this.AreaDefinitions = this.prepareList(Mojo.parseJSON(payload.data));
                this.FileMgrSvc = null;
				this.pushAreas();
            }.bind(this),
            onFailure: function(err){
				this.FileMgrSvc = null;
				Mojo.Controller.errorDialog(err.errorText);
            }.bind(this)
        });
        this.CallbackQueue = [];
    },
    
    getAreas: function(callback){
        if (callback) {
            this.CallbackQueue.push(callback);
            if (this.FileMgrSvc == null) {
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
                item.Type = "mapDir";
                item.Maps = this.prepareList(item.Maps);
            }
            else {
                item.Type = "mapDownload";
            }
            new_list.push(item);
        }
        return new_list;
    }
});
