var app = {
	// Application Constructor
	initialize : function() {

		// alert();
		this.bindEvents();
		 this.updateBrush( 0,0,0 );

	        this.sketcher = new Sketcher("canvas", this.currentBrush);
	},

	// Bind Event Listeners
	bindEvents : function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);

		// pen SDK events
		document.addEventListener("ACTION_DOWN", function() {
			app.initSketchEvents();
		})
		document.addEventListener("ACTION_UP", function() {
		})

	},

	initSketchEvents : function() {

		console.log("initSketchEvents");

		document.addEventListener("ACTION_DOWN",
				app.penTouchBegin);
		document.addEventListener("ACTION_MOVE", app.penTouchMove);
		document.addEventListener("ACTION_UP", app.penTouchEnd);

	},

	penTouchBegin : function(event) {
		event.x = event.x / window.devicePixelRatio;
		event.y = event.y / window.devicePixelRatio;
		var data = {
			x : event.x,
			y : event.y,
			pressure : event.pressure,
			id : "pen"
		}
		app.sketcher.drawBegin(data);
	},

	penTouchMove : function(event) {
		event.x = event.x / window.devicePixelRatio;
		event.y = event.y / window.devicePixelRatio;
		var data = {
			x : event.x,
			y : event.y,
			pressure : event.pressure,
			id : "pen"
		}
		app.sketcher.drawMove(data);
	},

	penTouchEnd : function(event) {
		app.sketcher.clear("pen");
	},

	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicity call 'app.receivedEvent(...);'
	onDeviceReady : function() {
		app.nativeReq();
		app.sketcher.resizeContext();
		app.initSketchEvents();

	},nativeReq : function() {
		var myPlugin = cordova.require('org.apache.cordova.plugin.SpenPlugin.SpenPlugin');
		myPlugin.addEvents();
	},
	
	updateBrushValues: function() {

        clearTimeout( this.updateTimeout );
        this.updateTimeout = setTimeout( function() {
            app.updateBrush( app.brushR, app.brushG, app.brushB );
        }, 100 );
    },

    updateBrush: function( r, g, b ) {

        this.brushR = r;
        this.brushG = g;
        this.brushB = b;

        console.log("rgba("+r+","+g+","+b+",0.45)")
        var canvas = document.createElement('canvas');
        canvas.width  = 50;
        canvas.height  = 50;
        var ctx = canvas.getContext("2d");

        var previewCanvas = document.getElementById("preview");
        var previewCtx = previewCanvas.getContext("2d");

        app.renderBrush( ctx, 0.45, 1 );
        app.renderBrush( previewCtx, 1, 2 );

        var img = new Image();
        img.src = canvas.toDataURL();
        this.currentBrush = img;


        if( app.sketcher ) {
            console.log("setting brush")
            this.sketcher.brush = img;

            this.rInput.value = r;
            this.gInput.value = g;
            this.bInput.value = b;
            //app.rSlider.setValue(r);
            //app.gSlider.setValue(g);
            //app.bSlider.setValue(b);
        }
    },
    renderBrush: function ( context, alpha, scale ) {
        context.clearRect(0,0,50*scale,50*scale);
        context.beginPath();
        switch( this.brushType ) {
            case "square":
                context.fillRect( 5*scale,5*scale,40*scale,40*scale );
                break;
            case "triangle":
                context.moveTo( 25*scale,0 );
                context.lineTo( 50*scale,50*scale );
                context.lineTo( 0,50*scale );
                context.lineTo( 25*scale,0 );
                break;
            case "caligraphic":
                context.moveTo( 35*scale,0 );
                context.lineTo( 50*scale,5*scale );
                context.lineTo( 15*scale,50*scale );
                context.lineTo( 5*scale,50*scale );
                context.lineTo( 35*scale,0 );
                break;
            default:
                context.arc(25*scale, 25*scale, 5*scale, 0, 2 * Math.PI, false);
                break;
        }
        context.fillStyle = "rgba("+this.brushR+","+this.brushG+","+this.brushB+"," + alpha +")";
        context.fill();
    }
};