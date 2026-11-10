/**
 * Spatial calculation helpers for GIS geometries
 */

// Earth radius in meters
const EARTH_RADIUS = 6378137;

// Cache computed bounding boxes by object reference for O(1) repeated lookups
const bboxCache = new WeakMap();

/**
 * Calculates the bounding box of a GeoJSON FeatureCollection, Feature, or Geometry
 * Returns [[minLat, minLng], [maxLat, maxLng]] for Leaflet, plus [minLng, minLat, maxLng, maxLat]
 */
export function calculateBBox(geoData) {
  if (geoData && typeof geoData === 'object' && bboxCache.has(geoData)) {
    return bboxCache.get(geoData);
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processCoords(coords) {
    if (!Array.isArray(coords)) return;
    if (coords.length >= 2 && coords[0] !== null && coords[1] !== null && typeof coords[0] !== 'object') {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    } else {
      for (let i = 0; i < coords.length; i++) {
        processCoords(coords[i]);
      }
    }
  }

  const features = geoData?.type === 'FeatureCollection'
    ? geoData.features
    : geoData?.type === 'Feature'
      ? [geoData]
      : Array.isArray(geoData)
        ? geoData
        : [{ geometry: geoData }];

  if (features && features.length > 0) {
    for (let i = 0; i < features.length; i++) {
      const coords = features[i]?.geometry?.coordinates;
      if (coords) processCoords(coords);
    }
  }

  if (!isFinite(minLng) || !isFinite(minLat) || !isFinite(maxLng) || !isFinite(maxLat)) {
    return {
      leafletBounds: [[-8.8, 111.0], [-6.5, 115.5]],
      bbox: [111.0, -8.8, 115.5, -6.5],
      isValid: false
    };
  }

  // Guard against non-WGS84 projected coordinates (e.g. UTM with lat > 90 or lng > 180)
  const isGeographic =
    Math.abs(minLat) <= 90 &&
    Math.abs(maxLat) <= 90 &&
    Math.abs(minLng) <= 180 &&
    Math.abs(maxLng) <= 180;

  const result = {
    leafletBounds: [[minLat, minLng], [maxLat, maxLng]],
    bbox: [minLng, minLat, maxLng, maxLat],
    isValid: isGeographic
  };

  if (geoData && typeof geoData === 'object') {
    bboxCache.set(geoData, result);
  }

  return result;
}

/**
 * Calculate Haversine distance between two [lng, lat] points in meters
 */
export function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
}

/**
 * Calculate total length of a LineString or MultiLineString coordinate array in meters
 */
export function calculateLineLength(coordinates, geomType = 'LineString') {
  let totalMeters = 0;
  if (!coordinates || !coordinates.length) return 0;

  if (geomType === 'LineString') {
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalMeters += haversineDistance(coordinates[i], coordinates[i + 1]);
    }
  } else if (geomType === 'MultiLineString') {
    coordinates.forEach((line) => {
      for (let i = 0; i < line.length - 1; i++) {
        totalMeters += haversineDistance(line[i], line[i + 1]);
      }
    });
  }
  return totalMeters;
}

/**
 * Calculate geodesic polygon area in square meters using spherical excess formula
 */
export function calculatePolygonArea(coordinates, geomType = 'Polygon') {
  if (!coordinates || !coordinates.length) return 0;

  function ringArea(ring) {
    if (!ring || ring.length < 3) return 0;
    const toRad = (deg) => (deg * Math.PI) / 180;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      area += toRad(p2[0] - p1[0]) * (2 + Math.sin(toRad(p1[1])) + Math.sin(toRad(p2[1])));
    }
    area = (Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS) / 2;
    return area;
  }

  let totalArea = 0;
  if (geomType === 'Polygon') {
    // Outer ring positive, holes negative
    totalArea += ringArea(coordinates[0]);
    for (let h = 1; h < coordinates.length; h++) {
      totalArea -= ringArea(coordinates[h]);
    }
  } else if (geomType === 'MultiPolygon') {
    coordinates.forEach((poly) => {
      totalArea += ringArea(poly[0]);
      for (let h = 1; h < poly.length; h++) {
        totalArea -= ringArea(poly[h]);
      }
    });
  }
  return Math.max(0, totalArea);
}

/**
 * Formats area nicely into m², Ha, or km²
 */
export function formatArea(squareMeters) {
  if (!squareMeters || squareMeters <= 0) return '0 m²';
  if (squareMeters >= 1000000) {
    return `${(squareMeters / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km² (${(squareMeters / 10000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ha)`;
  }
  if (squareMeters >= 10000) {
    return `${(squareMeters / 10000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} ha (${squareMeters.toLocaleString('id-ID', { maximumFractionDigits: 0 })} m²)`;
  }
  return `${squareMeters.toLocaleString('id-ID', { maximumFractionDigits: 1 })} m²`;
}

/**
 * Formats length nicely into m or km
 */
export function formatLength(meters) {
  if (!meters || meters <= 0) return '0 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} km`;
  }
  return `${meters.toLocaleString('id-ID', { maximumFractionDigits: 1 })} m`;
}

/**
 * Formats coordinates for status bar
 */
export function formatLatLong(lat, lng) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lng).toFixed(5)}° ${ew}`;
}

/**
 * Estimates UTM zone from longitude and latitude
 */
export function getUtmZoneString(lng, lat) {
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return 'Unknown CRS';
  const zoneNumber = Math.floor((lng + 180) / 6) + 1;
  const hem = lat >= 0 ? 'N' : 'S';
  return `UTM Zone ${zoneNumber}${hem}`;
}

/**
 * Determine predominant geometry type
 */
export function detectGeometryType(features) {
  if (!features || !features.length) return 'Unknown';
  const types = new Set();
  features.forEach((f) => {
    if (f?.geometry?.type) types.add(f.geometry.type);
  });
  if (types.size === 1) return [...types][0];
  if (types.size === 0) return 'Empty';
  return 'Mixed (' + [...types].join(', ') + ')';
}
