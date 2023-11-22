const parseGeoraster = require("georaster");
const { createWorker } = require("geotiff-tile-web-worker");

const { GeoRasterStack: CoreGeoRasterStack } = require("../core/index.js");

class GeoRasterStack extends CoreGeoRasterStack {
  static async init({ debug_level, flat = false, method, sources, turbo }) {
    return await super.init({
      create_worker: createWorker,
      debug_level,
      flat,
      method,
      parse_georaster: parseGeoraster,
      sources,
      turbo
    });
  }
}

module.exports = {
  GeoRasterStack
};

if (typeof self === "object") {
  self.GeoRasterStack = GeoRasterStack;
}

if (typeof window === "object") {
  window.GeoRasterStack = GeoRasterStack;
}
