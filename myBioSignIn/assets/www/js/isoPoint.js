/**
 * 
 */

var Point = function(x, y, pressure, time) {
	this.x = x;
	this.y = y;
	this.pressure = pressure;
	this.time = time;
};

var IsoPoint = function() {
	this.properties = new Hashtable();
	};


IsoPoint.prototype.toBytes = function() {
	
	var bufferTmp = new ArrayBuffer(32);
	var cont = 0;
	for (var i = 15; i >= 0; i--) {			
		var key = Channel.fromInteger(i);
		if (!this.properties.containsKey(key)) {
			continue;
		}	
		//TODO gestire eccezione channel.S -> 1 byte
		
		var value = new DataView(bufferTmp,cont,2);
		value.setUint16(0,this.properties.get(key)- key.minValue,false);
		cont = cont+2;
	}
	
	return bufferTmp.slice(0,cont);
}

function addIsoPoint(point) {
	var isoPoint = new IsoPoint();
	isoPoint.properties.put(channel.X,point.x);
	isoPoint.properties.put(channel.Y,point.y);
	isoPoint.properties.put(channel.F,point.pressure);
	isoPoint.properties.put(channel.T,point.time);
	//console.log(isoPoint.properties.entries());
	isoSignatureRep.points.push(isoPoint);
};

function createPoint(e) {
	var point  = new Point(Math.round(e.x / window.devicePixelRatio), Math.round(e.y
			/ window.devicePixelRatio), e.pressure, e.time);
	addIsoPoint(point);
};