import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  Waves,
  Layers,
  Compass,
  ArrowRight
} from 'lucide-react';
import { parseSpatialFiles } from '../utils/geoParser';

export default function UploadModal({
  isOpen,
  onClose,
  onAddLayers,
  onLoadSample,
  hasNoLayers = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const parsedLayers = await parseSpatialFiles(files);
      if (!parsedLayers.length) {
        throw new Error('Tidak ada data spasial yang berhasil dibaca.');
      }

      onAddLayers(parsedLayers);
      setSuccessMsg(`Berhasil memuat ${parsedLayers.length} layer spasial!`);
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 800);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memproses file spasial.');
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0B111A] border border-white/[0.1] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-white/[0.08] bg-[#070B10]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-teal-500/15 grid place-items-center text-teal-400 border border-teal-500/30 shrink-0">
              <Compass className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                {hasNoLayers ? 'Impor Data Geospasial atau Muat Preset DJPA' : 'Impor Layer Spasial'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasNoLayers
                  ? 'Unggah Shapefile (.zip/.shp) atau gunakan dataset Neraca Penatagunaan Tanah siap pakai.'
                  : 'Mendukung Shapefile (.shp/.zip), GeoJSON, KML, dan CSV dengan reproyeksi koordinat otomatis.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Drag & Drop Area for User's Own Data */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Unggah File Geospasial dari Perangkat
            </label>
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-7 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                isDragging
                  ? 'border-teal-400 bg-teal-500/10 scale-[1.005]'
                  : 'border-white/[0.12] bg-[#070B10]/70 hover:border-teal-500/50 hover:bg-white/[0.03]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.shp,.dbf,.shx,.prj,.cpg,.geojson,.json,.kml,.csv"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />

              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-8 text-teal-400 animate-spin" />
                  <p className="text-xs font-medium text-slate-300">
                    Membaca struktur geometri dan mendeteksi CRS/Proyeksi...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-3 text-slate-400">
                    <FileArchive className="size-7 text-amber-400" />
                    <FileCode className="size-7 text-teal-400" />
                    <FileSpreadsheet className="size-7 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-white text-center mb-1">
                    Tarik & Letakkan file ke sini, atau{' '}
                    <span className="text-teal-400 underline underline-offset-4">Pilih dari Komputer</span>
                  </p>
                  <p className="text-xs text-slate-400 text-center max-w-md mt-1">
                    Format: <b>.zip</b> berisi shapefile, atau pilih file <b>.shp</b> dan <b>.dbf</b> sekaligus (beserta .prj).
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/15 p-3.5 text-xs text-red-300 border border-red-500/30">
              <AlertCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 p-3.5 text-xs text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 2: Option to Use Dummy / Preset Data */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>2. Dataset Kanwil BPN Jawa Timur Siap Pakai</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Featured 8 DJPA layers preset */}
              <button
                type="button"
                onClick={() => onLoadSample('npgt_8_layers')}
                className="col-span-full flex items-center justify-between p-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/35 text-left transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="size-10 rounded-xl bg-teal-500/20 grid place-items-center text-teal-300 shrink-0 border border-teal-400/30 group-hover:scale-105 transition-transform">
                    <Layers className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-teal-300 tracking-wide">
                      8 Layer Analisis DJPA — NPGT Kecamatan Lengkap (Ter-Dissolve)
                    </span>
                    <span className="block text-[11px] text-slate-300/80 mt-0.5">
                      Memuat 8 indikator: KSPOLA, COMPATB, OPTNH, Vname, V_Arahan, V_Khusus, REKOMTNH, PASET
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-teal-400 shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('ujungpangkah')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left transition-all hover:border-teal-500/40"
              >
                <div className="size-8 rounded-lg bg-sky-500/15 grid place-items-center text-sky-400 shrink-0 border border-sky-500/25">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-white truncate">
                    Batas Adm Kec. Ujungpangkah
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Kab. Gresik, Jatim (13 Desa • UTM 49S)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onLoadSample('sungai')}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-left transition-all hover:border-emerald-500/40"
              >
                <div className="size-8 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-400 shrink-0 border border-emerald-500/25">
                  <Waves className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-white truncate">
                    Sungai Poligon 25K
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Jaringan Perairan & Sungai Jawa Timur
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-[#070B10] text-[11px] text-slate-400">
          <span className="font-mono text-[10px]">CRS Otomatis: WGS84 • UTM 48S/49S/50S • TM-3 BPN</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
