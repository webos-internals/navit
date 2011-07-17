// vim: sw=3 ts=3
G = {};

function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */

	G.Maps = new Maps();
	G.Maps.getMaps(this.getMapsCB.bind(this));
};

StageAssistant.prototype.getMapsCB = function(maps) {
	if (maps.length > 0) {
		//this.controller.pushScene("MapManager");
		this.controller.pushScene({name:"Navit", disableSceneScroller: true});
	}
	else {
		this.controller.pushScene("MapDownloader", null, true);
	}
};
