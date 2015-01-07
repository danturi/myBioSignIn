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
		var isoHeader = new IsoHeader();
		var bufferHeader = isoHeader.toBytes(1);
		var view = new DataView(bufferHeader);
		
		console.log(Number(view.getUint32(0)).toString(16));
		console.log(Number(view.getUint32(4)).toString(16));
		console.log(Number(view.getUint32(8)).toString(16));
		console.log(Number(view.getUint16(12)).toString(16));
		console.log(Number(view.getUint8(14)).toString(16));
	}

};

function ArrayBufferToString(buffer) {
	return BinaryToString(String.fromCharCode.apply(null, Array.prototype.slice
			.apply(new Uint8Array(buffer))));
}

function BinaryToString(binary) {
	var error;

	try {
		return decodeURIComponent(escape(binary));
	} catch (_error) {
		error = _error;
		if (error instanceof URIError) {
			return binary;
		} else {
			throw error;
		}
	}
}
app.initialize();
