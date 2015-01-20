var app = {
	// Application Constructor
	initialize : function() {
		this.bindEvents();
		this.pages = 0;
		this.cont = 1;
		this.sha256 = null;
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

			// Create sha256 of pdf file
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
				// Prepare canvas using PDF page
				// dimensions
				//
				var canvas = document.getElementById('the-canvas');
				canvas.style.border = "1px solid black";
				var context = canvas.getContext('2d');
				canvas.height = viewport.height;
				canvas.width = viewport.width;
				//
				// Render PDF page into canvas
				// context
				//
				var renderContext = {
					canvasContext : context,
					viewport : viewport
				};
				page.render(renderContext).promise.then(function() {
					app.buttonCheck();
					app.addCanvasGesture();
					app.signCheck();
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
	signCheck : function() {
		console.log(localStorage.getItem("pageSign"));
		if (localStorage.getItem("pageSign")) {
			var sign = localStorage.getItem("signature");
			var canvas = document.getElementById('the-canvas');
			var ctx = canvas.getContext('2d');
			var bc = canvas.getBoundingClientRect();
			var img = new Image();
			var maxW = localStorage.getItem("signWidth");
			var maxH = localStorage.getItem("signHeight");
			var size;
			img.onload = function() {
				if(this.width > maxW || this.height > maxH){
					size = scaleSize(maxW, maxH, this.width, this.height)
				}else {
					size = [this.width,this.height];
				}
				ctx.drawImage(this, parseInt(localStorage.getItem("signLeft"),10)-bc.left, parseInt(localStorage.getItem("signTop"),10)-bc.top,
						size[0],size[1]);
			}
			img.src = sign;
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
			var tapX = ev.center.x;
			var tapY = ev.center.y;
			var img = document.createElement("img");
			var src = document.getElementById("container");
			img.id = "signatureRect";
			img.src = "img/tapToSign.png";
			img.style.position = "absolute";
			img.style.left = tapX + document.body.scrollLeft - 125 + "px";
			img.style.top = tapY + document.body.scrollTop - 50 + "px";
			localStorage.setItem("signLeft",img.style.left);
			localStorage.setItem("signTop",img.style.top);
			localStorage.setItem("signWidth",img.width);
			localStorage.setItem("signHeight",img.height);
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

		hammertime.on('press', function() {
			var rect = document.getElementById("signatureRect");
			document.getElementById("container").removeChild(rect);
			app.addCanvasGesture();
		});
		hammertime.on('doubletap', function(ev) {
			//console.log(ev.center.y+ document.body.scrollTop);
			localStorage.setItem("pageSign", app.cont);
			window.open('sign_screen.html');
		})
		hammertime
				.on(
						'pan pinch panend pinchend drag dragup dragdown dragleft dragright',
						function(ev) {
							// pan
							posX = last_posX + ev.deltaX;
							posY = last_posY + ev.deltaY;
							max_pos_x = 2600;
							max_pos_y = 1600;
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
								var bc = el.getBoundingClientRect();
								localStorage.setItem("signWidth",bc.width);
								localStorage.setItem("signHeight",bc.height);
								localStorage.setItem("signLeft",bc.left+document.body.scrollLeft);
								localStorage.setItem("signTop",bc.top+document.body.scrollTop);
							}

						});
	}
};
app.initialize();
function scaleSize(maxW, maxH, currW, currH){

	var ratio = currH / currW;

	if(currW >= maxW && ratio <= 1){
	currW = maxW;
	currH = currW * ratio;
	} else if(currH >= maxH){
	currH = maxH;
	currW = currH / ratio;
	}

	return [currW, currH];
	}