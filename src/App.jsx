import React, { useState, useRef, useMemo } from 'react';
import Header from './components/Header';
import MapViewer from './components/MapViewer';
import NpgtPanel from './components/NpgtPanel';
import LayerManager from './components/LayerManager';
import BasemapSelector from './components/BasemapSelector';
import AttributeTable from './components/AttributeTable';
import InspectorModal from './components/InspectorModal';
import MeasureTools from './components/MeasureTools';
import UploadModal from './components/UploadModal';
import { SAMPLE_UJUNGPANGKAH_GEOJSON } from './data/sampleNpgtData';
import { calculateDistance, calculateGeodesicArea, NPGT_INDICATORS } from './utils/gisUtils';
import { 
  Compass, 
  Layers, 
  Map as MapIcon, 
  Palette, 
  Sparkles, 
  Info,
  Maximize2
} from 'lucide-react';

export default function App() {
  // Navigation & Tool states
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'layers' | 'styling'
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMeasureOpen, setIsMeasureOpen] = useState(false);
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);

  // Map & GIS states
  const [activeBasemap, setActiveBasemap] = useState('carto-dark');
  const [activeIndicator, setActiveIndicator] = useState('KSPOLA');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ lat: -6.945, lng: 112.55 });
  const [layerOpacity, setLayerOpacity] = useState(0.75);
  const [layerStrokeWidth, setLayerStrokeWidth] = useState(1.5);

  // Layers state
  const [features, setFeatures] = useState(SAMPLE_UJUNGPANGKAH_GEOJSON.features);
  const [layers, setLayers] = useState([
    {
      id: 'layer-ujungpangkah',
      name: 'NPGT Kec. Ujungpangkah (13 Desa)',
      visible: true,
      opacity: 0.75,
      strokeWidth: 1.5,
      featureCount: SAMPLE_UJUNGPANGKAH_GEOJSON.features.length,
      type: 'Poligon NPGT'
    }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-ujungpangkah');

  // Measuring tools state
  const [measureMode, setMeasureMode] = useState('distance'); // 'distance' | 'area'
  const [measurePoints, setMeasurePoints] = useState([]);

  const mapRef = useRef(null);

  // Filter features based on village dropdown if set
  const displayedFeatures = useMemo(() => {
    if (!selectedDesa) return features;
    return features.filter(f => f.properties?.WADMKD === selectedDesa);
  }, [features, selectedDesa]);

  // Measurement distance & area calculation
  const calculatedDistance = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += calculateDistance(
        measurePoints[i][0], measurePoints[i][1],
        measurePoints[i + 1][0], measurePoints[i + 1][1]
      );
    }
    return total;
  }, [measurePoints]);

  const calculatedArea = useMemo(() => {
    if (measurePoints.length < 3) return 0;
    const coords = measurePoints.map(p => [p[1], p[0]]); // [lon, lat]
    return calculateGeodesicArea(coords);
  }, [measurePoints]);

  const handleAddMeasurePoint = (latlng) => {
    setMeasurePoints(prev => [...prev, latlng]);
  };

  const handleClearMeasure = () => {
    setMeasurePoints([]);
  };

  // Reset view to Kec. Ujungpangkah center
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([-6.945, 112.55], 12);
    }
  };

  const handleZoomToFeature = (feature) => {
    if (!mapRef.current || !feature || !feature.geometry) return;
    try {
      const coords = feature.geometry.coordinates;
      let bounds = [];
      if (feature.geometry.type === 'Polygon') {
        bounds = coords[0].map(pt => [pt[1], pt[0]]);
      } else if (feature.geometry.type === 'MultiPolygon') {
        bounds = coords[0][0].map(pt => [pt[1], pt[0]]);
      }
      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (e) {
      console.warn('Could not fit bounds:', e);
    }
  };

  const handleLoadGeoJson = (geojson, fileName) => {
    const feats = geojson.features || [geojson];
    setFeatures(feats);
    setLayers(prev => [
      {
        id: `layer-${Date.now()}`,
        name: fileName || 'Imported Layer',
        visible: true,
        opacity: 0.75,
        strokeWidth: 1.5,
        featureCount: feats.length,
        type: 'GeoJSON FeatureCollection'
      },
      ...prev
    ]);
  };

  const handleLoadPresetSample = () => {
    setFeatures(SAMPLE_UJUNGPANGKAH_GEOJSON.features);
    setSelectedDesa('');
    setSelectedFeature(null);
    handleResetView();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070B10] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTableOpen={isTableOpen}
        setIsTableOpen={setIsTableOpen}
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
        isMeasureOpen={isMeasureOpen}
        setIsMeasureOpen={setIsMeasureOpen}
        cursorCoords={cursorCoords}
        totalFeatures={displayedFeatures.length}
        onResetView={handleResetView}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Interactive Dock / Panel */}
        <aside className="w-96 border-r border-white/10 z-20 flex flex-col bg-[#0B111B] shadow-2xl relative">
          {activeTab === 'analytics' && (
            <NpgtPanel
              features={features}
              activeIndicator={activeIndicator}
              setActiveIndicator={setActiveIndicator}
              selectedDesa={selectedDesa}
              setSelectedDesa={setSelectedDesa}
              onFeatureSelect={(f) => {
                setSelectedFeature(f);
                handleZoomToFeature(f);
              }}
            />
          )}

          {activeTab === 'layers' && (
            <LayerManager
              layers={layers}
              activeLayerId={activeLayerId}
              setActiveLayerId={setActiveLayerId}
              onToggleVisibility={(id) => {
                setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
              }}
              onUpdateOpacity={(id, op) => {
                setLayerOpacity(op);
                setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: op } : l));
              }}
              onUpdateStrokeWidth={(id, sw) => {
                setLayerStrokeWidth(sw);
                setLayers(prev => prev.map(l => l.id === id ? { ...l, strokeWidth: sw } : l));
              }}
              onZoomToLayer={handleResetView}
              onExportGeoJson={() => {
                const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features: displayedFeatures }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `NPGT_Layer_${activeIndicator}.geojson`;
                a.click();
              }}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeTab === 'styling' && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-sky-400" />
                  Legenda &amp; Skema Warna Aktif
                </h3>
                <span className="text-[11px] text-slate-400 font-mono block mb-3">
                  Indikator: <strong className="text-sky-300">{NPGT_INDICATORS[activeIndicator]?.label}</strong>
                </span>

                <div className="space-y-2">
                  {Object.entries(NPGT_INDICATORS[activeIndicator]?.colors || {}).map(([name, color]) => (
                    <div key={name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/60 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-slate-200">{name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulatory Reference Box */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-300 space-y-2">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Dasar Regulasi ATR/BPN
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Neraca Penatagunaan Tanah (NPGT) disusun berdasarkan Peraturan Menteri ATR/BPN tentang Penyelenggaraan Penataan Ruang dan Neraca Penatagunaan Tanah untuk mewujudkan kepastian hukum, optimalisasi hak atas tanah, dan ketahanan pangan Jawa Timur 2026.
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Central Map Canvas */}
        <main className="flex-1 relative h-full w-full">
          <MapViewer
            features={displayedFeatures}
            activeIndicator={activeIndicator}
            selectedFeature={selectedFeature}
            onFeatureClick={(f) => setSelectedFeature(f)}
            onCursorMove={(coords) => setCursorCoords(coords)}
            activeBasemap={activeBasemap}
            layerOpacity={layerOpacity}
            layerStrokeWidth={layerStrokeWidth}
            measureMode={isMeasureOpen ? measureMode : null}
            measurePoints={measurePoints}
            onAddMeasurePoint={handleAddMeasurePoint}
            mapRefOut={mapRef}
          />

          {/* Floating Map Floating Action Bar (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setIsBasemapOpen(!isBasemapOpen)}
              className="px-3 py-2 rounded-xl glass-panel text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 border border-white/10 shadow-lg cursor-pointer transition-all hover:border-sky-500/30"
            >
              <MapIcon className="w-4 h-4 text-sky-400" />
              <span>Peta Dasar</span>
            </button>
          </div>

          {/* Basemap Picker Modal */}
          <BasemapSelector
            activeBasemap={activeBasemap}
            onSelectBasemap={(bmId) => {
              setActiveBasemap(bmId);
              setIsBasemapOpen(false);
            }}
            isOpen={isBasemapOpen}
            onClose={() => setIsBasemapOpen(false)}
          />

          {/* Measuring Tools Drawer */}
          <MeasureTools
            isOpen={isMeasureOpen}
            onClose={() => setIsMeasureOpen(false)}
            measureMode={measureMode}
            setMeasureMode={setMeasureMode}
            measurePoints={measurePoints}
            onClearMeasure={handleClearMeasure}
            calculatedDistance={calculatedDistance}
            calculatedArea={calculatedArea}
          />

          {/* Feature Inspector */}
          {selectedFeature && (
            <InspectorModal
              feature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onZoomToFeature={handleZoomToFeature}
            />
          )}

          {/* Attribute Table Drawer */}
          <AttributeTable
            features={displayedFeatures}
            isOpen={isTableOpen}
            onClose={() => setIsTableOpen(false)}
            selectedFeatureId={selectedFeature?.properties?.OBJECTID}
            onFeatureSelect={(f) => {
              setSelectedFeature(f);
              handleZoomToFeature(f);
            }}
          />
        </main>
      </div>

      {/* Upload GIS Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadGeoJson={handleLoadGeoJson}
        onLoadPresetSample={handleLoadPresetSample}
      />
    </div>
  );
}
