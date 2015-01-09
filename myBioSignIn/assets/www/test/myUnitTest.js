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
	equal(view.getUint32(0), 1, "The full format record length is: 1");
	var view = new DataView(bufferHeader, 12, 2);
	equal(view.getUint16(0), 1,
	"The full format number of representation is: 1");
	var view = new DataView(bufferHeader, 14, 1);
	equal(view.getUint8(0), 0, "The full format certification flag is: 0");
});

var isoSignRep, bufferSign,bufferPoint, 
	bufferDescrX,bufferDescrT, 
	channelDescrX, channelDescrY, channelDescrF;

module("TEST SIGNATURE", {
	setup : function() {
		isoSignRep = new SignatureRepresentation();
		// create a isoPoint
		var isoPoint = new IsoPoint();
		isoPoint.properties.put(channel.X, 1200);
		isoPoint.properties.put(channel.Y, 2100);
		isoPoint.properties.put(channel.F, 1);
		isoPoint.properties.put(channel.T, 12);
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
	var view = new DataView(bufferDescrX,0,1);
	equal(Number(view.getUint8(0)).toString(2), 1100000,
	"The preamble field for channel.X is : 01100000");
	var view = new DataView(bufferSign, 37, 1); 
	equal(view.getUint8(0),0,"The first byte for number of sample points is : 0");
	var view = new DataView(bufferSign, 38, 2); 
	equal(view.getUint16(0),1,"The number of sample points is : 1");
	var view = new DataView(bufferPoint, 0, 2); 
	equal(view.getUint16(0),1200 - channelValue.SHORT.min,"The channel.X value is: 33968");
	var view = new DataView(bufferPoint, 2, 2);
	equal(view.getUint16(0),2100 - channelValue.SHORT.min,"The channel.Y value is: 34868");
	var view = new DataView(bufferPoint, 4, 2);
	equal(view.getUint16(0),12,"The channel.T value is: 12");
	var view = new DataView(bufferPoint, 6, 2);
	equal(view.getUint16(0),1,"The channel.F value is: 1");
});
