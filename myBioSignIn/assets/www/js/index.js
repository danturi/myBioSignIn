/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var wrapper = document.getElementById("signature-pad"), clearButton = wrapper
		.querySelector("[data-action=clear]"), saveButton = wrapper
		.querySelector("[data-action=save]"), canvas = wrapper
		.querySelector("canvas"), signaturePad;
// Adjust canvas coordinate space taking into account pixel ratio,
// to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
function resizeCanvas() {
	var ratio = window.devicePixelRatio || 1;
	canvas.width = canvas.offsetWidth * ratio;
	canvas.height = canvas.offsetHeight * ratio;
	canvas.getContext("2d").scale(ratio, ratio);
}
window.onresize = resizeCanvas;
resizeCanvas();
signaturePad = new SignaturePad(canvas);
clearButton.addEventListener("click", function(event) {
	signaturePad.clear();
});
saveButton.addEventListener("click", function(event) {
	if (signaturePad.isEmpty()) {
		alert("Please provide signature first.");
	} else {
		window.open(signaturePad.toDataURL());
	}
});
var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
	},
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
		document.addEventListener("ACTION_DOWN", function(event) {
			event.x = event.x / window.devicePixelRatio;
			event.y = event.y / window.devicePixelRatio;
			signaturePad._handleTouchStart(event);
		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.x = event.x / window.devicePixelRatio;
			event.y = event.y / window.devicePixelRatio;
			signaturePad._handleTouchMove(event);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.x = event.x / window.devicePixelRatio;
			event.y = event.y / window.devicePixelRatio;
			signaturePad._handleTouchEnd(event);
		});
	},
	onDeviceReady : function() {
		app.nativeReq();
	},
	nativeReq : function() {
		var myPlugin = cordova
				.require('org.apache.cordova.plugin.SpenPlugin.SpenPlugin');
		myPlugin.addEvents();
	}

};

app.initialize();