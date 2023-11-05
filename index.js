const readTile = require("geotiff-tile");
const { createWorker } = require("geotiff-tile-web-worker");
const proj4fullyloaded = require("proj4-fully-loaded");

const chooseAtRandom = arr => arr[Math.floor(Math.random() * arr.length)];

const range = ct => new Array(ct).fill(0).map((_, i) => i);

class GeoRasterReader {
  constructor({ debugLevel, method, sources, turbo }) {
    this.debugLevel = debugLevel;
    this.georasters = sources;
    this.defaultMethod = method;
    this.defaultTurbo = turbo;
    this.tileWorkers = range(3).map(() => createWorker());
  }

  async read({ extent, size }) {
    const startReadRasters = performance.now();

    const [width, height] = size;

    const out_array_types = ["Array", "Array", "Array"];
    const out_bbox = extent.bbox;
    const out_srs = Number(extent.srs.replace("EPSG:", ""));
    const resample_method = this.defaultMethod || "near-vectorize";

    const promises = this.georasters.map(async georaster => {
      // old-school in-memory georaster from an ArrayBuffer or simple object
      if (georaster.values) {
        const { forward, inverse } = proj4fullyloaded("EPSG:" + georaster.projection, extent.srs);

        return geowarp({
          debug_level: Math.max((this.debugLevel || 3) - 3, 0),
          forward,
          inverse,
          in_data: georaster.values,
          in_bbox: [georaster.xmin, georaster.ymin, georaster.xmax, georaster.ymax],
          in_layout: "[band][row][column]",
          in_srs: georaster.projection,
          in_width: georaster.width,
          in_height: georaster.height,
          out_array_types,
          out_bbox,
          out_layout: "[band][row][column]",
          out_srs,
          out_height: height,
          out_width: width,
          method: resample_method,
          round: false,
          turbo: this.turbo
        }).data;
      } else {
        const baseReadTileParams = {
          bbox: out_bbox,
          bbox_srs: out_srs,
          debug_level: 5,
          method: resample_method,
          round: false,
          tile_array_types: out_array_types,
          tile_height: height,
          tile_layout: "[band][row][column]",
          tile_srs: out_srs,
          tile_width: width,
          timed: true,
          use_overview: true,
          turbo: this.turbo
        };
        if (this.debugLevel >= 2) console.log("[georaster-reader] baseReadTileParams:", baseReadTileParams);
        if (georaster._url) {
          const tileWorker = await chooseAtRandom(this.tileWorkers);
          return tileWorker.createTile({ ...baseReadTileParams, url: georaster._url, debug_level: 4 }).then(({ tile }) => tile);
        } else if (georaster._geotiff) {
          return readTile({ ...baseReadTileParams, geotiff: georaster._geotiff }).then(({ tile }) => tile);
        }
      }
    });
    if (this.debugLevel >= 4) console.log("[georaster-reader] inside GeoRasterReader.read, promises:", promises);
    const valuesByGeoRaster = await Promise.all(promises);
    if (this.debugLevel >= 4) console.log("[georaster-reader] valuesByGeoRaster:", valuesByGeoRaster);

    // flatten the stack
    const result = valuesByGeoRaster.flat();
    if (this.debugLevel >= 1) console.log("[georaster-reader] read rasters took:", performance.now() - startReadRasters, "ms");
    return result;
  }
}

module.exports = {
  GeoRasterReader
};

if (typeof window === "object") {
  window.GeoRasterReader = GeoRasterReader;
}