import React from 'react';
import { Layers, Check } from 'lucide-react';

export const BASEMAP_OPTIONS = [
  {
    id: 'carto-dark',
    name: 'Carto Dark Matter',
    tag: 'Rekomendasi NPGT',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  },
  {
    id: 'esri-satellite',
    name: 'Esri Satellite Citra',
    tag: 'Resolusi Tinggi',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
  },
  {
    id: 'carto-positron',
    name: 'Carto Positron Terang',
    tag: 'Minimalis',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap'
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    tag: 'Vektor Jalan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap Medan',
    tag: 'Topografi & Kontur',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap'
  }
];

export default function BasemapSelector({ activeBasemap, onSelectBasemap, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-20 right-4 z-40 w-72 glass-dock rounded-2xl p-4 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          Pilihan Peta Dasar (Basemaps)
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10"
        >
          &times;
        </button>
      </div>

      <div className="space-y-2">
        {BASEMAP_OPTIONS.map(bm => {
          const isSelected = activeBasemap === bm.id;
          return (
            <div
              key={bm.id}
              onClick={() => onSelectBasemap(bm.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/30' 
                  : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div>
                <span className="text-xs font-medium block">{bm.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{bm.tag}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
