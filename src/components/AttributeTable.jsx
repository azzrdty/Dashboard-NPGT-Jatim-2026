import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  X,
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FIELD_LABELS, formatNumber } from '../utils/npgtData';

export default function AttributeTable({
  layer,
  selectedFeature,
  onSelectFeature,
  onClose,
  onZoomToFeature
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract all property column headers from features
  const columns = useMemo(() => {
    if (!layer?.data?.features?.length) return [];
    const colSet = new Set();
    layer.data.features.slice(0, 100).forEach((f) => {
      Object.keys(f.properties || {}).forEach((k) => colSet.add(k));
    });
    return Array.from(colSet);
  }, [layer]);

  // Filter features based on search term
  const filteredFeatures = useMemo(() => {
    if (!layer?.data?.features) return [];
    if (!searchTerm.trim()) return layer.data.features;

    const term = searchTerm.toLowerCase();
    return layer.data.features.filter((f) => {
      const props = f.properties || {};
      return Object.values(props).some((val) =>
        String(val).toLowerCase().includes(term)
      );
    });
  }, [layer, searchTerm]);

  // Sort filtered features
  const sortedFeatures = useMemo(() => {
    if (!sortColumn) return filteredFeatures;
    const sorted = [...filteredFeatures].sort((a, b) => {
      const valA = a.properties?.[sortColumn];
      const valB = b.properties?.[sortColumn];

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      const numA = parseFloat(valA);
      const numB = parseFloat(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }

      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [filteredFeatures, sortColumn, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedFeatures.length / pageSize) || 1;
  const paginatedFeatures = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedFeatures.slice(start, start + pageSize);
  }, [sortedFeatures, page, pageSize]);

  // Handle header sort click
  const handleSort = (col) => {
    if (sortColumn === col) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
    setPage(1);
  };

  // Export to CSV
  const exportToCsv = () => {
    if (!columns.length || !sortedFeatures.length) return;
    const headerRow = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    const rows = sortedFeatures.map((f) => {
      return columns
        .map((c) => {
          const val = f.properties?.[c] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${layer.name || 'data_layer'}_attributes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!layer) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[600] flex flex-col bg-[#0B111A]/98 border-t border-white/[0.1] shadow-[0_-16px_48px_rgba(0,0,0,0.75)] backdrop-blur-xl transition-all duration-300 ${
        isExpanded ? 'h-[82vh]' : 'h-80 sm:h-96'
      }`}
    >
      {/* Top Header / Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-[#070B10]/90 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-teal-500/15 border border-teal-500/25 grid place-items-center text-teal-400">
            <TableIcon className="size-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-white tracking-tight">
                {layer.name}
              </h3>
              <span className="rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {sortedFeatures.length.toLocaleString('id-ID')} / {(layer.data?.features?.length || 0).toLocaleString('id-ID')} poligon
              </span>
            </div>
          </div>
        </div>

        {/* Search Input & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter nilai atribut..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-40 sm:w-56 rounded-lg bg-[#0D1520] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 border border-white/[0.1] focus:outline-none focus:border-teal-500/60"
            />
          </div>

          <button
            type="button"
            title="Ekspor Data ke CSV"
            onClick={exportToCsv}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-white/[0.08] transition-colors"
          >
            <Download className="size-3.5 text-teal-400" />
            <span className="hidden sm:inline">Unduh CSV</span>
          </button>

          <button
            type="button"
            title={isExpanded ? 'Kecilkan Tabel' : 'Perbesar Tabel'}
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          <button
            type="button"
            title="Tutup Tabel"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto bg-[#090E16]">
        {columns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Tidak ada kolom atribut pada layer ini.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="sticky top-0 bg-[#070B10]/95 border-b border-white/[0.1] shadow-sm z-10">
              <tr>
                <th className="px-3 py-2 text-center w-12 border-r border-white/[0.06] text-[10px] font-mono text-slate-500">
                  #
                </th>
                {columns.map((col) => {
                  const isSorted = sortColumn === col;
                  const isPrimary = layer.npgtKey === col;
                  const humanLabel = FIELD_LABELS[col];
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className={`px-3 py-2 cursor-pointer border-r border-white/[0.06] transition-colors whitespace-nowrap ${
                        isPrimary
                          ? 'bg-teal-500/10 hover:bg-teal-500/15 text-teal-300'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
                              {col}
                            </span>
                            {isPrimary && (
                              <span className="rounded bg-teal-500/20 px-1 py-0.2 text-[8px] font-sans font-bold text-teal-300 uppercase">
                                Utama
                              </span>
                            )}
                          </div>
                          {humanLabel && (
                            <span className="block text-[9.5px] font-sans font-normal text-slate-400 tracking-normal normal-case mt-0.5">
                              {humanLabel}
                            </span>
                          )}
                        </div>
                        <ArrowUpDown
                          className={`size-3 shrink-0 ${
                            isSorted ? 'text-teal-400' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-[11px]">
              {paginatedFeatures.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">
                    Tidak ditemukan data yang sesuai pencarian "{searchTerm}"
                  </td>
                </tr>
              ) : (
                paginatedFeatures.map((f, index) => {
                  const rowNumber = (page - 1) * pageSize + index + 1;
                  const isSelected = selectedFeature?.id === f.id;

                  return (
                    <tr
                      key={f.id || index}
                      onClick={() => {
                        onSelectFeature(f, layer);
                        if (onZoomToFeature) onZoomToFeature(f);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-500/15 text-white font-medium'
                          : 'hover:bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      <td className="px-3 py-2 text-center font-mono text-[10px] text-slate-500 border-r border-white/[0.05]">
                        {rowNumber}
                      </td>
                      {columns.map((col) => {
                        const val = f.properties?.[col];
                        const isPrimary = layer.npgtKey === col;
                        const isArea = col === 'LUAS_HA' && typeof val === 'number';
                        return (
                          <td
                            key={col}
                            className={`px-3 py-2 border-r border-white/[0.05] max-w-xs truncate ${
                              isArea
                                ? 'font-mono text-right text-emerald-300 font-semibold'
                                : isPrimary
                                ? 'font-semibold text-teal-200 bg-teal-500/[0.04]'
                                : ''
                            }`}
                            title={String(val ?? '')}
                          >
                            {isArea
                              ? `${formatNumber(val)} Ha`
                              : val !== undefined && val !== null && val !== ''
                              ? String(val)
                              : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.08] bg-[#070B10] text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md bg-[#0D1520] px-2 py-1 text-slate-200 border border-white/[0.1] text-xs font-mono focus:outline-none focus:border-teal-500/50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <span>
            Halaman <span className="font-mono font-semibold text-white">{page}</span> dari{' '}
            <span className="font-mono font-semibold text-white">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-35 disabled:cursor-not-allowed text-slate-300 border border-white/[0.06]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-35 disabled:cursor-not-allowed text-slate-300 border border-white/[0.06]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
