var biosignin = {
	// Application Constructor
	initialize : function() {

		this.canvas = document.getElementById("canvas");
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;

		// signaturePad = new SignaturePad(canvas);
		this.signatureCapture = new SignatureCapture();
		this.isoSignatureRep = new SignatureRepresentation();
		this.cert = null;
		this.keys = null;
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
			createPoint(event,biosignin.isoSignatureRep);

		});
		document.addEventListener("ACTION_MOVE", function(event) {
			event.preventDefault();
			touch.innerHTML = event.pressure;
			// signaturePad._handleTouchMove(event);
			biosignin.signatureCapture.move(event);
			createPoint(event,biosignin.isoSignatureRep);
		});
		document.addEventListener("ACTION_UP", function(event) {
			event.preventDefault();
			touch.innerHTML = 0.0;
			// signaturePad._handleTouchEnd(event);
			biosignin.signatureCapture.up(event);
		});

	},
	onDeviceReady : function() {
		document.addEventListener("backbutton", function(e){
			localStorage.setItem("pageSign",0);
			navigator.app.backHistory();
		},false);
		biosignin.isoSignatureRep.initializeChannels();
		biosignin.nativeReq();

	},
	nativeReq : function() {
		var myPlugin = cordova
				.require('org.apache.cordova.plugin.SpenPlugin.SpenPlugin');
		myPlugin.addEvents();

	},
	clearSignature : function() {
		biosignin.signatureCapture.clear();
		biosignin.isoSignatureRep.clear();
		biosignin.initialize();
	},
	saveSignature : function() {
		var isoBase64 = biosignin.createIsoData();
		/*
		 * create xml container with hash of document and isoBase64 of the
		 * biometric signature
		 */
		var xml = biosignin.createXmlContainer(isoBase64);
		var chiperXmlPem = biosignin.chiperPKCS7(xml);
		//biosignin.decipherPKCS7(chiperXmlPem);
		console.log(chiperXmlPem);
		
		//show signature img on pdf
		var trimCanvas = biosignin.trimSignature();
		/*var context= trimCanvas.getContext("2d");
	      context.beginPath();
	      context.rect(0, 0, trimCanvas.width, trimCanvas.height);
	      context.lineWidth = 2;
	      context.strokeStyle = 'black';
	      context.stroke();*/
		localStorage.setItem("signature", trimCanvas.toDataURL());
		window.open("index.html");
	},
	createIsoData : function() {
		var isoHeader = new IsoHeader();
		var isoBody = new IsoBody();
		//biosignin.isoSignatureRep.initializeChannels();
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
	createXmlContainer : function(isoData) {
		var xw = new XMLWriter('UTF-8');
		xw.formatting = 'indented';// add indentation and newlines
		xw.indentChar = ' ';// indent with spaces
		xw.indentation = 2;// add 2 spaces per level
		xw.writeStartDocument();
		xw.writeStartElement('isoSignatureData');
		xw.writeComment('hash of document and isoBase64 of the biometric signature');
		xw.writeStartElement("hashInfo");
		xw.writeElementString("hashAlgorithm", "SHA-256");
		xw.writeElementString("startOffset","0");
		xw.writeElementString("length","0");
		xw.writeElementString('hashValue', localStorage.getItem("hashDocument"));
		xw.writeEndElement();
		xw.writeStartElement('signaturePositionBinding');
		xw.writeComment('additional info of signature position in PDFUnit');
		xw.writeElementString('page', localStorage.getItem('pageSign'));
		xw.writeElementString('X', localStorage.getItem('signLeftPDFSize'));
		xw.writeElementString('Y',localStorage.getItem('signTopPDFSize'));
		xw.writeElementString('width',localStorage.getItem("signWidthPDFSize"));
		xw.writeElementString('heigth',localStorage.getItem("signHeightPDFSize"));
		xw.writeEndElement();
		xw.writeElementString('isoData', isoData );
		xw.writeEndElement();
		xw.writeEndDocument();
		return xw.flush();
	},
	chiperPKCS7 : function (xml) {
		//create certificate
		var pki = forge.pki;
		var keys = pki.rsa.generateKeyPair(2048);
		this.keys = keys;
		var cert = pki.createCertificate();
		cert.publicKey = keys.publicKey;
		cert.serialNumber = '01';
		cert.validity.notBefore = new Date();
		cert.validity.notAfter = new Date();
		cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
		var attrs = [{
		  name: 'commonName',
		  value: 'myBiosignIn.polimi.it'
		}, {
		  name: 'countryName',
		  value: 'IT'
		}, {
		  shortName: 'ST',
		  value: 'Italy'
		}, {
		  name: 'localityName',
		  value: 'Milan'
		}, {
		  name: 'organizationName',
		  value: 'Test'
		}, {
		  shortName: 'OU',
		  value: 'Test'
		}];
		cert.setSubject(attrs);
		cert.setIssuer(attrs);
		cert.setExtensions([{
		  name: 'basicConstraints',
		  cA: true
		}, {
		  name: 'keyUsage',
		  keyCertSign: true,
		  digitalSignature: true,
		  nonRepudiation: true,
		  keyEncipherment: true,
		  dataEncipherment: true
		}, {
		  name: 'extKeyUsage',
		  serverAuth: true,
		  clientAuth: true,
		  codeSigning: true,
		  emailProtection: true,
		  timeStamping: true
		}, {
		  name: 'nsCertType',
		  client: true,
		  server: true,
		  email: true,
		  objsign: true,
		  sslCA: true,
		  emailCA: true,
		  objCA: true
		}, {
		  name: 'subjectAltName',
		  altNames: [{
		    type: 6, // URI
		    value: 'http://example.org/webid#me'
		  }, {
		    type: 7, // IP
		    ip: '127.0.0.1'
		  }]
		}, {
		  name: 'subjectKeyIdentifier'
		}]);
		this.cert = cert;
		// self-sign certificate
		cert.sign(keys.privateKey);
		// convert a Forge certificate to PEM
		var pem = pki.certificateToPem(cert);
		var p7 = forge.pkcs7.createEnvelopedData();
		var certFromPem = forge.pki.certificateFromPem(pem);
		p7.addRecipient(certFromPem);
		p7.content = forge.util.createBuffer(xml);
		console.log(p7.content);
		// encrypt
		p7.encrypt();
		// convert message to PEM
		var pem = forge.pkcs7.messageToPem(p7);
		return pem;
	},
	decipherPKCS7 : function (pem) {
		var p7 = forge.pkcs7.messageFromPem(pem);
		// look at p7.recipients
		// find a recipient by the issuer of a certificate
		var recipient = p7.findRecipient(this.cert);
		// decrypt
		p7.decrypt(p7.recipients[0], this.keys.privateKey);
		console.log(p7.content);
	},
	trimSignature : function() {
		var pointsLen = biosignin.isoSignatureRep.points.length;
		var minX = 2560, minY = 1600, maxX = 0, maxY = 0;
		for (var i = 0; i < pointsLen; i++) {
			var x = Math.round(biosignin.isoSignatureRep.points[i].properties
					.get(channel.X) / 100 * 11.7);
			var y = Math.round((biosignin.isoSignatureRep.points[i].properties
					.get(channel.Y)) / 100 * 11.7);
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
		
		var trimHeight = maxY - minY+1;
	    var trimWidth = maxX - minX+2;
	    //Y inverted
	    var trimmed = ctx.getImageData(minX-1, 1600-maxY, trimWidth, trimHeight);
	    copyCtx.canvas.width = trimWidth;
		copyCtx.canvas.height = trimHeight;
		copyCtx.putImageData(trimmed, 0, 0);
		var container = document.getElementById("container");
		//container.removeChild(canvas);
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