/**
 * 
 */

function IsoHeader() {
	this.buffer = new ArrayBuffer(15);
	//formatId
	this.viewFormatId = new DataView(this.buffer,0,4);
	//versionId
	this.viewVersionId = new DataView(this.buffer,4,4);
	//length
	this.viewRecordLength = new DataView(this.buffer,8,4);
	//num representations
	this.viewNumRepresentations = new DataView(this.buffer,12,2);
	//certification flag
	this.viewCertificationFlag = new DataView(this.buffer,14,1);
};

IsoHeader.prototype.initialize = function (){
	this.viewFormatId.setUint32(0,0x53444900,false);
	this.viewVersionId.setUint32(0,0x30323000,false);
	this.viewNumRepresentations.setUint16(0,1,false);
	this.viewCertificationFlag.setUint8(0,0,false);
}

IsoHeader.prototype.fromBytes = function(bytesIso, headerLength) {
	if (bytesIso == null) {
		throw new Error("byteIso is null");
	}
	var lengthIdent = formatIdentifier.length;
	var lengthVersion = versionNumber.length;
	
	if (bytesIso.length < (lengthIdent + lengthVersion)) {
		throw new Error(
		"Invalid length for iso header. Must be at least equal to format identifier more version number");
	}
	
	for (var i = 0; i < lengthIdent; i++) {
		if (formatIdentifier[i] != bytesIso[i]) {
			throw new Error("Unexpected format identifier");
		}
	}
	
	for (var j = 0; j < lengthVersion; j++) {
		if (versionNumber[j] != bytesIso[j + lengthIdent]) {
			throw new Error("Unexpected version number");
		}
	}

	var length = lengthIdent + lengthVersion;
	var channelsInclusion = (bytesIso[length] << 8) & 0xFF00 | (bytesIso[length + 1] & 0xFF);
	length += 2;
	var isoHeader = new IsoHeader();
	for (var k = 15; k >= 0; k--) {
		if ((channelsInclusion & (1 << k)) != 0) {
			var channelLength = 0;
			var channel = Channel.fromInteger(k);
			var description = ChannelDescription.FromBytes(channel, bytesIso, length, channelLength);
			length += description.length;
			isoHeader.channels.push(description);
		}
	}
	isoHeader.reserved[0] = bytesIso[length];
	length++;
	isoHeader.length = length;
	return isoHeader;
};

IsoHeader.prototype.toBytes = function(isoBodyLength) {
	this.initialize();
	this.viewRecordLength.setUint32(0,isoBodyLength+15,false);
    return this.buffer;
};