/**
 * 
 */

function IsoBody() {
	this.representations = [];
	return this;
};

function SignatureRepresentation() {
	this.channels = new Hashtable();  //Channel and ChannelDescription
	this.points = [];
	this.extendedData = false;
	var firstPointTime = 0;
	this.getFirstPointTime = function() {
		return firstPointTime;
	}
	this.setFirstPointTime = function(time) {
		firstPointTime = time;
	}
	this.DateTimeCapture=new Date();
	this.length=0;
	return this;
};
// Create binary data for signature Representation
SignatureRepresentation.prototype.toBytes = function() {
	
	//SIGNATURE HEADER
	var bufferHeader = new ArrayBuffer(21);

	var viewDateTime = new DataView(bufferHeader,4,9);
	//TODO function date/time ISO
	
	// Electromagnetic capture device technology identifier
	var viewTechId = new DataView(bufferHeader,13,1);
	viewTechId.setUint8(0,0x01,false);

	
	var viewVendorId = new DataView(bufferHeader,14,2);
	//Unknown
	viewVendorId.setUint16(0,0,false);
	
	var viewTypeId = new DataView(bufferHeader,16,2);
	//Unknown
	viewTypeId.setUint16(0,0,false);
	
	// 0 quality block
	var viewNumQualityBlocks = new DataView(bufferHeader,18,1);
	viewNumQualityBlocks.setUint8(0,0,false);
	
	
	//Channel Description 
	var viewChannelInclusion = new DataView(bufferHeader,19,2);
	var channelInclusionField = new Uint16Array(1);
	channelInclusionField[0]=0;
	for (var i = 15; i >= 0; i--){
		if (this.channels.containsKey(Channel.fromInteger(i))){
			channelInclusionField[0] = channelInclusionField[0] | (1 << i);
		}
	}
	viewChannelInclusion.setUint16(0,channelInclusionField[0],false);
	
	var tmpBufferChannel = bufferHeader.slice(0);
	for (var j = 15; j >= 0; j--){
		if (this.channels.containsKey(Channel.fromInteger(j))){
			var channelDescription = this.channels.get(Channel.fromInteger(j));
			var bufferChannelDescr = channelDescription.toBytes();
			tmpBufferChannel = _appendBuffer(tmpBufferChannel, bufferChannelDescr);
		}
	}
	bufferHeader = tmpBufferChannel.slice(0);
	
	// Number of sample points (max 3 bytes)
	var bufferNumPoints = new ArrayBuffer(4);
	var viewNumSamplePoints = new DataView(bufferNumPoints,0,4);
	if(this.points.length <= Math.pow(2, 24) ){
		viewNumSamplePoints.setUint32(0,this.points.length,false);
	} else {
		throw new Error("Number of sample points exception!")
	}
	bufferNumPoints = bufferNumPoints.slice(1); //take only 3 of 4 bytes
	bufferHeader=_appendBuffer(bufferHeader, bufferNumPoints);
	
	//SIGNATURE BODY
	var numPoints = this.points.length;
	var bufferPoints = this.points[0].toBytes();
	for (var z=1 ; z < numPoints;z++){
		var tmpBuffPoints = this.points[z].toBytes();
		bufferPoints = _appendBuffer(bufferPoints, tmpBuffPoints);
	}
	
	var bufferExtendedData = new ArrayBuffer(2);
	var viewExtendedDataLength = new DataView(bufferExtendedData,0,2);
	//no data length
	viewExtendedDataLength.setUint16(0,0,false);
	
	
	//union of all buffers
	var buffer = bufferHeader;
	buffer = _appendBuffer(buffer, bufferPoints);
	buffer = _appendBuffer(buffer, bufferExtendedData);
	
	//set signature representation length
	var viewLengthRep = new DataView(buffer,0,4);
	viewLengthRep.setUint32(0,buffer.byteLength,false);
	this.length = buffer.byteLength;
	return buffer;
};

SignatureRepresentation.prototype.fromBytes = function(bytesIso) {
	var bytesIso = bytesIso;
	
	var view = new DataView(bytesIso,0,4);
	this.length = view.getUint32(0);
	
	view = new DataView(bytesIso,4,9);
	//TODO Date ISO
	
	view = new DataView(bytesIso,13,1);
	if(!view.getUint8(0) == 0x01){
		throw Error("Error different device tech id");
	}
	
	view = new DataView(bytesIso,14,2);
	if(!view.getUint16(0) == 0){
		throw Error("Error different device vendor id");
	}
	
	view = new DataView(bytesIso,16,2);
	if(!view.getUint16(0) == 0){
		throw Error("Error different device type id");
	}
	
	view = new DataView(bytesIso,18,1);
	if(!view.getUint8(0) == 0){
		throw Error("There is quality block!");
	}
	
	//Get ChannelDescriptions
	view = new DataView(bytesIso,19,2);
	var channelsInclusion = new Uint16Array(1);
	channelsInclusion[0] = view.getUint16(0);
	var length = 21;
	for (var k = 15; k >= 0; k--) {
		if ((channelsInclusion[0] & (1 << k)) != 0) {
			var channel = Channel.fromInteger(k);
			var description = new ChannelDescription(channel);
			bytesIso = bytesIso.slice(length);
			description = description.fromBytes(bytesIso);
			length = description.length;
			this.channels.put(channel,description);
		}
	}
	bytesIso = bytesIso.slice(length);
	view = new DataView(bytesIso,0,4);
	var numOfPoints = view.getUint32(0) >> 8;
	
	bytesIso = bytesIso.slice(3);
	//Get Points
	for(var i = 0; i< numOfPoints;i++){
		var isoPoint = new IsoPoint();
		isoPoint = isoPoint.fromBytes(bytesIso, this);
		this.points.push(isoPoint);
		bytesIso = bytesIso.slice(this.channels.size()*2);
	}
	
	//Extended Data
	view = new DataView(bytesIso,0,2);
	if( view.getUint16(0) != 0){
		console.log(Number(view.getUint16(0).toString(2)));
		throw new Error("There is extended data!");
	}
	
	return this;
};

SignatureRepresentation.prototype.clear = function() {
	this.channels = new Hashtable();
	this.points = [];
	this.setFirstPointTime(0);
}

SignatureRepresentation.prototype.initializeChannels = function() {
	// create channel descriptions
	var channelDescrX = new ChannelDescription(channel.X);
	channelDescrX.attributes.put(channelAttributes.MAXIMUM_CHANNEL_VALUE,
			Math.round(deviceConstants.maxX/deviceConstants.pixelToMillimeters*scaling.X));
	channelDescrX.attributes.put(channelAttributes.MINIMUM_CHANNEL_VALUE,
			deviceConstants.minX);
	channelDescrX.attributes.put(channelAttributes.SCALING_VALUE,scaling.X);
	var channelDescrY = new ChannelDescription(channel.Y);
	channelDescrY.attributes.put(channelAttributes.MAXIMUM_CHANNEL_VALUE,
			Math.round(deviceConstants.maxY/deviceConstants.pixelToMillimeters*scaling.Y));
	channelDescrY.attributes.put(channelAttributes.MINIMUM_CHANNEL_VALUE,
			deviceConstants.minY);
	channelDescrY.attributes.put(channelAttributes.SCALING_VALUE,scaling.Y);
	var channelDescrF = new ChannelDescription(channel.F);
	channelDescrF.attributes
			.put(channelAttributes.MAXIMUM_CHANNEL_VALUE, deviceConstants.maxF*scaling.F);
	channelDescrF.attributes
			.put(channelAttributes.MINIMUM_CHANNEL_VALUE, deviceConstants.minF*scaling.F);
	channelDescrF.attributes.put(channelAttributes.SCALING_VALUE, scaling.F);
	var channelDescrT = new ChannelDescription(channel.T);
	channelDescrT.attributes.put(channelAttributes.MAXIMUM_CHANNEL_VALUE, 65535);
	channelDescrT.attributes.put(channelAttributes.MINIMUM_CHANNEL_VALUE, 0);
	channelDescrT.attributes.put(channelAttributes.SCALING_VALUE, scaling.T);
	// add channels
	this.channels.put(channel.X, channelDescrX);
	this.channels.put(channel.Y, channelDescrY);
	this.channels.put(channel.F, channelDescrF);
	this.channels.put(channel.T, channelDescrT);
};

var _appendBuffer = function(buffer1, buffer2) {
	  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
	  tmp.set(new Uint8Array(buffer1), 0);
	  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
	  return tmp.buffer;
	};