var EarthRadius = 6378137;


module.exports.displaceLatLon = displaceLatLon;
module.exports.boundingRectangle = boundingRectangle;
module.exports.distance = distance;

function displaceLatLon(lat, lon, dy, dx){
	
	var dLat = dy / EarthRadius;
	var dLon = dx / (EarthRadius * Math.cos(radians(lat)))

 	var newLat = lat + degrees(dLat);
 	var newLon = lon + degrees(dLon);
 	return {
 		lat: newLat,
 		lon: newLon
 	}
}

function boundingRectangle(lat, lon, radius){
	var topLeft = displaceLatLon(lat,lon,-radius,-radius);
	var bottomRight = displaceLatLon(lat,lon,radius,radius);
	return {
		top: topLeft.lat,
		left: topLeft.lon,
		bottom: bottomRight.lat,
		right: bottomRight.lon
	}
}


function radians(x){
	return x * Math.PI / 180;
}

function degrees(x){
	return (x * 180) / Math.PI
}

function distance(lat1, lon1, lat2, lon2) {
	var dlon = radians(lon2 - lon1);
	var dlat = radians(lat2 - lat1);

	var a = (Math.sin(dlat / 2) * Math.sin(dlat / 2)) + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * (Math.sin(dlon / 2) * Math.sin(dlon / 2));
	var angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return angle * EarthRadius;
}