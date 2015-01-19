var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
		this.file = null;
		this.pages = 0;
		this.cont = 1;
		this.sha256 = null;
	},
	signature : {
		heigth : 0,
		width : 0
	},
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);

	},
	onDeviceReady : function() {
		app.openPdf(1);
	},
	openPdf : function(num) {
		//
		// Fetch the PDF document from the URL using promises
		//
		PDFJS.getDocument('modello3.pdf').then(function(pdf) {

			app.pages = pdf.numPages;

			// Retrieve sha256 of pdf file
			pdf.getData().then(function(arrayBuffer) {
				var pdfraw = String.fromCharCode.apply(null, arrayBuffer);
				var md = forge.md.sha256.create();
				md.update(pdfraw);
				app.sha256 = md.digest().toHex();
			});
			// Using promise to fetch the page
			pdf.getPage(num).then(function(page) {
				var scale = 1.5;
				var viewport = page.getViewport(scale);
				//
				// Prepare canvas using PDF page dimensions
				//
				var canvas = document.getElementById('the-canvas');
				canvas.style.border = "1px solid black";
				var context = canvas.getContext('2d');
				canvas.height = viewport.height;
				canvas.width = viewport.width;
				//
				// Render PDF page into canvas context
				//
				var renderContext = {
					canvasContext : context,
					viewport : viewport
				};
				page.render(renderContext).promise.then(function() {
					app.buttonCheck();
					app.addCanvasGesture();
				});
			});
		});
	},
	buttonCheck : function() {
		var nextButton = document.getElementsByClassName("next");
		var prevButton = document.getElementsByClassName("back");

		if (this.pages > 1 && (this.cont < this.pages)) {
			nextButton[0].style.opacity = 1;
			nextButton[0].addEventListener("click", this.nextPage, false);
		} else {
			nextButton[0].style.opacity = 0.2;
			nextButton[0].removeEventListener("click", this.nextPage, false);
		}
		if (this.cont > 1) {
			prevButton[0].style.opacity = 1;
			prevButton[0].addEventListener("click", this.prevPage, false);
		} else {
			prevButton[0].style.opacity = 0.2;
			prevButton[0].removeEventListener("click", this.prevPage, false);
		}

	},
	nextPage : function() {
		var page = app.cont + 1;
		app.cont = page;
		return app.openPdf(page);
	},
	prevPage : function() {
		var page = app.cont - 1;
		app.cont = page;
		return app.openPdf(page);
	},
	addCanvasGesture : function() {
		var canvas = document.getElementById('the-canvas');
		var gesture = new Hammer(canvas, {
			recognizers : [ [ Hammer.Press ] ]
		});
		gesture.on("press", function(ev) {
			var canvas = document.getElementById('the-canvas');
			var bc = canvas.getBoundingClientRect();
			var tapX = ev.center.x;
			var tapY = ev.center.y;
			var img = document.createElement("img");
			var src = document.getElementById("container");
			img.id = "signatureRect";
			img.src = "img/tapToSign.png";
			img.style.position = "absolute";
			img.style.left = tapX + document.body.scrollLeft - 125 + "px";
			img.style.top = tapY + document.body.scrollTop - 50 + "px";
			src.appendChild(img);
			gesture.off("press");
			app.addSignatureGesture();
		});
	},
	addSignatureGesture : function() {
		var signRect = document.getElementById("signatureRect");
		this.hammerIt(signRect);
	},
	hammerIt : function(elm) {
		hammertime = new Hammer(elm, {
			preventDefault : true
		});
		hammertime.get('pinch').set({
			enable : true
		});

		var posX = 0, posY = 0, scale = 1, last_scale = 1, last_posX = 0, last_posY = 0, max_pos_x = 0, max_pos_y = 0, transform = "", el = elm;
		var canvas = document.getElementById('the-canvas');
		var bc = canvas.getBoundingClientRect();

		hammertime.on('press', function() {
			var rect = document.getElementById("signatureRect");
			document.getElementById("container").removeChild(rect);
			app.addCanvasGesture();
		});
		hammertime.on('doubletap', function() {
			var rect = document.getElementById("signatureRect");
			app.signature.height = rect.clientWidth;
			app.signature.width = rect.clientHeight;
			window.open('sign_screen.html');
		})
		hammertime
				.on(
						'pan pinch panend pinchend drag dragup dragdown dragleft dragright',
						function(ev) {
							// pan

							posX = last_posX + ev.deltaX;
							posY = last_posY + ev.deltaY;
							max_pos_x = bc.width;
							max_pos_y = bc.height;
							if (posX > max_pos_x) {
								posX = max_pos_x;
							}
							if (posX < -max_pos_x) {
								posX = -max_pos_x;
							}
							if (posY > max_pos_y) {
								posY = max_pos_y;
							}
							if (posY < -max_pos_y) {
								posY = -max_pos_y;
							}

							// pinch
							if (ev.type == "pinch") {
								scale = Math.max(.5, Math.min(last_scale
										* (ev.scale), 4));
							}
							if (ev.type == "pinchend") {
								last_scale = scale;
							}

							// drag
							if (ev.type == "drag") {
								posX = ev.deltaX + last_posX;
								posY = ev.deltaY + last_posY;
							}
							if (ev.type == "dragend") {
								last_posX = posX;
								last_posY = posY;
							}
							// panend
							if (ev.type == "panend") {
								last_posX = posX < max_pos_x ? posX : max_pos_x;
								last_posY = posY < max_pos_y ? posY : max_pos_y;
							}

							transform = "translate3d(" + posX + "px," + posY
									+ "px, 0) " + "scale3d(" + scale + ", "
									+ scale + ", 1)";

							if (transform) {
								el.style.webkitTransform = transform;
							}

						});
	},
	createHashPdf : function() {

	}
};
app.initialize();