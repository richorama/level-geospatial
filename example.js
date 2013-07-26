var db = require("level")("testdb");
var geo = require("./lib/level-geospatial")(db);

function seed(){
	for (var i = 0; i < 10000; i++){
		geo.put({
			lat:(Math.random() * 160) - 80,
			lon:(Math.random() * 360) - 180
		}, i, i, function(err){
			if (err) console.log(err);
		})		
	}
}

// uncomment this to seed the database
//seed();

// uncomment this to search the database
//geo.search({lat:-31,lon:-78},500000).on("data",console.log);

