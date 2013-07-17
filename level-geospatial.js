var assert = require("assert");
var stream = require('stream')
var Readable = stream.Readable;
var level = require("level");


module.exports = function(db){

	this.put = function(lat,lon,value, cb){
		var key = encodeGeo(lat,lon);
		db.put(key, value, cb);
	}

	this.get = function(lat,lon,cb){
		var key = encodeGeo(lat,lon);
		db.get(key,cb);
	}

	this.search = function(lat, lon, radius){
		var stream = new Readable({objectMode : true});
		var options = {}

		options.start = numTostr(lon - radius,180)
		options.end =  numTostr(lon + radius,180)
		var maxLat = numToStr(lat + radius,90);
		var minLat = numToStr(lat - radius,90);

		db.createReadStream(options)
		  .on('data', function (data) {
		  	var keyParts = decodeKey(data.key);
		  	if (keyParts.length != 2) return;
		  	if (minLat >= keyParts[0] >= maxLat){
		  		stream.push(data.value);	
		  	}

		  })
		  .on('end', function () {
		    stream.push(null);
		  });
		stream._read = function(){};

		return stream;
	}



	function decodeKey(key){
		return key.split("~");
	}

	function encodeGeo(lat,lon){
		return numToStr(lon, 180) + "~" + numToStr(lat,90);
	}

	function numToStr(value, range){
		if (typeof(value) != "number") throw("NaN");
		if (!(-range <= value <= range)) throw("value out of range");

		var str = String(value + range)
		var pointIndex = str.indexOf(".");
		if (pointIndex == -1){
			str = zeroPad(str,3) + "."
		} else {
			str = zeroPad(str.split(".")[0],3) + "." + str.split(".")[1];
		}
		return (str + "000000").substr(0,10);
	}

	function zeroPad(num, places) {
	  var zero = places - num.length + 1;
	  return Array(+(zero > 0 && zero)).join("0") + num;
	}

	assert(numToStr(0,180) == "180.000000");
	assert(numToStr(-180,180) == "000.000000");
	assert(numToStr(-175,180) == "005.000000");
	assert(numToStr(-170,180) == "010.000000");
	assert(numToStr(0.101,180) == "180.101000");
	assert(numToStr(-175.5,180) == "004.500000");

	return { get:this.get, put:this.put, search:this.search };
}




