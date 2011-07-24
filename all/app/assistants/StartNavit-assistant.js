// vim: sw=3 ts=3

StartNavitAssistant.googleGeocodeURL = "http://maps.googleapis.com/maps/api/geocode/xml?sensor=true&address=";

function StartNavitAssistant(){
   /* this is the creator function for your scene assistant object. It will be passed all the 
     	additional parameters (after the scene name) that were passed to pushScene. The reference
     	to the scene controller (this.controller) has not be established yet, so any initialization
     	that needs the scene controller should be done in the setup function below. */
}

StartNavitAssistant.prototype.setup = function(){
   /* this function is for setup tasks that have to happen when the scene is first created */
   /* use Mojo.View.render to render view templates and add them to the scene, if needed */

	// setup widgets here 
	this.LocListItems = [{Name: "searching ...", Lng:"" ,Lat:""}];
	this.LocList = { items: this.LocListItems };
   this.controller.setupWidget("LocList", {
      	listTemplate: "StartNavit/LocListTemplate",
   		itemTemplate: "StartNavit/LocListRowTemplate",
   		swipeToDelete: false,
   		autoconfirmDelete: false,
   		renderlimit: 40,
   		reordeable: false,
   		uniquenessProperty: "Index"
   	}, this.LocList
	);

   // add event handlers to listen to events from widgets 
   this.LocListTapHandler = this.LocListTap.bindAsEventListener(this);
   this.controller.listen("LocList", Mojo.Event.listTap, this.LocListTapHandler);

   this.controller.pushCommander(this.handleCommand.bind(this));
   
   this.controller.setupWidget("search_divSpinner", { spinnerSize : "large" }, { spinning: true } );

	// check parameter
	if (G.destination.lng=="" || G.destination.lat==""){
		var adr;
		var route="0"; //0 - show on map, 1 -route to target

		var foundIndex = G.destination.addr.indexOf("mapto:");
		if (foundIndex >= 0) {
			route="1";
			adr = G.destination.addr.substr(foundIndex + "mapto:".length);
			
			Mojo.Log.info("target+mapto: %s", adr);	
		} else {
			foundIndex = G.destination.addr.indexOf("maploc:");
			if (foundIndex >= 0) {
				adr = G.destination.addr.substr(foundIndex + "maploc:".length);
				Mojo.Log.info("target+maploc: %s", adr);	
			} else {
				// use entire URL string
				adr = G.destination.addr;
				Mojo.Log.info("target: %s", adr);	
			}
		}
		G.destination.route=route; //0 - show on map, 1 -route to target
		this.geocode(adr);
	} else  {
		G.destination.route="0"; //0 - show on map, 1 -route to target
		StartNavitAssistant.prototype.openNavit(G.destination);
	} 
};

StartNavitAssistant.prototype.activate = function(event){
   /* put in event handlers here that should only be in effect when this scene is active. For
     	example, key handlers that are observing the document */ 

};

StartNavitAssistant.prototype.deactivate = function(event){
   /* remove any event handlers you added in activate and do any other cleanup that should happen before
     	this scene is popped or another scene is pushed on top */
};

StartNavitAssistant.prototype.cleanup = function(event){
   /* this function should do any cleanup needed before the scene is destroyed as 
     	a result of being popped off the scene stack */
   this.controller.stopListening("LocList", Mojo.Event.listTap, this.LocListTapHandler);
};

StartNavitAssistant.prototype.LocListTap = function(event){
   /* Location selected */
  	Mojo.Log.info("LocListTap: %s", event.item.Name);
  	G.destination.addr=event.item.Name;
	G.destination.lng =event.item.Lng;
	G.destination.lat =event.item.Lat;
	StartNavitAssistant.prototype.openNavit(G.destination);
	
};


StartNavitAssistant.prototype.geocode = function(adr) {
	var url;

	url=StartNavitAssistant.googleGeocodeURL + adr;
	Mojo.Log.info("gocode url: %s", url);

	//show spinner
	$("search_divScrim").show();
	
	var request = new Ajax.Request(url, {
        method: 'get',
        evalJSON: false,
		  onSuccess: function(response){
				// Use responseText, not responseXML!! try: reponseJSON
			   var xmlstring = response.responseText;   
			   // Convert the string to an XML object
			   var xmlobject = (new DOMParser()).parseFromString(xmlstring, "text/xml");
				var elements = xmlobject.getElementsByTagName("result");
				Mojo.Log.info("Results: %i",elements.length);
				if (elements.length==0){
		            Mojo.Log.error("The geocoding service did not find a location.");
					Mojo.Controller.errorDialog("The geocoding service did not find a location.");
				} else if (elements.length==1){ //only one result => start Navit
  					G.destination.addr=elements[0].getElementsByTagName("formatted_address")[0].childNodes[0].nodeValue;
					G.destination.lng =elements[0].getElementsByTagName("lng")[0].childNodes[0].nodeValue;
					G.destination.lat =elements[0].getElementsByTagName("lat")[0].childNodes[0].nodeValue;
					StartNavitAssistant.prototype.openNavit(G.destination);	
				} else { //Clear list and add the resuts
					this.LocListItems.pop();
					for(var i = 0; i < elements.length; i++) {
						var element = elements[i];
						var adr = element.getElementsByTagName("formatted_address")[0].childNodes[0].nodeValue;
						Mojo.Log.info("gocoded[%i]: %s",i, adr);
						var lng = element.getElementsByTagName("lng")[0].childNodes[0].nodeValue;
						var lat = element.getElementsByTagName("lat")[0].childNodes[0].nodeValue;
						var location = {
							Name : adr,
							Lng : lng,
							Lat : lat
						};
						this.LocListItems.push(location);
					}
					//Mojo.Log.info("LocListItems: " + Object.toJSON(this.LocListItems));
					this.controller.modelChanged(this.LocList, this);
					//hide spinner
					$("search_divScrim").hide();  

				}

        }.bind(this),
        onFailure: function(response){
            Mojo.Log.error("geocode service error: %s", response.statusText);
			Mojo.Controller.errorDialog("geocode service error: %s", response.statusText);
        }.bind(this),
    });	
}

StartNavitAssistant.prototype.openNavit = function(dest){
	var stFile;
	var stText;
	var writeMode;

	Mojo.Log.info("openNavit adr:%s lng:%s lat:%s type:%s", dest.addr, dest.lng, dest.lat,dest.route);
		
	//Route to or show position?
	if (dest.route=="0"){ //show on map
		stFile='/media/internal/appdata/org.webosinternals.navit/center.txt';
		stText='mg: ' + dest.lng + " " + dest.lat + "\n";	
		writeMode=false;
	} else { //route to target
		stFile='/media/internal/appdata/org.webosinternals.navit/destination.txt';
		stText='type=former_destination label="'+ dest.addr +'"\nmg: ' + dest.lng + " " + dest.lat + "\n";
		writeMode=true;
	}
	this.request = new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
			method: 'write',
			parameters: {
			file: stFile,
			str: stText,
			append: writeMode
		},
		onSuccess:	function(payload) {
					new Mojo.Service.Request('palm://com.palm.applicationManager', {
						method: 'open',
						parameters: {
							id: 'org.webosinternals.navit',
							params: {}
						}
					});
					delete this.request;
					window.close();
				}.bind(this),
		onFailure:	function(err) {
					delete this.request;
					Mojo.Log.info('Set destination failed');
					Mojo.Controller.errorDialog('Set destination failed');
				}.bind(this)
	});
};


StartNavitAssistant.prototype.handleCommand = function(event){
   //test for Mojo.Event.back, not Mojo.Event.command..
/*
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
*/
};
