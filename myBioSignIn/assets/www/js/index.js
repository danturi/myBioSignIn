var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// signaturePad = new SignaturePad(canvas);
signatureCapture = new SignatureCapture();
isoSignatureRep = new SignatureRepresentation();


var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
	},
	bindEvents : function() {
		var touch = document.getElementById("touch");
		var clear_button = document.getElementById("control_clear");
		var save_button = document.getElementById("control_save");
		touch.style["display"] = "block";

		save_button.addEventListener('click', this.saveSignature, false);
		clear_button.addEventListener('click', this.clearSignature, false);
		document.addEventListener('deviceready', this.onDeviceReady, false);
		document.addEventListener("ACTION_DOWN", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchStart(event);
			signatureCapture.down(event);
			createPoint(event);
			console.log(event.x);

		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchMove(event);
			signatureCapture.move(event);
			createPoint(event);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.preventDefault();
			touch.innerHTML = 0.0;
			// signaturePad._handleTouchEnd(event);
			signatureCapture.up(event);
		});
	},
	onDeviceReady : function() {
		app.nativeReq();
	},
	nativeReq : function() {
		var myPlugin = cordova
				.require('org.apache.cordova.plugin.SpenPlugin.SpenPlugin');
		myPlugin.addEvents();

	},
	clearSignature : function() {
		// signaturePad.clear();
		signatureCapture.clear();
		isoSignatureRep.clear();
	},
	saveSignature : function() {
		app.createIsoData();
		
	},
	createIsoData : function() {
		var isoHeader = new IsoHeader();
		var isoBody = new IsoBody();
		isoSignatureRep.initializeChannels();
		isoBody.representations.push(isoSignatureRep);

		var bufferBody = isoSignatureRep.toBytes();
		var bufferHeader = isoHeader.toBytes(bufferBody.byteLength);
		var view = new DataView(bufferBody,38,2);
		/*var points;
		for (var i=0; i< isoSignatureRep.points.length; i++){
			points = isoSignatureRep.points[i].properties.get(channel.X)+", ";
		}
		console.log(points);
		*/
		console.log(isoSignatureRep.points.length);
		console.log(view.getUint16(0));
	}

};
app.initialize();
