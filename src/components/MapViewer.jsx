import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Layers,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Ruler,
  Square,
  RotateCcw,
  MapPin,
  Compass,
  Upload,
  Sparkles,
  MousePointerClick,
  Filter,
  X
} from 'lucide-react';
import {
  calculateBBox,
  haversineDistance,
  calculatePolygonArea,
  formatArea,
  formatLength,
  formatLatLong,
  getUtmZoneString
} from '../utils/spatialCalculations';
import { projectToNative } from '../utils/geoParser';

// Available Basemaps
export const BASEMAPS = [
  {
    id: 'google-hybrid',
    name: 'Google Hybrid (Satelit + Jalan)',
    category: 'Google',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  {
    id: 'google-sat',
    name: 'Google Satellite',
    category: 'Google',
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  {
    id: 'google-streets',
    name: 'Google Streets',
    category: 'Google',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  {
    id: 'google-terrain',
    name: 'Google Terrain',
    category: 'Google',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  {
    id: 'esri-hybrid',
    name: 'Esri Hybrid (Satelit + Label)',
    category: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19
  },
  {
    id: 'esri-sat',
    name: 'Esri Satellite',
    category: 'Satelit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    category: 'Vektor',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  {
    id: 'carto-light',
    name: 'CartoDB Positron (Terang)',
    category: 'Minimalis',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20
  },
  {
    id: 'carto-dark',
    name: 'CartoDB Dark Matter (Gelap)',
    category: 'Minimalis',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap (Topografi)',
    category: 'Topografi',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
    maxZoom: 17
  }
];

// Compute zoom-adaptive outline weight so polygons stay clean when zoomed out
function getAdaptiveOutlineWeight(baseWeight, zoom) {
  if (zoom <= 10) return Math.min(baseWeight * 0.2, 0.3);
  if (zoom <= 12) return Math.min(baseWeight * 0.4, 0.55);
  if (zoom <= 14) return Math.min(baseWeight * 0.7, 0.95);
  return baseWeight;
}

// Build Leaflet style function for a given layer & zoom level
// Note (Opsi 1): Layer transparency (layer.fillOpacity) is applied at the <canvas> DOM container level,
// while internal Canvas paths are drawn at 100% opacity (1.0) to eliminate sub-pixel alpha seams.
function buildLayerStyleFn(layer, zoom, legendSelectedCategory = null) {
  const defaultColor = layer.color || '#3b82f6';
  const thematicCol = layer.thematic?.column;
  const colorMap = layer.thematic?.colorMap;
  const showOutline = layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true);
  const baseWeight = layer.weight !== undefined && layer.weight > 0 ? layer.weight : 1.2;
  const adaptiveWeight = getAdaptiveOutlineWeight(baseWeight, zoom);
  const baseStrokeColor = layer.thematic ? '#0f172a' : (layer.color || '#1e40af');

  // Opsi 1: 100% opaque seam-welding stroke in the exact same fillColor
  const antiGapWeight = zoom <= 11 ? 1.5 : zoom <= 13 ? 1.15 : 0.85;

  const isLayerFiltered = Boolean(
    legendSelectedCategory && legendSelectedCategory.layerId === layer.id
  );
  const targetCategoryVal = isLayerFiltered ? legendSelectedCategory.value : null;

  return (feature) => {
    let fillColor = defaultColor;
    let val = '';
    if (thematicCol && colorMap) {
      val = String(feature?.properties?.[thematicCol] || '').trim() || '(kosong)';
      if (colorMap[val]) {
        fillColor = colorMap[val];
      }
    }

    if (isLayerFiltered) {
      const matches = val === targetCategoryVal;
      if (matches) {
        return {
          stroke: true,
          color: '#ffffff',
          weight: Math.max(2.4, adaptiveWeight + 1.2),
          opacity: 1.0,
          lineJoin: 'round',
          lineCap: 'round',
          fillColor,
          fillOpacity: 1.0
        };
      } else {
        return {
          stroke: true,
          color: '#334155',
          weight: 0.5,
          opacity: 0.15,
          lineJoin: 'round',
          lineCap: 'round',
          fillColor: '#070b12',
          fillOpacity: 0.05
        };
      }
    }

    if (showOutline) {
      return {
        stroke: true,
        color: baseStrokeColor,
        weight: adaptiveWeight,
        opacity: zoom <= 11 ? 0.65 : 0.9,
        lineJoin: 'round',
        lineCap: 'round',
        fillColor,
        fillOpacity: 1.0
      };
    }

    return {
      stroke: true,
      color: fillColor,
      weight: antiGapWeight,
      opacity: 1.0,
      lineJoin: 'round',
      lineCap: 'round',
      fillColor,
      fillOpacity: 1.0
    };
  };
}

/**
 * Enhanced HTML5 Canvas Renderer combining:
 * - Opsi 1: Layer-Level CSS Opacity + 100% Opaque Buffer Seam Welding
 * - Opsi 2: Topological Integer Pixel Grid Snapping (Delta Encoding) with smoothFactor: 0
 * - Opsi 3: Color-Batched Multi-Path Rendering (1 fill + 1 stroke per color category)
 */
class QuantizedCanvasRenderer extends L.Canvas {
  constructor(options) {
    super(options);
    this._containerOpacity = options?.containerOpacity !== undefined ? options.containerOpacity : 1;
    this._containerVisible = options?.containerVisible !== undefined ? options.containerVisible : true;
    this._polyBatches = null;
  }

  _initContainer() {
    super._initContainer();
    if (this._container) {
      this._container.style.opacity = String(this._containerOpacity);
      this._container.style.display = this._containerVisible ? '' : 'none';
      // Disable direct canvas DOM pointer capture so map-level hit-testing works across all stacked canvases
      this._container.style.pointerEvents = 'none';
    }
  }

  setContainerOpacity(opacity) {
    const clamped = Math.max(0, Math.min(1, opacity !== undefined ? opacity : 0.75));
    this._containerOpacity = clamped;
    if (this._container) {
      this._container.style.opacity = String(clamped);
    }
  }

  setContainerVisible(visible) {
    this._containerVisible = Boolean(visible);
    if (this._container) {
      this._container.style.display = visible ? '' : 'none';
      this._container.style.pointerEvents = 'none';
    }
  }

  _draw() {
    const bounds = this._redrawBounds;
    const ctx = this._ctx;
    if (!ctx) return;

    ctx.save();
    if (bounds) {
      const size = bounds.getSize();
      ctx.beginPath();
      ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
      ctx.clip();
    }

    this._drawing = true;
    this._polyBatches = new Map();
    if (!bounds) {
      this._drawnLayers = {};
    } else if (!this._drawnLayers) {
      this._drawnLayers = {};
    }

    for (let order = this._drawFirst; order; order = order.next) {
      const layer = order.layer;
      if (!bounds || (layer._pxBounds && layer._pxBounds.intersects(bounds))) {
        layer._updatePath();
      }
    }

    this._flushPolyBatches(ctx);
    this._polyBatches = null;
    this._drawing = false;

    ctx.restore();
  }

  _appendQuantizedRings(ctx, parts, closed) {
    const len = parts.length;
    for (let i = 0; i < len; i++) {
      const ring = parts[i];
      const ringLen = ring.length;
      if (ringLen === 0) continue;

      // Opsi 2: Snap to integer pixel grid (1px precision) so shared vertices match 100%
      let prevQx = (ring[0].x + 0.5) | 0;
      let prevQy = (ring[0].y + 0.5) | 0;
      ctx.moveTo(prevQx, prevQy);

      let writtenCount = 1;

      for (let j = 1; j < ringLen; j++) {
        const pt = ring[j];
        const qx = (pt.x + 0.5) | 0;
        const qy = (pt.y + 0.5) | 0;

        // Delta Encoding: skip zero-delta points
        if (qx !== prevQx || qy !== prevQy || j === ringLen - 1) {
          ctx.lineTo(qx, qy);
          prevQx = qx;
          prevQy = qy;
          writtenCount++;
        }
      }

      if (closed && writtenCount >= 2) {
        ctx.closePath();
      }
    }
  }

  _flushPolyBatches(ctx) {
    if (!this._polyBatches || this._polyBatches.size === 0) return;

    // Pass 1: Fill + same-color seam weld for each color category in a single unified path
    for (const batch of this._polyBatches.values()) {
      const { opts, fillColor, strokeColor, layers } = batch;
      ctx.beginPath();

      for (let k = 0; k < layers.length; k++) {
        const parts = layers[k]._parts;
        if (parts && parts.length > 0) {
          this._appendQuantizedRings(ctx, parts, true);
        }
      }

      if (opts.fill) {
        const alpha = opts.fillOpacity !== undefined ? opts.fillOpacity : 1.0;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fillColor;
        // 'nonzero' prevents XOR gaps when quantized sub-polygons touch/overlap by 1px
        ctx.fill('nonzero');

        // Weld sub-pixel seams between adjacent polygons of the same color
        if (ctx.setLineDash) ctx.setLineDash([]);
        ctx.lineWidth = strokeColor === fillColor ? (opts.weight || 1.35) : 1.15;
        ctx.strokeStyle = fillColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Pass 2: If user explicitly enabled a contrasting outline, draw it on top
      if (opts.stroke && opts.weight > 0 && strokeColor !== fillColor) {
        if (ctx.setLineDash) {
          ctx.setLineDash(opts._dashArray || []);
        }
        ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 0.85;
        ctx.lineWidth = opts.weight;
        ctx.strokeStyle = strokeColor;
        ctx.lineCap = opts.lineCap || 'round';
        ctx.lineJoin = opts.lineJoin || 'round';
        ctx.stroke();
      }
    }

    this._polyBatches.clear();
  }

  _updatePoly(layer, closed) {
    if (!this._drawing) return;
    const parts = layer._parts;
    if (!parts || !parts.length) return;

    // Register in _drawnLayers so Leaflet's L.Canvas hit-detection (_onClick / _handleMouseMove) works!
    if (!this._drawnLayers) {
      this._drawnLayers = {};
    }
    this._drawnLayers[layer._leaflet_id] = layer;

    // Opsi 3: Batch closed polygons by color & style
    if (closed && this._polyBatches) {
      const opts = layer.options;
      const fillColor = opts.fillColor || opts.color || '#3b82f6';
      const strokeColor = opts.color || fillColor;
      const key = `${fillColor}|${strokeColor}|${opts.weight || 0}|${opts.opacity ?? 1}|${opts.fillOpacity ?? 1}`;

      let batch = this._polyBatches.get(key);
      if (!batch) {
        batch = { opts, fillColor, strokeColor, layers: [] };
        this._polyBatches.set(key, batch);
      }
      batch.layers.push(layer);
      return;
    }

    // Open polylines (e.g. LineString, measurement lines): flush pending batches and draw immediately
    const ctx = this._ctx;
    this._flushPolyBatches(ctx);
    ctx.beginPath();
    this._appendQuantizedRings(ctx, parts, false);
    this._fillStroke(ctx, layer);
  }
}

function createQuantizedCanvas(options) {
  return new QuantizedCanvasRenderer(options);
}

export default function MapViewer({
  layers = [],
  selectedFeature = null,
  onSelectFeature,
  activeLayer = null,
  activeLayerId,
  onSelectActiveLayer,
  zoomToTrigger,
  fitAllTrigger,
  onOpenUpload,
  onToggleAllOutlines,
  legendSelectedCategory = null,
  onClearLegendCategory
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const canvasRendererRef = useRef(null);
  const overlayRendererRef = useRef(null);
  const baseTileGroupRef = useRef(null);
  const labelTileGroupRef = useRef(null);
  const vectorLayersGroupRef = useRef(null);
  const hoverGroupRef = useRef(null);
  const highlightGroupRef = useRef(null);
  const measureGroupRef = useRef(null);
  const sharedTooltipRef = useRef(null);

  // Cache L.geoJSON instances by layer.id -> { geoJsonLayer, dataRef, styleKey, layerRef }
  const layerCacheRef = useRef(new Map());
  const onSelectFeatureRef = useRef(onSelectFeature);
  onSelectFeatureRef.current = onSelectFeature;

  const legendSelectedCategoryRef = useRef(legendSelectedCategory);
  legendSelectedCategoryRef.current = legendSelectedCategory;

  // Direct DOM refs for 60fps coordinate readout without triggering React re-renders
  const latLngSpanRef = useRef(null);
  const nativeCoordSpanRef = useRef(null);
  const zoomSpanRef = useRef(null);
  const activeLayerCrsRef = useRef(activeLayer?.crsCode || 'EPSG:4326');
  activeLayerCrsRef.current = activeLayer?.crsCode || 'EPSG:4326';

  // UI state
  const [currentBasemap, setCurrentBasemap] = useState(BASEMAPS[0].id);
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [measureMode, setMeasureMode] = useState(null); // 'distance' | 'area' | null
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureResult, setMeasureResult] = useState('');
  const measureModeRef = useRef(null);
  measureModeRef.current = measureMode;

  // 1. Initialize Map with Quantized Hardware-Accelerated Canvas Renderer
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const canvasRenderer = createQuantizedCanvas({ padding: 0.5, tolerance: 2 });
    const overlayRenderer = createQuantizedCanvas({ padding: 0.25, pane: 'markerPane' });
    canvasRendererRef.current = canvasRenderer;
    overlayRendererRef.current = overlayRenderer;

    // Center of East Java / Indonesia by default
    const map = L.map(mapContainerRef.current, {
      center: [-7.536, 112.238],
      zoom: 9,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      renderer: canvasRenderer
    });

    // Create groups
    const baseGroup = L.layerGroup().addTo(map);
    const labelGroup = L.layerGroup().addTo(map);
    const vectorGroup = L.layerGroup().addTo(map);
    const hoverGroup = L.layerGroup().addTo(map);
    const highlightGroup = L.layerGroup().addTo(map);
    const measureGroup = L.layerGroup().addTo(map);

    const sharedTooltip = L.tooltip({
      sticky: true,
      opacity: 0.95,
      direction: 'top',
      offset: [0, -8]
    });

    baseTileGroupRef.current = baseGroup;
    labelTileGroupRef.current = labelGroup;
    vectorLayersGroupRef.current = vectorGroup;
    hoverGroupRef.current = hoverGroup;
    highlightGroupRef.current = highlightGroup;
    measureGroupRef.current = measureGroup;
    sharedTooltipRef.current = sharedTooltip;
    mapInstanceRef.current = map;

    // Helper: deterministic hit-test across all visible vector layers from top to bottom
    const findHitFeature = (layerPoint) => {
      if (!layerPoint) return null;
      const entries = Array.from(layerCacheRef.current.values());
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (!entry.layerRef?.visible || !entry.geoJsonLayer) continue;
        let matchedSubLayer = null;
        const isFilterActive = legendSelectedCategoryRef.current?.layerId === entry.layerRef.id;
        const filterCol = legendSelectedCategoryRef.current?.column;
        const filterVal = legendSelectedCategoryRef.current?.value;

        entry.geoJsonLayer.eachLayer((subLayer) => {
          if (!matchedSubLayer && subLayer._containsPoint && subLayer._containsPoint(layerPoint)) {
            if (isFilterActive && filterCol) {
              const val = String(subLayer.feature?.properties?.[filterCol] || '').trim() || '(kosong)';
              if (val === filterVal) {
                matchedSubLayer = subLayer;
              }
            } else {
              matchedSubLayer = subLayer;
            }
          }
        });
        if (matchedSubLayer && matchedSubLayer.feature) {
          return {
            feature: matchedSubLayer.feature,
            layer: entry.layerRef
          };
        }
      }
      return null;
    };

    let hoveredFeatureRef = null;

    // Throttled mousemove via requestAnimationFrame (zero React re-renders!)
    let rafId = null;
    map.on('mousemove', (e) => {
      if (rafId) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const layerPoint = e.layerPoint;
      const latlng = e.latlng;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (latLngSpanRef.current) {
          latLngSpanRef.current.textContent = formatLatLong(lat, lng);
        }
        if (nativeCoordSpanRef.current) {
          const crsCode = activeLayerCrsRef.current;
          if (crsCode && crsCode !== 'EPSG:4326') {
            const nat = projectToNative(lng, lat, crsCode);
            if (nat) {
              nativeCoordSpanRef.current.textContent = `X: ${Math.round(nat.x).toLocaleString('id-ID')} m, Y: ${Math.round(nat.y).toLocaleString('id-ID')} m`;
            }
          }
        }

        // Hover hit-testing for polygon inspection
        if (measureModeRef.current || map.dragging?.moving()) {
          return;
        }
        const hit = findHitFeature(layerPoint);
        if (hit) {
          if (mapContainerRef.current) {
            mapContainerRef.current.style.cursor = 'pointer';
          }
          if (hoveredFeatureRef !== hit.feature) {
            hoveredFeatureRef = hit.feature;
            const currentLayer = hit.layer;
            const props = hit.feature.properties || {};
            const activeCol = currentLayer.thematic?.column || currentLayer.npgtKey;
            const npgtVal = activeCol ? props[activeCol] : null;
            const subLabel =
              props.WADMKD ||
              props.NAMOBJ ||
              props.QNAME5 ||
              props.namobj ||
              props.wadmkd ||
              props.WADMKC ||
              props.name ||
              props.NAME ||
              props.id ||
              hit.feature.id ||
              'Fitur Spasial';
            const areaVal = props.LUAS_HA !== undefined ? Number(props.LUAS_HA) : NaN;
            const areaBadge =
              Number.isFinite(areaVal) && areaVal > 0
                ? ` <span class="font-mono text-teal-300">(${areaVal.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ha)</span>`
                : '';
            const title = npgtVal ? `${npgtVal}${subLabel ? ` • ${subLabel}` : ''}` : subLabel;

            if (sharedTooltipRef.current) {
              sharedTooltipRef.current
                .setLatLng(latlng)
                .setContent(
                  `<div class="text-xs text-white"><span class="font-semibold">${title}</span>${areaBadge}<div class="text-[10px] text-slate-300 mt-0.5">Klik poligon untuk rincian atribut</div></div>`
                )
                .openOn(map);
            }

            hoverGroup.clearLayers();
            const hoverOverlay = L.geoJSON(hit.feature, {
              renderer: overlayRendererRef.current,
              interactive: false,
              style: {
                stroke: true,
                color: '#ffffff',
                weight: 2.2,
                opacity: 0.95,
                fill: false
              }
            });
            hoverGroup.addLayer(hoverOverlay);
          } else if (sharedTooltipRef.current && map.hasLayer(sharedTooltipRef.current)) {
            sharedTooltipRef.current.setLatLng(latlng);
          }
        } else if (hoveredFeatureRef) {
          hoveredFeatureRef = null;
          if (mapContainerRef.current) {
            mapContainerRef.current.style.cursor = '';
          }
          if (sharedTooltipRef.current) {
            map.closeTooltip(sharedTooltipRef.current);
          }
          hoverGroup.clearLayers();
        }
      });
    });

    map.on('mouseout', () => {
      hoveredFeatureRef = null;
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = '';
      }
      if (sharedTooltipRef.current) {
        map.closeTooltip(sharedTooltipRef.current);
      }
      hoverGroup.clearLayers();
    });

    // Update zoom display & adaptive polygon edge weights on zoomend
    map.on('zoomend', () => {
      const z = map.getZoom();
      if (zoomSpanRef.current) {
        zoomSpanRef.current.textContent = `Zoom: ${z}`;
      }
      hoveredFeatureRef = null;
      hoverGroup.clearLayers();
      layerCacheRef.current.forEach((entry) => {
        if (entry.layerRef?.visible && vectorGroup.hasLayer(entry.geoJsonLayer)) {
          entry.geoJsonLayer.setStyle(buildLayerStyleFn(entry.layerRef, z, legendSelectedCategoryRef.current));
        }
      });
    });

    // Select feature on polygon click, or deselect when clicking empty map background
    map.on('click', (e) => {
      if (measureModeRef.current) return;
      const hit = findHitFeature(e.layerPoint);
      if (onSelectFeatureRef.current) {
        if (hit) {
          onSelectFeatureRef.current(hit.feature, hit.layer);
        } else {
          onSelectFeatureRef.current(null, null);
        }
      }
    });

    // Resize observer to auto-invalidate size
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      layerCacheRef.current.clear();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Manage Basemap tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileGroupRef.current) return;

    const baseGroup = baseTileGroupRef.current;
    const labelGroup = labelTileGroupRef.current;
    baseGroup.clearLayers();
    labelGroup.clearLayers();

    const selected = BASEMAPS.find((b) => b.id === currentBasemap) || BASEMAPS[0];
    const tile = L.tileLayer(selected.url, {
      attribution: selected.attribution,
      maxZoom: selected.maxZoom || 20,
      subdomains: selected.subdomains || 'abc'
    });
    baseGroup.addLayer(tile);

    if (selected.labelUrl) {
      const labelTile = L.tileLayer(selected.labelUrl, {
        maxZoom: selected.maxZoom || 19,
        pane: 'overlayPane'
      });
      labelGroup.addLayer(labelTile);
    }
  }, [currentBasemap]);

  // 3. Render Vector Layers (Cached L.geoJSON on Canvas Renderer)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vectorGroup = vectorLayersGroupRef.current;
    const hoverGroup = hoverGroupRef.current;
    if (!map || !vectorGroup) return;

    const currentZoom = map.getZoom() || 9;
    const cache = layerCacheRef.current;
    const activeIds = new Set(layers.map((l) => l.id));

    // 1. Remove deleted layers from cache and map
    for (const [cachedId, entry] of cache.entries()) {
      if (!activeIds.has(cachedId)) {
        if (vectorGroup.hasLayer(entry.geoJsonLayer)) {
          vectorGroup.removeLayer(entry.geoJsonLayer);
        }
        if (entry.renderer && map.hasLayer(entry.renderer)) {
          map.removeLayer(entry.renderer);
        }
        cache.delete(cachedId);
      }
    }

    // 2. Create or update each layer
    layers.forEach((layer) => {
      if (!layer.data) return;

      const layerOpacity = layer.fillOpacity !== undefined ? layer.fillOpacity : 0.75;

      const styleKey = JSON.stringify({
        color: layer.color,
        stroke: layer.stroke,
        weight: layer.weight,
        pointRadius: layer.pointRadius,
        thematicCol: layer.thematic?.column,
        thematicPalette: layer.thematic?.palette,
        thematicCount: layer.thematic?.categories?.length,
        selectedCategory: legendSelectedCategory?.layerId === layer.id ? legendSelectedCategory.value : null
      });

      let entry = cache.get(layer.id);

      // Only build L.geoJSON if not cached OR if underlying GeoJSON data object changed
      if (!entry || entry.dataRef !== layer.data) {
        if (entry && vectorGroup.hasLayer(entry.geoJsonLayer)) {
          vectorGroup.removeLayer(entry.geoJsonLayer);
        }
        if (entry?.renderer && map.hasLayer(entry.renderer)) {
          map.removeLayer(entry.renderer);
        }

        const layerRenderer = createQuantizedCanvas({
          padding: 0.5,
          tolerance: 2,
          containerOpacity: layerOpacity,
          containerVisible: Boolean(layer.visible)
        });

        const styleFn = buildLayerStyleFn(layer, currentZoom, legendSelectedCategory);

        const geoJsonLayer = L.geoJSON(layer.data, {
          renderer: layerRenderer,
          smoothFactor: 0, // Opsi 2: Disable independent per-polygon DP so shared borders never diverge
          style: styleFn,
          pointToLayer: (feature, latlng) => {
            const currentLayer = cache.get(layer.id)?.layerRef || layer;
            let fillColor = currentLayer.color || '#3b82f6';
            let val = '';
            if (currentLayer.thematic && currentLayer.thematic.column) {
              val = String(feature?.properties?.[currentLayer.thematic.column] || '').trim() || '(kosong)';
              if (currentLayer.thematic.colorMap && currentLayer.thematic.colorMap[val]) {
                fillColor = currentLayer.thematic.colorMap[val];
              }
            }
            const isFilterActive = legendSelectedCategory?.layerId === currentLayer.id;
            const matches = !isFilterActive || val === legendSelectedCategory.value;
            const showOutline = currentLayer.stroke === true && (currentLayer.weight !== undefined ? currentLayer.weight > 0 : true);
            return L.circleMarker(latlng, {
              renderer: layerRenderer,
              radius: matches ? (currentLayer.pointRadius || 6) : 3,
              fillColor,
              stroke: showOutline || (matches && isFilterActive),
              color: matches && isFilterActive ? '#ffffff' : '#ffffff',
              weight: matches && isFilterActive ? 2.5 : (showOutline ? 1.5 : 0),
              opacity: matches ? (showOutline ? 1 : 0) : 0.1,
              fillOpacity: matches ? 1.0 : 0.08
            });
          }
        });

        entry = {
          geoJsonLayer,
          renderer: layerRenderer,
          dataRef: layer.data,
          styleKey,
          layerRef: layer
        };
        cache.set(layer.id, entry);
      } else {
        entry.layerRef = layer;
        // Opsi 1: Update container CSS opacity instantaneously without re-rendering Canvas paths!
        if (entry.renderer) {
          entry.renderer.setContainerOpacity(layerOpacity);
        }
        if (entry.styleKey !== styleKey) {
          entry.styleKey = styleKey;
          entry.geoJsonLayer.setStyle(buildLayerStyleFn(layer, currentZoom, legendSelectedCategory));
        }
      }

      // Toggle visibility in vectorGroup without recreating L.geoJSON
      if (layer.visible) {
        if (entry.renderer) {
          entry.renderer.setContainerVisible(true);
          entry.renderer.setContainerOpacity(layerOpacity);
        }
        if (!vectorGroup.hasLayer(entry.geoJsonLayer)) {
          vectorGroup.addLayer(entry.geoJsonLayer);
          entry.geoJsonLayer.setStyle(buildLayerStyleFn(layer, currentZoom, legendSelectedCategory));
        }
      } else {
        if (entry.renderer) {
          entry.renderer.setContainerVisible(false);
        }
        if (vectorGroup.hasLayer(entry.geoJsonLayer)) {
          vectorGroup.removeLayer(entry.geoJsonLayer);
        }
      }
    });
  }, [layers, legendSelectedCategory]);

  // Auto-zoom to extent of matching category features from legend
  useEffect(() => {
    if (!legendSelectedCategory || !mapInstanceRef.current) return;
    const lyr = layers.find((l) => l.id === legendSelectedCategory.layerId);
    if (!lyr?.data?.features?.length) return;

    const matchedFeatures = lyr.data.features.filter((f) => {
      const val = String(f?.properties?.[legendSelectedCategory.column] || '').trim() || '(kosong)';
      return val === legendSelectedCategory.value;
    });

    if (matchedFeatures.length > 0) {
      const bbox = calculateBBox({ type: 'FeatureCollection', features: matchedFeatures });
      if (bbox && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bbox, {
          padding: [70, 70],
          maxZoom: 16,
          animate: true,
          duration: 0.75
        });
      }
    }
  }, [legendSelectedCategory, layers]);

  // 4. Highlight Selected Feature
  useEffect(() => {
    if (!mapInstanceRef.current || !highlightGroupRef.current) return;
    const highlightGroup = highlightGroupRef.current;
    highlightGroup.clearLayers();

    if (!selectedFeature) return;

    const highlightLayer = L.geoJSON(selectedFeature, {
      renderer: overlayRendererRef.current,
      interactive: false,
      style: {
        color: '#fbbf24', // Amber glow
        weight: 3.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.45,
        dashArray: '4, 4'
      },
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, {
          renderer: overlayRendererRef.current,
          radius: 9,
          fillColor: '#fbbf24',
          color: '#ffffff',
          weight: 2.5,
          fillOpacity: 0.9
        });
      }
    });

    highlightGroup.addLayer(highlightLayer);
  }, [selectedFeature]);

  // 5. Fit bounds to all layers on trigger OR when new layers are added
  const prevLayerCountRef = useRef(0);
  const prevFitTriggerRef = useRef(0);
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const totalCount = layers.length;
    const isNewLayerAdded = totalCount > prevLayerCountRef.current;
    prevLayerCountRef.current = totalCount;

    const isFitTriggered = fitAllTrigger !== prevFitTriggerRef.current && fitAllTrigger > 0;
    prevFitTriggerRef.current = fitAllTrigger;

    // Skip if not explicitly triggered and no new layer was added
    if (!isFitTriggered && !isNewLayerAdded) return;

    const visibleLayers = layers.filter((l) => l.visible && l.data);
    if (!visibleLayers.length) return;

    let combinedBBox = {
      minLng: Infinity,
      minLat: Infinity,
      maxLng: -Infinity,
      maxLat: -Infinity
    };

    visibleLayers.forEach((l) => {
      const { bbox, isValid } = calculateBBox(l.data);
      if (isValid) {
        if (bbox[0] < combinedBBox.minLng) combinedBBox.minLng = bbox[0];
        if (bbox[1] < combinedBBox.minLat) combinedBBox.minLat = bbox[1];
        if (bbox[2] > combinedBBox.maxLng) combinedBBox.maxLng = bbox[2];
        if (bbox[3] > combinedBBox.maxLat) combinedBBox.maxLat = bbox[3];
      }
    });

    if (isFinite(combinedBBox.minLng)) {
      // Handle single-point or zero-dimension bounding box
      const dLng = combinedBBox.maxLng - combinedBBox.minLng;
      const dLat = combinedBBox.maxLat - combinedBBox.minLat;
      if (dLng < 0.0001 && dLat < 0.0001) {
        // Single point — zoom to fixed level
        mapInstanceRef.current.setView(
          [(combinedBBox.minLat + combinedBBox.maxLat) / 2, (combinedBBox.minLng + combinedBBox.maxLng) / 2],
          15
        );
      } else {
        mapInstanceRef.current.fitBounds(
          [
            [combinedBBox.minLat, combinedBBox.minLng],
            [combinedBBox.maxLat, combinedBBox.maxLng]
          ],
          { padding: [40, 40], maxZoom: 16 }
        );
      }
    }
  }, [fitAllTrigger, layers]);

  // 6. Zoom to active or specific layer / feature bounds
  const prevZoomTimestampRef = useRef(0);
  useEffect(() => {
    if (!mapInstanceRef.current || !zoomToTrigger) return;
    if (zoomToTrigger.timestamp && zoomToTrigger.timestamp === prevZoomTimestampRef.current) return;
    prevZoomTimestampRef.current = zoomToTrigger.timestamp || Date.now();

    if (zoomToTrigger.bounds) {
      mapInstanceRef.current.fitBounds(zoomToTrigger.bounds, { padding: [40, 40], maxZoom: 17 });
      return;
    }

    const targetLayer = layers.find((l) => l.id === zoomToTrigger.layerId);
    if (!targetLayer || !targetLayer.data) return;

    const { leafletBounds, isValid } = calculateBBox(targetLayer.data);
    if (isValid) {
      mapInstanceRef.current.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [zoomToTrigger, layers]);

  // 6b. Auto-zoom to active layer (or first visible layer) extent on initial mount
  const hasAutoZoomedOnMountRef = useRef(false);
  useEffect(() => {
    if (!mapInstanceRef.current || hasAutoZoomedOnMountRef.current) return;
    const target = layers.find((l) => l.id === activeLayerId) || layers.find((l) => l.visible) || layers[0];
    if (target?.data) {
      const { leafletBounds, isValid } = calculateBBox(target.data);
      if (isValid) {
        hasAutoZoomedOnMountRef.current = true;
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 16 });
      }
    }
  }, [layers, activeLayerId]);

  // 7. Measurement Mode Handling
  useEffect(() => {
    if (!mapInstanceRef.current || !measureGroupRef.current) return;
    const map = mapInstanceRef.current;
    const measureGroup = measureGroupRef.current;

    measureGroup.clearLayers();
    if (!measureMode) {
      setMeasurePoints([]);
      setMeasureResult('');
      return;
    }

    const handleClick = (e) => {
      const newPt = [e.latlng.lng, e.latlng.lat];
      setMeasurePoints((prev) => {
        const next = [...prev, newPt];
        return next;
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [measureMode]);

  // Update measurement graphics whenever points change
  useEffect(() => {
    if (!measureGroupRef.current || !measureMode) return;
    const measureGroup = measureGroupRef.current;
    measureGroup.clearLayers();

    if (!measurePoints.length) return;

    // Draw vertex markers
    measurePoints.forEach((pt, idx) => {
      const marker = L.circleMarker([pt[1], pt[0]], {
        radius: 5,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      });
      measureGroup.addLayer(marker);
    });

    if (measureMode === 'distance' && measurePoints.length >= 2) {
      const latlngs = measurePoints.map((p) => [p[1], p[0]]);
      const polyline = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 3,
        dashArray: '5, 5'
      });
      measureGroup.addLayer(polyline);

      let totalDist = 0;
      for (let i = 0; i < measurePoints.length - 1; i++) {
        totalDist += haversineDistance(measurePoints[i], measurePoints[i + 1]);
      }
      setMeasureResult(`Panjang: ${formatLength(totalDist)} (${measurePoints.length} titik)`);
    } else if (measureMode === 'area' && measurePoints.length >= 3) {
      const latlngs = measurePoints.map((p) => [p[1], p[0]]);
      const polygon = L.polygon(latlngs, {
        color: '#10b981',
        weight: 2,
        fillColor: '#10b981',
        fillOpacity: 0.25
      });
      measureGroup.addLayer(polygon);

      const ring = [...measurePoints, measurePoints[0]];
      const totalArea = calculatePolygonArea([ring]);
      setMeasureResult(`Luas: ${formatArea(totalArea)}`);
    } else {
      setMeasureResult(
        measureMode === 'distance'
          ? 'Klik pada peta untuk menambah titik jarak...'
          : 'Klik minimal 3 titik untuk mengukur luas area...'
      );
    }
  }, [measurePoints, measureMode]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const npgtLayers = useMemo(() => layers.filter((l) => Boolean(l.npgtKey)), [layers]);

  return (
    <div className="relative size-full overflow-hidden bg-[#070B10] font-sans">
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="size-full z-0 cursor-crosshair" />

      {/* Empty State Banner if no layers loaded */}
      {layers.length === 0 && (
        <div className="absolute inset-0 z-[350] flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-md w-full rounded-2xl bg-[#0B111A]/95 border border-slate-800 p-6 shadow-2xl backdrop-blur-xl text-center text-slate-200">
            <div className="size-12 rounded-xl bg-teal-500/15 text-teal-300 grid place-items-center mx-auto mb-3.5 border border-teal-500/30">
              <Upload className="size-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Kanvas Spasial Siap Digunakan
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Unggah file Shapefile (.zip atau .shp+.dbf), GeoJSON, KML, CSV, atau muat data simulasi NPGT Kecamatan untuk memulai analisis.
            </p>
            <button
              type="button"
              onClick={onOpenUpload}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              <Upload className="size-4 stroke-[2.25]" />
              <span>Unggah Data Spasial / Pilih Simulasi</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Filter Legend Notification Pill */}
      {legendSelectedCategory && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B111A]/95 border border-teal-500/50 shadow-2xl backdrop-blur-md text-xs text-white animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full shrink-0 shadow-sm border border-white/40"
              style={{ backgroundColor: legendSelectedCategory.color || '#2dd4bf' }}
            />
            <span className="text-slate-300">
              Menampilkan: <strong className="text-teal-300 font-semibold">{legendSelectedCategory.value}</strong>
            </span>
          </div>

          {legendSelectedCategory.areaHa ? (
            <span className="font-mono text-[11px] text-slate-400 border-l border-slate-700/80 pl-2">
              {formatNumber(legendSelectedCategory.areaHa)} Ha
            </span>
          ) : null}

          <div className="flex items-center gap-1 border-l border-slate-700/80 pl-1.5">
            <button
              type="button"
              onClick={() => {
                const lyr = layers.find((l) => l.id === legendSelectedCategory.layerId);
                if (lyr?.data?.features) {
                  const matched = lyr.data.features.filter((f) => {
                    const val = String(f?.properties?.[legendSelectedCategory.column] || '').trim() || '(kosong)';
                    return val === legendSelectedCategory.value;
                  });
                  if (matched.length) {
                    const b = calculateBBox({ type: 'FeatureCollection', features: matched });
                    if (b && mapInstanceRef.current) {
                      mapInstanceRef.current.fitBounds(b, { padding: [70, 70], maxZoom: 16 });
                    }
                  }
                }
              }}
              title="Fokuskan kembali ke bidang poligon ini (Zoom to Extent)"
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Crosshair className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={onClearLegendCategory}
              title="Tampilkan semua bidang poligon (Reset Filter)"
              className="flex items-center gap-1 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              <span>Semua</span>
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {/* Top Left Navigation / Zoom Controls */}
      <div className="absolute top-3.5 left-3.5 z-[400] flex flex-col gap-1.5">
        <div className="flex flex-col overflow-hidden rounded-xl bg-[#0B111A]/95 shadow-xl backdrop-blur-md border border-slate-800 text-slate-200">
          <button
            type="button"
            title="Perbesar (Zoom In)"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2 hover:bg-slate-800/80 active:bg-slate-700 transition-colors"
          >
            <ZoomIn className="size-4" />
          </button>
          <div className="h-px bg-slate-800" />
          <button
            type="button"
            title="Perkecil (Zoom Out)"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2 hover:bg-slate-800/80 active:bg-slate-700 transition-colors"
          >
            <ZoomOut className="size-4" />
          </button>
        </div>

        <button
          type="button"
          title="Fokuskan Seluruh Area Peta (Fit Bounds)"
          onClick={() => {
            const visible = layers.filter((l) => l.visible && l.data);
            if (!visible.length) return;
            let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
            visible.forEach((l) => {
              const { bbox, isValid } = calculateBBox(l.data);
              if (isValid) {
                if (bbox[0] < a) a = bbox[0];
                if (bbox[1] < b) b = bbox[1];
                if (bbox[2] > c) c = bbox[2];
                if (bbox[3] > d) d = bbox[3];
              }
            });
            if (isFinite(a)) {
              mapInstanceRef.current?.fitBounds([[b, a], [d, c]], { padding: [40, 40] });
            }
          }}
          className="rounded-xl bg-[#0B111A]/95 p-2 text-slate-300 hover:text-white shadow-xl backdrop-blur-md border border-slate-800 hover:bg-slate-800/80 transition-colors"
        >
          <Crosshair className="size-4" />
        </button>

        <button
          type="button"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          onClick={toggleFullscreen}
          className="rounded-xl bg-[#0B111A]/95 p-2 text-slate-300 hover:text-white shadow-xl backdrop-blur-md border border-slate-800 hover:bg-slate-800/80 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>

      {/* Top Right: Basemap Selector & GIS Tools */}
      <div className="absolute top-3.5 right-3.5 z-[400] flex items-center gap-2">
        {/* Quick Outline Toggle Button */}
        {layers.length > 0 && onToggleAllOutlines && (() => {
          const hasOutline = layers.some(
            (l) => l.visible && l.stroke === true && (l.weight !== undefined ? l.weight > 0 : true)
          );
          return (
            <button
              type="button"
              title={hasOutline ? 'Sembunyikan Garis Batas (Outline) Poligon' : 'Tampilkan Garis Batas (Outline) Poligon'}
              onClick={() => onToggleAllOutlines(!hasOutline)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md border transition-colors ${
                hasOutline
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-[#0B111A]/95 hover:bg-slate-800/80 text-slate-300 border-slate-800'
              }`}
            >
              <Square className="size-3.5" />
              <span>{hasOutline ? 'Outline: Aktif' : 'Outline: Nonaktif'}</span>
            </button>
          );
        })()}

        {/* Inspect / Select & Measurement Toolbar */}
        <div className="flex items-center rounded-xl bg-[#0B111A]/95 shadow-xl backdrop-blur-md border border-slate-800 p-0.5 text-slate-200">
          <button
            type="button"
            title="Mode Pilih / Inspect Poligon (Klik poligon di peta untuk melihat atribut)"
            onClick={() => {
              setMeasureMode(null);
              setMeasurePoints([]);
              setMeasureResult('');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              !measureMode
                ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <MousePointerClick className="size-3.5" />
            <span>Inspect</span>
          </button>

          <button
            type="button"
            title="Ukur Jarak Garis (Distance)"
            onClick={() => {
              setMeasureMode((prev) => (prev === 'distance' ? null : 'distance'));
              setMeasurePoints([]);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              measureMode === 'distance'
                ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <Ruler className="size-3.5" />
            <span>Jarak</span>
          </button>

          <button
            type="button"
            title="Ukur Luas Area Poligon"
            onClick={() => {
              setMeasureMode((prev) => (prev === 'area' ? null : 'area'));
              setMeasurePoints([]);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              measureMode === 'area'
                ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <Square className="size-3.5" />
            <span>Luas</span>
          </button>

          {measureMode && (
            <button
              type="button"
              title="Reset Pengukuran"
              onClick={() => {
                setMeasurePoints([]);
                setMeasureResult('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>

        {/* Basemap Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBasemapMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl bg-[#0B111A]/95 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md border border-slate-800 hover:bg-slate-800/80 transition-colors"
          >
            <Layers className="size-3.5 text-teal-400" />
            <span className="hidden sm:inline text-slate-400">Peta Dasar:</span>
            <span className="text-white font-semibold max-w-[130px] truncate">
              {BASEMAPS.find((b) => b.id === currentBasemap)?.name.replace(/\s*\(.*\)/, '')}
            </span>
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0B111A]/98 p-2 shadow-2xl backdrop-blur-xl border border-slate-800 text-xs text-slate-200 z-[500]">
              <div className="px-2.5 py-1.5 font-semibold text-slate-400 border-b border-slate-800/80 mb-1">
                Pilih Peta Dasar
              </div>
              <div className="space-y-0.5 max-h-72 overflow-y-auto">
                {BASEMAPS.map((base) => {
                  const isSelected = base.id === currentBasemap;
                  return (
                    <button
                      key={base.id}
                      type="button"
                      onClick={() => {
                        setCurrentBasemap(base.id);
                        setShowBasemapMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                          : 'hover:bg-slate-800/70 text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{base.name}</span>
                        <span className="text-[10px] text-slate-400">{base.category}</span>
                      </div>
                      {isSelected && <span className="size-2 rounded-full bg-teal-400 shadow-sm" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Measurement Info Toast / Status */}
      {measureMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2 rounded-full bg-[#0B111A]/95 px-4 py-2 shadow-2xl backdrop-blur-md border border-teal-500/40 text-xs text-white">
          <Compass className="size-3.5 text-teal-400 animate-spin" />
          <span className="font-medium">{measureResult}</span>
          <button
            type="button"
            onClick={() => setMeasureMode(null)}
            className="ml-2 rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] hover:bg-slate-700 text-slate-300"
          >
            Selesai
          </button>
        </div>
      )}

      {/* Bottom Coordinates, Native Projection, & CRS Status Bar */}
      <div className="absolute bottom-2.5 left-3.5 z-[400] flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#0B111A]/95 px-3 py-1 shadow-xl backdrop-blur-md border border-slate-800">
          <MapPin className="size-3 text-teal-400 shrink-0" />
          <span ref={latLngSpanRef} className="tabular-nums font-mono text-slate-200">
            {formatLatLong(-7.536, 112.238)}
          </span>

          {activeLayer?.crsCode && activeLayer.crsCode !== 'EPSG:4326' && (
            <>
              <span className="text-slate-700">|</span>
              <span ref={nativeCoordSpanRef} className="tabular-nums font-mono text-teal-300">
                X: — m, Y: — m
              </span>
            </>
          )}

          <span className="text-slate-700">|</span>
          <span ref={zoomSpanRef} className="text-slate-400 font-mono">Zoom: 9</span>

          <span className="text-slate-700">|</span>
          <span className="text-slate-300 font-mono font-medium flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-teal-400" />
            {activeLayer?.crsCode || 'EPSG:4326'}
          </span>
        </div>
      </div>
    </div>
  );
}
