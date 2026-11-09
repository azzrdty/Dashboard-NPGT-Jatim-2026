import React from 'react';
import { 
  X, 
  MapPin, 
  Layers, 
  FileText, 
  Copy, 
  Check, 
  Maximize2, 
  ShieldAlert, 
  ShieldCheck,
  Compass
} from 'lucide-react';
import { NPGT_INDICATORS, formatArea } from '../utils/gisUtils';

export default function InspectorModal({
  feature,
  onClose,
  onZoomToFeature
}) {
  const [copied, setCopied] = React.useState(false);

  if (!feature) return null;

  const props = feature.properties || {};

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(feature, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute top-20 right-4 z-30 w-96 max-h-[85vh] glass-dock rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/80 flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-sky-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">
              {props.NAMOBJ || props.WADMKD || 'Fitur Geospasial'}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {props.WADMKC || 'Kecamatan Ujungpangkah'}, {props.WADMKK || 'Kab. Gresik'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Scroll */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
        {/* Spatial Dimension Card */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Dimensi Luas &amp; Geometri
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">Luas Tercatat</span>
              <span className="text-sm font-bold text-white">
                {props.LUAS_HA ? `${props.LUAS_HA} Ha` : '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Proyeksi Asal</span>
              <span className="text-xs font-semibold text-sky-400">
                UTM Zone 49S
              </span>
            </div>
          </div>
        </div>

        {/* 8 NPGT Indicators Section */}
        <div>
          <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block mb-2">
            Status 8 Indikator NPGT ATR/BPN
          </span>
          <div className="space-y-1.5">
            {Object.keys(NPGT_INDICATORS).map(code => {
              const val = props[code];
              const config = NPGT_INDICATORS[code];
              const color = config.colors?.[val] || '#64748B';

              return (
                <div
                  key={code}
                  className="p-2.5 rounded-lg bg-slate-900/50 border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold block">
                      {code} &bull; {config.label}
                    </span>
                    <span className="font-medium text-slate-200 text-xs">
                      {val || 'Tidak Terdata'}
                    </span>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={val}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Existing Land Use & Spatial Plan (RTRW) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Penggunaan Tanah Aktual</span>
            <span className="font-medium text-slate-200">
              {props.GUNA_TNH || '-'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Rencana Pola Ruang (RTRW)</span>
            <span className="font-medium text-slate-200">
              {props.RTRW || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin' : 'Copy GeoJSON'}</span>
        </button>

        <button
          onClick={() => onZoomToFeature(feature)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Fokus Peta</span>
        </button>
      </div>
    </div>
  );
}
