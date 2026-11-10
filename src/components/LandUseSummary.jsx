import React, { useMemo } from 'react';
import { formatNumber } from '../utils/npgtData';
import { Layers, AlertCircle, PieChart } from 'lucide-react';

export default function LandUseSummary({
  rows = [],
  selectedLandUse = '',
  onSelectLandUse
}) {
  const { items, total, available } = useMemo(() => {
    const totals = new Map();
    let found = false;

    rows.forEach((row) => {
      if (row.QNAME5 === undefined || row.QNAME5 === null || row.QNAME5 === '') return;
      found = true;
      const label = String(row.QNAME5).trim();
      totals.set(label, (totals.get(label) ?? 0) + (row.area || 1));
    });

    const itemsList = [...totals.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return {
      items: itemsList,
      total: itemsList.reduce((sum, item) => sum + item.value, 0),
      available: found
    };
  }, [rows]);

  return (
    <div id="land-use-summary" className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm text-slate-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="size-5 text-volt text-[#e6ff2e]" />
          <h4 className="text-base font-bold text-white tracking-tight">
            Penggunaan Tanah
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Luas per penggunaan tanah (kolom QNAME5)
        </span>
      </div>

      {!rows.length && (
        <p className="py-8 text-center text-xs text-slate-500">
          Belum ada data termuat
        </p>
      )}

      {!!rows.length && !available && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
          <AlertCircle className="size-4 text-amber-400 shrink-0" />
          <span>Kolom <b>QNAME5</b> tidak ditemukan pada data yang diunggah</span>
        </div>
      )}

      {available && (
        <>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
            <span>
              <b className="text-white font-mono">{formatNumber(items.length)}</b> jenis penggunaan tanah
            </span>
            <span>
              Total: <b className="font-mono text-white text-sm">{formatNumber(total)}</b> ha
            </span>
          </div>

          <ul className="mt-3.5 max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {items.map((item) => {
              const percent = total ? (item.value / total) * 100 : 0;
              const isSelected = selectedLandUse === item.label;

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onSelectLandUse && onSelectLandUse(item.label)}
                    className={`w-full text-left p-2 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-slate-800 ring-1 ring-[#e6ff2e]/50'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-medium text-slate-200" title={item.label}>
                        {item.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-300">
                        <b className="text-white font-mono">{formatNumber(item.value)}</b> ha{' '}
                        <em className="ml-1 not-italic text-slate-400 font-mono text-[11px]">
                          {formatNumber(percent)}%
                        </em>
                      </span>
                    </div>

                    <div
                      className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800"
                      role="img"
                      aria-label={`${item.label}: ${formatNumber(percent)}%`}
                    >
                      <div
                        className="h-full rounded-full bg-[#e6ff2e] transition-all duration-300"
                        style={{ width: `${Math.max(percent, 0.75)}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
