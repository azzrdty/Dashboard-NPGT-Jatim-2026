import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Sliders, 
  Download, 
  Maximize2, 
  Layers, 
  Palette,
  Trash2,
  Plus
} from 'lucide-react';

export default function LayerManager({
  layers,
  activeLayerId,
  setActiveLayerId,
  onToggleVisibility,
  onUpdateOpacity,
  onUpdateStrokeWidth,
  onZoomToLayer,
  onExportGeoJson,
  onOpenUpload
}) {
  return (
    <div className="flex flex-col h-full bg-[#0B111B] text-slate-200 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Daftar Layer Geospasial
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kelola visibilitas, opasitas, dan urutan peta
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-blue-500/20 cursor-pointer"
          title="Tambah Layer Baru"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Layers List */}
      <div className="p-4 space-y-3 flex-1">
        {layers.map(layer => {
          const isSelected = activeLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/15'
              }`}
            >
              {/* Layer Title Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 truncate">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      layer.visible ? 'text-sky-400 hover:text-sky-300' : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-100 block truncate">
                      {layer.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {layer.featureCount} fitur &bull; {layer.type || 'Poligon'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomToLayer(layer.id);
                    }}
                    title="Zoom ke Cakupan Layer"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportGeoJson(layer.id);
                    }}
                    title="Ekspor sebagai GeoJSON"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-slate-500" />
                    Transparansi Isian (Fill)
                  </span>
                  <span className="font-mono text-sky-400">{Math.round(layer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={layer.opacity}
                  aria-label="Transparansi Isian"
                  onChange={(e) => onUpdateOpacity(layer.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Tebal Garis Batas</span>
                  <span className="font-mono text-sky-400">{layer.strokeWidth || 1.5} px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={layer.strokeWidth || 1.5}
                  aria-label="Tebal Garis Batas"
                  onChange={(e) => onUpdateStrokeWidth(layer.id, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
