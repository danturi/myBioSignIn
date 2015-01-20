var biosignin = {
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

		// Pen Events
		document.addEventListener("ACTION_DOWN", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchStart(event);
			biosignin.signatureCapture.down(event);
			createPoint(event);

		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchMove(event);
			biosignin.signatureCapture.move(event);
			createPoint(event);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.preventDefault();
			touch.innerHTML = 0.0;
			// signaturePad._handleTouchEnd(event);
			biosignin.signatureCapture.up(event);
		});

	},
	onDeviceReady : function() {
		biosignin.nativeReq();

	},
	nativeReq : function() {
		var myPlugin = cordova
				.require('org.apache.cordova.plugin.SpenPlugin.SpenPlugin');
		myPlugin.addEvents();

	},
	clearSignature : function() {
		// signaturePad.clear();
		biosignin.signatureCapture.clear();
		biosignin.isoSignatureRep.clear();
	},
	saveSignature : function() {
		var isoBase64 = biosignin.createIsoData();
		var trimCanvas = biosignin.trimSignature();
		//localStorage.setItem("signatureImg", trimCanvas);
		localStorage.setItem("signature", trimCanvas.toDataURL());
		window.open("index.html");
	},
	createIsoData : function() {
		var isoHeader = new IsoHeader();
		var isoBody = new IsoBody();
		biosignin.isoSignatureRep.initializeChannels();
		isoBody.representations.push(biosignin.isoSignatureRep);

		var bufferBody = biosignin.isoSignatureRep.toBytes();
		var bufferHeader = isoHeader.toBytes(bufferBody.byteLength);
		var finalSignBuffer = _appendBuffer(bufferHeader, bufferBody);
		// Convert to Base64String
		var binary = '';
		var bytes = new Uint8Array(finalSignBuffer);
		var len = bytes.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary);
	},
	trimSignature : function() {
		var pointsLen = biosignin.isoSignatureRep.points.length;
		var minX = 2560, minY = 1600, maxX = 0, maxY = 0;
		for (var i = 0; i < pointsLen; i++) {
			var x = Math.round(biosignin.isoSignatureRep.points[i].properties
					.get(channel.X) / 100 * 11.7);
			var y = Math.round(biosignin.isoSignatureRep.points[i].properties
					.get(channel.Y) / 100 * 11.7);
			if (x < minX)
				minX = x;
			if (y < minY)
				minY = y;
			if (x > maxX)
				maxX = x;
			if (y > maxY)
				maxY = y;
		}
		var canvas = document.getElementById("canvas");
		var ctx=canvas.getContext('2d');
		var copy = document.createElement('canvas');
		copy.id = "canvas_trim";
		var copyCtx = copy.getContext('2d');
		var trimHeight = maxY - minY + 5;
	    var trimWidth = maxX - minX + 5;
	    var trimmed = ctx.getImageData(minX-5, minY-5, trimWidth, trimHeight);
	    copyCtx.canvas.width = trimWidth;
		copyCtx.canvas.height = trimHeight;
		copyCtx.putImageData(trimmed, 0, 0);
		var container = document.getElementById("container");
		container.removeChild(canvas);
		container.appendChild(copy);
		return copy;
	}

};
biosignin.initialize();
var _appendBuffer = function(buffer1, buffer2) {
	var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	tmp.set(new Uint8Array(buffer1), 0);
	tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	return tmp.buffer;
}