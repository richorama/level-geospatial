var ts = require("./tile-system");
var cu = require("./coordinate-utils");
var assert = require("assert");
var stream = require('stream')
var Readable = stream.Readable;

var MaxDetailLevel = 22;

module.exports = function(db){

  function idToKey(id, callback){
    const key = "keys~" + id;
    return db.get(key);
  }

  /* SLOW */
  function put(position, id, value, callback){
    var newKey = encodeLevelKey(position, id);
    // look up old key
    return idToKey(id)
    .catch(ignoreNotFoundErrors)
    .then(oldKey => {
      var batch = [];

      // add the main update to the batch
      batch.push({type:"put", key:"geos~" + newKey, value:value});
      if (oldKey){
        // remove the old key
        batch.push({type:"del", key:"geos~" + oldKey});
      }
      // update the pointer
      batch.push({type:"put", key:"keys~" + id, value:newKey});
      return db.batch(batch)
      .then(passResToCallbackOrReturn.bind(null, callback))
      .catch(passErrToCallbackOrRethrow(callback));
    });
  }

  /* SLOW */
  function getById(id, callback){
    return idToKey(id)
    .then(key => {
      const geoKey = "geos~" + key;
      return db.get(geoKey)
      .then(data => {
        var output = decodeLevelKey(geoKey);
        output.value = data;
        return passResToCallbackOrReturn(callback, output);
      })
    })
    .catch(passErrToCallbackOrRethrow(callback));
  }

  function get(position, id, callback){
    const key = encodeLevelKey(position, id);
    const geoKey = "geos~" + key;
    return db.get(geoKey)
    .then(data => {
      var output = decodeLevelKey(geoKey);
      output.value = data;
      return passResToCallbackOrReturn(callback, output);
    })
    .catch(passErrToCallbackOrRethrow(callback));
  }

  /* SLOW */
  function del(id, callback){
    return idToKey(id)
    .then(oldKey => {
      if (oldKey){
        var batch = [];
        batch.push({type:"del", key:"keys~" + id});
        batch.push({type:"del", key:"geos~" + oldKey});
        return db.batch(batch)
        .then(passResToCallbackOrReturn.bind(null, callback));
      } else {
        return passResToCallbackOrReturn(callback);
      }
    })
    .catch(passErrToCallbackOrRethrow(callback));
  }


  function search(position, radius){
    var stream = new Readable({objectMode : true});
    var quadKeys = getSearchRange(position,radius);
    var openStreams = 0;
    //var total = 0;
    //var hits = 0;

    quadKeys.forEach(function(quadKey){

      //console.log("http://ak.dynamic.t1.tiles.virtualearth.net/comp/ch/" + quadKey + "?mkt=en-gb&it=G,VE,BX,L,LA&shading=hill&og=18&n=z");

      var options = {}
      options.start = "geos~" + quadKey;
      options.end =  "geos~" + quadKey + "~";
      openStreams++;

      db.createReadStream(options)
        .on('data', function (data) {
          //total++;
        //console.log(data);

          var key = decodeLevelKey(data.key);

          var d = cu.distance(parseFloat(position.lat),parseFloat(position.lon),key.position.lat,key.position.lon);

          if (d <= radius){
            //hits++;
            key.distance = d;
            key.value = data.value;
            stream.push(key);
          }

        })
        .on('end', function () {
          openStreams--;
          if (openStreams == 0) {
            stream.push(null);
            //console.log("stats:" + hits + "/" + total);
          }
        });
      stream._read = function(){};

    });

    return stream;
  }


  function searchKey(position,depth){
    var pixelCoords = ts.latLonToPixelXY(position.lat,position.lon,depth);
    var tileCoords = ts.pixelXYToTileXY(pixelCoords.pixelX,pixelCoords.pixelY);
    return ts.tileXYToQuadKey(tileCoords.tileX,tileCoords.tileY,depth);
  }

  function latLonToQuadKey(position, level){
    var pixelCoords = ts.latLonToPixelXY(position.lat,position.lon,level);
    var tileCoords = ts.pixelXYToTileXY(pixelCoords.pixelX,pixelCoords.pixelY);
    return ts.tileXYToQuadKey(tileCoords.tileX,tileCoords.tileY,level);
  }

  function encodeLevelKey(position, id){
    id = String(id).replace("~","");
    return latLonToQuadKey(position, MaxDetailLevel) + "~" + String(position.lat) + "~" + String(position.lon) + "~" + id;
  }

  function decodeLevelKey(key){
    var parts = key.split("~");
    return {
      quadKey: parts[1],
      position: {
        lat: parseFloat(parts[2]),
        lon: parseFloat(parts[3])},
      id: parts[4]
    }
  }

  function getSearchRange(position, radius){
    var box = cu.boundingRectangle(position.lat, position.lon, radius);
    var topLeft = ts.latLonToPixelXY(box.top,box.left,MaxDetailLevel);
    var bottomRight = ts.latLonToPixelXY(box.bottom,box.right,MaxDetailLevel);
    var numberOfTilesAtMaxDepth = Math.floor((bottomRight.pixelX - topLeft.pixelX) / 256);
    var zoomLevelsToRise = Math.floor(Math.log(numberOfTilesAtMaxDepth) / Math.log(2));
    zoomLevelsToRise++;

    var quadDictionary = {};
    quadDictionary[latLonToQuadKey({lat:box.top, lon:box.left},Math.max(0,MaxDetailLevel - zoomLevelsToRise))] = true;
    quadDictionary[latLonToQuadKey({lat:box.top, lon:box.right},Math.max(0,MaxDetailLevel - zoomLevelsToRise))] = true;
    quadDictionary[latLonToQuadKey({lat:box.bottom, lon:box.left},Math.max(0,MaxDetailLevel - zoomLevelsToRise))] = true;
    quadDictionary[latLonToQuadKey({lat:box.bottom, lon:box.right},Math.max(0,MaxDetailLevel - zoomLevelsToRise))] = true;

    var quadList = [];
    for (x in quadDictionary){
      quadList.push(x);
    }

    return quadList;
  }


  return {
    put:put,
    search:search,
    getByKey:getById,
    get:get,
    del:del
  };
}

const passResToCallbackOrReturn = (callback, res) => {
  if (callback){
    callback(null,res);
  } else {
    return res;
  };
};

const passErrToCallbackOrRethrow = callback => err => {
  if (callback){
    callback(err);
  } else {
    throw err;
  };
};

const ignoreNotFoundErrors = err => {
  if (err.name === 'NotFoundError') {
    return;
  } else {
    throw err;
  }
};
