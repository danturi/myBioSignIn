var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//signaturePad = new SignaturePad(canvas);
signatureCapture = new SignatureCapture();


var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
	},
	bindEvents : function() {
		var touch = document.getElementById("touch");
		var clear_button = document.getElementById("control_clear");
		touch.style["display"] = "block";
		
		
		clear_button.addEventListener('click', this.clearSignature, false);
		document.addEventListener('deviceready', this.onDeviceReady, false);
		document.addEventListener("ACTION_DOWN", function(event) {
			event.preventDefault();
			touch.innerHTML=event.pressure;
			//signaturePad._handleTouchStart(event);
			signatureCapture.down(event);
			
		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			//signaturePad._handleTouchMove(event);
			signatureCapture.move(event);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.preventDefault();
			touch.innerHTML = 0.0;
			//signaturePad._handleTouchEnd(event);
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
	clearSignature: function() {
		//signaturePad.clear();
		signatureCapture.clear();
	}

};

app.initialize();