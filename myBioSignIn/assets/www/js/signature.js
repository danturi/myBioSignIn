/*******************************************************************************
 * Signsend - The signature capture webapp sample using HTML5 Canvas Author:
 * Jack Wong <jack.wong@zetakey.com> Copyright (c): 2014 Zetakey Solutions
 * Limited, all rights reserved This library is free software; you can
 * redistribute it and/or modify it under the terms of the GNU Lesser General
 * Public License as published by the Free Software Foundation; either version
 * 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA You may contact the
 * author of Jack Wong by e-mail at: jack.wong@zetakey.com The latest version
 * can obtained from: https://github.com/jackccwong/signsend The live demo is
 * located at: http://apps.zetakey.com/signsend
 ******************************************************************************/
var SignatureCapture = (function (document) {

	var SignatureCapture = function () {
		
		this.canvas = document.getElementById("canvas");
		this.context = canvas.getContext("2d");
		
		this.initializeCanvas();

		this.disableSave = true;
		this.pixels = [];
		this.cpixels = [];
		this.xyLast = {};
		this.xyAddLast = {};
		this.calculate = false;

	};
	
	SignatureCapture.prototype.initializeCanvas = function() {
		var context = this.context;
		var canvas = this.canvas;
		context.fillStyle = "rgba(0,0,0,0)";
		context.strokeStyle = "#000000";
		context.lineWidth = 1;
		context.lineCap = "round";
		context.fillRect(0, 0, canvas.width, canvas.height);
		/*
		context.fillStyle = "#3a87ad";
		context.strokeStyle = "#3a87ad";
		context.lineWidth = 1;
		context.moveTo((canvas.width * 0.042), (canvas.height * 0.7));
		context.lineTo((canvas.width * 0.958), (canvas.height * 0.7));
		context.stroke();
		*/
		context.fillStyle = "rgba(0,0,0,0)";
		context.strokeStyle = "#000000";
		context.lineWidth = 2;
	}
	
	SignatureCapture.prototype.clear = function() {
		var ctx = this.context, canvas = this.canvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.initializeCanvas();
	};

	SignatureCapture.prototype.get_board_coords = function(e) {
			return {
				x : Math.round(e.x / window.devicePixelRatio),
				y : Math.round(e.y / window.devicePixelRatio)
			};
		
	};

	SignatureCapture.prototype.down = function (e) {
		var context = this.context;
		
		var xy = this.get_board_coords(e);
		context.beginPath();
		this.pixels.push('moveStart');
		context.moveTo(xy.x, xy.y);
		this.pixels.push(xy.x, xy.y);
		this.xyLast = xy;
	};

	SignatureCapture.prototype.move = function (e) {

		var xy = this.get_board_coords(e);
		var context = this.context;
		var xyLast = this.xyLast;
		var xyAdd = {
				x : (xyLast.x + xy.x) / 2,
				y : (xyLast.y + xy.y) / 2
		};

		/*
		if (this.calculate) {
			var xLast = (this.xyAddLast.x + xyLast.x + xyAdd.x) / 3;
			var yLast = (this.xyAddLast.y + xyLast.y + xyAdd.y) / 3;
			this.pixels.push(xLast, yLast);
		} else {
			this.calculate = true;
		}*/
		
		context.quadraticCurveTo(this.xyLast.x, this.xyLast.y, xyAdd.x, xyAdd.y);
		this.pixels.push(xyAdd.x, xyAdd.y);
		context.stroke();
		context.beginPath();
		context.moveTo(xyAdd.x, xyAdd.y);
		this.xyAddLast = xyAdd;
		this.xyLast = xy;
		
	};

	SignatureCapture.prototype.up = function (e) {
		this.disableSave = false;
		this.context.stroke();
		this.pixels.push('e');
		this.calculate = false;
	};

	return SignatureCapture;
})(document);

