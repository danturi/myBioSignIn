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
// Initialize header with constant value
IsoHeader.prototype.initialize = function (){
	this.viewFormatId.setUint32(0,0x53444900,false);
	this.viewVersionId.setUint32(0,0x30323000,false);
	this.viewNumRepresentations.setUint16(0,1,false);
	this.viewCertificationFlag.setUint8(0,0,false);
}

IsoHeader.prototype.fromBytes = function(bytesIso) {
	if (!bytesIso) {
		throw new Error("ERROR byteIso is null");
	}
	var isoHeader = this;
	var bytesFormatId = new DataView(bytesIso,0,4); 
	if (!(bytesFormatId.getUint32(0) == 0x53444900)){
		throw new Error("Unexpected format identifier");
	}
	isoHeader.viewFormatId.setUint32(0,bytesFormatId.getUint32(0),false);
	
	var bytesVersionId = new DataView(bytesIso,4,4); 
	if (!(bytesVersionId.getUint32(0) == 0x30323000)){
		throw new Error("Unexpected version number");
	}
	isoHeader.viewVersionId.setUint32(0,bytesVersionId.getUint32(0),false);

	var bytesRecordLength = new DataView(bytesIso,8,4);
	isoHeader.viewRecordLength.setUint32(0,bytesRecordLength.getUint32(0),false);
	
	var bytesNumRep = new DataView(bytesIso,12,2);
	isoHeader.viewNumRepresentations.setUint16(0,bytesNumRep.getUint16(0),false);
	
	var bytesCertifFlag = new DataView(bytesIso,14,1);
	isoHeader.viewCertificationFlag.setUint8(0,bytesCertifFlag.getUint8(0),false);
	
	return isoHeader;
};
// Create isoHeader buffer, set total record length
IsoHeader.prototype.toBytes = function(isoBodyLength) {
	this.initialize();
	if(isoBodyLength){
		this.viewRecordLength.setUint32(0,isoBodyLength+15,false);
	}else {
		throw new Error("Unexpected body length");
	}
    return this.buffer;
};