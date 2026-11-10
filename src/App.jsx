import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map as MapIcon,
  BarChart3,
  Upload,
  Plus,
  Layers,
  Sparkles,
  Compass,
  Table,
  PanelLeftClose,
  PanelLeft,
  Crosshair,
  Download,
  FileCheck,
  Split
} from 'lucide-react';

import MapViewer from './components/MapViewer';
import LayerPanel from './components/LayerPanel';
import AttributeTable from './components/AttributeTable';
import ThematicModal from './components/ThematicModal';
import FeatureInspector from './components/FeatureInspector';
import UploadModal from './components/UploadModal';
import LegendWidget from './components/LegendWidget';
import NpgtDashboard from './components/NpgtDashboard';

import { parseShapefileZip, reprojectLayerData } from './utils/geoParser';
import { calculateBBox } from './utils/spatialCalculations';
import {
  create8NpgtLayers,
  buildLandUseLayerVariant,
  buildLandCapabilityLayerVariant
} from './utils/npgtData';

export default function App() {
  // Main Navigation View: 'map' | 'npgt'
  const [currentView, setCurrentView] = useState('map');

  // Spatial Layers list - starts empty by default (no dummy data)
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [legendSelectedCategory, setLegendSelectedCategory] = useState(null);

  // Selected feature for inspector
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedFeatureLayer, setSelectedFeatureLayer] = useState(null);

  // UI Modals & Drawers - isUploadOpen starts TRUE so popup appears when no data is loaded
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(true);
  const [isThematicOpen, setIsThematicOpen] = useState(false);
  const [thematicLayerId, setThematicLayerId] = useState(null);
  const [tableLayerId, setTableLayerId] = useState(null);

  // Triggers for map navigation
  const [zoomToTrigger, setZoomToTrigger] = useState(null);
  const [fitAllTrigger, setFitAllTrigger] = useState(0);

  // Color palette sequence for newly added layers
  const defaultColors = [
    '#3b82f6', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899'  // Pink
  ];

  // Active layer object
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0] || null;

  // Ensure existing NPGT layer sets in memory include the Penggunaan Tanah & Kemampuan Tanah layers
  useEffect(() => {
    const hasDjpaSet = layers.some((l) => l.id.startsWith('djpa-layer-'));
    const hasLandUseLayer = layers.some(
      (l) => l.isLandUse || l.npgtKey === 'QNAME5' || l.npgtKey === 'QREKLAS'
    );
    const hasCapabilityLayer = layers.some(
      (l) =>
        l.isLandCapability ||
        [
          'Lname', 'Uname', 'Xname', 'Dname', 'Ename',
          'LERENG', 'KDEFEK', 'TEKSTUR', 'DRAINS', 'EROSI',
          'L', 'U', 'X', 'D', 'E'
        ].includes(l.npgtKey)
    );
    if (hasDjpaSet && (!hasLandUseLayer || !hasCapabilityLayer)) {
      const baseDjpa = layers.find((l) => l.id.startsWith('djpa-layer-') && l.sourceData);
      if (baseDjpa) {
        const rebuilt = create8NpgtLayers(baseDjpa);
        if (rebuilt.length > 0) {
          setLayers((prev) => {
            const nonDjpa = prev.filter((l) => !l.id.startsWith('djpa-layer-'));
            return [...rebuilt, ...nonDjpa];
          });
          setActiveLayerId(rebuilt[0].id);
        }
      }
    }
  }, [layers]);

  // Add parsed layers to state
  const handleAddLayers = useCallback((newLayers) => {
    // If uploaded data has NPGT columns, check if we should auto-create the 8 analysis layers
    const firstNpgt = newLayers.find((nl) => nl.hasNpgt);
    if (firstNpgt) {
      const eightLayers = create8NpgtLayers(firstNpgt);
      if (eightLayers.length > 0) {
        setLayers((prev) => [...eightLayers, ...prev]);
        setActiveLayerId(eightLayers[0].id);
        setIsUploadOpen(false);
        setTimeout(() => setFitAllTrigger((t) => t + 1), 200);
        return;
      }
    }

    setLayers((prev) => {
      const updated = [...prev];
      let firstNewId = null;
      newLayers.forEach((nl, idx) => {
        const id = `layer-${Date.now()}-${idx}`;
        if (!firstNewId) firstNewId = id;
        const color = defaultColors[(prev.length + idx) % defaultColors.length];
        updated.push({
          id,
          name: nl.name,
          data: nl.data,
          visible: true,
          color,
          fillOpacity: 0.65,
          stroke: false,
          weight: 0,
          hasNpgt: nl.hasNpgt || false,
          crsInfo: nl.crsInfo || 'WGS84 Geographic (EPSG:4326)',
          crsCode: nl.crsCode || 'EPSG:4326',
          crsType: nl.crsType || 'Geographic',
          thematic: null
        });
      });
      // Set active layer to first newly added layer
      if (firstNewId) {
        setTimeout(() => setActiveLayerId(firstNewId), 0);
      }
      return updated;
    });

    setIsUploadOpen(false);
    if (newLayers.length > 0) {
      setTimeout(() => {
        setFitAllTrigger((t) => t + 1);
      }, 200);
    }
  }, []);

  // Duplicate dataset into 8 distinct layers focused on each analysis
  const handleDuplicateNpgt = useCallback((baseLayer) => {
    const targetLayer = baseLayer || layers.find((l) => l.hasNpgt) || layers[0];
    if (!targetLayer || !targetLayer.data) return;

    const eightLayers = create8NpgtLayers(targetLayer);
    if (!eightLayers.length) return;

    setLayers((prev) => {
      const remaining = prev.filter(
        (l) => !l.id.startsWith('djpa-layer-') && l.id !== targetLayer.id
      );
      return [...eightLayers, ...remaining];
    });

    setActiveLayerId(eightLayers[0].id);
    setCurrentView('map');
    setTimeout(() => {
      setFitAllTrigger((t) => t + 1);
    }, 150);
  }, [layers]);

  // Load sample dataset on user request from the popup
  const handleLoadSample = async (sampleKey) => {
    try {
      setIsUploadOpen(false);
      const baseUrl = import.meta.env.BASE_URL.endsWith('/')
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

      let url = `${baseUrl}samples/npgt_djpa_lengkap.geojson`;
      let title = 'Data NPGT DJPA';

      if (sampleKey === 'sungai') {
        url = `${baseUrl}samples/sungai_poligon.zip`;
        title = 'Sungai Poligon 25K';
      } else if (sampleKey === 'ujungpangkah') {
        url = `${baseUrl}samples/ujungpangkah_admin.zip`;
        title = 'Batas Adm Kec. Ujungpangkah';
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengunduh file contoh.');

      if (url.endsWith('.geojson')) {
        const json = await res.json();
        const baseLayer = {
          name: title,
          data: json,
          hasNpgt: true,
          crsInfo: 'WGS 84 / UTM Zone 49S (EPSG:32749)',
          crsCode: 'EPSG:32749'
        };
        const eightLayers = create8NpgtLayers(baseLayer);
        setLayers((prev) => [...eightLayers, ...prev.filter((l) => !l.id.startsWith('djpa-layer-'))]);
        setActiveLayerId(eightLayers[0].id);
        setCurrentView('map');
        setTimeout(() => setFitAllTrigger((t) => t + 1), 200);
        return;
      }

      const buf = await res.arrayBuffer();
      const parsed = await parseShapefileZip(buf, title);
      handleAddLayers(parsed);
    } catch (err) {
      console.error(err);
      alert(`Gagal memuat data contoh: ${err.message}`);
    }
  };

  // Layer state controls
  const handleToggleVisibility = useCallback((id) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
    setLegendSelectedCategory((prev) => (prev?.layerId === id ? null : prev));
  }, []);

  const handleSelectLegendCategory = useCallback((catInfo) => {
    setLegendSelectedCategory(catInfo);
    if (catInfo?.layerId) {
      setActiveLayerId(catInfo.layerId);
    }
  }, []);

  // Activate a layer; if it is one of the NPGT thematic layers, make it the active visible NPGT layer in 1 click
  const handleSelectActiveLayer = useCallback((id) => {
    setActiveLayerId(id);
    setSelectedFeatureLayer((prevLayer) => {
      if (prevLayer && prevLayer.id !== id && prevLayer.npgtKey) {
        setSelectedFeature(null);
        return null;
      }
      return prevLayer;
    });
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id);
      if (!target) return prev;
      if (target.npgtKey) {
        return prev.map((l) => {
          if (l.npgtKey) {
            return { ...l, visible: l.id === id };
          }
          return l;
        });
      }
      return prev;
    });
  }, []);

  const handleUpdateLayerStyle = useCallback((id, newStyles) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id);
      if (!target) return prev;

      // If CRS changed between projected systems, dynamically reproject coordinates
      if (newStyles.crsCode && newStyles.crsCode !== target.crsCode) {
        const reprojectedSource = target.sourceData
          ? reprojectLayerData(target.sourceData, target.crsCode, newStyles.crsCode)
          : null;
        setTimeout(() => setFitAllTrigger((t) => t + 1), 100);
        return prev.map((l) => {
          if (l.id === id || l.data === target.data || (target.sourceData && l.sourceData === target.sourceData)) {
            return {
              ...l,
              ...(l.id === id ? newStyles : {}),
              crsCode: newStyles.crsCode,
              crsInfo: newStyles.crsInfo || l.crsInfo,
              data: reprojectLayerData(l.data, target.crsCode, newStyles.crsCode),
              ...(reprojectedSource ? { sourceData: reprojectedSource } : {})
            };
          }
          return l;
        });
      }

      return prev.map((l) => (l.id === id ? { ...l, ...newStyles } : l));
    });
  }, []);

  const handleToggleAllOutlines = useCallback((showOutline) => {
    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        stroke: showOutline,
        weight: showOutline ? (l.weight > 0 ? l.weight : 1.2) : l.weight
      }))
    );
  }, []);

  const handleRemoveLayer = useCallback((id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setActiveLayerId((prev) => (prev === id ? null : prev));
    setTableLayerId((prev) => (prev === id ? null : prev));
    setLegendSelectedCategory((prev) => (prev?.layerId === id ? null : prev));
    setSelectedFeatureLayer((prev) => {
      if (prev?.id === id) {
        setSelectedFeature(null);
        return null;
      }
      return prev;
    });
  }, []);

  const handleZoomToLayer = useCallback((id) => {
    setZoomToTrigger({ layerId: id, timestamp: Date.now() });
  }, []);

  const handleSelectFeature = useCallback((feature, layer) => {
    setSelectedFeature(feature);
    setSelectedFeatureLayer(layer);
  }, []);

  const handleZoomToFeature = useCallback((feature) => {
    if (!feature) return;
    const { leafletBounds, isValid } = calculateBBox(feature);
    if (isValid) {
      setZoomToTrigger({ bounds: leafletBounds, timestamp: Date.now() });
    }
  }, []);

  const handleExportLayer = useCallback((layer) => {
    if (!layer?.data) return;
    const jsonStr = JSON.stringify(layer.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layer.name || 'layer'}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Apply Thematic classification
  const handleApplyThematic = useCallback((layerId, thematicConfig) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, thematic: thematicConfig } : l))
    );
  }, []);

  // Toggle Gambaran Penggunaan Tanah layer between QNAME5 and QREKLAS
  const handleToggleLandUseMode = useCallback((layerId, targetMode) => {
    setLegendSelectedCategory(null);
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return buildLandUseLayerVariant(l, targetMode);
      })
    );
    setSelectedFeatureLayer((prev) => {
      if (prev?.id === layerId) {
        setSelectedFeature(null);
        return null;
      }
      return prev;
    });
  }, []);

  // Toggle Gambaran Kemampuan Tanah layer between L, U, X, D, and E
  const handleToggleCapabilityMode = useCallback((layerId, targetMode) => {
    setLegendSelectedCategory(null);
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return buildLandCapabilityLayerVariant(l, targetMode);
      })
    );
    setSelectedFeatureLayer((prev) => {
      if (prev?.id === layerId) {
        setSelectedFeature(null);
        return null;
      }
      return prev;
    });
  }, []);

  const handleClearThematic = (layerId) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, thematic: null } : l))
    );
  };

  // View a specific NPGT indicator layer directly in the spatial map
  const handleViewIndicatorInMap = useCallback((indKey) => {
    const existing = layers.find(
      (l) =>
        l.npgtKey === indKey ||
        (indKey === 'OPTNH' && l.npgtKey === 'OPTIMALTNH') ||
        (indKey === 'QNAME5' && (l.isLandUse || l.npgtKey === 'QNAME5' || l.npgtKey === 'QREKLAS')) ||
        (indKey === 'Lname' &&
          (l.isLandCapability ||
            [
              'Lname', 'Uname', 'Xname', 'Dname', 'Ename',
              'LERENG', 'KDEFEK', 'TEKSTUR', 'DRAINS', 'EROSI',
              'L', 'U', 'X', 'D', 'E'
            ].includes(l.npgtKey)))
    );

    if (existing) {
      handleSelectActiveLayer(existing.id);
      setCurrentView('map');
      setTimeout(() => {
        setZoomToTrigger({ layerId: existing.id, timestamp: Date.now() });
      }, 120);
      return;
    }

    const targetLayer = activeLayer || layers.find((l) => l.hasNpgt) || layers[0];
    if (targetLayer && targetLayer.data) {
      const splitLayers = create8NpgtLayers(targetLayer);
      if (splitLayers.length > 0) {
        const matched =
          splitLayers.find(
            (l) =>
              l.npgtKey === indKey ||
              (indKey === 'OPTNH' && l.npgtKey === 'OPTIMALTNH') ||
              (indKey === 'QNAME5' && l.isLandUse) ||
              (indKey === 'Lname' && l.isLandCapability)
          ) || splitLayers[0];
        const withVisibility = splitLayers.map((l) => ({
          ...l,
          visible: l.id === matched.id
        }));
        setLayers((prev) => {
          const remaining = prev.filter(
            (l) => !l.id.startsWith('djpa-layer-') && l.id !== targetLayer.id
          );
          return [...withVisibility, ...remaining];
        });
        setActiveLayerId(matched.id);
        setCurrentView('map');
        setTimeout(() => {
          setZoomToTrigger({ layerId: matched.id, timestamp: Date.now() });
          setFitAllTrigger((t) => t + 1);
        }, 150);
        return;
      }
    }

    setCurrentView('map');
  }, [layers, activeLayer, handleSelectActiveLayer]);

  // When switching from Dashboard to Spatial Map, automatically zoom to active layer extent
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    if (prevViewRef.current === 'npgt' && currentView === 'map') {
      const targetLayer = activeLayer || layers.find((l) => l.visible) || layers[0];
      if (targetLayer) {
        setTimeout(() => {
          setZoomToTrigger({ layerId: targetLayer.id, timestamp: Date.now() });
        }, 120);
      }
    }
    prevViewRef.current = currentView;
  }, [currentView, activeLayer, layers]);
  // Check if any layer has NPGT data
  const hasNpgtData = layers.some((l) => l.hasNpgt);
  const npgtSplitLayers = layers.filter((l) => Boolean(l.npgtKey));

  // Extract regional metadata summary from active layer
  const sampleProps = activeLayer?.data?.features?.[0]?.properties || {};
  const kecName = sampleProps.WADMKC || sampleProps.KECAMATAN || '';
  const kabName = sampleProps.WADMKK || sampleProps.KABUPATEN || '';
  const activeTotalHa = activeLayer?.totalAreaHa || 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070B10] text-slate-100 font-sans">
      {/* Top Cartographic Workstation Bar */}
      <header className="h-14 bg-[#0A0F16] border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Sidebar Toggle + Brand Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {currentView === 'map' && (
            <button
              type="button"
              title={isLayerPanelOpen ? 'Sembunyikan Panel Layer' : 'Buka Panel Layer'}
              onClick={() => setIsLayerPanelOpen((p) => !p)}
              className={`p-2 rounded-lg border transition-colors shrink-0 ${
                isLayerPanelOpen
                  ? 'bg-slate-800/90 text-teal-300 border-teal-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isLayerPanelOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <Compass className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  WebGIS NPGT
                </span>
                <span className="hidden md:inline-flex items-center rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-teal-300 border border-teal-500/25">
                  BPN Jawa Timur
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block truncate">
                Neraca Penatagunaan Tanah Kecamatan &bull; Analisis Spasial DJPA
              </p>
            </div>
          </div>

          {/* Active Region Context Pill */}
          {(kecName || kabName) && (
            <div className="hidden xl:flex items-center gap-2 ml-2 pl-3 border-l border-slate-800 text-xs">
              <span className="text-slate-300 font-medium truncate max-w-[200px]">
                {kecName ? `Kec. ${kecName}` : ''}{kecName && kabName ? ', ' : ''}{kabName}
              </span>
              {activeTotalHa > 0 && (
                <span className="rounded-md bg-slate-900 border border-slate-800 px-2 py-0.5 font-mono text-[11px] text-teal-300">
                  {activeTotalHa.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ha
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center rounded-xl bg-[#070B10] p-1 border border-slate-800/90 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setCurrentView('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              currentView === 'map'
                ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="size-3.5" />
            <span>Peta Spasial</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('npgt')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              currentView === 'npgt'
                ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="size-3.5" />
            <span>Dashboard NPGT</span>
            {hasNpgtData && (
              <span
                className={`size-1.5 rounded-full ${
                  currentView === 'npgt' ? 'bg-slate-950' : 'bg-teal-400 animate-pulse'
                }`}
              />
            )}
          </button>
        </div>

        {/* Right: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasNpgtData && npgtSplitLayers.length === 0 && (
            <button
              type="button"
              title="Dissolve & pecah data DJPA menjadi 8 layer analisis tematik"
              onClick={() => handleDuplicateNpgt(activeLayer)}
              className="hidden lg:flex items-center gap-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 px-3 py-1.5 text-xs font-semibold text-teal-300 transition-colors"
            >
              <Split className="size-3.5 text-teal-400" />
              <span>Buka 8 Layer Analisis</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-sm transition-colors"
          >
            <Upload className="size-3.5 stroke-[2.25]" />
            <span>Unggah Data</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 relative flex overflow-hidden">
        {currentView === 'map' ? (
          <>
            {/* Left Spatial Layer Drawer */}
            {isLayerPanelOpen && (
              <LayerPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onSetActiveLayer={handleSelectActiveLayer}
                onToggleVisibility={handleToggleVisibility}
                onUpdateLayerStyle={handleUpdateLayerStyle}
                onToggleAllOutlines={handleToggleAllOutlines}
                onRemoveLayer={handleRemoveLayer}
                onZoomToLayer={handleZoomToLayer}
                onOpenTable={(id) => setTableLayerId(id)}
                onOpenThematic={(id) => {
                  setThematicLayerId(id);
                  setIsThematicOpen(true);
                }}
                onOpenUpload={() => setIsUploadOpen(true)}
                onExportLayer={handleExportLayer}
                onDuplicateNpgt={handleDuplicateNpgt}
                onToggleLandUseMode={handleToggleLandUseMode}
                onToggleCapabilityMode={handleToggleCapabilityMode}
              />
            )}

            {/* Interactive Leaflet Map Center */}
            <main className="flex-1 relative h-full">
              <MapViewer
                layers={layers}
                selectedFeature={selectedFeature}
                onSelectFeature={handleSelectFeature}
                activeLayer={activeLayer}
                activeLayerId={activeLayerId}
                onSelectActiveLayer={handleSelectActiveLayer}
                zoomToTrigger={zoomToTrigger}
                fitAllTrigger={fitAllTrigger}
                onOpenUpload={() => setIsUploadOpen(true)}
                onToggleAllOutlines={handleToggleAllOutlines}
                legendSelectedCategory={legendSelectedCategory}
                onClearLegendCategory={() => setLegendSelectedCategory(null)}
              />

              {/* Floating Map Legend */}
              <LegendWidget
                layers={layers}
                selectedCategory={legendSelectedCategory}
                onSelectCategory={handleSelectLegendCategory}
                onOpenTable={(id) => setTableLayerId(id)}
                onToggleLandUseMode={handleToggleLandUseMode}
                onToggleCapabilityMode={handleToggleCapabilityMode}
              />
            </main>

            {/* Feature Inspector Panel (Right Drawer) */}
            {selectedFeature && (
              <FeatureInspector
                feature={selectedFeature}
                layer={selectedFeatureLayer}
                onClose={() => setSelectedFeature(null)}
                onZoomToFeature={handleZoomToFeature}
              />
            )}

            {/* Attribute Table Drawer (Bottom) */}
            {tableLayerId && (
              <AttributeTable
                layer={layers.find((l) => l.id === tableLayerId)}
                selectedFeature={selectedFeature}
                onSelectFeature={handleSelectFeature}
                onClose={() => setTableLayerId(null)}
                onZoomToFeature={handleZoomToFeature}
              />
            )}
          </>
        ) : (
          /* NPGT BPN Jatim Analytical Dashboard View */
          <NpgtDashboard
            layer={activeLayer || layers[0]}
            onApplyThematicFilter={handleApplyThematic}
            onView8LayersInMap={() => handleDuplicateNpgt(activeLayer)}
            onViewIndicatorInMap={handleViewIndicatorInMap}
          />
        )}
      </div>

      {/* Thematic Choropleth Modal */}
      {isThematicOpen && (
        <ThematicModal
          isOpen={isThematicOpen}
          layer={layers.find((l) => l.id === thematicLayerId)}
          onClose={() => {
            setIsThematicOpen(false);
            setThematicLayerId(null);
          }}
          onApplyThematic={handleApplyThematic}
          onClearThematic={handleClearThematic}
        />
      )}

      {/* Upload & Format Converter Modal */}
      {isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onAddLayers={handleAddLayers}
          onLoadSample={handleLoadSample}
          hasNoLayers={layers.length === 0}
        />
      )}
    </div>
  );
}
