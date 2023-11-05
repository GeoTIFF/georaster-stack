# georaster-reader
> Read Stack of GeoSpatial Rasters

### features
- Reprojection and Resampling
- Band Separated Rasters (like Landsat 8)
- Mixed Projections
- Turbo-Charging Reprojection
- Web Workers

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

const georaster = await parseGeoraster("https://example.org/wildfires.tiff");

const reader = new GeoRasterReader({ sources: [georaster] });

reader.read({
  // instance of GeoExtent (https://www.npmjs.com/package/geo-extent)
  // an extent is a bbox with a spatial reference system
  extent: new GeoExtent([-122.49755859375, 38.8520508, -120.06958007812499, 40.697299008636755], { srs: 4326 }),
  size: [width, height]
});
```

### advanced usage
```js
const reader = new GeoRasterReader({
  // multiple sources
  // they can even be in different projections!
  sources: [
     await parseGeoraster("https://example.org/wildfires_red.tiff"),
     await parseGeoraster("https://example.org/wildfires_green.tiff")
     await parseGeoraster("https://example.org/blue.tiff")
  ],

  // optional properties
  debugLevel,
  method: "near-vectorize", // default resampling method via https://github.com/danieljdufour/geowarp
  turbo: true // apply experimential projection turbo charging via https://github.com/DanielJDufour/proj-turbo
});
```
