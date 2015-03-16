/**
 * 
 */
var isoHeader, bufferHeader;

module("TEST HEADER", {
	setup : function() {
		isoHeader = new IsoHeader();
		bufferHeader = isoHeader.toBytes(0);
	},
	teardown : function() {

	}
});
test("Test iso header bytes ", function() {
	var view = new DataView(bufferHeader, 0, 4);
	equal(view.getUint32(0), 0x53444900,
			"The full format identifier is: 0x53444900");
	var view = new DataView(bufferHeader, 4, 4);
	equal(view.getUint32(0), 0x30323000,
			"The full format version is: 0x30323000");
	var view = new DataView(bufferHeader, 8, 4);
	equal(view.getUint32(0), 15, "The full format record length is: 15");
	var view = new DataView(bufferHeader, 12, 2);
	equal(view.getUint16(0), 1,
			"The full format number of representation is: 1");
	var view = new DataView(bufferHeader, 14, 1);
	equal(view.getUint8(0), 0, "The full format certification flag is: 0");
});

var isoSignRep, bufferSign, bufferPoint, bufferDescrX, bufferDescrT, channelDescrX, channelDescrY, channelDescrF;

module("TEST SIGNATURE", {
	setup : function() {
		isoSignRep = new SignatureRepresentation();
		// create a isoPoint
		var isoPoint = new IsoPoint();
		isoPoint.properties.put(channel.X, 1200);
		isoPoint.properties.put(channel.Y, 2100);
		isoPoint.properties.put(channel.F, 1);
		isoPoint.properties.put(channel.T, 1200);
		// add point
		isoSignRep.points.push(isoPoint);
		// create channel descriptions
		channelDescrX = new ChannelDescription(channel.X);
		channelDescrX.attributes.put(channelAttributes.MAXIMUM_CHANNEL_VALUE,
				4000);
		channelDescrX.attributes.put(channelAttributes.MINIMUM_CHANNEL_VALUE,
				4000);
		channelDescrY = new ChannelDescription(channel.Y);
		channelDescrY.attributes.put(channelAttributes.MAXIMUM_CHANNEL_VALUE,
				4000);
		channelDescrY.attributes.put(channelAttributes.MINIMUM_CHANNEL_VALUE,
				4000);
		channelDescrF = new ChannelDescription(channel.F);
		channelDescrF.attributes
				.put(channelAttributes.MAXIMUM_CHANNEL_VALUE, 1);
		channelDescrF.attributes
				.put(channelAttributes.MINIMUM_CHANNEL_VALUE, 0);
		channelDescrT = new ChannelDescription(channel.T);
		// add channels
		isoSignRep.channels.put(channel.X, channelDescrX);
		isoSignRep.channels.put(channel.Y, channelDescrY);
		isoSignRep.channels.put(channel.F, channelDescrF);
		isoSignRep.channels.put(channel.T, channelDescrT);

		bufferSign = isoSignRep.toBytes();
		bufferPoint = isoPoint.toBytes();
		bufferDescrX = channelDescrX.toBytes();
		bufferDescrT = channelDescrT.toBytes();

	},
	teardown : function() {

	}
});
test("Test length signature bytes", function() {
	// header = 40 bytes + body = 10 bytes (only one point)
	var view = new DataView(bufferSign, 0, 4);
	equal(view.getUint32(0), 50,
			"The signature representation length is: 50 bytes");
	equal(bufferPoint.byteLength, 8,
			"The isoPoint representation length is: 8 bytes");
	equal(bufferDescrX.byteLength, 5,
			"The channelDescription representation length is: 5 bytes");
});
test("Test iso signature bytes", function() {
	var view = new DataView(bufferSign, 13, 1);
	equal(view.getUint8(0), 1,
			"The capture device tech ID is : 1 (Electromagnetic)");
	var view = new DataView(bufferSign, 19, 2);
	equal(Number(view.getUint16(0)).toString(2), 1100000101000000,
			"The channel inclusion field for X,Y,T,F is : 1100000101000000");
	var view = new DataView(bufferDescrX, 0, 1);
	equal(Number(view.getUint8(0)).toString(2), 1100000,
			"The preamble field for channel.X is : 01100000");
	var view = new DataView(bufferSign, 37, 1);
	equal(view.getUint8(0), 0,
			"The first byte for number of sample points is : 0");
	var view = new DataView(bufferSign, 38, 2);
	equal(view.getUint16(0), 1, "The number of sample points is : 1");
	var view = new DataView(bufferPoint, 0, 2);
	equal(view.getUint16(0), 1200 - channelValue.SHORT.min,
			"The channel.X value is: 33968");
	var view = new DataView(bufferPoint, 2, 2);
	equal(view.getUint16(0), 2100 - channelValue.SHORT.min,
			"The channel.Y value is: 34868");
	var view = new DataView(bufferPoint, 4, 2);
	equal(view.getUint16(0), 1200, "The channel.T value is: 1200");
	var view = new DataView(bufferPoint, 6, 2);
	equal(view.getUint16(0), 1, "The channel.F value is: 1");
});

var realIsoHeader, realIsoBody, realBufferBody, realBufferHeader,realBufferPoint,realIsoPoint,isoSignatureRep;
module("TEST REAL SIGNATURE", {
	setup : function() {
		isoSignatureRep = new SignatureRepresentation();
		isoSignatureRep.initializeChannels();
		
		function checkRangeValue(value, channel){
			/*if(value < channel.minValue || value > channel.maxValue){
				throw new Error("The value of "+channel+" : "+value+" is outside range["+channel.minValue+";"+channel.maxValue+"]");
				return false;
			}*/
			var channelDescr = isoSignatureRep.channels.get(channel);
			if(value < channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE) ||
					value > channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)){
				throw new Error("The value of "+channel+" : "+value+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]");
				return false;
			}
			return true;
		}
		
		// add first real point
		var point = new Point(400, 600, 0.996474775847872, 9820);

		realIsoPoint = new IsoPoint();
		var valueX = Math.round(point.x / deviceConstants.pixelToMillimeters * scaling.X);
		if(checkRangeValue(valueX, channel.X)){
			realIsoPoint.properties.put(channel.X,valueX);
		}
		var valueY = Math.round((deviceConstants.maxY - point.y)/ deviceConstants.pixelToMillimeters * scaling.Y);
		if(checkRangeValue(valueY, channel.Y)){
			realIsoPoint.properties.put(channel.Y,valueY);
		}
		if(point.pressure < 0 || point.pressure > 1){
			throw new Error ("Force value not valid!"); 
			var valueF = 0;
		} else {
			var valueF = Math.round(tabletUnitToNewton(point.pressure)*scaling.F);
			if(checkRangeValue(valueF, channel.F)){
				realIsoPoint.properties.put(channel.F,valueF);
			}
		}
		var firstTime = isoSignatureRep.getFirstPointTime();
		if (firstTime == 0) {
			realIsoPoint.properties.put(channel.T,0);
			isoSignatureRep.setFirstPointTime(point.time);
		} else {
			if(Math.round((point.time - firstTime)/1000*scaling.T) > 65535){
				throw new Error("Hai impiegato troppo tempo per firmare, ricomincia!");
			} else {
				realIsoPoint.properties.put(channel.T,Math.round((point.time - firstTime)/1000*scaling.T));
			}
		}
		isoSignatureRep.points.push(realIsoPoint);

		
		// add second real point
		point = new Point(560, 1600, 0.776474775847872, 9850);

		realIsoPoint2 = new IsoPoint();
		var valueX = Math.round(point.x / deviceConstants.pixelToMillimeters * scaling.X);
		if(checkRangeValue(valueX, channel.X)){
			realIsoPoint2.properties.put(channel.X,valueX);
		}
		var valueY = Math.round((deviceConstants.maxY - point.y)/ deviceConstants.pixelToMillimeters * scaling.Y);
		if(checkRangeValue(valueY, channel.Y)){
			realIsoPoint2.properties.put(channel.Y,valueY);
		}
		if(point.pressure < 0 || point.pressure > 1){
			throw new Error ("Force value not valid!");
			var valueF = 0;
		} else {
			var valueF = Math.round(tabletUnitToNewton(point.pressure)*scaling.F);
			if(checkRangeValue(valueF, channel.F)){
				realIsoPoint2.properties.put(channel.F,valueF);
			}
		}
		var firstTime = isoSignatureRep.getFirstPointTime();
		if (firstTime == 0) {
			realIsoPoint2.properties.put(channel.T,0);
			isoSignatureRep.setFirstPointTime(point.time);
		} else {
			if(Math.round((point.time - firstTime)/1000*scaling.T) > 65535){
				throw new Error("Hai impiegato troppo tempo per firmare, ricomincia!");
			} else {
				realIsoPoint2.properties.put(channel.T,Math.round((point.time - firstTime)/1000*scaling.T));
			}
		}
		isoSignatureRep.points.push(realIsoPoint2);
		
		// create iso bytes
		realIsoHeader = new IsoHeader();
		realIsoBody = new IsoBody();
		realIsoBody.representations.push(isoSignatureRep);
		realBufferBody = isoSignatureRep.toBytes();
		realBufferHeader = realIsoHeader.toBytes(realBufferBody.byteLength);
	
	},
	teardown : function() {

	}
});
test("Test header fromBytes", function() {
	 
	function equalBuffer(buf1, buf2) {
		if (buf1.byteLength != buf2.byteLength)
			return false;
		var dv1 = new Uint8Array(buf1);
		var dv2 = new Uint8Array(buf2);
		for (var i = 0; i != buf1.byteLength; i++) {
			if (dv1[i] != dv2[i])
				return false;
		}
		return true;
	}
	;
	var isoHeaderFromBytes = new IsoHeader();
	isoHeaderFromBytes.fromBytes(realBufferHeader);
	equal(equalBuffer(isoHeaderFromBytes.buffer,realIsoHeader.buffer),true,
				"Iso Header correct!");

});
test("Test signature fromBytes", function() {
	var isoSignFromBytes = new SignatureRepresentation();
		isoSignFromBytes.fromBytes(realBufferBody); 
	//Test point channel values
	equal(isoSignFromBytes.points.length, 2, "The number of sample points is : 2");
	
	//Test first point value
	equal(isoSignFromBytes.points[0].properties.get(channel.X),realIsoPoint.properties.get(channel.X),"Channel X of iso point is the same: "+isoSignFromBytes.points[0].properties.get(channel.X));
	equal(isoSignFromBytes.points[0].properties.get(channel.Y),realIsoPoint.properties.get(channel.Y),"Channel Y of iso point is the same: "+isoSignFromBytes.points[0].properties.get(channel.Y));
	equal(isoSignFromBytes.points[0].properties.get(channel.F),realIsoPoint.properties.get(channel.F),"Channel F of iso point is the same:"+isoSignFromBytes.points[0].properties.get(channel.F));
	equal(isoSignFromBytes.points[0].properties.get(channel.T),realIsoPoint.properties.get(channel.T),"Channel T of iso point is the same:"+isoSignFromBytes.points[0].properties.get(channel.T));
	
	//Test second point value
	equal(isoSignFromBytes.points[1].properties.get(channel.X),realIsoPoint2.properties.get(channel.X),"Channel X of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.X));
	equal(isoSignFromBytes.points[1].properties.get(channel.Y),realIsoPoint2.properties.get(channel.Y),"Channel Y of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.Y));
	equal(isoSignFromBytes.points[1].properties.get(channel.F),realIsoPoint2.properties.get(channel.F),"Channel F of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.F));
	equal(isoSignFromBytes.points[1].properties.get(channel.T),realIsoPoint2.properties.get(channel.T),"Channel T of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.T));
	
	//Test channels description
	var descrXFromBytes = isoSignFromBytes.channels.get(channel.X);
	var descrYFromBytes = isoSignFromBytes.channels.get(channel.Y);
	var descrFFromBytes = isoSignFromBytes.channels.get(channel.F);
	var descrTFromBytes = isoSignFromBytes.channels.get(channel.T);
	var descrX = isoSignatureRep.channels.get(channel.X);
	var descrY = isoSignatureRep.channels.get(channel.Y);
	var descrF = isoSignatureRep.channels.get(channel.F);
	var descrT = isoSignatureRep.channels.get(channel.T);
	equal(descrXFromBytes.attributes.get(channelAttributes.SCALING_VALUE),descrX.attributes.get(channelAttributes.SCALING_VALUE),"Channel X SCALING_VALUE is the same: "+descrX.attributes.get(channelAttributes.SCALING_VALUE));
	equal(descrXFromBytes.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),descrX.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),"Channel X MAXIMUM_CHANNEL_VALUE is the same: "+descrX.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE));
	equal(descrXFromBytes.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),descrX.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),"Channel X MINIMUM_CHANNEL_VALUE is the same: "+descrX.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE));
	equal(descrYFromBytes.attributes.get(channelAttributes.SCALING_VALUE),descrY.attributes.get(channelAttributes.SCALING_VALUE),"Channel Y SCALING_VALUE is the same: "+descrY.attributes.get(channelAttributes.SCALING_VALUE));
	equal(descrYFromBytes.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),descrY.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),"Channel Y MAXIMUM_CHANNEL_VALUE is the same: "+descrY.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE));
	equal(descrYFromBytes.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),descrY.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),"Channel Y MINIMUM_CHANNEL_VALUE is the same: "+descrY.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE));
	equal(descrFFromBytes.attributes.get(channelAttributes.SCALING_VALUE),descrF.attributes.get(channelAttributes.SCALING_VALUE),"Channel F SCALING_VALUE is the same: "+descrF.attributes.get(channelAttributes.SCALING_VALUE));
	equal(descrFFromBytes.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),descrF.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),"Channel F MAXIMUM_CHANNEL_VALUE is the same: "+descrF.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE));
	equal(descrFFromBytes.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),descrF.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),"Channel F MINIMUM_CHANNEL_VALUE is the same: "+descrF.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE));
	equal(descrTFromBytes.attributes.get(channelAttributes.SCALING_VALUE),descrT.attributes.get(channelAttributes.SCALING_VALUE),"Channel T SCALING_VALUE is the same: "+descrT.attributes.get(channelAttributes.SCALING_VALUE));
	equal(descrTFromBytes.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),descrT.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE),"Channel T MAXIMUM_CHANNEL_VALUE is the same: "+descrT.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE));
	equal(descrTFromBytes.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),descrT.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE),"Channel T MINIMUM_CHANNEL_VALUE is the same: "+descrT.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE));
	//test channels
	equal(isoSignFromBytes.channels.size(),isoSignatureRep.channels.size(),"The signature has "+isoSignatureRep.channels.size()+" channels");

});

//TODO aggiungere casi limite
