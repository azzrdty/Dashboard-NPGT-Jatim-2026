import React, { useState } from 'react';
import { Ruler, Square, Trash2, X, CheckCircle2 } from 'lucide-react';
import { formatDistance, formatArea } from '../utils/gisUtils';

export default function MeasureTools({
  isOpen,
  onClose,
  measureMode,
  setMeasureMode,
  measurePoints,
  onClearMeasure,
  calculatedDistance,
  calculatedArea
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-4 z-40 w-80 glass-dock rounded-2xl p-4 shadow-2xl border border-white/10 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white">
            Alat Pengukuran Geospasial
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setMeasureMode('distance')}
          className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            measureMode === 'distance'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>Jarak (Garis)</span>
        </button>

        <button
          onClick={() => setMeasureMode('area')}
          className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            measureMode === 'area'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          <span>Luas (Poligon)</span>
        </button>
      </div>

      {/* Instruction Tip */}
      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 mb-3 leading-relaxed">
        {measureMode === 'distance' ? (
          <span>Klik pada peta untuk menambah titik pengukuran jarak linier.</span>
        ) : (
          <span>Klik minimal 3 titik pada peta untuk menghitung luas area geodesik.</span>
        )}
      </div>

      {/* Result Display */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 mb-3">
        <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
          Hasil Perhitungan Geodesik
        </span>
        {measureMode === 'distance' ? (
          <div className="text-lg font-bold font-mono text-amber-300">
            {formatDistance(calculatedDistance)}
          </div>
        ) : (
          <div className="text-lg font-bold font-mono text-amber-300">
            {formatArea(calculatedArea)}
          </div>
        )}
        <span className="text-[10px] text-slate-400 font-mono block mt-1">
          {measurePoints.length} Titik Kordinat Terpilih
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={onClearMeasure}
        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Hapus Titik Pengukuran</span>
      </button>
    </div>
  );
}
