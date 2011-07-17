// vim: sw=3 ts=3
function AppAssistant(appController) {
	Mojo.Log.info("AppAssistant");
	/* this is the creator function for your stage assistant object */
}

AppAssistant.prototype.setup = function() {
	Mojo.Log.info("AppAssistant setup");

}

// -------------------------------------------------------
// handleLaunch - called by the framework when the application is asked to launch
//- First launch; create card stage and first first scene
//- Update; after alarm fires to update feeds
//- Notification; after user taps banner or dashboard
//
AppAssistant.prototype.handleLaunch = function (launchParameters) {
	Mojo.Log.info("launchParameters: %j", launchParameters);
	if (launchParameters.target != undefined && launchParameters.target != "") {
		/* Target wird vom Adressbuch zur Übergabe verwende
		   Folgende Prefixes sind bekannt:
		   "mapto:"  Routing zur Adresse starten
		   "maploc:" Adresse anzeigen
		   */
		Mojo.Log.info("launchParameters target is %s", launchParameters.target);
	} else {/* query kann auch eine Adresse beinhalten
		   	  this.controller.serviceRequest('palm://com.palm.applicationManager', {method: 'open',parameters: {
		   	  id:"com.palm.app.maps",
		   	  params:
		   	  {
		   	  "query" : wgslong + ' ' + wgslat
		   	  }
		   	  }}); */
		if ( launchParameters.query != undefined) {
			Mojo.Log.info(" launchParameters query is: %s", launchParameters.query);
		}
		if (launchParameters.zoom != undefined) {
			Mojo.Log.info(" launchParameters zoom is: %s", launchParameters.zoom);
		}
		if (launchParameters.type != undefined) {
			Mojo.Log.info(" launchParameters type is: %s", launchParameters.type);
		}
		if (launchParameters.layer != undefined) {
			Mojo.Log.info(" launchParameters layer is: %s", launchParameters.layer);
		}
		/* For driving directions, vermutlich kann daddr auch eine Adresse beinhalten
		   daddr = destination address
		   saddr = start address 
		   this.controller.serviceRequest('palm://com.palm.applicationManager', {method: 'open',parameters: {
		   id:"com.palm.app.maps",
		   params:
		   {
		   saddr: '',
		   daddr: wgslong + ' ' + wgslat
		   }
		   }});*/			
		if (launchParameters.saddr != undefined) {
			Mojo.Log.info(" launchParameters saddr is: %s", launchParameters.saddr);
		}
		if (launchParameters.daddr != undefined) {
			Mojo.Log.info(" launchParameters daddr is: %s", launchParameters.daddr);
		}
		if (launchParameters.location && launchParameters.location.lat && launchParameters.location.lng) {	
			/* passing location parameter from global search
			   lat = latitude in degrees (float)
			   lng = longitude in degrees (float)
			   acc = accuracy in meters - optional (float)
			   age = age of fix in seconds - optional (int) */
			Mojo.Log.info("launchParameters.location.lat,lng is: %s, %s",
					launchParameters.location.lat,launchParameters.location.lng);
			if (launchParameters.location.acc) {
				Mojo.Log.info("launchParameters.location.acc is: %s", launchParameters.location.acc);
			}
			if (launchParameters.location.age) {
				Mojo.Log.info("launchParameters.location.age is: %s", launchParameters.location.age);
			}	
		}
	}


 	var launchParams = PalmSystem.launchParams;

   if ( launchParams ) { 
		Mojo.Log.info("launchParams: %j", launchParams);
		Mojo.Log.info("launchParamsJSON: %j", launchParams.evalJSON());
   }
}

