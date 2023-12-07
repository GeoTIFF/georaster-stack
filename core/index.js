const readTile = require("geotiff-tile");
const proj4fullyloaded = require("proj4-fully-loaded");

const chooseAtRandom = arr => arr[Math.floor(Math.random() * arr.length)];

const range = ct => new Array(ct).fill(0).map((_, i) => i);

// approach of static async factory functions is described here:
// https://dev.to/somedood/the-proper-way-to-write-async-constructors-in-javascript-1o8c

class GeoRasterStack {
  constructor({ cache = true, cache_size = 100, create_worker, debug_level, flat = false, georasters, method, turbo }) {
    this.cache = [];
    this.cache_size = cache_size;
    this.use_cache = cache || false;
    this.debug_level = debug_level;
    this.flat = flat;
    this.georasters = georasters;
    this.defaultMethod = method;
    this.defaultTurbo = turbo;
    this.tileWorkers = range(3).map(() => create_worker());
    return this;
  }

  static async init({ cache, cache_size, create_worker, debug_level, flat, method, parse_georaster, sources, turbo }) {
    return new GeoRasterStack({
      cache,
      cache_size,
      create_worker,
      debug_level,
      flat,
      georasters: await Promise.all(sources.map(src => (typeof src === "string" ? parse_georaster(src) : src))),
      method,
      turbo
    });
  }

  async _read({ extent, size }) {
    const startReadRasters = performance.now();

    const [width, height] = size;

    const out_array_types = ["Array", "Array", "Array"];

    const resample_method = this.defaultMethod || "near-vectorize";

    const sub_debug_level = Math.max((this.debug_level || 3) - 3, 0);

    const promises = this.georasters.map(async georaster => {
      // old-school in-memory georaster from an ArrayBuffer or simple object
      if (georaster.values) {
        if (extent.srs === "simple") {
          return geowarp({
            debug_level: sub_debug_level,
            in_data: georaster.values,
            in_bbox: [0, 0, georaster.width, georaster.height],
            in_layout: "[band][row][column]",
            in_width: georaster.width,
            in_height: georaster.height,
            out_array_types,
            out_bbox: extent.bbox,
            out_layout: "[band][row][column]",
            out_height: height,
            out_width: width,
            method: resample_method,
            round: false,
            turbo: this.turbo
          }).data;
        } else {
          const { forward, inverse } = proj4fullyloaded("EPSG:" + georaster.projection, extent.srs);

          return geowarp({
            debug_level: sub_debug_level,
            forward,
            inverse,
            in_data: georaster.values,
            in_bbox: [georaster.xmin, georaster.ymin, georaster.xmax, georaster.ymax],
            in_layout: "[band][row][column]",
            in_srs: georaster.projection,
            in_width: georaster.width,
            in_height: georaster.height,
            out_array_types,
            out_bbox: extent.bbox,
            out_layout: "[band][row][column]",
            out_srs: extent.srs,
            out_height: height,
            out_width: width,
            method: resample_method,
            round: false,
            turbo: this.turbo
          }).data;
        }
      } else {
        const baseReadTileParams = {
          bbox: extent.bbox,
          bbox_srs: extent.srs,
          debug_level: sub_debug_level,
          method: resample_method,
          round: false,
          tile_array_types: out_array_types,
          tile_height: height,
          tile_layout: "[band][row][column]",
          tile_srs: extent.srs,
          tile_width: width,
          timed: sub_debug_level >= 1,
          use_overview: true,
          turbo: this.turbo
        };

        if (extent.srs === "simple") {
          // this will prevent attempts at resampling because
          // the input (geotiff) and output srs will be treated as the same
          baseReadTileParams.geotiff_srs = "simple";
        }

        if (this.debug_level >= 2) console.log("[georaster-stack] baseReadTileParams:", baseReadTileParams);
        if (georaster._url) {
          const tileWorker = await chooseAtRandom(this.tileWorkers);
          const createTileParams = { ...baseReadTileParams, url: georaster._url };
          if (this.debug_level >= 1) console.log("[georaster-stack] calling createTile with:", createTileParams);
          const created = await tileWorker.createTile(createTileParams);
          if (created === undefined) {
            console.error("[georaster-stack] failed to create tile with the following params:\n" + JSON.stringify(createTileParams));
            throw new Error("[georaster-stack] failed to create tile");
          }
          return created.tile;
        } else if (georaster._geotiff) {
          return readTile({ ...baseReadTileParams, geotiff: georaster._geotiff }).then(({ tile }) => tile);
        }
      }
    });
    if (this.debug_level >= 4) console.log("[georaster-stack] inside GeoRasterReader.read, promises:", promises);
    const valuesByGeoRaster = await Promise.all(promises);
    if (this.debug_level >= 4) console.log("[georaster-stack] valuesByGeoRaster:", valuesByGeoRaster);

    // flatten the stack
    const result = this.flat ? valuesByGeoRaster.flat() : valuesByGeoRaster;
    if (this.debug_level >= 1) console.log("[georaster-stack] read rasters took:", performance.now() - startReadRasters, "ms");
    return { data: result, size };
  }

  async read({ extent, size }) {
    if (this.use_cache) {
      const [width, height] = size;

      const key = `bbox=${extent.bbox.join(",")}; srs=${extent.srs}; height=${height}; width=${width}`;
      if (this.debug_level >= 2) console.log("[georaster-stack] key:", key);

      if (this.cache.length > 0) {
        const entry = this.cache.find(it => it[0] === key);
        if (entry) {
          if (this.debug_level >= 1) console.log(`[georaster-stack] found cache entry "${key}"`);
          return entry[1];
        }
      }

      const promise = this._read({ extent, size });

      // if at limit, remove first element in cache array
      if (this.cache.length === this.cache_size) this.cache.shift();

      this.cache.push([key, promise]);

      return promise;
    } else {
      return this._read({ extent, size });
    }
  }
}

module.exports = {
  GeoRasterStack
};
