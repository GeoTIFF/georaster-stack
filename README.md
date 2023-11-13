# georaster-reader
> Read Stack of GeoSpatial Rasters

### features
- Reprojection and Resampling
- Band Separated Rasters (like Landsat 8)
- Mixed Projections
- Turbo-Charging Reprojection
- Web Workers
- Simple SRS (inspired by [CRS.Simple](https://leafletjs.com/examples/crs-simple/crs-simple.html))

### Known Limitations
- Only works in the Browser

### install
```
npm install georaster-reader
```

### basic usage
```js
import { GeoExtent } from "geo-extent";
import { GeoRasterReader } from "georaster-reader";

import parseGeoRaster from "georaster";

const reader = new GeoRasterReader({
  // multiple sources
  // they can even be in different projections!
  sources: [
     await parseGeoraster("https://example.org/red.tiff"),
     await parseGeoraster("https://example.org/green.tiff")
     await parseGeoraster("https://example.org/blue.tiff")
  ]
});

const result = await reader.read({
  // instance of GeoExtent (https://www.npmjs.com/package/geo-extent)
  // an extent is a bbox with a spatial reference system
  extent: new GeoExtent([-122.49755859375, 38.8520508, -120.06958007812499, 40.697299008636755], { srs: 4326 }),
  size: [width, height]
});

// result is the following object
{
  // multi-dimensional numberical arrays separated by source, then band, then row, then column
  data: [
    [
      [
        [6453, 7692, 12722, 7274, 6302, 6234, 6147, 6276, ...], // first row of first band
        [5997, 9353, 12493, 6389, 10166, 6285, 10634, 7954, ...] // second row of second band
      ],
      [ ... ] // second band
      [ ... ] // third band
    ],
    [ [ [...] ... ] ... ] // second georaster
    [ [ [...] ... ] ... ] // third georaster
  ],
  size: [ result_data_width, result_data_height ]
}
```

### advanced usage
#### optional properties
```js
const reader = new GeoRasterReader({
  sources: [...],

  // optional properties
  debugLevel,
  flat: true, // flatten all the georaster results when reading by one level, so they appear as if they came from the same source
  method: "near-vectorize", // default resampling method via https://github.com/danieljdufour/geowarp
  turbo: true // apply experimential projection turbo charging via https://github.com/DanielJDufour/proj-turbo
});
```

### simple projection
If you want to read using pixel coordinates, pass in an extent with srs set to "simple".
Inspired by Leaflet's Simple CRS, "simple" srs is when the bottom left corner of the image is [0, 0)]
and the top-right of the image is [image_width, image_height].
```js
await reader.read({
  extent: new GeoExtent([512, 256, 768, 512], { srs: "simple" }),
});
```
