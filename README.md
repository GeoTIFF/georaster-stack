# georaster-stack
> Read Stack of GeoSpatial Rasters

### features
- Reprojection and Resampling
- Band Separated Rasters
- Projection Mixing
- Turbo-Charging Reprojection
- Web Workers
- Simple SRS (inspired by [CRS.Simple](https://leafletjs.com/examples/crs-simple/crs-simple.html))
- Various Resampling Methods

### Known Limitations
- Currently only works in the Browser

### install
```
npm install georaster-stack
```

### basic usage
```js
import { GeoExtent } from "geo-extent";
import { GeoRasterStack } from "georaster-stack/web";

const stack = await GeoRasterStack.init({
  // multiple sources
  // they can even be in different projections!
  sources: [
    "https://example.org/red.tiff",
    "https://example.org/green.tiff",
    "https://example.org/blue.tiff"
  ]
});

const result = await stack.read({
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
const stack = await GeoRasterStack.init({
  sources: [...],

  // optional properties
  debug_level: 2,
  flat: true, // flatten all the georaster results when reading by one level, so they appear as if they came from the same source
  method: "near-vectorize", // resampling method via https://github.com/danieljdufour/geowarp
  turbo: true // apply experimential projection turbo charging via https://github.com/DanielJDufour/proj-turbo
});
```

### simple projection
If you want to read using pixel coordinates, pass in an extent with srs set to "simple".
Inspired by Leaflet's Simple CRS, "simple" srs is when the bottom left corner of the image is [0, 0]
and the top-right of the image is [image_width, image_height].
```js
await stack.read({
  extent: new GeoExtent([512, 256, 768, 512], { srs: "simple" }),
  size: [512, 512]
});
```
