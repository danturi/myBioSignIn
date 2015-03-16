/**
 * 
 */
var deviceConstants = {
		pixelToMillimeters: 11.7,
		maxX: 2560,
		minX: 0,
		maxY: 1600,
		minY: 0,
		maxF: 2.800,
		minF: 0
}

var Point = function(x, y, pressure, time) {
	this.x = x;
	this.y = y;
	this.pressure = pressure;
	this.time = time; //milliseconds
};
	
var IsoPoint = function() {
	this.properties = new Hashtable();
	};

var scaling = {
		X: 100,
		Y: 100,
		F: 1000,
		T: 1000
}


IsoPoint.prototype.toBytes = function() {
	
	var bufferTmp = new ArrayBuffer(32);
	var cont = 0;
	for (var i = 15; i >= 0; i--) {			
		var key = Channel.fromInteger(i);
		if (!this.properties.containsKey(key)) {
			continue;
		}	
		//channel.S has only 1 byte
		if(key === channel.S){
			var value = new DataView(bufferTmp,cont,1);
			value.setUint8(0,this.properties.get(key)- key.minValue,false);
			cont= cont+1;
		}else {
			var value = new DataView(bufferTmp,cont,2);
			value.setUint16(0,this.properties.get(key)- key.minValue,false);
			cont = cont+2;
		}
	}
	
	return bufferTmp.slice(0,cont);
}

IsoPoint.prototype.fromBytes = function (bytesIso,signRep) {
	if (!bytesIso) {
		throw new Error("byteIso is null");
	}
	var isoPoint = this;
	var cont = 0;
	for (var i = 15; i >= 0; i--) {
		var key = Channel.fromInteger(i);
		if (!signRep.channels.containsKey(key)) {
			continue;
		}
		if(key === channel.S){
			var view = new DataView(bytesIso,cont,1);
			isoPoint.properties.put(key,view.getUint8(0)+key.minValue);
			cont = cont+1;
		}
		var view = new DataView(bytesIso,cont,2);
		isoPoint.properties.put(key,view.getUint16(0)+key.minValue);
		cont = cont+2;
	}
	return isoPoint;
};


function addIsoPoint(point) {
	var isoPoint = new IsoPoint();
	// X 
	var valueX = Math.round(point.x / deviceConstants.pixelToMillimeters * scaling.X);
	if(checkRangeValue(valueX, channel.X)){
		isoPoint.properties.put(channel.X,valueX);
	}
	// Y, ISO convention upwards (Android convention downwards)
	var valueY = Math.round((deviceConstants.maxY - point.y)/ deviceConstants.pixelToMillimeters * scaling.Y);
	if(checkRangeValue(valueY, channel.Y)){
		isoPoint.properties.put(channel.Y,valueY);
	}
	// F
	if(point.pressure < 0 || point.pressure > 1){
		throw new Error ("Force value not valid!");
		var valueF = 0;
	} else {
		var valueF = Math.round(tabletUnitToNewton(point.pressure)*scaling.F);
		if(checkRangeValue(valueF, channel.F)){
			isoPoint.properties.put(channel.F,valueF);
		}
	}
	
	// T
	var firstTime = biosignin.isoSignatureRep.getFirstPointTime();
	if(firstTime == 0){
		isoPoint.properties.put(channel.T,0);
		biosignin.isoSignatureRep.setFirstPointTime(point.time);
	}else {
		var valueT = Math.round((point.time - firstTime)/1000*scaling.T)
		if( valueT > 65535){
			alert("Hai impiegato troppo tempo per firmare, ricomincia!");
			biosignin.clearSignature();
		}else{
			isoPoint.properties.put(channel.T,valueT);
		}
	}
	biosignin.isoSignatureRep.points.push(isoPoint);
};

function createPoint(e) {
	var point  = new Point(Math.round(e.x / window.devicePixelRatio), Math.round(e.y
			/ window.devicePixelRatio), e.pressure, e.time);
	addIsoPoint(point);
};

function tabletUnitToNewton(value){
	if(value <= 0.988){
		//empirical force function
		return 0.0217800303*Math.exp(4.5880838131*value).toFixed(3);
	}else {
		if(value <= 0.996){
			//linear interpolation 
			return (value-0.996)*(-213.5)-((value-0.986)*(-246.8)).toFixed(3);
		}else {
			//max force value
			return 2.800;
		}
	}
};
// Check ISO range size
function checkRangeValue(value, channel){
	if(value < channel.minValue || value > channel.maxValue){
		throw new Error("The value of "+channel+" : "+value+" is outside range["+channel.minValue+";"+channel.maxValue+"]");
		return false;
	}
	var channelDescr = biosignin.isoSignatureRep.channels.get(channel);
	if(value < channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE) ||
			value > channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)){
		throw new Error("The value of "+channel+" : "+value+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]");
		return false;
	}
	return true;
}