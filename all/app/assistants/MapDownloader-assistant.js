// vim: sw=3 ts=3
function MapDownloaderAssistant(listItems, need_maps){
   /* this is the creator function for your scene assistant object. It will be passed all the 
     	additional parameters (after the scene name) that were passed to pushScene. The reference
     	to the scene controller (this.controller) has not be established yet, so any initialization
     	that needs the scene controller should be done in the setup function below. */
   this.WeNeedMaps = need_maps;

   if (listItems) {
      this.PredefinedAreas = listItems;
   }
   else {
      this.PredefinedAreas = [];
   }
}

MapDownloaderAssistant.prototype.setup = function(){
   /* this function is for setup tasks that have to happen when the scene is first created */

   /* use Mojo.View.render to render view templates and add them to the scene, if needed */

   /* setup widgets here */
   this.controller.setupWidget("MapDefinitionList", {
      listTemplate: "MapDownloader/MapDefinitionListTemplate",
   itemTemplate: "MapDownloader/MapDefinitionListRowTemplate",
   swipeToDelete: false,
   renderlimit: 40,
   reordeable: false
   }, this.MapDefinitionListModel = {
      items: this.PredefinedAreas
   });

   /* add event handlers to listen to events from widgets */
   this.MapDefinitionListTapHandler = this.MapDefinitionListTap.bindAsEventListener(this);
   this.controller.listen("MapDefinitionList", Mojo.Event.listTap, this.MapDefinitionListTapHandler);

    /* Add Back button for TouchPad */
	if(G.isTouchPad()){
		var menuModel = {
				visible: true,
				items: [
					{ icon: "back", command: "goBack"}
				]
			};
		this.controller.setupWidget(Mojo.Menu.commandMenu,
			this.attributes = {
				spacerHeight: 0,
				menuClass: 'no-fade'
			},
			menuModel
		);   
	}

   this.controller.pushCommander(this.handleCommand.bind(this));
};

MapDownloaderAssistant.prototype.activate = function(event){
   /* put in event handlers here that should only be in effect when this scene is active. For
     	example, key handlers that are observing the document */
   if (this.MapDefinitionListModel.items.length == 0) {
      (new PredefinedAreas()).getAreas(this.ListCallback.bind(this));
   }
   if (this.WeNeedMaps) {
      this.controller.showAlertDialog({
         title: $L("Maps Missing"),
         message: $L("You need to download a map to use Navit."),
         choices: [{
            label: $L("Proceed"),
         type: "affirmative"
         }]
      });
      delete this.WeNeedMaps;
   }
};

MapDownloaderAssistant.prototype.deactivate = function(event){
   /* remove any event handlers you added in activate and do any other cleanup that should happen before
     	this scene is popped or another scene is pushed on top */
};

MapDownloaderAssistant.prototype.cleanup = function(event){
   /* this function should do any cleanup needed before the scene is destroyed as 
     	a result of being popped off the scene stack */
   this.controller.stopListening("MapDefinitionList", Mojo.Event.listTap, this.MapDefinitionListTapHandler);
};

MapDownloaderAssistant.prototype.ListCallback = function(list){
   this.MapDefinitionListModel.items = list;
   this.controller.modelChanged(this.MapDefinitionListModel);
};

MapDownloaderAssistant.prototype.MapDefinitionListTap = function(event){
   var item = event.item;
   if (item.Maps) {
      if (item.BBox) {
         var items = [{
            Name: item.Name,
               BBox: item.BBox,
               Class: "mapDownload"
         }].concat(item.Maps);
      }
      else {
         var items = item.Maps;
      }
      this.controller.stageController.pushScene("MapDownloader", items);
   }
   else {
      this.controller.showAlertDialog({
         title: $L("Download '" + item.Name + "' ?"),
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
                    		 this.controller.stageController.pushScene("MapDownloadProgress", item);
                		 }
            		 }
      });
   }
};

MapDownloaderAssistant.prototype.handleCommand = function(event){
   //test for Mojo.Event.back, not Mojo.Event.command..
   if (event.type == Mojo.Event.back || (event.type == Mojo.Event.command && event.command == 'goBack')) {
      if (this.controller.stageController.getScenes().length == 1) {
         event.preventDefault();
         event.stopPropagation();
         this.controller.stageController.swapScene("MapManager");
      }
   }
};
