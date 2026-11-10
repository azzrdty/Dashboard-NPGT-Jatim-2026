import * as shpModule from 'shpjs';
import proj4 from 'proj4';
import JSZip from 'jszip';

// Pre-define common Indonesian and standard GIS projections in proj4
proj4.defs([
  ['EPSG:32746', '+proj=utm +zone=46 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32747', '+proj=utm +zone=47 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32748', '+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32749', '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32750', '+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32751', '+proj=utm +zone=51 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32752', '+proj=utm +zone=52 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32753', '+proj=utm +zone=53 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32754', '+proj=utm +zone=54 +south +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32646', '+proj=utm +zone=46 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32647', '+proj=utm +zone=47 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32648', '+proj=utm +zone=48 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32649', '+proj=utm +zone=49 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32650', '+proj=utm +zone=50 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:32651', '+proj=utm +zone=51 +north +datum=WGS84 +units=m +no_defs'],
  ['EPSG:23837', '+proj=tmerc +lat_0=0 +lon_0=109.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs'], // TM-3 BPN Zone 49.1
  ['EPSG:23838', '+proj=tmerc +lat_0=0 +lon_0=112.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs'], // TM-3 BPN Zone 49.2
  ['EPSG:23839', '+proj=tmerc +lat_0=0 +lon_0=115.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs'], // TM-3 BPN Zone 50.1
  ['EPSG:23840', '+proj=tmerc +lat_0=0 +lon_0=118.5 +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs'], // TM-3 BPN Zone 50.2
  ['ESRI:54034', '+proj=cea +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'], // World Cylindrical Equal Area (BPN NPGT/DJPA/LSD/LBS/RTRW)
  ['EPSG:54034', '+proj=cea +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'],
  ['World_Cylindrical_Equal_Area', '+proj=cea +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'],
  ['EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs'],
  ['EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs']
]);

export const CRS_LABELS = {
  'EPSG:4326': 'WGS84 Geographic (EPSG:4326)',
  'ESRI:54034': 'World Cylindrical Equal Area (ESRI:54034)',
  'EPSG:32749': 'WGS 84 / UTM Zone 49S (EPSG:32749)',
  'EPSG:32750': 'WGS 84 / UTM Zone 50S (EPSG:32750)',
  'EPSG:32748': 'WGS 84 / UTM Zone 48S (EPSG:32748)',
  'EPSG:32751': 'WGS 84 / UTM Zone 51S (EPSG:32751)',
  'EPSG:3857': 'Web Mercator Auxiliary Sphere (EPSG:3857)',
  'EPSG:23837': 'DGN95 / TM-3 BPN Zone 49.1 (EPSG:23837)',
  'EPSG:23838': 'DGN95 / TM-3 BPN Zone 49.2 (EPSG:23838)',
  'EPSG:23839': 'DGN95 / TM-3 BPN Zone 50.1 (EPSG:23839)',
  'EPSG:23840': 'DGN95 / TM-3 BPN Zone 50.2 (EPSG:23840)'
};

// Safely extract shpjs exports across ESM, CJS, and Vite environments
const rawShp = shpModule.default || shpModule;
export const parseZip = shpModule.parseZip || rawShp.parseZip || (typeof rawShp === 'function' ? rawShp : null);
export const parseShp = shpModule.parseShp || rawShp.parseShp;
export const parseDbf = shpModule.parseDbf || rawShp.parseDbf;
export const combine = shpModule.combine || rawShp.combine;

// Unified shp object ensuring shp.parse, shp.parseZip, shp.parseShp are always valid functions
export const shp = {
  parse: async (buffer) => (parseZip ? await parseZip(buffer) : await rawShp(buffer)),
  parseZip: async (buffer) => (parseZip ? await parseZip(buffer) : await rawShp(buffer)),
  parseShp: (buf, prj) => (parseShp ? parseShp(buf, prj) : null),
  parseDbf: (buf, cpg) => (parseDbf ? parseDbf(buf, cpg) : null),
  combine: (args) => (combine ? combine(args) : null),
  fromObject: async (obj) => (typeof rawShp === 'function' ? await rawShp(obj) : null)
};

/**
 * Extract numeric parameter from Esri WKT string
 */
function getWktParam(wkt, paramName, fallback = 0) {
  const regex = new RegExp(`PARAMETER\\s*\\[\\s*"${paramName}"\\s*,\\s*([-+0-9.eE]+)\\s*\\]`, 'i');
  const match = wkt.match(regex);
  return match ? parseFloat(match[1]) : fallback;
}

/**
 * Extract and parse CRS information from PRJ WKT string
 */
export function parseCrsInfo(prjString) {
  if (!prjString || typeof prjString !== 'string') {
    return {
      name: 'WGS84 Geographic (EPSG:4326)',
      code: 'EPSG:4326',
      type: 'Geographic',
      isProjected: false,
      wkt: null
    };
  }

  const str = prjString.trim();
  const name = str.includes('"') ? str.split('"')[1] : 'Custom CRS';
  const isProjected = /^PROJCS/i.test(str);

  // Match common Indonesian and international EPSG/ESRI codes
  let code = isProjected ? 'CUSTOM' : 'EPSG:4326';

  if (/Cylindrical_Equal_Area/i.test(str) || /54034/i.test(str)) {
    code = 'ESRI:54034';
  } else if (/UTM_Zone_(\d+)([NS])/i.test(str) || /zone\s*(\d+)\s*([ns])/i.test(str)) {
    const m = str.match(/UTM_Zone_(\d+)([NS])/i) || str.match(/zone\s*(\d+)\s*([ns])/i);
    const zoneNum = parseInt(m[1], 10);
    const hemi = m[2].toUpperCase();
    code = `EPSG:${hemi === 'S' ? 32700 + zoneNum : 32600 + zoneNum}`;
  } else if (/TM.?3.*49[._]1/i.test(str)) {
    code = 'EPSG:23837';
  } else if (/TM.?3.*49[._]2/i.test(str)) {
    code = 'EPSG:23838';
  } else if (/TM.?3.*50[._]1/i.test(str)) {
    code = 'EPSG:23839';
  } else if (/TM.?3.*50[._]2/i.test(str)) {
    code = 'EPSG:23840';
  } else if (/Web_Mercator/i.test(name) || /Mercator_Auxiliary/i.test(str) || /Pseudo.?Mercator/i.test(name) || /3857/i.test(name)) {
    code = 'EPSG:3857';
  } else if (/WGS_1984/i.test(name) && !isProjected) {
    code = 'EPSG:4326';
  }

  // If proj4 doesn't have this projection yet, register WKT or build proj4 string from WKT parameters
  if (code === 'CUSTOM' && str) {
    let registered = false;
    try {
      proj4.defs(name, str);
      // Verify proj4 can actually transform with this WKT
      proj4(name, 'EPSG:4326', [500000, 9200000]);
      code = name;
      registered = true;
    } catch (e) {
      registered = false;
    }

    if (!registered) {
      try {
        const lon0 = getWktParam(str, 'Central_Meridian', 0);
        const lat0 = getWktParam(str, 'Latitude_Of_Origin', 0);
        const latTs = getWktParam(str, 'Standard_Parallel_1', 0);
        const x0 = getWktParam(str, 'False_Easting', 0);
        const y0 = getWktParam(str, 'False_Northing', 0);
        const k0 = getWktParam(str, 'Scale_Factor', 1);

        let projDef = null;
        if (/Cylindrical_Equal_Area/i.test(str)) {
          projDef = `+proj=cea +lon_0=${lon0} +lat_ts=${latTs} +x_0=${x0} +y_0=${y0} +datum=WGS84 +units=m +no_defs`;
        } else if (/Transverse_Mercator/i.test(str)) {
          projDef = `+proj=tmerc +lat_0=${lat0} +lon_0=${lon0} +k=${k0} +x_0=${x0} +y_0=${y0} +datum=WGS84 +units=m +no_defs`;
        } else if (/Mercator/i.test(str)) {
          projDef = `+proj=merc +a=6378137 +b=6378137 +lat_ts=${latTs} +lon_0=${lon0} +x_0=${x0} +y_0=${y0} +k=${k0} +units=m +nadgrids=@null +no_defs`;
        }
        if (projDef) {
          proj4.defs(name, projDef);
          code = name;
        }
      } catch (e2) {
        console.warn('Could not synthesize custom WKT projection:', e2);
      }
    }
  }

  return {
    name: CRS_LABELS[code] || name,
    code,
    type: isProjected ? 'Projected (Meter)' : 'Geographic (Derajat)',
    isProjected,
    wkt: str
  };
}

/**
 * Check if coordinates appear to be projected in meters rather than degrees
 */
export function isProjectedCoords(coords) {
  if (!Array.isArray(coords)) return false;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90;
  }
  return isProjectedCoords(coords[0]);
}

/**
 * Extract a single representative [x, y] coordinate from a nested coord structure
 */
function extractSampleCoord(coords) {
  if (!Array.isArray(coords)) return null;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return coords;
  }
  return extractSampleCoord(coords[0]);
}

/**
 * Auto-detect the CRS of projected coordinates (meter-based) for Indonesian data.
 * - World Cylindrical Equal Area (ESRI:54034): |x| > 2,000,000 for BPN/NPGT/DJPA/LSD/LBS/RTRW data
 * - Web Mercator (EPSG:3857): |x| > 2,000,000 when layer is explicitly Web Mercator / Sungai RBI
 * - UTM Zone 49S (EPSG:32749): x 100k-900k, y 8M-10M
 * - UTM Zone 50S (EPSG:32750): x 100k-900k, y 8M-10M
 * - TM-3 BPN: x 50k-500k, y 1M-2M
 */
export function detectProjectedCrs(x, y, features = [], layerName = '') {
  // Large X in millions (10M - 16M for Indonesia): either ESRI:54034 (CEA) or EPSG:3857 (Web Mercator)
  if (Math.abs(x) > 2000000) {
    if (/mercator|3857|sungai/i.test(layerName)) {
      return 'EPSG:3857';
    }
    // Default to World Cylindrical Equal Area (ESRI:54034), standard for BPN NPGT/DJPA/LSD/LBS/RTRW
    return 'ESRI:54034';
  }

  // TM-3 BPN projections — Y between 1,000,000 and 2,000,000, X between 50,000 and 500,000
  if (y > 1000000 && y < 2000000 && x > 50000 && x < 500000) {
    try {
      const [lng, lat] = proj4('EPSG:23838', 'EPSG:4326', [x, y]);
      if (lng >= 109 && lng <= 116 && lat >= -11 && lat <= 1) {
        return 'EPSG:23838';
      }
    } catch (e) { /* ignore */ }
    try {
      const [lng, lat] = proj4('EPSG:23839', 'EPSG:4326', [x, y]);
      if (lng >= 112 && lng <= 119 && lat >= -11 && lat <= 1) {
        return 'EPSG:23839';
      }
    } catch (e) { /* ignore */ }
    return 'EPSG:23838';
  }

  // UTM Southern Hemisphere — Y between 8,000,000 and 10,000,000
  if (y > 8000000 && y < 10100000 && x > 100000 && x < 900000) {
    const utmZones = [
      { code: 'EPSG:32749', lonMin: 107.5, lonMax: 114.5 },
      { code: 'EPSG:32750', lonMin: 113.5, lonMax: 120.5 },
      { code: 'EPSG:32748', lonMin: 101.5, lonMax: 108.5 },
      { code: 'EPSG:32751', lonMin: 119.5, lonMax: 126.5 }
    ];
    for (const zone of utmZones) {
      try {
        const [lng, lat] = proj4(zone.code, 'EPSG:4326', [x, y]);
        if (lng >= zone.lonMin && lng <= zone.lonMax && lat >= -11 && lat <= 0) {
          return zone.code;
        }
      } catch (e) { /* ignore */ }
    }
    return 'EPSG:32749';
  }

  // UTM Northern Hemisphere — Y between 0 and 1,000,000
  if (y > 0 && y < 1000000 && x > 100000 && x < 900000) {
    return 'EPSG:32649';
  }

  return 'EPSG:32749';
}

/**
 * Check if coordinates look like swapped [lat, lng] instead of [lng, lat].
 * For Indonesia: lat ∈ [-11, 6], lng ∈ [95, 141]
 */
function isSwappedLatLng(x, y) {
  return (x >= -11 && x <= 6 && y >= 95 && y <= 141);
}

/**
 * Fast recursive coordinate reprojection using a pre-compiled proj4 converter
 */
function reprojectWithConverter(coords, converter) {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const x = coords[0];
    const y = coords[1];
    if (Math.abs(x) > 180 || Math.abs(y) > 90) {
      try {
        const pt = converter.forward([x, y]);
        return [pt[0], pt[1]];
      } catch (e) {
        return [x, y];
      }
    }
    if (isSwappedLatLng(x, y)) {
      return [y, x];
    }
    return [x, y];
  }
  const out = new Array(coords.length);
  for (let i = 0; i < coords.length; i++) {
    out[i] = reprojectWithConverter(coords[i], converter);
  }
  return out;
}

/**
 * Reproject coordinate arrays to WGS84 (EPSG:4326)
 */
export function reprojectCoords(coords, fromCRS = 'EPSG:32749') {
  try {
    const converter = proj4(fromCRS, 'EPSG:4326');
    return reprojectWithConverter(coords, converter);
  } catch (e) {
    return coords;
  }
}

/**
 * Re-interpret an already reprojected WGS84 GeoJSON layer as if its original native
 * coordinates were in `newCrs` instead of `oldCrs`.
 * Works by recovering native [x, y] via `oldCrs` and projecting to WGS84 via `newCrs`.
 */
export function reprojectLayerData(geoJsonData, oldCrs, newCrs) {
  if (!geoJsonData?.features || !oldCrs || !newCrs || oldCrs === newCrs) return geoJsonData;
  if (oldCrs === 'EPSG:4326' || newCrs === 'EPSG:4326') return geoJsonData;

  let toNative;
  let toWgs84;
  try {
    toNative = proj4('EPSG:4326', oldCrs);
    toWgs84 = proj4(newCrs, 'EPSG:4326');
  } catch (e) {
    return geoJsonData;
  }

  function transformCoords(coords) {
    if (!Array.isArray(coords)) return coords;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      try {
        const raw = toNative.forward([coords[0], coords[1]]);
        const next = toWgs84.forward(raw);
        if (isFinite(next[0]) && isFinite(next[1])) {
          return [next[0], next[1]];
        }
      } catch (e) {
        return [coords[0], coords[1]];
      }
      return [coords[0], coords[1]];
    }
    const out = new Array(coords.length);
    for (let i = 0; i < coords.length; i++) {
      out[i] = transformCoords(coords[i]);
    }
    return out;
  }

  return {
    ...geoJsonData,
    features: geoJsonData.features.map((f) => ({
      ...f,
      geometry: f.geometry
        ? {
            ...f.geometry,
            coordinates: transformCoords(f.geometry.coordinates)
          }
        : f.geometry
    }))
  };
}

/**
 * Convert [lng, lat] degrees to native projected coordinates [x, y] meters
 */
export function projectToNative(lng, lat, targetCrsCode = 'EPSG:32749') {
  if (!isFinite(lng) || !isFinite(lat)) return null;
  if (!targetCrsCode || targetCrsCode === 'EPSG:4326') return null;
  try {
    const [x, y] = proj4('EPSG:4326', targetCrsCode, [lng, lat]);
    return { x, y };
  } catch (e) {
    return null;
  }
}

/**
 * Check if properties contain NPGT (Neraca Penatagunaan Tanah) DJPA columns
 */
export function checkNpgtColumns(features) {
  if (!features || !features.length) return false;
  const sample = features[0]?.properties || {};
  const keys = Object.keys(sample).map((k) => k.toUpperCase());
  const npgtKeys = ['KSPOLA', 'COMPATB', 'OPTNH', 'OPTIMALTNH', 'VNAME', 'V_ARAHAN', 'REKOMTNH', 'PASET'];
  const matchCount = npgtKeys.filter((k) => keys.includes(k)).length;
  return matchCount >= 3;
}

/**
 * Normalizes GeoJSON into a standard FeatureCollection with ids.
 * Auto-detects CRS from coordinate values when fallbackCrs is not specific enough.
 */
export function normalizeGeoJson(rawGeoJson, layerName = 'Spatial Layer', fallbackCrs = 'EPSG:4326') {
  let featureCollection;

  if (rawGeoJson.type === 'FeatureCollection') {
    featureCollection = rawGeoJson;
  } else if (rawGeoJson.type === 'Feature') {
    featureCollection = {
      type: 'FeatureCollection',
      features: [rawGeoJson]
    };
  } else if (rawGeoJson.type && (rawGeoJson.coordinates || rawGeoJson.geometries)) {
    featureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: rawGeoJson,
        properties: {}
      }]
    };
  } else if (Array.isArray(rawGeoJson)) {
    featureCollection = {
      type: 'FeatureCollection',
      features: rawGeoJson
    };
  } else {
    throw new Error('Format GeoJSON tidak valid atau tidak dikenali.');
  }

  // Ensure every feature has an ID, non-null properties, and check coordinates
  let needsReprojection = false;
  let reprojCrs = fallbackCrs;

  // Sample the first feature's coordinates to determine if reprojection is needed
  const sampleGeom = featureCollection.features[0]?.geometry;
  if (sampleGeom && isProjectedCoords(sampleGeom.coordinates)) {
    needsReprojection = true;

    const sampleCoord = extractSampleCoord(sampleGeom.coordinates);
    if (sampleCoord) {
      const [x, y] = sampleCoord;
      if (!fallbackCrs || fallbackCrs === 'EPSG:4326') {
        reprojCrs = detectProjectedCrs(x, y, featureCollection.features, layerName);
      } else {
        // Verify fallbackCrs can actually reproject sampleCoord
        try {
          const [lng, lat] = proj4(fallbackCrs, 'EPSG:4326', [x, y]);
          if (!isFinite(lng) || !isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) {
            reprojCrs = detectProjectedCrs(x, y, featureCollection.features, layerName);
          } else {
            reprojCrs = fallbackCrs;
          }
        } catch (e) {
          reprojCrs = detectProjectedCrs(x, y, featureCollection.features, layerName);
        }
      }
    }
  }

  let converter = null;
  if (needsReprojection && reprojCrs) {
    try {
      converter = proj4(reprojCrs, 'EPSG:4326');
    } catch (e) {
      converter = null;
    }
  }

  const rawFeatures = featureCollection.features || [];
  const cleanFeatures = [];

  const normalizeRings = (rings) => {
    for (let rIdx = 0; rIdx < rings.length; rIdx++) {
      const ring = rings[rIdx];
      if (!ring || ring.length < 4) continue;
      let area = 0;
      for (let k = 0, len = ring.length - 1; k < len; k++) {
        area += (ring[k][0] * ring[k + 1][1]) - (ring[k + 1][0] * ring[k][1]);
      }
      if ((rIdx === 0 && area < 0) || (rIdx > 0 && area > 0)) {
        ring.reverse();
      }
    }
  };

  for (let i = 0; i < rawFeatures.length; i++) {
    const f = rawFeatures[i];
    if (!f || !f.geometry) continue;

    let geometry = f.geometry;
    if (converter && geometry.coordinates) {
      geometry = {
        type: geometry.type,
        coordinates: reprojectWithConverter(geometry.coordinates, converter)
      };
    }

    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
      normalizeRings(geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
      for (let p = 0; p < geometry.coordinates.length; p++) {
        if (Array.isArray(geometry.coordinates[p])) {
          normalizeRings(geometry.coordinates[p]);
        }
      }
    }

    cleanFeatures.push({
      type: 'Feature',
      id: f.id !== undefined ? f.id : `feature-${i}`,
      geometry,
      properties: f.properties || {}
    });
  }

  featureCollection.features = cleanFeatures;

  if (needsReprojection && reprojCrs) {
    featureCollection._detectedCrs = reprojCrs;
  }

  return featureCollection;
}

/**
 * Helper to resolve final CRS metadata after normalizeGeoJson
 */
function resolveFinalCrs(crsInfo, fc) {
  if (fc?._detectedCrs && (!crsInfo?.code || crsInfo.code === 'EPSG:4326')) {
    const code = fc._detectedCrs;
    return {
      code,
      name: CRS_LABELS[code] || code,
      type: 'Projected (Meter)'
    };
  }
  return crsInfo;
}

/**
 * Parse Shapefile from a ZIP file ArrayBuffer, extracting exact PRJ and CRS
 */
export async function parseShapefileZip(buffer, fileName = 'Shapefile Layer') {
  try {
    // 1. Inspect PRJ from the ZIP archive
    let crsInfo = {
      name: 'WGS84 (EPSG:4326)',
      code: 'EPSG:4326',
      type: 'Geographic (Derajat)',
      isProjected: false
    };

    try {
      const zip = await JSZip.loadAsync(buffer);
      const prjFile = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.prj'));
      if (prjFile) {
        const prjText = await zip.files[prjFile].async('text');
        crsInfo = parseCrsInfo(prjText);
      }
    } catch (e) {
      console.warn('Could not read PRJ from zip:', e);
    }

    // 2. Parse Shapefile using shpjs (which handles PRJ automatically)
    let parsed;
    if (typeof parseZip === 'function') {
      parsed = await parseZip(buffer);
    } else if (typeof rawShp === 'function') {
      parsed = await rawShp(buffer);
    } else {
      throw new Error('Library pembaca shapefile (shpjs) tidak berhasil diinisialisasi.');
    }

    const layers = [];

    if (Array.isArray(parsed)) {
      // Multiple FeatureCollections from multi-shapefile zip
      parsed.forEach((item, idx) => {
        const fc = normalizeGeoJson(item, item.fileName || `${fileName} (L${idx + 1})`, crsInfo.code);
        const resolved = resolveFinalCrs(crsInfo, fc);
        layers.push({
          name: item.fileName || `${fileName.replace(/\.zip$/i, '')} - Layer ${idx + 1}`,
          data: fc,
          hasNpgt: checkNpgtColumns(fc.features),
          crsInfo: resolved.name,
          crsCode: resolved.code,
          crsType: resolved.type
        });
      });
    } else if (parsed && parsed.type === 'FeatureCollection') {
      // Single FeatureCollection
      const fc = normalizeGeoJson(parsed, fileName, crsInfo.code);
      const resolved = resolveFinalCrs(crsInfo, fc);
      layers.push({
        name: fileName.replace(/\.zip$/i, ''),
        data: fc,
        hasNpgt: checkNpgtColumns(fc.features),
        crsInfo: resolved.name,
        crsCode: resolved.code,
        crsType: resolved.type
      });
    } else if (parsed && typeof parsed === 'object' && !parsed.type) {
      // Object with named keys (from nested folder ZIPs): { "folder/name": FeatureCollection }
      const keys = Object.keys(parsed);
      keys.forEach((key, idx) => {
        const item = parsed[key];
        if (item && item.type === 'FeatureCollection') {
          const fc = normalizeGeoJson(item, key, crsInfo.code);
          const resolved = resolveFinalCrs(crsInfo, fc);
          layers.push({
            name: key.replace(/^.*\//, '').replace(/\.zip$/i, '') || `${fileName.replace(/\.zip$/i, '')} - Layer ${idx + 1}`,
            data: fc,
            hasNpgt: checkNpgtColumns(fc.features),
            crsInfo: resolved.name,
            crsCode: resolved.code,
            crsType: resolved.type
          });
        }
      });
    }

    if (!layers.length) {
      throw new Error('Tidak ditemukan layer spasial valid di dalam file zip.');
    }

    return layers;
  } catch (err) {
    console.error('Error parsing Shapefile ZIP:', err);
    throw new Error(`Gagal membaca file ZIP Shapefile: ${err.message}`);
  }
}

/**
 * Parse loose shapefile components (.shp, optional .dbf, optional .prj, .cpg)
 * DBF is now optional — if missing, geometry-only features are created.
 */
export async function parseLooseShapefile({ shpFile, dbfFile, prjFile, cpgFile }) {
  if (!shpFile) {
    throw new Error('Harap sertakan minimal file .shp.');
  }

  try {
    const shpBuf = await shpFile.arrayBuffer();
    const dbfBuf = dbfFile ? await dbfFile.arrayBuffer() : null;
    const prjStr = prjFile ? await prjFile.text() : null;
    const cpgStr = cpgFile ? (await cpgFile.text()).trim() : undefined;

    const crsInfo = parseCrsInfo(prjStr);

    let combined = null;

    // 1. Parse via parseShp + parseDbf + combine (letting normalizeGeoJson handle exact proj4 CRS)
    const pShp = parseShp || shp.parseShp;
    const pDbf = parseDbf || shp.parseDbf;
    const comb = combine || shp.combine;

    if (pShp) {
      const geoms = pShp(shpBuf);
      if (dbfBuf && pDbf && comb) {
        const records = pDbf(dbfBuf, cpgStr);
        combined = comb([geoms, records]);
      } else {
        combined = {
          type: 'FeatureCollection',
          features: (geoms || []).map((geom, idx) => ({
            type: 'Feature',
            id: `feature-${idx}`,
            geometry: geom,
            properties: { FID: idx }
          }))
        };
      }
    } else if (dbfBuf && typeof rawShp === 'function') {
      combined = await rawShp({
        shp: shpBuf,
        dbf: dbfBuf,
        cpg: cpgStr
      });
    }

    const cleanName = shpFile.name.replace(/\.shp$/i, '');
    const fc = normalizeGeoJson(combined, cleanName, crsInfo.code);
    const resolved = resolveFinalCrs(crsInfo, fc);

    return [{
      name: cleanName,
      data: fc,
      hasNpgt: checkNpgtColumns(fc.features),
      crsInfo: resolved.name,
      crsCode: resolved.code,
      crsType: resolved.type
    }];
  } catch (err) {
    console.error('Error parsing loose shapefiles:', err);
    throw new Error(`Gagal membaca komponen shapefile: ${err.message}`);
  }
}

/**
 * Parse GeoJSON or JSON string / file
 */
export async function parseGeoJsonFile(file) {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const cleanName = file.name.replace(/\.(geojson|json)$/i, '');
    const fc = normalizeGeoJson(json, cleanName);

    return [{
      name: cleanName,
      data: fc,
      hasNpgt: checkNpgtColumns(fc.features),
      crsInfo: 'WGS84 (EPSG:4326)',
      crsCode: 'EPSG:4326',
      crsType: 'Geographic (Derajat)'
    }];
  } catch (err) {
    throw new Error(`Gagal membaca file GeoJSON: ${err.message}`);
  }
}

/**
 * Lightweight KML parser converting Placemarks to GeoJSON
 */
export async function parseKmlFile(file) {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    const features = [];

    for (let i = 0; i < placemarks.length; i++) {
      const pm = placemarks[i];
      const props = {};

      const nameNode = pm.getElementsByTagName('name')[0];
      if (nameNode) props.name = nameNode.textContent.trim();
      const descNode = pm.getElementsByTagName('description')[0];
      if (descNode) props.description = descNode.textContent.trim();

      const simpleData = pm.getElementsByTagName('SimpleData');
      for (let s = 0; s < simpleData.length; s++) {
        const k = simpleData[s].getAttribute('name');
        if (k) props[k] = simpleData[s].textContent.trim();
      }

      let geometry = null;
      const pointNode = pm.getElementsByTagName('Point')[0];
      const lineNode = pm.getElementsByTagName('LineString')[0];
      const polyNode = pm.getElementsByTagName('Polygon')[0];

      if (pointNode) {
        const coordsStr = pointNode.getElementsByTagName('coordinates')[0]?.textContent.trim();
        if (coordsStr) {
          const parts = coordsStr.split(',').map((x) => parseFloat(x.trim()));
          if (!isNaN(parts[0]) && !isNaN(parts[1])) {
            geometry = { type: 'Point', coordinates: [parts[0], parts[1]] };
          }
        }
      } else if (lineNode) {
        const coordsStr = lineNode.getElementsByTagName('coordinates')[0]?.textContent.trim();
        if (coordsStr) {
          const coords = coordsStr.split(/\s+/).filter(Boolean).map((pt) => {
            const parts = pt.split(',').map((x) => parseFloat(x.trim()));
            return [parts[0], parts[1]];
          });
          if (coords.length > 1) {
            geometry = { type: 'LineString', coordinates: coords };
          }
        }
      } else if (polyNode) {
        const outerNode = polyNode.getElementsByTagName('outerBoundaryIs')[0];
        const coordsStr = outerNode?.getElementsByTagName('coordinates')[0]?.textContent.trim();
        if (coordsStr) {
          const ring = coordsStr.split(/\s+/).filter(Boolean).map((pt) => {
            const parts = pt.split(',').map((x) => parseFloat(x.trim()));
            return [parts[0], parts[1]];
          });
          if (ring.length >= 3) {
            geometry = { type: 'Polygon', coordinates: [ring] };
          }
        }
      }

      if (geometry) {
        features.push({
          type: 'Feature',
          id: `kml-${i}`,
          geometry,
          properties: props
        });
      }
    }

    if (!features.length) {
      throw new Error('Tidak ditemukan elemen geometri (Placemark) yang valid di file KML.');
    }

    const cleanName = file.name.replace(/\.kml$/i, '');
    const fc = {
      type: 'FeatureCollection',
      features
    };

    return [{
      name: cleanName,
      data: fc,
      hasNpgt: checkNpgtColumns(features),
      crsInfo: 'WGS84 (EPSG:4326)',
      crsCode: 'EPSG:4326',
      crsType: 'Geographic (Derajat)'
    }];
  } catch (err) {
    throw new Error(`Gagal membaca file KML: ${err.message}`);
  }
}

/**
 * Parse CSV with latitude and longitude columns
 */
export async function parseCsvFile(file) {
  try {
    const text = await file.text();
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('File CSV kosong atau hanya memiliki header.');

    const delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());

    const latKeys = ['latitude', 'lat', 'y', 'lintang', 'lat_dd'];
    const lonKeys = ['longitude', 'long', 'lon', 'lng', 'x', 'bujur', 'lon_dd'];

    const latIndex = headers.findIndex((h) => latKeys.includes(h.toLowerCase()));
    const lonIndex = headers.findIndex((h) => lonKeys.includes(h.toLowerCase()));

    if (latIndex === -1 || lonIndex === -1) {
      throw new Error('File CSV tidak memiliki kolom koordinat lintang/bujur (misal: latitude/longitude, lat/lon, x/y).');
    }

    const features = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
      if (row.length < headers.length) continue;

      const latVal = parseFloat(row[latIndex].replace(',', '.'));
      const lonVal = parseFloat(row[lonIndex].replace(',', '.'));

      if (isFinite(latVal) && isFinite(lonVal)) {
        const properties = {};
        headers.forEach((h, idx) => {
          properties[h] = row[idx] || '';
        });

        features.push({
          type: 'Feature',
          id: `csv-${i}`,
          geometry: {
            type: 'Point',
            coordinates: [lonVal, latVal]
          },
          properties
        });
      }
    }

    if (!features.length) {
      throw new Error('Tidak ada baris dengan koordinat numerik yang valid pada CSV.');
    }

    const cleanName = file.name.replace(/\.csv$/i, '');
    return [{
      name: cleanName,
      data: {
        type: 'FeatureCollection',
        features
      },
      hasNpgt: checkNpgtColumns(features),
      crsInfo: 'WGS84 Lintang/Bujur (EPSG:4326)',
      crsCode: 'EPSG:4326',
      crsType: 'Geographic (Derajat)'
    }];
  } catch (err) {
    throw new Error(`Gagal membaca file CSV: ${err.message}`);
  }
}

/**
 * Universal dispatcher for any combination of dropped or selected files
 */
export async function parseSpatialFiles(files) {
  const fileArray = Array.from(files);
  if (!fileArray.length) return [];

  // 1. Single ZIP file
  const zipFile = fileArray.find((f) => /\.zip$/i.test(f.name));
  if (zipFile && fileArray.length === 1) {
    const buf = await zipFile.arrayBuffer();
    return await parseShapefileZip(buf, zipFile.name);
  }

  // 2. Loose Shapefile components (.shp, .dbf, etc.)
  const shpFiles = fileArray.filter((f) => /\.shp$/i.test(f.name));
  if (shpFiles.length > 0) {
    const results = [];
    for (const shpFile of shpFiles) {
      const baseName = shpFile.name.replace(/\.shp$/i, '').toLowerCase();
      const dbfFile = fileArray.find((f) => f.name.toLowerCase() === `${baseName}.dbf`);
      const prjFile = fileArray.find((f) => f.name.toLowerCase() === `${baseName}.prj`);
      const cpgFile = fileArray.find((f) => f.name.toLowerCase() === `${baseName}.cpg`);

      if (!dbfFile) {
        console.warn(`File ${baseName}.dbf tidak ditemukan, memuat geometri saja.`);
      }

      const layers = await parseLooseShapefile({ shpFile, dbfFile, prjFile, cpgFile });
      results.push(...layers);
    }
    return results;
  }

  // 3. GeoJSON
  const geojsonFiles = fileArray.filter((f) => /\.(geojson|json)$/i.test(f.name));
  if (geojsonFiles.length > 0) {
    const results = [];
    for (const gf of geojsonFiles) {
      const layers = await parseGeoJsonFile(gf);
      results.push(...layers);
    }
    return results;
  }

  // 4. KML
  const kmlFiles = fileArray.filter((f) => /\.kml$/i.test(f.name));
  if (kmlFiles.length > 0) {
    const results = [];
    for (const kf of kmlFiles) {
      const layers = await parseKmlFile(kf);
      results.push(...layers);
    }
    return results;
  }

  // 5. CSV
  const csvFiles = fileArray.filter((f) => /\.csv$/i.test(f.name));
  if (csvFiles.length > 0) {
    const results = [];
    for (const cf of csvFiles) {
      const layers = await parseCsvFile(cf);
      results.push(...layers);
    }
    return results;
  }

  throw new Error('Format file tidak didukung. Harap unggah file .zip shapefile, file .shp bersama .dbf, GeoJSON, KML, atau CSV berkoordinat.');
}

export default shp;
