import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Table,
  Palette,
  Crosshair,
  Plus,
  Sliders,
  ChevronDown,
  ChevronUp,
  Shapes,
  Sparkles,
  Compass,
  Info,
  Square,
  SquareDashed
} from 'lucide-react';
import { detectGeometryType } from '../utils/spatialCalculations';
import {
  getLayerThematicCategories,
  formatNumber,
  hasQreklasColumn,
  hasLandCapabilityColumns,
  CAPABILITY_MODES
} from '../utils/npgtData';

const COLOR_PRESETS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

const CRS_PRESETS = {
  'EPSG:4326': 'WGS84 Geographic (EPSG:4326)',
  'ESRI:54034': 'World Cylindrical Equal Area (ESRI:54034 - Standar NPGT/DJPA/LSD)',
  'EPSG:32749': 'WGS 84 / UTM Zone 49S (EPSG:32749 - Jatim Barat/Tengah)',
  'EPSG:32750': 'WGS 84 / UTM Zone 50S (EPSG:32750 - Jatim Timur/Madura/Bali)',
  'EPSG:32748': 'WGS 84 / UTM Zone 48S (EPSG:32748 - Jabar/Jakarta)',
  'EPSG:32751': 'WGS 84 / UTM Zone 51S (EPSG:32751 - NTT/Maluku)',
  'EPSG:3857': 'Web Mercator (EPSG:3857)',
  'EPSG:23837': 'DGN95 / TM-3 BPN Zone 49.1 (EPSG:23837)',
  'EPSG:23838': 'DGN95 / TM-3 BPN Zone 49.2 (EPSG:23838)',
  'EPSG:23839': 'DGN95 / TM-3 BPN Zone 50.1 (EPSG:23839)',
  'EPSG:23840': 'DGN95 / TM-3 BPN Zone 50.2 (EPSG:23840)'
};

export default function LayerPanel({
  layers = [],
  activeLayerId,
  onSetActiveLayer,
  onToggleVisibility,
  onUpdateLayerStyle,
  onToggleAllOutlines,
  onRemoveLayer,
  onZoomToLayer,
  onOpenTable,
  onOpenThematic,
  onOpenUpload,
  onExportLayer,
  onDuplicateNpgt,
  onToggleLandUseMode,
  onToggleCapabilityMode
}) {
  const [expandedLayerId, setExpandedLayerId] = useState(null);

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedLayerId((prev) => (prev === id ? null : id));
  };

  const anyOutlineVisible = layers.some(
    (l) => l.stroke === true && (l.weight !== undefined ? l.weight > 0 : true)
  );

  return (
    <aside className="flex flex-col h-full w-80 sm:w-86 bg-[#0A0F16] border-r border-slate-800/80 text-slate-200 select-none shrink-0 z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-[#070B10]/50">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-teal-400" />
          <h2 className="font-semibold text-xs tracking-tight text-white">Layer Spasial</h2>
          <span className="flex items-center justify-center px-1.5 py-0.2 rounded-md bg-slate-800/90 border border-slate-700/60 text-[10px] font-mono text-teal-300">
            {layers.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {layers.length > 0 && onToggleAllOutlines && (
            <button
              type="button"
              onClick={() => onToggleAllOutlines(!anyOutlineVisible)}
              title={anyOutlineVisible ? 'Matikan Outline Semua Layer' : 'Tampilkan Outline Semua Layer'}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium border transition-colors ${
                anyOutlineVisible
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/70'
              }`}
            >
              {anyOutlineVisible ? <Square className="size-3" /> : <SquareDashed className="size-3" />}
              <span>Outline</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1 rounded-lg bg-teal-400 hover:bg-teal-300 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition-colors shadow-xs"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Helper banner when 8 NPGT layers are active */}
      {layers.some((l) => l.npgtKey) && (
        <div className="px-3.5 py-2 bg-teal-500/8 border-b border-teal-500/15 text-[11px] text-slate-300 flex items-center justify-between">
          <span>Klik kartu analisis untuk menampilkan di peta</span>
          <span className="font-mono text-[10px] text-teal-400">Dissolved</span>
        </div>
      )}

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-[#070B10]/50">
            <Shapes className="size-9 text-slate-600 mb-3" />
            <p className="text-xs font-semibold text-white mb-1">Belum Ada Layer Spasial</p>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Unggah file Shapefile (.zip atau .shp+.dbf), GeoJSON, KML, CSV, atau pilih data simulasi.
            </p>
            <button
              type="button"
              onClick={onOpenUpload}
              className="rounded-xl bg-teal-400 hover:bg-teal-300 px-4 py-2 text-xs font-bold text-slate-950 transition-colors shadow-md shadow-teal-500/15"
            >
              Unggah / Pilih Simulasi
            </button>
          </div>
        ) : (
          layers.map((layer) => {
            const isActive = layer.id === activeLayerId;
            const isExpanded = layer.id === expandedLayerId;
            const count = layer.data?.features?.length || 0;
            const thematicCategories = getLayerThematicCategories(layer);
            const isLandUseLayer =
              layer.isLandUse || layer.npgtKey === 'QNAME5' || layer.npgtKey === 'QREKLAS';
            const canToggleQreklas =
              isLandUseLayer && Boolean(onToggleLandUseMode) && hasQreklasColumn(layer);
            const currentLandUseMode =
              layer.landUseMode || (layer.npgtKey === 'QREKLAS' ? 'QREKLAS' : 'QNAME5');
            const isLandCapabilityLayer =
              layer.isLandCapability ||
              ['Lname', 'Uname', 'Xname', 'Dname', 'Ename'].includes(layer.npgtKey);
            const canToggleCapability =
              isLandCapabilityLayer &&
              Boolean(onToggleCapabilityMode) &&
              hasLandCapabilityColumns(layer);
            const currentCapabilityMode =
              layer.capabilityMode ||
              CAPABILITY_MODES.find((m) => m.column === layer.npgtKey)?.mode ||
              'L';

            return (
              <div
                key={layer.id}
                onClick={() => onSetActiveLayer(layer.id)}
                className={`rounded-xl border transition-all cursor-pointer ${
                  layer.visible && isActive
                    ? 'bg-[#111A26] border-teal-500/50 shadow-md ring-1 ring-teal-500/20'
                    : layer.visible
                    ? 'bg-[#0E1621] border-slate-700/80 hover:border-slate-600'
                    : 'bg-[#090E15]/70 border-slate-800/70 opacity-75 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <h3
                          className={`text-xs font-semibold truncate max-w-[195px] ${
                            layer.visible ? 'text-white' : 'text-slate-400'
                          }`}
                          title={layer.name}
                        >
                          {layer.name}
                        </h3>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] text-slate-400">
                          <span className="font-mono text-slate-300">{count.toLocaleString('id-ID')} fitur</span>
                          {layer.crsCode && (
                            <>
                              <span>&bull;</span>
                              <span
                                className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700"
                                title={layer.crsInfo}
                              >
                                {layer.crsCode.replace('EPSG:', '').replace('ESRI:', '')}
                              </span>
                            </>
                          )}
                          {canToggleQreklas ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-md bg-slate-900/95 p-0.5 border border-slate-700/80"
                            >
                              {['QNAME5', 'QREKLAS'].map((mode) => {
                                const active = currentLandUseMode === mode;
                                return (
                                  <button
                                    key={mode}
                                    type="button"
                                    title={
                                      mode === 'QNAME5'
                                        ? 'Tampilkan Penggunaan Tanah Detail (QNAME5)'
                                        : 'Tampilkan Reklasifikasi Penggunaan Tanah (QREKLAS)'
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!active) onToggleLandUseMode(layer.id, mode);
                                    }}
                                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all ${
                                      active
                                        ? 'bg-teal-400 text-slate-950 shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {mode}
                                  </button>
                                );
                              })}
                            </div>
                          ) : canToggleCapability ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center rounded-md bg-slate-900/95 p-0.5 border border-slate-700/80"
                            >
                              {CAPABILITY_MODES.map(({ mode, title }) => {
                                const active = currentCapabilityMode === mode;
                                return (
                                  <button
                                    key={mode}
                                    type="button"
                                    title={`Tampilkan ${title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!active) onToggleCapabilityMode(layer.id, mode);
                                    }}
                                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all ${
                                      active
                                        ? 'bg-teal-400 text-slate-950 shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {mode}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            layer.hasNpgt && (
                              <span className="rounded bg-teal-500/15 px-1.5 py-0.2 font-mono text-[9px] font-medium text-teal-300 border border-teal-500/25">
                                {layer.npgtKey || 'DJPA'}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(layer.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          layer.visible
                            ? 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </button>

                      <button
                        type="button"
                        title="Pengaturan Simbologi & Sistem Koordinat"
                        onClick={(e) => toggleExpand(layer.id, e)}
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
                          isExpanded ? 'bg-slate-800 text-white' : ''
                        }`}
                      >
                        <Sliders className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mini Thematic Composition Bar (Always Area-Proportional) */}
                  {thematicCategories.length > 0 && (
                    <div className="mt-2 flex h-1.5 w-full rounded-full overflow-hidden bg-slate-900 gap-0.5">
                      {thematicCategories.map((cat) => (
                        <div
                          key={cat.label}
                          style={{
                            flex: cat.areaHa,
                            backgroundColor: cat.color
                          }}
                          title={`${cat.label}: ${formatNumber(cat.areaHa)} Ha (${cat.pct.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions toolbar */}
                  {isActive && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/70 flex items-center justify-between text-slate-400 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Fokuskan ke Layer Ini (Zoom to Extent)"
                          onClick={(e) => {
                            e.stopPropagation();
                            onZoomToLayer(layer.id);
                          }}
                          className="p-1 rounded-md hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Crosshair className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Buka Tabel Atribut Data"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTable(layer.id);
                          }}
                          className="p-1 rounded-md hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Table className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          title="Klasifikasi Tematik / Choropleth"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenThematic(layer.id);
                          }}
                          className="p-1 rounded-md hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Palette className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          title={
                            layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true)
                              ? 'Hapus Outline (Garis Batas)'
                              : 'Tampilkan Outline (Garis Batas)'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            const hasOutline = layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true);
                            onUpdateLayerStyle(layer.id, {
                              stroke: !hasOutline,
                              weight: !hasOutline ? (layer.weight > 0 ? layer.weight : 1.2) : 0
                            });
                          }}
                          className={`p-1 rounded-md hover:text-white hover:bg-slate-800 transition-colors ${
                            layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true) ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true) ? (
                            <Square className="size-3.5" />
                          ) : (
                            <SquareDashed className="size-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          title="Unduh sebagai GeoJSON"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportLayer(layer);
                          }}
                          className="p-1 rounded-md hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        title="Hapus Layer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLayer(layer.id);
                        }}
                        className="p-1 rounded-md hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Duplicate into 8 DJPA layers button */}
                  {layer.hasNpgt && onDuplicateNpgt && !layer.npgtKey && (
                    <button
                      type="button"
                      title="Duplikasi data ini menjadi 8 layer tematik sesuai indikator DJPA"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateNpgt(layer);
                      }}
                      className="mt-2.5 flex items-center justify-center gap-1.5 w-full rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 py-1.5 px-2 text-[11px] font-semibold text-emerald-300 transition-colors"
                    >
                      <Sparkles className="size-3.5 text-emerald-400" />
                      <span>Pecah ke 8 Layer Analisis DJPA</span>
                    </button>
                  )}
                </div>

                {/* Collapsible Styling Drawer */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 bg-slate-900/60 border-t border-slate-700/50 space-y-3.5 text-xs"
                  >
                    {/* Color Swatches */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                        Warna Simbol
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {COLOR_PRESETS.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => onUpdateLayerStyle(layer.id, { color: col })}
                            className={`size-5 rounded-full transition-transform ${
                              layer.color === col ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <input
                          type="color"
                          value={layer.color || '#3b82f6'}
                          onChange={(e) => onUpdateLayerStyle(layer.id, { color: e.target.value })}
                          className="size-5 rounded cursor-pointer bg-transparent border-0"
                          title="Pilih Warna Kustom"
                        />
                      </div>
                    </div>

                    {/* Opacity slider */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Transparansi Isian (Fill)</span>
                        <span className="font-mono">{Math.round((layer.fillOpacity ?? 0.45) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={layer.fillOpacity ?? 0.45}
                        onChange={(e) =>
                          onUpdateLayerStyle(layer.id, { fillOpacity: parseFloat(e.target.value) })
                        }
                        className="w-full accent-sky-500 bg-slate-700 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Stroke / Outline Toggle & Width Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Garis Batas (Outline)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const hasOutline = layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true);
                            onUpdateLayerStyle(layer.id, {
                              stroke: !hasOutline,
                              weight: !hasOutline ? (layer.weight > 0 ? layer.weight : 1.2) : 0
                            });
                          }}
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border transition-colors ${
                            layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true)
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true) ? 'Hapus Outline' : 'Aktifkan Outline'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Ketebalan Outline</span>
                        <span className="font-mono">
                          {layer.stroke === true && (layer.weight !== undefined ? layer.weight > 0 : true) ? `${layer.weight ?? 1.2} px` : '0 px (Nonaktif)'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.5"
                        value={layer.stroke === true ? (layer.weight ?? 1.2) : 0}
                        onChange={(e) => {
                          const w = parseFloat(e.target.value);
                          onUpdateLayerStyle(layer.id, {
                            weight: w,
                            stroke: w > 0
                          });
                        }}
                        className="w-full accent-sky-500 bg-slate-700 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Coordinate Reference System (CRS) Selector */}
                    <div className="pt-2 border-t border-slate-700/50">
                      <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-1">
                        <span className="flex items-center gap-1">
                          <Compass className="size-3 text-emerald-400" />
                          Sistem Koordinat (CRS)
                        </span>
                        <span className="font-mono text-emerald-400">{layer.crsCode || 'EPSG:4326'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-1.5 truncate" title={layer.crsInfo}>
                        {layer.crsInfo || 'WGS84 Geographic (EPSG:4326)'}
                      </p>
                      <select
                        value={layer.crsCode || 'EPSG:4326'}
                        onChange={(e) => {
                          const code = e.target.value;
                          onUpdateLayerStyle(layer.id, {
                            crsCode: code,
                            crsInfo: CRS_PRESETS[code] || code
                          });
                        }}
                        className="w-full rounded-lg bg-slate-800 px-2 py-1.5 text-[11px] text-slate-200 border border-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                      >
                        {Object.entries(CRS_PRESETS).map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Format: SHP, GeoJSON, KML, CSV</span>
        <span className="font-mono text-emerald-400">CRS: Auto-Detect / WGS84</span>
      </div>
    </aside>
  );
}
