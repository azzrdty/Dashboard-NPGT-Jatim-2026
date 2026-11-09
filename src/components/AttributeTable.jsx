import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Download, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronUp, 
  ChevronDown,
  Table as TableIcon,
  Maximize2
} from 'lucide-react';
import { exportFeaturesToCsv } from '../utils/gisUtils';

export default function AttributeTable({
  features,
  isOpen,
  onClose,
  onFeatureSelect,
  selectedFeatureId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('OBJECTID');
  const [sortAsc, setSortAsc] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract columns dynamically from features
  const columns = useMemo(() => {
    if (!features.length) return [];
    const firstProps = features[0].properties || {};
    return Object.keys(firstProps);
  }, [features]);

  // Filter and sort features
  const processedFeatures = useMemo(() => {
    let result = [...features];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(f => {
        return Object.values(f.properties || {}).some(v => 
          String(v).toLowerCase().includes(q)
        );
      });
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA = a.properties?.[sortField] ?? '';
        let valB = b.properties?.[sortField] ?? '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [features, searchTerm, sortField, sortAsc]);

  if (!isOpen) return null;

  const handleHeaderClick = (col) => {
    if (sortField === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(col);
      setSortAsc(true);
    }
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-40 glass-dock border-t border-white/10 flex flex-col transition-all duration-300 shadow-2xl ${
        isExpanded ? 'h-[75vh]' : 'h-80'
      }`}
    >
      {/* Table Header Bar */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <TableIcon className="w-4 h-4 text-sky-400" />
            <span>Tabel Atribut Fitur Geospasial</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono">
              {processedFeatures.length} dari {features.length} Baris
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-64 hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari desa, indikator, nilai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportFeaturesToCsv(processedFeatures, `NPGT_Attributes_${Date.now()}.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Kecilkan Tabel' : 'Perbesar Tabel'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Tabel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Scroll Container */}
      <div className="flex-1 overflow-auto bg-[#070B10]/95 font-mono text-[11px]">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-slate-900 z-10 border-b border-white/10">
            <tr>
              <th className="px-3 py-2 text-slate-400 font-semibold uppercase tracking-wider w-12 text-center">
                #
              </th>
              {columns.map(col => {
                const isSorted = sortField === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleHeaderClick(col)}
                    className="px-3 py-2 text-slate-300 font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-sky-400" /> : <ArrowDown className="w-3 h-3 text-sky-400" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 text-slate-600" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {processedFeatures.map((f, idx) => {
              const isSelected = selectedFeatureId === f.properties?.OBJECTID;
              return (
                <tr
                  key={idx}
                  onClick={() => onFeatureSelect(f)}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-blue-600/30 text-white font-semibold' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <td className="px-3 py-2 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 whitespace-nowrap">
                      {f.properties?.[col] !== undefined && f.properties?.[col] !== null 
                        ? String(f.properties[col]) 
                        : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
