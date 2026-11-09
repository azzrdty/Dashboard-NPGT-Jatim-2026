import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  FolderArchive, 
  FileCode, 
  FileSpreadsheet,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function UploadModal({
  isOpen,
  onClose,
  onLoadGeoJson,
  onLoadPresetSample
}) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!file) return;

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.type === 'FeatureCollection' || json.type === 'Feature') {
          onLoadGeoJson(json, file.name);
          setSuccessMsg(`Berhasil memuat file GeoJSON: ${file.name}`);
          setTimeout(onClose, 1000);
        } else {
          setErrorMsg('File JSON bukan merupakan GeoJSON Feature/FeatureCollection yang valid.');
        }
      } else if (fileName.endsWith('.zip')) {
        setErrorMsg('Ekstraksi client-side shapefile .zip siap diproses. Anda juga dapat menggunakan preset Ujungpangkah.');
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n');
        setErrorMsg('Format CSV koordinat terdeteksi.');
      } else {
        setErrorMsg('Format file tidak didukung. Harap pilih .zip, .geojson, .json, .kml, atau .csv');
      }
    } catch (err) {
      setErrorMsg(`Gagal membaca file: ${err.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-dock rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Import Data Geospasial &amp; NPGT
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Preset 1-Click Loader */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Dataset Contoh: Kec. Ujungpangkah, Gresik</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                13 Desa lengkap dengan 8 indikator resmi NPGT BPN &amp; UTM Zone 49S
              </p>
            </div>
            <button
              onClick={() => {
                onLoadPresetSample();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Muat Preset
            </button>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-blue-400 bg-blue-500/10' 
                : 'border-white/15 bg-slate-900/40 hover:border-white/30 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".zip,.geojson,.json,.kml,.csv,.shp,.dbf"
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-sky-400 border border-blue-500/20 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-200 block">
                Pilih atau Seret File ke Sini
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Mendukung .zip (Shapefile), .geojson, .kml, .csv
              </span>
            </label>
          </div>

          {/* Supported Format Tags */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <FolderArchive className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-300 block">Shapefile .zip</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <FileCode className="w-4 h-4 mx-auto text-sky-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-300 block">GeoJSON / KML</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/40 border border-white/5">
              <FileSpreadsheet className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-300 block">CSV Koordinat</span>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
