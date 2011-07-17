// vim: sw=3 ts=3

function MapManagerAssistant(){
   /* this is the creator function for your scene assistant object. It will be passed all the 
     	additional parameters (after the scene name) that were passed to pushScene. The reference
     	to the scene controller (this.controller) has not be established yet, so any initialization
     	that needs the scene controller should be done in the setup function below. */
}

MapManagerAssistant.prototype.setup = function(){
   /* this function is for setup tasks that have to happen when the scene is first created */
   /* use Mojo.View.render to render view templates and add them to the scene, if needed */
   
	/* setup widgets here */
   this.controller.setupWidget("MapList", {
      	listTemplate: "MapManager/MapListTemplate",
   		itemTemplate: "MapManager/MapListRowTemplate",
   		addItemLabel: $L("Download new map ..."),
   		swipeToDelete: true,
   		autoconfirmDelete: false,
   		renderlimit: 40,
   		reordeable: false,
   		uniquenessProperty: "Index"
   	}, this.MapListModel = {
      items: []
   	}
	);

   /* add event handlers to listen to events from widgets */
   this.MapListTapHandler = this.MapListTap.bindAsEventListener(this);
   this.controller.listen("MapList", Mojo.Event.listTap, this.MapListTapHandler);

   this.MapListAddHandler = this.MapListAdd.bindAsEventListener(this);
   this.controller.listen("MapList", Mojo.Event.listAdd, this.MapListAddHandler);

   this.MapListDeleteHandler = this.MapListDelete.bindAsEventListener(this);
   this.controller.listen("MapList", Mojo.Event.listDelete, this.MapListDeleteHandler);

   this.controller.pushCommander(this.handleCommand.bind(this));
};

MapManagerAssistant.prototype.activate = function(event){
   /* put in event handlers here that should only be in effect when this scene is active. For
     	example, key handlers that are observing the document */
   G.Maps.getMaps(this.GetMapsCallback.bind(this));
};

MapManagerAssistant.prototype.deactivate = function(event){
   /* remove any event handlers you added in activate and do any other cleanup that should happen before
     	this scene is popped or another scene is pushed on top */
};

MapManagerAssistant.prototype.cleanup = function(event){
   /* this function should do any cleanup needed before the scene is destroyed as 
     	a result of being popped off the scene stack */
   this.controller.stopListening("MapList", Mojo.Event.listTap, this.MapListTapHandler);
   this.controller.stopListening("MapList", Mojo.Event.listAdd, this.MapListAddHandler);
   this.controller.stopListening("MapList", Mojo.Event.listDelete, this.MapListDeleteHandler);
};

MapManagerAssistant.prototype.GetMapsCallback = function(list){
   this.MapListModel.items = list;
   this.controller.modelChanged(this.MapListModel);
};

MapManagerAssistant.prototype.MapListTap = function(event){
   G.Maps.makeActive(event.item, this.GetMapsCallback.bind(this));
};

MapManagerAssistant.prototype.MapListAdd = function(event){
   this.controller.stageController.pushScene("MapDownloader");
};

MapManagerAssistant.prototype.MapListDelete = function(event){
   G.Maps.removeMap(event.item, this.GetMapsCallback.bind(this));
};

MapManagerAssistant.prototype.handleCommand = function(event){
   //test for Mojo.Event.back, not Mojo.Event.command..
   if (event.type == Mojo.Event.back) {
      if (this.controller.stageController.getScenes().length == 1) {
         event.preventDefault();
         event.stopPropagation();
         this.controller.stageController.swapScene({
            name: "Navit",
            disableSceneScroller: true
         });
      }
   }
};
