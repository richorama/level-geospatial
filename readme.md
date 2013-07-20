# level-geospatial

Uses a quad tree to index latitude and longitude coordinates in a leveldb database.

# Project Status

Experimental - subject to change.

# Install

```
$ npm install level-geospatial
```

# How to use

The module takes a leveldb database (or a sub-level):

```js
var db = require('level')('path_to_your_database');
var geo = require('level-geospatial')(db);
```

You can then start adding key/values, along with latitude/longitude values. 

```js
// lat, lon, key, value 
geo.put(52.081959, 1.415904, 'Location1', 'My value', function(err){
	if (err) console.log(err);
});
```

You can retrieve a value back like this:
```js
// this is the fast way of getting the record
geo.get(52.081959, 1.415904, 'Location1',function(err,data){
	console.log(data);
});

// this is the slower/convenient way of getting the record
geo.getByKey('Location1', function(err,data){
	console.log(data);
});

// the data looks like this:
{ quadKey: '1222222212112112222210',
  lat: 52.081959,
  lon: 1.415904,
  id: 'Location1',
  value: 'My value' }
```

You can also search within a radius (in meters) of a given point:
```js
// lat, lon, radius in meters
geo.search(52.081959, 1.415904, 15000).on('data', function(data){
	console.log(data)
});

// the data looks like this:
{ quadKey: '1222222212112112222210',
  lat: 52.081959,
  lon: 1.415904,
  id: 'Location1',
  value: 'My value'
  distance: 1232.232323 }  // this is the distance in meters from your search
```

Please note, the results are not returned in any meaningful order.

# How does it work?

The data is indexed using a quad tree. When you index a point, it's quad key value is calculated to a depth of 22. When you search the database, the quad key is calculated for location, and then the radius is used to calculate an appropriate depth in the quad tree to search. Candidate keys are then tested using a simple distance calculation to work out if they are close enough to be included in the results.

The quad key notation used is the same for Bing Maps. The quad keys can be inserted into this URL, to retrieve a map tile for a given location:

```
http://ak.dynamic.t1.tiles.virtualearth.net/comp/ch/{QUADKEY}?mkt=en-gb&it=G,VE,BX,L,LA&shading=hill&og=18&n=z
```

# TODO

Currently searches that span the international date line will not return all results.

# License

MIT
