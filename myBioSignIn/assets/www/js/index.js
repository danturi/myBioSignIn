var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
		this.num_pages = 0;
		this.pages = [];
		this.current_page;
		this.sha256 = null;
		this.canvas = document.getElementById('the-canvas');
		this.signed = false;
	},
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);

	},
	onDeviceReady : function() {
		document.addEventListener("backbutton", function(e) {
			navigator.app.exitApp();
		}, false);
		app.openPdf();
	},
	openPdf : function() {

		var currentPage = 1;
		//
		// Fetch the PDF document from the URL using promises
		//
		PDFJS.getDocument('modello3.pdf').then(function(pdf) {

			app.num_pages = pdf.numPages;

			// Create sha256 of pdf file
			pdf.getData().then(function(arrayBuffer) {
				var pdfraw = String.fromCharCode.apply(null, arrayBuffer);
				var md = forge.md.sha256.create();
				md.update(pdfraw);
				app.sha256 = md.digest().toHex();
			});

			if (currentPage <= pdf.numPages)
				getPage();

			function getPage() {
				// Using promise to fetch the page
				pdf.getPage(currentPage).then(function(page) {
					var scale = 1.5;
					var viewport = page.getViewport(scale);

					// Prepare canvas using PDF page
					// dimensions
					//
					// var canvas = document.getElementById('the-canvas');
					var canvas = app.canvas;
					canvas.style.border = "1px solid black";
					var context = canvas.getContext('2d');
					canvas.height = viewport.height;
					canvas.width = viewport.width;
					canvas.style.display = "none";

					var renderContext = {
						canvasContext : context,
						viewport : viewport
					};
					page.render(renderContext).then(function() {

						// store compressed image data in array
						app.pages.push(canvas.toDataURL());

						if (currentPage < pdf.numPages) {
							currentPage++;
							getPage(); // get next page
						} else {
							if (!localStorage.getItem("pageSign")) {
								localStorage.setItem("pageSign", 0);
							}
							app.current_page = 1;
							app.drawPage(0);
						}

					});
				});
			}
		});
	},
	drawPage : function(index) {
		window.scrollTo(0, 0);
		var ctx = app.canvas.getContext('2d');
		var img = new Image;
		img.onload = function() {
			ctx.drawImage(this, 0, 0, ctx.canvas.width, ctx.canvas.height);
			app.canvas.style.display = "block";
			app.generalCheck();// invoke callback when we're done
		};
		img.src = app.pages[index]; // start loading the data-uri as source
	},
	generalCheck : function() {
		this.buttonCheck();
		// console.log(localStorage.getItem("pageSign"));
		if (localStorage.getItem("pageSign") == 0) {
			this.addCanvasGesture();
		}
		this.signCheck();
	},
	buttonCheck : function() {
		var nextButton = document.getElementsByClassName("next");
		var prevButton = document.getElementsByClassName("back");

		if (this.num_pages > 1 && (this.current_page < this.num_pages)) {
			nextButton[0].style.opacity = 1;
			nextButton[0].addEventListener("click", this.nextPage, false);
		} else {
			nextButton[0].style.opacity = 0.2;
			nextButton[0].removeEventListener("click", this.nextPage, false);
		}
		if (this.current_page > 1) {
			prevButton[0].style.opacity = 1;
			prevButton[0].addEventListener("click", this.prevPage, false);
		} else {
			prevButton[0].style.opacity = 0.2;
			prevButton[0].removeEventListener("click", this.prevPage, false);
		}

	},
	signCheck : function() {
		var pageSign = localStorage.getItem("pageSign");
		if (pageSign != 0)
			this.signed = true;
		if (pageSign && (this.current_page == pageSign)) {
			var sign = localStorage.getItem("signature");
			var canvas = this.canvas;
			var ctx = canvas.getContext('2d');
			var bc = canvas.getBoundingClientRect();
			var img = new Image();
			var maxW = localStorage.getItem("signWidth");
			var maxH = localStorage.getItem("signHeight");
			var size;
			img.onload = function() {
				if (this.width > maxW || this.height > maxH) {
					size = scaleSize(maxW, maxH, this.width, this.height);
				} else {
					size = [ this.width, this.height ];
				}
				ctx.drawImage(this, parseInt(localStorage.getItem("signLeft"),
						10)
						- bc.left,
						parseInt(localStorage.getItem("signTop"), 10) - bc.top,
						size[0], size[1]);
			};
			img.src = sign;
		}
	},
	nextPage : function() {
		app.current_page = app.current_page + 1;
		return app.drawPage(app.current_page - 1); // array parte da 0
	},
	prevPage : function() {
		app.current_page = app.current_page - 1;
		return app.drawPage(app.current_page - 1);
	},
	addCanvasGesture : function() {
		var canvas = this.canvas;
		var gesture = new Hammer(canvas, {
			recognizers : [ [ Hammer.Press ] ]
		});
		gesture
				.on("press",
						function(ev) {
							var tapX = ev.center.x;
							var tapY = ev.center.y;
							var img;
							if (document.getElementById("signatureRect")) {
								img = document.getElementById("signatureRect");
							} else {
								img = document.createElement("img");
							}
							var src = document.getElementById("container");
							var logo = document.getElementById("header");
							img.id = "signatureRect";
							img.src = "img/tapToSign.png";
							img.style.position = "absolute";
							img.onload = function() {
								var leftPos = tapX + document.body.scrollLeft
										- img.width / 2;
								var topPos = tapY + document.body.scrollTop
										- img.height / 2;
								var canvasLeft = parseInt(
										app.canvas.offsetLeft, 10);

								// check box signature is inside the canvas
								if (leftPos < canvasLeft) {
									leftPos = canvasLeft;
								}
								if (leftPos + img.width > canvasLeft
										+ app.canvas.width) {
									leftPos = canvasLeft + app.canvas.width
											- img.width;
								}
								if (topPos < logo.offsetHeight) {
									topPos = logo.offsetHeight;
								}
								if (topPos + img.height > app.canvas.height
										+ logo.offsetHeight) {
									topPos = app.canvas.height
											+ logo.offsetHeight - img.height;
								}

								img.style.left = leftPos + "px";
								img.style.top = topPos + "px";
	
								src.appendChild(img);
								gesture.off("press");
								app.addSignatureGesture();
							}
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

		var posX = 0, posY = 0, scale = 1, last_scale = 1, last_posX = 0, last_posY = 0, max_pos_x = 0, max_pos_y = 0, min_pos_x = 0, min_pos_y = 0, transform = "", el = elm;
		var canvas = this.canvas;
		var logo = document.getElementById("header");
		// X,Y relative to canvas
		var firstX = parseInt(elm.style.left, 10) - app.canvas.offsetLeft;
		var firstY = parseInt(elm.style.top, 10) - 44;
		// console.log(firstY);

		hammertime.on('press', function() {
			var src = document.getElementById("container");
			src.removeChild(elm);
			app.addCanvasGesture();
		});
		hammertime
				.on(
						'doubletap',
						function(ev) {
							localStorage.setItem("pageSign", app.current_page);
							var bc = el.getBoundingClientRect();
							localStorage.setItem("signWidth", bc.width);
							localStorage.setItem("signHeight", bc.height);
							localStorage.setItem("signLeft", bc.left
									+ document.body.scrollLeft);
							localStorage.setItem("signTop", bc.top
									+ document.body.scrollTop);
							
							// Save pdfUnit position info
							localStorage
									.setItem(
											"signTopPDFSize",
											Math.round((app.canvas.height
															- (bc.top+document.body.scrollTop
															- logo.offsetHeight+bc.height)) / 1.5));
							localStorage
									.setItem(
											"signLeftPDFSize",
											Math.round((bc.left
															+ document.body.scrollLeft - app.canvas.offsetLeft) / 1.5));
							//test
							//console.log(app.canvas.width);
							console.log(app.canvas.height
															- (bc.top+document.body.scrollTop
															- logo.offsetHeight+bc.height));
							//console.log(bc.left
								//	+ document.body.scrollLeft - app.canvas.offsetLeft);
							localStorage.setItem("signWidthPDFSize",
									bc.width / 1.5);
							localStorage.setItem("signHeightPDFSize",
									bc.height / 1.5);
							localStorage.setItem("hashDocument", app.sha256);
							window.open('sign_screen.html');
						});
		hammertime
				.on(
						'pan pinch panend pinchend drag dragup dragdown dragleft dragright',
						function(ev) {
							// pan
							posX = last_posX + ev.deltaX;
							posY = last_posY + ev.deltaY;
							// check if signature box is inside the canvas when
							// moved
							if (last_scale > 1) {
								max_pos_x = app.canvas.width - firstX - 250
										* scale / 1.5;
								max_pos_y = app.canvas.height - firstY - 100
										* scale / 1.5;
								min_pos_x = firstX / (scale * 1.5);
							} else {
								max_pos_x = app.canvas.width - firstX - 250;
								min_pos_x = firstX;
								max_pos_y = app.canvas.height - firstY - 100;
								min_pos_y = firstY;
							}
							if (posX > max_pos_x) {
								posX = max_pos_x;
							}
							if (posX < -min_pos_x) {
								posX = -min_pos_x;
							}
							if (posY > max_pos_y) {
								posY = max_pos_y;
							}
							if (posY < -min_pos_y) {
								posY = -min_pos_y;
							}

							// pinch
							if (ev.type == "pinch") {
								scale = Math.max(.5, Math.min(last_scale
										* (ev.scale), 3));
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
	}
};
app.initialize();
function scaleSize(maxW, maxH, currW, currH) {

	var ratio = currH / currW;

	if (currW >= maxW && ratio <= 1) {
		currW = maxW;
		currH = currW * ratio;
	} else if (currH >= maxH) {
		currH = maxH;
		currW = currH / ratio;
	}

	return [ currW, currH ];
}