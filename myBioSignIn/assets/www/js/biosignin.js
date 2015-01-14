var app = {		
	// Application Constructor
	initialize : function() {
		
		this.canvas = document.getElementById("canvas");
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		
		// signaturePad = new SignaturePad(canvas);
		this.signatureCapture = new SignatureCapture();
		this.isoSignatureRep = new SignatureRepresentation();
		
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
		
		//Pen Events
		document.addEventListener("ACTION_DOWN", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchStart(event);
			app.signatureCapture.down(event);
			createPoint(event);

		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchMove(event);
			app.signatureCapture.move(event);
			createPoint(event);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.preventDefault();
			touch.innerHTML = 0.0;
			// signaturePad._handleTouchEnd(event);
			app.signatureCapture.up(event);
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
		app.signatureCapture.clear();
		app.isoSignatureRep.clear();
	},
	saveSignature : function() {
		app.createIsoData();

	},
	createIsoData : function() {
		var isoHeader = new IsoHeader();
		var isoBody = new IsoBody();
		app.isoSignatureRep.initializeChannels();
		isoBody.representations.push(app.isoSignatureRep);

		var bufferBody = app.isoSignatureRep.toBytes();
		var bufferHeader = isoHeader.toBytes(bufferBody.byteLength);
		alert(app.isoSignatureRep.points.length);
	
		 /* 
		 * var points=""; for (var i=0; i< isoSignatureRep.points.length; i++){
		 * points = points +
		 * isoSignatureRep.points[i].properties.get(channel.T)+", "; }
		 * console.log(points); /* console.log(isoSignatureRep.points.length);
		 * console.log(view.getUint16(0));
		 */
	}

};
app.initialize();