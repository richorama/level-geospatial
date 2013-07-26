# level-geospatial

Uses a [quadtree](http://en.wikipedia.org/wiki/Quadtree) to index latitude and longitude coordinates in a [leveldb](https://npmjs.org/package/level) database.

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
geo.put({lat:52.081959, lon:1.415904}, 'Location1', 'My value', function(err){
	if (err) console.log(err);
});
```

You can retrieve a value back like this:
```js
// this is the fast way of getting the value
geo.get({lat:52.081959, lon:1.415904}, 'Location1',function(err,data){
	console.log(data);
});

// this is the slower/convenient way of getting the value
geo.getByKey('Location1', function(err,data){
	console.log(data);
});

// the data returned looks like this:
{ quadKey: '1222222212112112222210',
  position: {
    lat: 52.081959,    
    lon: 1.415904 },
  id: 'Location1',
  value: 'My value' }
```

You can search within a radius (in meters) of a given point:
```js
// lat, lon, radius in meters
geo.search({lat:52.081959, lon:1.415904}, 15000).on('data', function(data){
	console.log(data)
});

// the data returned looks like this:
{ quadKey: '1222222212112112222210',
  position: {
    lat: 52.081959,    
    lon: 1.415904 },
  id: 'Location1',
  value: 'My value'
  distance: 1232.232323 }  // this is the distance in meters from your search
```

Please note, the results are not returned in any meaningful order.

You can update/delete like this:

```js
// to update the value/location:
geo.put({lat:53.1, lon:2.2}, "Location1", "NEW VALUE", function(err){
	if (err) console.log(err);
});

// to delete
geo.del("Location1", function(err){
	if (err) console.log(err);
});
```

# How does it work?

The data is indexed using a [quadtree](http://en.wikipedia.org/wiki/Quadtree). When you index a point, it's quadkey is calculated to a depth of 22. 

The quadkey is a string which stores where the point lives in the quadtree. The [quadkey notation](http://msdn.microsoft.com/en-us/library/bb259689.aspx) used is the same as Bing Maps. The quadkeys can be inserted into this URL to retrieve a map tile for a given location:

```
http://ak.dynamic.t1.tiles.virtualearth.net/comp/ch/{QUADKEY}?mkt=en-gb&it=G,VE,BX,L,LA&shading=hill&og=18&n=z
```

When you search the database, the quadkey is calculated for search location. The radius is then used to calculate an appropriate depth in the quadtree to search to. 

Potential matches within those quads are then tested using a simple distance calculation to work out if they are close enough to be included in the results.

# TODO

Currently searches that span the international date line will not return all results.
Batch operations are not supported.

# License

MIT
