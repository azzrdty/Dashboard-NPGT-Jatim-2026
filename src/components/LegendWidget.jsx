import React, { useState, useEffect, useRef } from 'react';
import { ListFilter, ChevronDown, ChevronUp, Table, Minus, Plus, Check, Filter, X } from 'lucide-react';
import {
  FIELD_LABELS,
  getLayerThematicCategories,
  formatNumber,
  hasQreklasColumn,
  hasLandCapabilityColumns,
  CAPABILITY_MODES
} from '../utils/npgtData';

export default function LegendWidget({
  layers = [],
  selectedCategory = null,
  onSelectCategory,
  onOpenTable,
  onToggleLandUseMode,
  onToggleCapabilityMode
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [scale, setScale] = useState(() => {
    try {
      const saved = localStorage.getItem('npgt_legend_scale');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.6) return parsed;
      }
    } catch (err) {}
    return 1.0;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    try {
      localStorage.setItem('npgt_legend_scale', scale.toString());
    } catch (err) {}
  }, [scale]);

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setScale((s) => Math.max(0.7, Math.round((s - 0.1) * 10) / 10));
  };

  const handleResetScale = (e) => {
    e.stopPropagation();
    setScale(1.0);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scale
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const deltaX = dragStartRef.current.x - e.clientX;
      const deltaY = dragStartRef.current.y - e.clientY;
      const delta = (deltaX + deltaY) / 2;
      const newScale = Math.min(
        1.6,
        Math.max(0.7, Math.round((dragStartRef.current.scale + delta / 220) * 100) / 100)
      );
      setScale(newScale);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  // Active layers that are visible
  const activeLayers = layers.filter((l) => l.visible);
  if (!activeLayers.length) return null;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'bottom right',
        transition: isDragging ? 'none' : 'transform 140ms ease-out'
      }}
      className="absolute bottom-3.5 right-3.5 z-[400] w-80 rounded-2xl bg-[#0B111A]/95 shadow-2xl backdrop-blur-xl border border-slate-800/90 text-slate-200 overflow-hidden text-xs"
    >
      {/* Top-Left Drag to Resize Corner Grip */}
      {!collapsed && (
        <div
          onMouseDown={handleResizeStart}
          title="Tarik sudut ini untuk memperbesar/memperkecil kartu dan teks legenda"
          className="absolute top-0 left-0 z-20 size-5 flex items-center justify-center cursor-nwse-resize text-slate-500 hover:text-teal-300 transition-colors group"
        >
          <div className="size-2 rounded-tl-xs border-t-2 border-l-2 border-slate-600 group-hover:border-teal-400 transition-colors" />
        </div>
      )}

      {/* Header */}
      <div
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex items-center justify-between px-3 py-2.5 bg-[#070B10]/80 border-b border-slate-800/80 cursor-pointer select-none hover:bg-slate-900/80 transition-colors pl-4"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <ListFilter className="size-3.5 text-teal-400 shrink-0" />
          <span className="font-semibold text-white text-xs truncate">
            Legenda
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] text-slate-400 shrink-0">
            {activeLayers.length}
          </span>
        </div>

        {/* Controls: Zoom In/Out/Reset & Collapse */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Zoom Controller */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center rounded-lg bg-slate-900/90 border border-slate-700/80 p-0.5 text-slate-300"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              title="Perkecil Ukuran Kartu & Teks (Zoom Out)"
              disabled={scale <= 0.7}
              className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Minus className="size-2.5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleResetScale}
              title="Klik untuk reset ukuran (100%)"
              className="px-1 text-[10px] font-mono font-medium hover:text-teal-300 transition-colors cursor-pointer"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              title="Perbesar Ukuran Kartu & Teks (Zoom In)"
              disabled={scale >= 1.6}
              className="p-1 rounded hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Plus className="size-2.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="w-px h-3.5 bg-slate-800" />

          <button
            type="button"
            title={collapsed ? 'Tampilkan Legenda' : 'Sembunyikan Legenda'}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-3.5 max-h-72 overflow-y-auto space-y-3.5">
          {activeLayers.map((layer) => {
            const colCode = layer.thematic?.column;
            const colLabel = colCode ? FIELD_LABELS[colCode] || colCode : null;
            const thematicCategories = getLayerThematicCategories(layer);
            const isLandUseLayer =
              layer.isLandUse || layer.npgtKey === 'QNAME5' || layer.npgtKey === 'QREKLAS';
            const canToggleQreklas =
              isLandUseLayer && Boolean(onToggleLandUseMode) && hasQreklasColumn(layer);
            const currentLandUseMode =
              layer.landUseMode || (layer.npgtKey === 'QREKLAS' ? 'QREKLAS' : 'QNAME5');
            const isLandCapabilityLayer =
              layer.isLandCapability ||
              [
                'Lname', 'Uname', 'Xname', 'Dname', 'Ename',
                'LERENG', 'KDEFEK', 'TEKSTUR', 'DRAINS', 'EROSI',
                'L', 'U', 'X', 'D', 'E'
              ].includes(layer.npgtKey);
            const canToggleCapability =
              isLandCapabilityLayer &&
              Boolean(onToggleCapabilityMode) &&
              hasLandCapabilityColumns(layer);
            const currentCapabilityMode =
              layer.capabilityMode ||
              CAPABILITY_MODES.find(
                (m) =>
                  m.column === layer.npgtKey ||
                  m.replacementCol === layer.npgtKey ||
                  m.fallbackCol === layer.npgtKey ||
                  m.mode === layer.npgtKey
              )?.mode ||
              'L';

            return (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!thematicCategories.length && (
                      <span
                        className="size-2.5 rounded-full shrink-0 shadow-sm border border-white/20"
                        style={{ backgroundColor: layer.color || '#2dd4bf' }}
                      />
                    )}
                    <span className="font-semibold text-white truncate" title={layer.name}>
                      {layer.name}
                    </span>
                  </div>

                  {onOpenTable && (
                    <button
                      type="button"
                      onClick={() => onOpenTable(layer.id)}
                      title="Buka Tabel Atribut Layer Ini"
                      className="p-1 rounded-md text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <Table className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* If layer has thematic styling */}
                {thematicCategories.length > 0 && (
                  <div className="space-y-2 pt-0.5">
                    {colLabel && (
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span className="truncate">{colLabel}</span>
                        {canToggleQreklas ? (
                          <div className="inline-flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-700/80 shrink-0">
                            {['QNAME5', 'QREKLAS'].map((mode) => {
                              const active = currentLandUseMode === mode;
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    if (!active) onToggleLandUseMode(layer.id, mode);
                                  }}
                                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all ${
                                    active
                                      ? 'bg-teal-400 text-slate-950 shadow-xs'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {mode}
                                </button>
                              );
                            })}
                          </div>
                        ) : canToggleCapability ? (
                          <div className="inline-flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-700/80 shrink-0">
                            {CAPABILITY_MODES.map(({ mode, title }) => {
                              const active = currentCapabilityMode === mode;
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  title={title}
                                  onClick={() => {
                                    if (!active) onToggleCapabilityMode(layer.id, mode);
                                  }}
                                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all ${
                                    active
                                      ? 'bg-teal-400 text-slate-950 shadow-xs'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  {mode}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="font-mono text-teal-400">{colCode}</span>
                        )}
                      </div>
                    )}

                    {/* Active Filter notification pill */}
                    {selectedCategory?.layerId === layer.id && (
                      <div className="flex items-center justify-between gap-1.5 p-1.5 px-2 rounded-lg bg-teal-500/15 border border-teal-500/35 text-[10px] text-teal-300">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <Filter className="size-3 text-teal-400 shrink-0" />
                          <span className="truncate">
                            Filter aktif: <strong className="text-white">{selectedCategory.value}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectCategory) onSelectCategory(null);
                          }}
                          className="flex items-center gap-1 text-[9px] font-semibold text-teal-200 hover:text-white bg-teal-500/25 hover:bg-teal-500/40 px-1.5 py-0.5 rounded transition-colors shrink-0 cursor-pointer"
                          title="Tampilkan kembali semua bidang poligon"
                        >
                          <span>Reset</span>
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}

                    {/* Stacked composition bar (Always Area-Proportional) */}
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-800 gap-0.5">
                      {thematicCategories.map((cat) => (
                        <div
                          key={cat.label}
                          style={{
                            flex: cat.areaHa,
                            backgroundColor: cat.color
                          }}
                          title={`${cat.label}: ${formatNumber(cat.areaHa)} Ha (${cat.pct.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)`}
                        />
                      ))}
                    </div>

                    <div className="space-y-1 pt-0.5">
                      {thematicCategories.slice(0, 20).map((cat) => {
                        const isSelected =
                          selectedCategory?.layerId === layer.id &&
                          selectedCategory?.value === cat.label;
                        const isOtherSelected =
                          selectedCategory?.layerId === layer.id &&
                          selectedCategory?.value !== cat.label;

                        const areaStr = `${formatNumber(cat.areaHa)} Ha`;
                        const pctStr = `${(cat.pct || 0).toLocaleString('id-ID', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })}%`;

                        return (
                          <div
                            key={cat.label}
                            role="button"
                            tabIndex={0}
                            title={
                              isSelected
                                ? `Klik untuk membatalkan filter "${cat.label}" (tampilkan semua bidang)`
                                : `Klik untuk memilih & menampilkan bidang poligon "${cat.label}" di peta`
                            }
                            onClick={() => {
                              if (!onSelectCategory) return;
                              if (isSelected) {
                                onSelectCategory(null);
                              } else {
                                onSelectCategory({
                                  layerId: layer.id,
                                  column: colCode,
                                  value: cat.label,
                                  color: cat.color,
                                  areaHa: cat.areaHa,
                                  count: cat.count
                                });
                              }
                            }}
                            className={`flex items-center justify-between gap-2 text-[11px] px-2 py-1.5 rounded-lg transition-all cursor-pointer select-none border ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-xs ring-1 ring-teal-500/30'
                                : isOtherSelected
                                ? 'opacity-35 hover:opacity-90 hover:bg-slate-800/60 border-transparent text-slate-300'
                                : 'hover:bg-slate-800/80 hover:text-white border-transparent text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="size-2.5 rounded-sm shrink-0 shadow-xs"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="truncate" title={cat.label}>
                                {cat.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                              <span className="font-mono text-[10px] text-slate-300">
                                {areaStr} <span className="text-teal-400 font-medium">({pctStr})</span>
                              </span>
                              {isSelected && (
                                <span className="size-3.5 rounded-full bg-teal-400 text-slate-950 grid place-items-center shrink-0">
                                  <Check className="size-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {thematicCategories.length > 20 && (
                        <span className="block text-[10px] text-slate-500 italic px-2">
                          +{thematicCategories.length - 20} kategori lainnya
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
