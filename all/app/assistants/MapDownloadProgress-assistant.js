function MapDownloadProgressAssistant(item){
    /* this is the creator function for your scene assistant object. It will be passed all the 
     additional parameters (after the scene name) that were passed to pushScene. The reference
     to the scene controller (this.controller) has not be established yet, so any initialization
     that needs the scene controller should be done in the setup function below. */
    this.Item = item;
    this.Active = false;
}

MapDownloadProgressAssistant.prototype.setup = function(){
    /* this function is for setup tasks that have to happen when the scene is first created */
    
    /* use Mojo.View.render to render view templates and add them to the scene, if needed */
    
    
    /* setup widgets here */
    this.controller.setupWidget("DownloadProgressPill", {
        title: this.Item.Name
    }, this.progressModel = {
        value: 0,
        disabled: false
    });
    
    /* add event handlers to listen to events from widgets */
    this.Active = true;
    
    this.controller.pushCommander(this.handleCommand.bind(this));
    
    G.Maps.download(this.Item, this.updateProgress.bind(this));
};

MapDownloadProgressAssistant.prototype.activate = function(event){
    /* put in event handlers here that should only be in effect when this scene is active. For
     example, key handlers that are observing the document */
};

MapDownloadProgressAssistant.prototype.deactivate = function(event){
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
     this scene is popped or another scene is pushed on top */
};

MapDownloadProgressAssistant.prototype.cleanup = function(event){
    /* this function should do any cleanup needed before the scene is destroyed as 
     a result of being popped off the scene stack */
    G.Maps.cancelDownload();
    this.Active = false;
};

MapDownloadProgressAssistant.prototype.handleCommand = function(event){
    //test for Mojo.Event.back, not Mojo.Event.command..
    if (event.type == Mojo.Event.back && this.Active) {
        event.preventDefault();
        event.stopPropagation();
        this.controller.showAlertDialog({
            title: $L("Cancel download?"),
            choices: [{
                label: $L("Yes"),
                value: 1,
                type: "affirmative"
            }, {
                label: $L("No"),
                value: 0,
                type: "negative"
            }],
            onChoose: function(value){
                if (value == 1) {
                    this.cleanup();
                    this.controller.stageController.popScene();
                }
            }.bind(this)
        });
    }
};

MapDownloadProgressAssistant.prototype.updateProgress = function(received, total, finish){
    if (!this.Active) {
        return;
    }
    /*var D = new Date();
     var time = D.getTime()*1000 + D.getMilliseconds();*/
    this.progressModel.value = received / total;
    if (received && total/*this.LastReceived && this.LastTime*/) {
        if (finish) {
            $("StatusText").innerHTML = "Download completed. You may go back.";
            this.controller.showAlertDialog({
                title: $L("Download finished"),
                choices: [{
                    label: $L("Dismiss"),
                    value: 1,
                    type: "affirmative"
                }],
                onChoose: function(value){
                    this.cleanup();
                    this.controller.stageController.popScene();
                }.bind(this)
            });
        }
        else {
            /*var bps = (received - this.lastReceived)/((time - this.LastTime)/1000);*/
            $("StatusText").innerHTML = "Downloaded " + bytesToSize(received, 2) +
            " of " +
            bytesToSize(total, 2)/* + " ("+bytesToSize(bps,2)+"/s)"*/;
        }
    }
    this.controller.modelChanged(this.progressModel);
    /*	this.LastReceived = received;
     this.LastTime = time;*/
};
