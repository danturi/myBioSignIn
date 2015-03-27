/**
 * 
 */
var isoHeader, bufferHeader;

module("TEST HEADER", {
	setup : function() {
		isoHeader = new IsoHeader();
		bufferHeader = isoHeader.toBytes(1);
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
	equal(view.getUint32(0), 16, "The full format record length is: 15");
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
		
		// add first real point
		var point = new Point(400, 600, 0.996474775847872, 9820);
		addIsoPoint(point,isoSignatureRep);
		// add second real point
		point = new Point(560, 1600, 0.776474775847872, 9850);
		addIsoPoint(point,isoSignatureRep);
		// add third real point
		point = new Point(560, 1600, 0.995, 9890);
		addIsoPoint(point,isoSignatureRep);
		
		
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
	equal(isoSignFromBytes.points.length, 3, "The number of sample points is : 3");
	
	//Test first point value
	equal(isoSignFromBytes.points[0].properties.get(channel.X),isoSignatureRep.points[0].properties.get(channel.X),"Channel X of iso point is the same: "+isoSignFromBytes.points[0].properties.get(channel.X));
	equal(isoSignFromBytes.points[0].properties.get(channel.Y),isoSignatureRep.points[0].properties.get(channel.Y),"Channel Y of iso point is the same: "+isoSignFromBytes.points[0].properties.get(channel.Y));
	equal(isoSignFromBytes.points[0].properties.get(channel.F),isoSignatureRep.points[0].properties.get(channel.F),"Channel F of iso point is the same:"+isoSignFromBytes.points[0].properties.get(channel.F));
	equal(isoSignFromBytes.points[0].properties.get(channel.T),isoSignatureRep.points[0].properties.get(channel.T),"Channel T of iso point is the same:"+isoSignFromBytes.points[0].properties.get(channel.T));
	
	//Test second point value
	equal(isoSignFromBytes.points[1].properties.get(channel.X),isoSignatureRep.points[1].properties.get(channel.X),"Channel X of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.X));
	equal(isoSignFromBytes.points[1].properties.get(channel.Y),isoSignatureRep.points[1].properties.get(channel.Y),"Channel Y of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.Y));
	equal(isoSignFromBytes.points[1].properties.get(channel.F),isoSignatureRep.points[1].properties.get(channel.F),"Channel F of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.F));
	equal(isoSignFromBytes.points[1].properties.get(channel.T),isoSignatureRep.points[1].properties.get(channel.T),"Channel T of iso point is the same: "+isoSignFromBytes.points[1].properties.get(channel.T));
	
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

module("TEST FAIL SIGNATURE", {
	setup : function() {
		isoSignatureRep = new SignatureRepresentation();
		isoSignatureRep.initializeChannels();
		
		// create iso bytes
		realIsoHeader = new IsoHeader();
		realIsoBody = new IsoBody();
	
	},
	teardown : function() {

	}
});
test("Test header fail", function() {
	//Header without bodyLenght
	try{
		realBufferHeader = realIsoHeader.toBytes();
	}catch (error){
		equal(error.message, "Unexpected body length", "Throw Error in Header without bodyLenght");
	}
	//Header with wrong format ID
	var buffer = realIsoHeader.toBytes(realBufferBody.byteLength);
	var header = new IsoHeader();
	var view = new DataView(buffer, 0, 4);
	view.setUint32(0,0x33444900,false);
	try {
		header.fromBytes(buffer);
	} catch (error){
		equal(error.message, "Unexpected format identifier", "Throw Error in Header with wrong format ID");
	}
	//Header with wrong version ID
	var buffer = realIsoHeader.toBytes(realBufferBody.byteLength);
	var header = new IsoHeader();
	var view = new DataView(buffer, 4, 4);
	view.setUint32(0,0x534900,false);
	try {
		header.fromBytes(buffer);
	} catch (error){
		equal(error.message, "Unexpected version number", "Throw Error in Header with wrong version ID");
	}
	//Header fromByte with null parameter
	var header = new IsoHeader();
	try {
		header.fromBytes();
	} catch (error){
		equal(error.message, "ERROR byteIso is null", "Throw Error in Header fromByte with null parameter");
	}
});

test("Test point value fail", function() {
	// add Point with not valid X (MIN)
	var point = new Point(-400, 600, 0.996474775847872, 9820);
	var channelDescr = isoSignatureRep.channels.get(channel.X);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		//equal(error.message, "The value of "+channel.X+" : -3419"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]")
		equal(error.message, "The value of "+channel.X+" : -3419"+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]","The value of "+channel.X+" : -3419"+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]");
	}
	// add Point with not valid X (MIN second condition)
	var point = new Point(-64400, 600, 0.996474775847872, 9820);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		equal(error.message, "The value of "+channel.X+" : -550427"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]","The value of "+channel.X+" : -550427"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]")
	}
	// add Point with not valid X (MAX)
	var point = new Point(3000, 600, 0.996474775847872, 9820);
	var channelDescr = isoSignatureRep.channels.get(channel.X);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		//equal(error.message, "The value of "+channel.X+" : -3419"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]")
		equal(error.message, "The value of "+channel.X+" : 25641"+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]","The value of "+channel.X+" : 25641"+" is outside range["+channelDescr.attributes.get(channelAttributes.MINIMUM_CHANNEL_VALUE)+";"+channelDescr.attributes.get(channelAttributes.MAXIMUM_CHANNEL_VALUE)+"]");
	}
	// add Point with not valid X (MAX second condition)
	var point = new Point(64400, 600, 0.996474775847872, 9820);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		equal(error.message, "The value of "+channel.X+" : 550427"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]","The value of "+channel.X+" : 550427"+" is outside range["+channel.X.minValue+";"+channel.X.maxValue+"]")
	}
	
	// add Point with not valid F
	var point = new Point(400, 600, 2, 9820);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		equal(error.message, "Force value not valid!","Force value not valid: "+point.pressure);
	}
	// add Point with not valid F
	var point = new Point(400, 600, -2, 9820);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		equal(error.message, "Force value not valid!","Force value not valid: "+point.pressure);
	}
	// add Point with not valid T
	isoSignatureRep.setFirstPointTime(22);
	var point = new Point(400, 600, 1, 112982982982);
	try{
		addIsoPoint(point,isoSignatureRep);
	}catch (error){
		equal(error.message, "Time value too big","Time not valid: "+point.time);
	}
});
test("Test body fail", function() {
	// add first real point
	var point = new Point(400, 600, 0.996474775847872, 9820);
	addIsoPoint(point,isoSignatureRep);
	// add second real point
	point = new Point(560, 1600, 0.776474775847872, 9850);
	addIsoPoint(point,isoSignatureRep);
	
	realIsoBody.representations.push(isoSignatureRep);
	var buffer = isoSignatureRep.toBytes();
	//Body with different tech ID
	var view = new DataView(buffer, 13, 1);
	view.setUint8(0,0x11,false);
	try {
		isoSignatureRep.fromBytes(buffer);
	} catch (error){
		equal(error.message, "Error different device tech id", "Throw Error in Body with different tech ID");
	}
	//Body with different device vendor ID
	var buffer = isoSignatureRep.toBytes();
	var view = new DataView(buffer, 14, 2);
	view.setUint16(0,0x11,false);
	try {
		isoSignatureRep.fromBytes(buffer);
	} catch (error){
		equal(error.message, "Error different device vendor id", "Throw Error in Body with different device vendor id");
	}
	//Body with different device type ID
	var buffer = isoSignatureRep.toBytes();
	var view = new DataView(buffer, 16, 2);
	view.setUint16(0,0x11,false);
	try {
		isoSignatureRep.fromBytes(buffer);
	} catch (error){
		equal(error.message, "Error different device type id", "Throw Error in Body with different device type id");
	}
	//Body with quality block
	var buffer = isoSignatureRep.toBytes();
	var view = new DataView(buffer, 18, 1);
	view.setUint8(0,0x11,false);
	try {
		isoSignatureRep.fromBytes(buffer);
	} catch (error){
		equal(error.message, "There is quality block!", "Throw Error in Body with presence of quality block");
	}
});