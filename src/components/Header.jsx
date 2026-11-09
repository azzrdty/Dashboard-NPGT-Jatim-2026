import React from 'react';
import { 
  Map, 
  Layers, 
  BarChart3, 
  Table as TableIcon, 
  Upload, 
  Ruler, 
  Download, 
  Compass, 
  ShieldCheck, 
  Info,
  Maximize2
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  isTableOpen, 
  setIsTableOpen, 
  isUploadOpen, 
  setIsUploadOpen, 
  isMeasureOpen, 
  setIsMeasureOpen, 
  cursorCoords, 
  totalFeatures,
  onResetView
}) {
  return (
    <header className="h-16 border-b border-white/10 glass-dock px-4 flex items-center justify-between z-30 select-none relative">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 p-[1px] shadow-lg shadow-blue-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#080E18] rounded-[11px] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              WebGIS NPGT Jawa Timur
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider uppercase">
                BPN DJPA 2026
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <span>Neraca Penatagunaan Tanah</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-sky-400">Kec. Ujungpangkah, Kab. Gresik</span>
          </p>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <div className="hidden lg:flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10 shadow-inner">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analisis NPGT</span>
        </button>

        <button
          onClick={() => setActiveTab('layers')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Manajemen Layer</span>
          <span className="ml-1 px-1.5 py-0.2 bg-white/10 rounded-full text-[10px] text-slate-300">
            {totalFeatures}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('styling')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
            activeTab === 'styling'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Klasifikasi Tematik</span>
        </button>
      </div>

      {/* Right HUD & Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Real-time Cursor Coordinates */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Lat: {cursorCoords.lat ? cursorCoords.lat.toFixed(5) : '-6.94500'}</span>
          <span className="text-slate-600">|</span>
          <span>Lon: {cursorCoords.lng ? cursorCoords.lng.toFixed(5) : '112.55000'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-sky-400 font-semibold">UTM 49S</span>
        </div>

        {/* GIS Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMeasureOpen(!isMeasureOpen)}
            title="Pengukuran Jarak & Luas"
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isMeasureOpen 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Ukur</span>
          </button>

          <button
            onClick={() => setIsTableOpen(!isTableOpen)}
            title="Buka Tabel Atribut"
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isTableOpen 
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' 
                : 'bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-700/60 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Tabel</span>
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 border border-blue-400/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:inline">Import SHP/GIS</span>
          </button>

          <button
            onClick={onResetView}
            title="Reset Posisi Peta (Kec. Ujungpangkah)"
            className="p-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
