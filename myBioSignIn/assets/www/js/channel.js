/**
 * 
 */
var value = new enums.Enum({
	SHORT : {
		min : -32768,
		max : 32767,
	}
})

var channel = new enums.Enum({
	R : {
		descr : "Rotation",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	E : {
		descr : "Elevation",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	A : {
		descr : "Azimuth",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	TY : {
		descr : "TiltY",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	TX : {
		descr : "TiltX",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	S : {
		descr : "Tip Switch",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	F : {
		descr : "Pressure",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	DT : {
		descr : "Delta Time",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	T : {
		descr : "Time",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	AY : {
		descr : "AccelerationY",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	AX : {
		descr : "AccelerationX",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	VY : {
		descr : "VelocityY",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	VX : {
		descr : "VelocityX",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	Z : {
		descr : "CoordinateZ",
		minValue : 0,
		maxValue : (value.SHORT.max - value.SHORT.min),
	},
	Y : {
		descr : "CoordinateY",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
	X : {
		descr : "CoordinateX",
		minValue : value.SHORT.min,
		maxValue : value.SHORT.max,
	},
})

var channelAttributes = new enums.Enum("RESERVED_FUTURE_USE",
		"LINEAR_COMPONENT_REMOVED", "CONSTANT", "STANDARD_DEVIATION",
		"MEAN_CHANNEL_VALUE", "MAXIMUM_CHANNEL_VALUE", "MINIMUM_CHANNEL_VALUE",
		"SCALING_VALUE");
var Channel = {
	fromInteger : function(x) {
	switch (x) {
	case 0:
		return channel.R;
	case 1:
		return channel.E;
	case 2:
		return channel.A;
	case 3:
		return channel.TY;
	case 4:
		return channel.TX;
	case 5:
		return channel.S;
	case 6:
		return channel.F;
	case 7:
		return channel.DT;
	case 8:
		return channel.T;
	case 9:
		return channel.AY;
	case 10:
		return channel.AX;
	case 11:
		return channel.VY;
	case 12:
		return channel.VX;
	case 13:
		return channel.Z;
	case 14:
		return channel.Y;
	case 15:
		return channel.X;
	}
	return null;
	}
}


var ChannelAttributes = {
	fromValues : function(x) {
		switch (x) {
		case 0:
			return channelAttributes.RESERVED_FUTURE_USE;
		case 1:
			return channelAttributes.LINEAR_COMPONENT_REMOVED;
		case 2:
			return channelAttributes.CONSTANT;
		case 3:
			return channelAttributes.STANDARD_DEVIATION;
		case 4:
			return channelAttributes.MEAN_CHANNEL_VALUE;
		case 5:
			return channelAttributes.MAXIMUM_CHANNEL_VALUE;
		case 6:
			return channelAttributes.MINIMUN_CHANNEL_VALUE;
		case 7:
			return channelAttributes.SCALING_VALUE;

		}
		return null;
	}
}


function ChannelDescription(channel) {
	this.channel = channel;
	this.attributes = new Hashtable();
	return this;
}

// TODO sistemare operatori logici
ChannelDescription.prototype.fromBytes = function(channel, bytesIso, offset,
		channelLength) {
	if (bytesIso == null) {
		throw new Error("byteIso is null");
	}
	var attributesInclusion = bytesIso[offset];
	var length = 1;
	var attributes = {};
	for (var i = 7; i >= 0; i--) {
		if ((attributesInclusion & (1 << i)) == 0) {
			continue;
		}
		var attribute = ChannelAttributes.fromValues(i);
		var valueFromBytes = (bytesIso[offset + length] << 8) & 0xFF00
				| (bytesIso[offset + length + 1] & 0xFF);
		var realValue = 0.0;
		switch (attribute) {
		case channelAttributes.RESERVED_FUTURE_USE:
		case channelAttributes.LINEAR_COMPONENT_REMOVED:
			break;
		case channelAttributes.CONSTANT:
		case channelAttributes.STANDARD_DEVIATION:
			realValue = valueFromBytes;
			continue;
		case channelAttributes.MEAN_CHANNEL_VALUE:
		case channelAttributes.MAXIMUM_CHANNEL_VALUE:
		case channelAttributes.MINIMUM_CHANNEL_VALUE:
			realValue = valueFromBytes + channel.getMinValue();
			break;
		case channelAttributes.SCALING_VALUE: {
			var exponent = ((0xf800 & valueFromBytes) >> 11) - 0x10;
			var fractionField = 0x7ff & valueFromBytes;
			var mantissa = 1.0 + (fractionField / Math.pow(2.0, 11.0));
			realValue = mantissa * Math.pow(2.0, exponent);
			break;
		}
		default:
			throw new Error("not handle attribute exception");
		}
		length += 2;
		attributes[attribute.name] = realValue;
	}
	return new ChannelDescription(channel, length, attributes);
}


ChannelDescription.prototype.toBytes = function() {
	
	var buffer = new ArrayBuffer(1 + (2*this.attributes.keys().length));
	var viewPreamble = new DataView(buffer,0,1);
	
	var attributesPreamble = new Uint8Array(1);
	for (var i = 7; i >= 0; i--) {
		var attribute = ChannelAttributes.fromValues(i);
		if(this.attributes.containsKey(attribute)){
			attributesPreamble[0] = attributesPreamble[0] | (1 << i);
		}
	}
	viewPreamble.setUint8(0,attributesPreamble[0],false);
	
	var arrayKeys = this.attributes.keys();
	var arrayLength = arrayKeys.length;
	var value = new Uint16Array(1);
	var cont = 1;
	
	for (var j =0 ; j < arrayLength; j++){
		switch (arrayKeys[j]) {
		case channelAttributes.RESERVED_FUTURE_USE:
		case channelAttributes.LINEAR_COMPONENT_REMOVED:
			break;

		case channelAttributes.CONSTANT:
		case channelAttributes.STANDARD_DEVIATION:
			value[0] = this.attributes.get(key);
			break;
		case MAXIMUM_CHANNEL_VALUE:
		case MINIMUM_CHANNEL_VALUE:
		case MEAN_CHANNEL_VALUE:
			value[0] = this.attributes.get(key) - this.channel.minValue; 
			break;
		case SCALING_VALUE: {
			//TODO da controllare 
			var mantissa = Math.floor(Math.log(this.attributes.get(key)) / Math.log(2.0));
			var fractorField =  (((this.attributes.get(key) / Math.pow(2.0,  mantissa)) - 1.0) * 2048.0);
			value[0] = (mantissa + 0x10) << 11;
			value[0] += fractorField & 0x7ff;
			break;
		}
		default:
			throw new Error(key.name+" not managed");
		}
		
		var viewAttributesValue = new DataView(buffer,cont,2); 
		viewAttributesValue.setUint16(0,value[0],false);
		cont = cont +2;
	  }
	return buffer;
}
