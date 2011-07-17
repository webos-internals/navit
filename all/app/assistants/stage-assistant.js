// vim: sw=3 ts=3

//G = {};	// global data goes here

function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */
	
	if (G.launchParameters) {
		this.controller.serviceRequest('palm://ca.canucksoftware.filemgr', {
				method: 'write',
				parameters: {
					file: '/media/internal/appdata/org.webosinternals.navit/destination.txt',
					str: 'type=former_destination label="'+ launchParameters.daddr +'"\nmg: ' + launchParameters.lng + " " + launchParameters.lat + "\n",
					append: true
				},
				onSuccess:	function(payload) {
									that.controller.serviceRequest('palm://com.palm.applicationManager', {
										method: 'open',
										parameters: {
											id: 'org.webosinternals.navit',
											params: {}
										}
									});
								},
				onFailure:	function(err) {
									Mojo.Controller.errorDialog('Set destination failed');
								}
		});
	}
	else {
		G.Maps = new Maps();
		G.Maps.updateMaps(this.updateMapsCB.bind(this));
	}
};

StageAssistant.prototype.updateMapsCB = function(maps) {
	if (maps.length > 0) {
		this.controller.pushScene("MapManager");
		//this.controller.pushScene({name:"Navit", disableSceneScroller: true});
	}
	else {
		this.controller.pushScene("MapDownloader", null, true);
	}
};
