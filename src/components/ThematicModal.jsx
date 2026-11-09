import React, { useState, useMemo } from 'react';
import { Palette, X, Check, RotateCcw } from 'lucide-react';
import { getFeatureAreaHa, formatNumber } from '../utils/npgtData';

export const PALETTES = {
  vibrant: {
    name: 'Vibrant 10 (Kontras Tinggi)',
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1']
  },
  pastel: {
    name: 'Pastel Modern (Lembut)',
    colors: ['#93c5fd', '#86efac', '#fde047', '#fca5a5', '#d8b4fe', '#f9a8d4', '#67e8f9', '#fdba74', '#5eead4', '#a5b4fc']
  },
  viridis: {
    name: 'Viridis (Aman Buta Warna)',
    colors: ['#440154', '#482777', '#3f4a8a', '#31688e', '#26828e', '#1f9e89', '#35b779', '#6dcd59', '#b4de2c', '#fde725']
  },
  plasma: {
    name: 'Plasma (Ungu-Pink-Kuning)',
    colors: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921']
  },
  warm: {
    name: 'Warm Spectrum (Hangat/Kesesuaian)',
    colors: ['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#b91c1c']
  },
  earth: {
    name: 'Tata Guna Lahan / Alam',
    colors: ['#15803d', '#22c55e', '#84cc16', '#eab308', '#d97706', '#b45309', '#0284c7', '#64748b']
  }
};

export default function ThematicModal({
  layer,
  isOpen,
  onClose,
  onApplyThematic,
  onClearThematic
}) {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedPalette, setSelectedPalette] = useState('vibrant');

  // Columns in layer
  const columns = useMemo(() => {
    if (!layer?.data?.features?.length) return [];
    const set = new Set();
    layer.data.features.slice(0, 50).forEach((f) => {
      Object.keys(f.properties || {}).forEach((k) => set.add(k));
    });
    return Array.from(set);
  }, [layer]);

  // Set default column when opened
  React.useEffect(() => {
    if (layer?.thematic?.column) {
      setSelectedColumn(layer.thematic.column);
    } else if (columns.length > 0 && !selectedColumn) {
      // Prioritize common classification columns
      const pref = columns.find((c) =>
        /^(namobj|wadmkd|wadmkc|kspola|compatb|optnh|vname|remark|status|zona|kategori)$/i.test(c)
      );
      setSelectedColumn(pref || columns[0]);
    }
  }, [layer, columns, selectedColumn]);

  // Unique values for chosen column, sorted and weighted by area in Hectares
  const uniqueValues = useMemo(() => {
    if (!layer?.data?.features || !selectedColumn) return [];
    const valCounts = new Map();
    const valAreas = new Map();
    let totalAreaHa = 0;

    layer.data.features.forEach((f) => {
      const v = String(f.properties?.[selectedColumn] || '').trim() || '(Kosong)';
      const ha = getFeatureAreaHa(f);
      valCounts.set(v, (valCounts.get(v) || 0) + 1);
      valAreas.set(v, (valAreas.get(v) || 0) + ha);
      totalAreaHa += ha;
    });

    return Array.from(valCounts.entries())
      .map(([val, count]) => {
        const areaHa = valAreas.get(val) || 0;
        const pct = totalAreaHa > 0 ? (areaHa / totalAreaHa) * 100 : 0;
        return { val, count, areaHa, pct };
      })
      .sort((a, b) => b.areaHa - a.areaHa || b.count - a.count);
  }, [layer, selectedColumn]);

  // Generated color mapping
  const colorMap = useMemo(() => {
    const palette = PALETTES[selectedPalette]?.colors || PALETTES.vibrant.colors;
    const map = {};
    uniqueValues.forEach((item, index) => {
      map[item.val] = palette[index % palette.length];
    });
    return map;
  }, [uniqueValues, selectedPalette]);

  if (!isOpen || !layer) return null;

  const handleApply = () => {
    if (!selectedColumn) return;
    onApplyThematic(layer.id, {
      column: selectedColumn,
      palette: selectedPalette,
      colorMap,
      categories: uniqueValues.map((u) => ({
        label: u.val,
        color: colorMap[u.val],
        count: u.count,
        areaHa: u.areaHa,
        pct: u.pct,
        value: u.areaHa
      }))
    });
    onClose();
  };

  const handleClear = () => {
    onClearThematic(layer.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Palette className="size-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm text-white">Klasifikasi Tematik / Warna Kategori</h3>
              <p className="text-[11px] text-slate-400">{layer.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Column Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Pilih Kolom Atribut untuk Pewarnaan:
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full rounded-xl bg-slate-800 px-3 py-2 text-xs text-white border border-slate-700 focus:outline-none focus:border-amber-400 font-medium"
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Palette Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Pilih Skema Palet Warna:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PALETTES).map(([key, pal]) => {
                const isSelected = selectedPalette === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPalette(key)}
                    className={`flex flex-col gap-1.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-slate-800/40 border-slate-750 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-300">{pal.name}</span>
                    <div className="flex h-3 w-full rounded overflow-hidden">
                      {pal.colors.slice(0, 8).map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Preview */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Pratinjau Kategori ({uniqueValues.length} nilai unik):</span>
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl bg-slate-950/60 p-2.5 border border-slate-800 space-y-1.5">
              {uniqueValues.map((item) => (
                <div
                  key={item.val}
                  className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-850"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: colorMap[item.val] }}
                    />
                    <span className="truncate text-slate-200" title={item.val}>
                      {item.val}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {formatNumber(item.areaHa)} Ha ({item.pct.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/60">
          {layer.thematic ? (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>Hapus Pewarnaan Tematik</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-colors"
            >
              <Check className="size-3.5 stroke-[2.5]" />
              <span>Terapkan Klasifikasi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
