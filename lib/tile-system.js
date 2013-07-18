var EarthRadius = 6378137;
var MinLatitude = -85.05112878;
var MaxLatitude = 85.05112878;
var MinLongitude = -180;
var MaxLongitude = 180;


/// <summary>
/// clips a number to the specified minimum and maximum values.
/// </summary>
/// <param name="n">The number to clip.</param>
/// <param name="minValue">Minimum allowable value.</param>
/// <param name="maxValue">Maximum allowable value.</param>
/// <returns>The clipped value.</returns>
function clip(n, minValue, maxValue) {
    return Math.min(Math.max(n, minValue), maxValue);
}



/// <summary>
/// Determines the map width and height (in pixels) at a specified level
/// of detail.
/// </summary>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <returns>The map width and height in pixels.</returns>
function MapSize(levelOfDetail){
    return Math.floor(256 << levelOfDetail);
}
module.exports.mapSize = MapSize;


/// <summary>
/// Determines the ground resolution (in meters per pixel) at a specified
/// latitude and level of detail.
/// </summary>
/// <param name="latitude">Latitude (in degrees) at which to measure the
/// ground resolution.</param>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <returns>The ground resolution, in meters per pixel.</returns>
function GroundResolution(latitude, levelOfDetail){
    laitude = clip(latitude, MinLatitude, MaxLatitude);
    return Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * EarthRadius / MapSize(levelOfDetail);
}

module.exports.groundResolution = GroundResolution;

/// <summary>
/// Determines the map scale at a specified latitude, level of detail,
/// and screen resolution.
/// </summary>
/// <param name="latitude">Latitude (in degrees) at which to measure the
/// map scale.</param>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <param name="screenDpi">Resolution of the screen, in dots per inch.</param>
/// <returns>The map scale, expressed as the denominator N of the ratio 1 : N.</returns>
module.exports.mapScale = function(latitude, levelOfDetail, screenDpi){
    return GroundResolution(latitude, levelOfDetail) * screenDpi / 0.0254;
}



/// <summary>
/// Converts a point from latitude/longitude WGS-84 coordinates (in degrees)
/// into pixel XY coordinates at a specified level of detail.
/// </summary>
/// <param name="latitude">Latitude of the point, in degrees.</param>
/// <param name="longitude">Longitude of the point, in degrees.</param>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <param name="pixelX">Output parameter receiving the X coordinate in pixels.</param>
/// <param name="pixelY">Output parameter receiving the Y coordinate in pixels.</param>
module.exports.latLonToPixelXY = function(latitude, longitude, levelOfDetail){
    latitude = clip(latitude, MinLatitude, MaxLatitude);
    longitude = clip(longitude, MinLongitude, MaxLongitude);

    var x = (longitude + 180) / 360; 
    var sinLatitude = Math.sin(latitude * Math.PI / 180);
    var y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);

    var mapSize = MapSize(levelOfDetail);
    var pixelX = Math.floor(clip(x * mapSize + 0.5, 0, mapSize - 1));
    var pixelY = Math.floor(clip(y * mapSize + 0.5, 0, mapSize - 1));
    return {pixelX:pixelX,pixelY:pixelY};
}



/// <summary>
/// Converts a pixel from pixel XY coordinates at a specified level of detail
/// into latitude/longitude WGS-84 coordinates (in degrees).
/// </summary>
/// <param name="pixelX">X coordinate of the point, in pixels.</param>
/// <param name="pixelY">Y coordinates of the point, in pixels.</param>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <param name="latitude">Output parameter receiving the latitude in degrees.</param>
/// <param name="longitude">Output parameter receiving the longitude in degrees.</param>
module.exports.pixelXYToLatLon = function(pixelX, pixelY, levelOfDetail){
    var mapSize = MapSize(levelOfDetail);
    var x = (clip(pixelX, 0, mapSize - 1) / mapSize) - 0.5;
    var y = 0.5 - (clip(pixelY, 0, mapSize - 1) / mapSize);

    var latitude = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;
    var longitude = 360 * x;
    return {latitude:latitude,longitude:longitude};
}



/// <summary>
/// Converts pixel XY coordinates into tile XY coordinates of the tile containing
/// the specified pixel.
/// </summary>
/// <param name="pixelX">Pixel X coordinate.</param>
/// <param name="pixelY">Pixel Y coordinate.</param>
/// <param name="tileX">Output parameter receiving the tile X coordinate.</param>
/// <param name="tileY">Output parameter receiving the tile Y coordinate.</param>
module.exports.pixelXYToTileXY = function(pixelX, pixelY){
    var tileX = Math.floor(pixelX / 256);
    var tileY = Math.floor(pixelY / 256);
    return {tileX:tileX,tileY:tileY};
}



/// <summary>
/// Converts tile XY coordinates into pixel XY coordinates of the upper-left pixel
/// of the specified tile.
/// </summary>
/// <param name="tileX">Tile X coordinate.</param>
/// <param name="tileY">Tile Y coordinate.</param>
/// <param name="pixelX">Output parameter receiving the pixel X coordinate.</param>
/// <param name="pixelY">Output parameter receiving the pixel Y coordinate.</param>
module.exports.tileXYToPixelXY = function(tileX, tileY){
    var pixelX = tileX * 256;
    var pixelY = tileY * 256;
    return {pixelX:pixelX,pixelY:pixelY};
}



/// <summary>
/// Converts tile XY coordinates into a QuadKey at a specified level of detail.
/// </summary>
/// <param name="tileX">Tile X coordinate.</param>
/// <param name="tileY">Tile Y coordinate.</param>
/// <param name="levelOfDetail">Level of detail, from 1 (lowest detail)
/// to 23 (highest detail).</param>
/// <returns>A string containing the QuadKey.</returns>
module.exports.tileXYToQuadKey = function(tileX, tileY, levelOfDetail) {
    var quadKey = "";
    for (var i = levelOfDetail; i > 0; i--)
    {
        var digit = '0';
        var mask = 1 << (i - 1);
        if ((tileX & mask) != 0) {
            digit++;
        }
        if ((tileY & mask) != 0) {
            digit++;
            digit++;
        }
        quadKey += digit;
    }
    return quadKey;
}



/// <summary>
/// Converts a QuadKey into tile XY coordinates.
/// </summary>
/// <param name="quadKey">QuadKey of the tile.</param>
/// <param name="tileX">Output parameter receiving the tile X coordinate.</param>
/// <param name="tileY">Output parameter receiving the tile Y coordinate.</param>
/// <param name="levelOfDetail">Output parameter receiving the level of detail.</param>
module.exports.quadKeyToTileXY = function(quadKey)
{
    var tileX = 0;
    var tileY = 0;
    var levelOfDetail = quadKey.Length;
    for (var i = levelOfDetail; i > 0; i--)
    {
        var mask = 1 << (i - 1);
        switch (quadKey[levelOfDetail - i])
        {
            case '0':
                break;

            case '1':
                tileX |= mask;
                break;

            case '2':
                tileY |= mask;
                break;

            case '3':
                tileX |= mask;
                tileY |= mask;
                break;

            default:
                throw Error("Invalid QuadKey digit sequence.");
        }
    }
}


