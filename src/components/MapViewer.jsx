import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFeatureColor, NPGT_INDICATORS } from '../utils/gisUtils';
import { BASEMAP_OPTIONS } from './BasemapSelector';

export default function MapViewer({
  features,
  activeIndicator,
  selectedFeature,
  onFeatureClick,
  onCursorMove,
  activeBasemap,
  layerOpacity = 0.7,
  layerStrokeWidth = 1.5,
  measureMode,
  measurePoints,
  onAddMeasurePoint,
  mapRefOut
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const measureLayerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Kecamatan Ujungpangkah, Kab. Gresik, Jawa Timur
    const map = L.map(mapContainerRef.current, {
      center: [-6.945, 112.55],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Zoom control position
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const bm = BASEMAP_OPTIONS.find(b => b.id === activeBasemap) || BASEMAP_OPTIONS[0];
    tileLayerRef.current = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: 19
    }).addTo(map);

    // Measure layer group
    measureLayerRef.current = L.layerGroup().addTo(map);

    // Mouse Move event for coordinates HUD
    map.on('mousemove', (e) => {
      onCursorMove?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // Click on map for measurement
    map.on('click', (e) => {
      if (measureMode) {
        onAddMeasurePoint?.([e.latlng.lat, e.latlng.lng]);
      }
    });

    mapInstanceRef.current = map;
    if (mapRefOut) mapRefOut.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const bm = BASEMAP_OPTIONS.find(b => b.id === activeBasemap) || BASEMAP_OPTIONS[0];
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(bm.url, {
      attribution: bm.attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
  }, [activeBasemap]);

  // Render & Update GeoJSON Polygons with NPGT Indicator Styling
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    if (!features || !features.length) return;

    const geoData = {
      type: "FeatureCollection",
      features: features
    };

    geojsonLayerRef.current = L.geoJSON(geoData, {
      style: (feature) => {
        const isSelected = selectedFeature && selectedFeature.properties?.OBJECTID === feature.properties?.OBJECTID;
        const color = getFeatureColor(feature, activeIndicator);

        return {
          fillColor: color,
          fillOpacity: isSelected ? 0.9 : layerOpacity,
          color: isSelected ? '#38BDF8' : '#FFFFFF',
          weight: isSelected ? 3 : layerStrokeWidth,
          opacity: 0.9,
          dashArray: isSelected ? '4' : null
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const val = props[activeIndicator] || '-';
        const indLabel = NPGT_INDICATORS[activeIndicator]?.label || activeIndicator;

        // Interactive Tooltip on hover
        layer.bindTooltip(`
          <div class="px-2 py-1 text-xs font-sans text-slate-100 bg-slate-900/95 border border-white/20 rounded shadow-xl">
            <div class="font-bold text-sky-400 text-sm mb-0.5">${props.NAMOBJ || props.WADMKD || 'Fitur'}</div>
            <div class="text-[11px] text-slate-300 font-mono">Luas: <span class="text-white font-semibold">${props.LUAS_HA || '-'} Ha</span></div>
            <div class="text-[11px] text-slate-300 font-mono">${activeIndicator}: <span class="text-emerald-400 font-bold">${val}</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">Guna Lahan: ${props.GUNA_TNH || '-'}</div>
          </div>
        `, {
          sticky: true,
          direction: 'top',
          className: 'leaflet-custom-tooltip'
        });

        // Click event
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onFeatureClick?.(feature);
        });

        // Hover highlight
        layer.on('mouseover', function () {
          this.setStyle({
            weight: layerStrokeWidth + 1.5,
            color: '#38BDF8',
            fillOpacity: Math.min(layerOpacity + 0.2, 1)
          });
        });

        layer.on('mouseout', function () {
          const isSelected = selectedFeature && selectedFeature.properties?.OBJECTID === feature.properties?.OBJECTID;
          geojsonLayerRef.current?.resetStyle(this);
          if (isSelected) {
            this.setStyle({
              fillOpacity: 0.9,
              color: '#38BDF8',
              weight: 3
            });
          }
        });
      }
    }).addTo(map);

  }, [features, activeIndicator, selectedFeature, layerOpacity, layerStrokeWidth]);

  // Render Measurement Overlay
  useEffect(() => {
    if (!measureLayerRef.current) return;
    measureLayerRef.current.clearLayers();

    if (!measurePoints || measurePoints.length === 0) return;

    measurePoints.forEach((pt, i) => {
      const marker = L.circleMarker(pt, {
        radius: 5,
        color: '#F59E0B',
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 2
      });
      measureLayerRef.current.addLayer(marker);
    });

    if (measurePoints.length >= 2) {
      if (measureMode === 'distance') {
        const polyline = L.polyline(measurePoints, {
          color: '#F59E0B',
          weight: 3,
          dashArray: '6, 6'
        });
        measureLayerRef.current.addLayer(polyline);
      } else if (measureMode === 'area' && measurePoints.length >= 3) {
        const polygon = L.polygon(measurePoints, {
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '4, 4'
        });
        measureLayerRef.current.addLayer(polygon);
      }
    }
  }, [measurePoints, measureMode]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />
    </div>
  );
}
