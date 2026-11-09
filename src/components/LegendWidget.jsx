import React, { useState } from 'react';
import { ListFilter, ChevronDown, ChevronUp, Table } from 'lucide-react';
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
  onOpenTable,
  onToggleLandUseMode,
  onToggleCapabilityMode
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Active layers that are visible
  const activeLayers = layers.filter((l) => l.visible);
  if (!activeLayers.length) return null;

  return (
    <div className="absolute bottom-3.5 right-3.5 z-[400] w-80 rounded-2xl bg-[#0B111A]/95 shadow-2xl backdrop-blur-xl border border-slate-800/90 text-slate-200 overflow-hidden text-xs">
      {/* Header */}
      <div
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#070B10]/80 border-b border-slate-800/80 cursor-pointer select-none hover:bg-slate-900/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ListFilter className="size-3.5 text-teal-400" />
          <span className="font-semibold text-white text-xs">
            Legenda Simbologi
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] text-slate-400">
            {activeLayers.length}
          </span>
        </div>
        <button type="button" className="text-slate-400 hover:text-white">
          {collapsed ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
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
              ['Lname', 'Uname', 'Xname', 'Dname', 'Ename'].includes(layer.npgtKey);
            const canToggleCapability =
              isLandCapabilityLayer &&
              Boolean(onToggleCapabilityMode) &&
              hasLandCapabilityColumns(layer);
            const currentCapabilityMode =
              layer.capabilityMode ||
              CAPABILITY_MODES.find((m) => m.column === layer.npgtKey)?.mode ||
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

                    <div className="space-y-1.5 pt-0.5">
                      {thematicCategories.slice(0, 15).map((cat) => {
                        const areaStr = `${formatNumber(cat.areaHa)} Ha`;
                        const pctStr = `${(cat.pct || 0).toLocaleString('id-ID', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })}%`;

                        return (
                          <div key={cat.label} className="flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="size-2.5 rounded-sm shrink-0 shadow-xs"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="truncate text-slate-200" title={cat.label}>
                                {cat.label}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-300 shrink-0 whitespace-nowrap">
                              {areaStr} <span className="text-teal-400 font-medium">({pctStr})</span>
                            </span>
                          </div>
                        );
                      })}
                      {thematicCategories.length > 15 && (
                        <span className="block text-[10px] text-slate-500 italic">
                          +{thematicCategories.length - 15} kategori lainnya
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
