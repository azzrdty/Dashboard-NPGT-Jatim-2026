import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  ChevronDown,
  MapPin,
  Building,
  Layers,
  PieChart
} from 'lucide-react';

import {
  indicators,
  groups,
  tones,
  getTone,
  getLandUseColor,
  getLandCapabilityColor,
  CAPABILITY_MODES,
  sortByTone,
  formatNumber,
  parseAnalysis,
  createDemoRows,
  hasQreklasColumn,
  hasLandCapabilityColumns
} from '../utils/npgtData';

export default function NpgtDashboard({
  layer,
  onApplyThematicFilter,
  onView8LayersInMap,
  onViewIndicatorInMap
}) {
  const [filters, setFilters] = useState({});
  const [selectedDesa, setSelectedDesa] = useState('');
  const [selectedLandUse, setSelectedLandUse] = useState('');
  const [landUseMode, setLandUseMode] = useState('QNAME5'); // 'QNAME5' | 'QREKLAS'
  const [capabilityMode, setCapabilityMode] = useState('L'); // 'L' | 'U' | 'X' | 'D' | 'E'
  const [unitMode, setUnitMode] = useState('ha'); // 'ha' | 'count'
  const [activeIndicator, setActiveIndicator] = useState('KSPOLA');
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Collapsible cards state for analysis groups (default: all open)
  const [openGroups, setOpenGroups] = useState({
    0: true,
    1: true,
    2: true,
    3: true
  });

  const toggleGroup = (gIndex) => {
    setOpenGroups((prev) => ({
      ...prev,
      [gIndex]: !prev[gIndex]
    }));
  };

  const handleToggleAllGroups = () => {
    const allOpen = groups.every((_, i) => openGroups[i] !== false);
    const next = {};
    groups.forEach((_, i) => {
      next[i] = !allOpen;
    });
    setOpenGroups(next);
  };

  const handleSelectIndicator = (indKey, groupIndex) => {
    setActiveIndicator(indKey);
    if (groupIndex !== undefined && openGroups[groupIndex] === false) {
      setOpenGroups((prev) => ({ ...prev, [groupIndex]: true }));
    }
  };

  // Check if layer has real NPGT features (use sourceData if layer is dissolved per indicator)
  const rawFeatures = (layer?.sourceData || layer?.data)?.features || [];
  const rawRecords = useMemo(() => {
    return rawFeatures.map((f, i) => ({
      id: f.id !== undefined ? f.id : i,
      geometry: f.geometry,
      ...(f.properties || {})
    }));
  }, [rawFeatures]);

  // Parse layer analysis rows or demo rows
  const { rows, isRealData, wilayahInfo } = useMemo(() => {
    if (!useDemoMode && rawRecords.length > 0) {
      try {
        const parsed = parseAnalysis(rawRecords);
        const first = parsed[0] || {};
        return {
          rows: parsed,
          isRealData: true,
          wilayahInfo: {
            kab: first.WADMKK || '',
            kec: first.WADMKC || '',
            desaCount: new Set(parsed.map((r) => r.WADMKD).filter(Boolean)).size
          }
        };
      } catch (e) {
        // Fallback to demo if columns are missing
        const demo = createDemoRows();
        return {
          rows: demo,
          isRealData: false,
          wilayahInfo: {
            kab: 'Kabupaten Kediri (Simulasi)',
            kec: 'Kecamatan Contoh',
            desaCount: 6
          }
        };
      }
    } else {
      const demo = createDemoRows();
      return {
        rows: demo,
        isRealData: false,
        wilayahInfo: {
          kab: 'Kabupaten Kediri (Simulasi)',
          kec: 'Kecamatan Contoh',
          desaCount: 6
        }
      };
    }
  }, [rawRecords, useDemoMode]);

  // Check whether uploaded data actually contains QREKLAS / Kemampuan Tanah columns
  const hasQreklas = useMemo(() => {
    if (isRealData) {
      return hasQreklasColumn(layer);
    }
    return false;
  }, [isRealData, layer]);

  const hasCapability = useMemo(() => {
    if (isRealData) {
      return hasLandCapabilityColumns(layer);
    }
    return true;
  }, [isRealData, layer]);

  const effectiveLandUseMode = hasQreklas ? landUseMode : 'QNAME5';
  const activeCapSpec =
    CAPABILITY_MODES.find((m) => m.mode === capabilityMode) || CAPABILITY_MODES[0];
  const effectiveCapColumn = activeCapSpec.column;

  // Extract unique desa list
  const desas = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.WADMKD).filter(Boolean))).sort();
  }, [rows]);

  // Value getter: selalu berbasis luas hektar (area)
  const getVal = (r) => (typeof r.area === 'number' && !isNaN(r.area) ? r.area : 0);
  const sum = (arr) => arr.reduce((s, r) => s + getVal(r), 0);

  // Filter rows
  const filterRows = (excludeKey) => {
    return rows.filter((r) => {
      if (selectedDesa && r.WADMKD !== selectedDesa) return false;
      if (selectedLandUse && r.QNAME5 !== selectedLandUse) return false;
      return Object.entries(filters).every(([k, v]) => {
        if (k === excludeKey) return true;
        if (k === 'QNAME5') return r[effectiveLandUseMode] === v;
        if (k === 'Lname') return r[effectiveCapColumn] === v;
        return r[k] === v;
      });
    });
  };

  // Grouped stats per indicator (land use & capability sorted by area; 8 analyses sorted by tone priority)
  const indicatorStats = useMemo(() => {
    return Object.fromEntries(
      indicators.map((ind) => {
        const catMap = new Map();
        let tot = 0;
        const propKey = ind.isLandUse
          ? effectiveLandUseMode
          : ind.isLandCapability
          ? effectiveCapColumn
          : ind.key;
        filterRows(ind.key).forEach((r) => {
          const val = r[propKey] || '(kosong)';
          const weight = getVal(r);
          catMap.set(val, (catMap.get(val) || 0) + weight);
          tot += weight;
        });

        const rawList = Array.from(catMap.entries()).map(([label, value]) => ({
          label,
          value
        }));

        let sortedList;
        if (ind.isLandUse) {
          sortedList = [...rawList]
            .sort((a, b) => b.value - a.value)
            .map((item, idx) => ({
              ...item,
              color: getLandUseColor(item.label, idx)
            }));
        } else if (ind.isLandCapability) {
          sortedList = [...rawList]
            .sort((a, b) => b.value - a.value)
            .map((item, idx) => ({
              ...item,
              color: getLandCapabilityColor(item.label, capabilityMode, idx)
            }));
        } else {
          sortedList = sortByTone(rawList).map((item) => {
            const t = getTone(item.label);
            return {
              ...item,
              color: tones[t] || tones.ok
            };
          });
        }

        return [ind.key, { tot, list: sortedList }];
      })
    );
  }, [rows, filters, selectedDesa, selectedLandUse, unitMode, effectiveLandUseMode, effectiveCapColumn, capabilityMode]);

  // Current active filtered list
  const currentFiltered = useMemo(
    () => filterRows(),
    [rows, filters, selectedDesa, selectedLandUse, unitMode, effectiveLandUseMode, effectiveCapColumn]
  );
  const totalVal = sum(currentFiltered);

  const currentAttr = indicators.find((a) => a.key === activeIndicator) || indicators[0];
  const currentStat = indicatorStats[activeIndicator] || { tot: 0, list: [] };

  const handleToggleFilter = (key, val) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (next[key] === val) {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
  };

  const handleChangeLandUseMode = (mode) => {
    setLandUseMode(mode);
    setFilters((prev) => {
      if (!prev.QNAME5) return prev;
      const next = { ...prev };
      delete next.QNAME5;
      return next;
    });
  };

  const handleChangeCapabilityMode = (mode) => {
    setCapabilityMode(mode);
    setFilters((prev) => {
      if (!prev.Lname) return prev;
      const next = { ...prev };
      delete next.Lname;
      return next;
    });
  };

  const resetFilters = () => {
    setFilters({});
    setSelectedDesa('');
    setSelectedLandUse('');
  };

  // KPIs
  const kpis = [
    {
      label: 'Total Luas Teranalisis',
      val: `${formatNumber(totalVal)} Ha`
    },
    {
      label: 'Sesuai / Mendukung RTRW',
      pct: totalVal
        ? Math.round(
            (sum(currentFiltered.filter((r) => /^(sesuai|mendukung)$/i.test(String(r.KSPOLA || '')))) / totalVal) * 100
          )
        : 0
    },
    {
      label: 'Kompatibilitas Tanah',
      pct: totalVal
        ? Math.round(
            (sum(currentFiltered.filter((r) => /^kompatibel$/i.test(String(r.COMPATB || '')))) / totalVal) * 100
          )
        : 0
    },
    {
      label: 'Keoptimalan Tanah',
      pct: totalVal
        ? Math.round(
            (sum(currentFiltered.filter((r) => /^optimal$/i.test(String(r.OPTNH || '')))) / totalVal) * 100
          )
        : 0
    },
    {
      label: 'Tanah Tersedia',
      val: `${formatNumber(sum(currentFiltered.filter((r) => /^tersedia$/i.test(String(r.Vname || '')))))} Ha`
    },
    {
      label: 'Potensi Penataan Aset',
      val: `${formatNumber(sum(currentFiltered.filter((r) => /^potensi/i.test(String(r.PASET || '')))))} Ha`
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#070B10] p-6 text-slate-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Title & Wilayah Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-teal-500/15 grid place-items-center text-teal-400 border border-teal-500/30">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Dashboard Neraca Penatagunaan Tanah (NPGT)
                </h1>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  {wilayahInfo.kab && (
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Building className="size-3 text-teal-400" />
                      {wilayahInfo.kab}
                    </span>
                  )}
                  {wilayahInfo.kec && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <MapPin className="size-3 text-amber-400" />
                        Kec. {wilayahInfo.kec}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-mono text-[11px]">{wilayahInfo.desaCount} Desa/Kelurahan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spatial View & Demo Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onViewIndicatorInMap ? (
              <button
                type="button"
                onClick={() => onViewIndicatorInMap(activeIndicator)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-colors"
              >
                <Layers className="size-3.5 stroke-[2.5]" />
                <span>Lihat Indikator di Peta Spasial</span>
              </button>
            ) : (
              onView8LayersInMap && (
                <button
                  type="button"
                  onClick={onView8LayersInMap}
                  className="flex items-center gap-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-colors"
                >
                  <Layers className="size-3.5 stroke-[2.5]" />
                  <span>Buka Layer di Peta Spasial</span>
                </button>
              )
            )}

            {!isRealData && (
              <span className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-400" />
                Mode Simulasi Contoh
              </span>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#0B111A] border border-white/[0.08] shadow-sm flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-slate-400">{kpi.label}</span>
              <div className="mt-2">
                {kpi.pct !== undefined ? (
                  <div>
                    <span className="text-2xl font-bold text-white font-mono tabular-nums">{kpi.pct}%</span>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full transition-all"
                        style={{ width: `${kpi.pct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">{kpi.val}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-[#0B111A] border border-white/[0.08] text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 pr-2 border-r border-white/[0.08]">
            <Filter className="size-3.5 text-teal-400" />
            <span className="font-semibold text-white">Filter Wilayah & Indikator:</span>
          </div>

          {desas.length > 0 && (
            <select
              value={selectedDesa}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="rounded-lg bg-[#070B10] px-3 py-1.5 text-xs text-white border border-white/[0.1] focus:outline-none focus:border-teal-500/50"
            >
              <option value="">Semua Desa / Kelurahan ({desas.length})</option>
              {desas.map((d) => (
                <option key={d} value={d}>
                  Desa {d}
                </option>
              ))}
            </select>
          )}

          {selectedLandUse && (
            <button
              type="button"
              onClick={() => setSelectedLandUse('')}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#e6ff2e]/20 text-[#e6ff2e] border border-[#e6ff2e]/40 hover:bg-[#e6ff2e]/30 transition-colors"
            >
              <span>Penggunaan: {selectedLandUse}</span>
              <span className="font-bold ml-1">&times;</span>
            </button>
          )}

          {Object.entries(filters).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleToggleFilter(k, v)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-colors"
            >
              <span>{k}: {v}</span>
              <span className="text-sky-400 font-bold ml-1">&times;</span>
            </button>
          ))}

          {(Object.keys(filters).length > 0 || selectedDesa || selectedLandUse) && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-white underline ml-auto transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* 2-Column Workspace: Left Indicators & Right Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Indicators in Collapsible Cards */}
          <div className="lg:col-span-5 space-y-3">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers className="size-3.5 text-teal-400" />
                <span className="text-xs font-bold text-white tracking-tight">Pilihan Analisis NPGT</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-[10px] font-mono text-teal-300 border border-slate-700/60">
                  {indicators.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleAllGroups}
                className="text-[11px] font-medium text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
              >
                {groups.every((_, i) => openGroups[i] !== false) ? 'Tutup Semua' : 'Buka Semua'}
              </button>
            </div>

            {/* Collapsible Group Cards */}
            <div className="space-y-3">
              {groups.map((groupTitle, gIndex) => {
                const groupAttrs = indicators.filter((a) => a.group === gIndex);
                const isOpen = openGroups[gIndex] !== false;
                const hasActiveIndicator = groupAttrs.some((a) => a.key === activeIndicator);

                return (
                  <div
                    key={gIndex}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      hasActiveIndicator
                        ? 'bg-[#0B111A] border-teal-500/35 shadow-md ring-1 ring-teal-500/15'
                        : 'bg-[#0B111A] border-white/[0.08] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Collapsible Card Header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(gIndex)}
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/[0.02] transition-colors select-none group/hdr cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-semibold text-white tracking-tight">
                              {groupTitle}
                            </h3>
                            {hasActiveIndicator && (
                              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-teal-500/15 border border-teal-500/30 text-[9px] font-medium text-teal-300">
                                <span className="size-1 rounded-full bg-teal-400 animate-pulse" />
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                          {groupAttrs.length} analisis
                        </span>
                        <div
                          className={`size-6 rounded-md grid place-items-center text-slate-400 group-hover/hdr:text-white transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-teal-400' : ''
                          }`}
                        >
                          <ChevronDown className="size-3.5" />
                        </div>
                      </div>
                    </button>

                    {/* Collapsible Card Body */}
                    {isOpen && (
                      <div className="p-3 pt-0 space-y-1.5 border-t border-white/[0.04] bg-[#070B10]/40">
                        {groupAttrs.map((a) => {
                          const isActive = a.key === activeIndicator;
                          const stat = indicatorStats[a.key];
                          const topCat = stat?.list?.[0];

                          return (
                            <button
                              key={a.key}
                              type="button"
                              onClick={() => handleSelectIndicator(a.key, gIndex)}
                              className={`w-full text-left p-3 rounded-xl transition-all border ${
                                isActive
                                  ? 'bg-teal-500/10 border-teal-500/45 shadow-sm'
                                  : 'bg-[#070B10]/70 border-white/[0.06] hover:bg-white/[0.03] hover:border-white/[0.12]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white">{a.title}</span>
                                {a.isLandUse && hasQreklas ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-700/80 shrink-0"
                                  >
                                    {['QNAME5', 'QREKLAS'].map((mode) => {
                                      const active = effectiveLandUseMode === mode;
                                      return (
                                        <span
                                          key={mode}
                                          role="button"
                                          tabIndex={0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeLandUseMode(mode);
                                            handleSelectIndicator(a.key, gIndex);
                                          }}
                                          className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all cursor-pointer ${
                                            active
                                              ? 'bg-teal-400 text-slate-950 shadow-xs'
                                              : 'text-slate-400 hover:text-white'
                                          }`}
                                        >
                                          {mode}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : a.isLandCapability && hasCapability ? (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-700/80 shrink-0"
                                  >
                                    {CAPABILITY_MODES.map(({ mode, title }) => {
                                      const active = capabilityMode === mode;
                                      return (
                                        <span
                                          key={mode}
                                          role="button"
                                          tabIndex={0}
                                          title={title}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleChangeCapabilityMode(mode);
                                            handleSelectIndicator(a.key, gIndex);
                                          }}
                                          className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold transition-all cursor-pointer ${
                                            active
                                              ? 'bg-teal-400 text-slate-950 shadow-xs'
                                              : 'text-slate-400 hover:text-white'
                                          }`}
                                        >
                                          {mode}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-mono text-teal-300 px-1.5 py-0.5 rounded bg-teal-500/15 border border-teal-500/25">
                                    {a.key}
                                  </span>
                                )}
                              </div>

                              {/* Area-Proportional Segment Bar */}
                              <div className="flex h-2 w-full rounded-full overflow-hidden mt-2 bg-slate-800 gap-0.5">
                                {stat?.list?.map((item) => (
                                  <div
                                    key={item.label}
                                    style={{
                                      flex: item.value,
                                      backgroundColor: item.color
                                    }}
                                    title={`${item.label}: ${formatNumber(item.value)} Ha`}
                                  />
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                                <span className="truncate max-w-[200px]">
                                  {topCat ? topCat.label : '-'}
                                </span>
                                <span className="font-mono tabular-nums text-slate-300">
                                  {topCat && stat.tot
                                    ? `${formatNumber(topCat.value)} Ha (${Math.round((topCat.value / stat.tot) * 100)}%)`
                                    : '0%'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Indicator / Land Use Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Indicator Detail Card */}
            <div className="rounded-xl bg-[#0B111A] border border-white/[0.08] p-6 space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{currentAttr.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentStat.list.length} kategori
                    </span>
                    {currentAttr.isLandUse && hasQreklas ? (
                      <div className="inline-flex items-center rounded-lg bg-[#070B10] p-0.5 border border-slate-700/80">
                        {['QNAME5', 'QREKLAS'].map((mode) => {
                          const active = effectiveLandUseMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => handleChangeLandUseMode(mode)}
                              className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-all ${
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
                    ) : currentAttr.isLandCapability && hasCapability ? (
                      <div className="inline-flex items-center rounded-lg bg-[#070B10] p-0.5 border border-slate-700/80">
                        {CAPABILITY_MODES.map(({ mode, title }) => {
                          const active = capabilityMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              title={title}
                              onClick={() => handleChangeCapabilityMode(mode)}
                              className={`px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-all ${
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
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 font-mono text-xs font-semibold border border-teal-500/30">
                        {currentAttr.key}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {currentAttr.description}
                </p>

                {/* Area-Proportional Stacked Bar Summary */}
                {currentStat.list.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-900 border border-white/[0.06] gap-0.5 p-0.5">
                      {currentStat.list.map((item) => {
                        const pct = currentStat.tot ? ((item.value / currentStat.tot) * 100).toFixed(1) : 0;
                        return (
                          <div
                            key={item.label}
                            style={{
                              flex: item.value,
                              backgroundColor: item.color
                            }}
                            className="h-full first:rounded-l-full last:rounded-r-full transition-all"
                            title={`${item.label}: ${formatNumber(item.value)} Ha (${pct}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Categorical Breakdown Table */}
              <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#070B10]/70">
                <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-slate-300 bg-[#070B10] border-b border-white/[0.06]">
                  <div className="col-span-6">Kategori Klasifikasi</div>
                  <div className="col-span-3 text-right">Luas (Ha)</div>
                  <div className="col-span-3 text-right">Proporsi Luas</div>
                </div>

                <div className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.06]">
                  {currentStat.list.map((item) => {
                    const isFiltered = filters[activeIndicator] === item.label;
                    const pctNum = currentStat.tot ? (item.value / currentStat.tot) * 100 : 0;
                    const pct = pctNum.toFixed(1);

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleToggleFilter(activeIndicator, item.label)}
                        className={`w-full grid grid-cols-12 px-4 py-3 text-xs items-center text-left transition-colors ${
                          isFiltered
                            ? 'bg-teal-500/15 text-white font-medium'
                            : 'hover:bg-white/[0.04] text-slate-300'
                        }`}
                      >
                        <div className="col-span-6 flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className="size-3 rounded-[4px] shrink-0 shadow-sm border border-white/20"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate" title={item.label}>{item.label}</span>
                        </div>

                        <div className="col-span-3 text-right font-mono tabular-nums font-semibold text-white">
                          {formatNumber(item.value)} Ha
                        </div>

                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <div className="hidden sm:block w-14 h-1.5 rounded-full bg-slate-800/90 overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(2, pctNum))}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-slate-300 w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Indicator Total Footer */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#070B10] border border-white/[0.08] text-xs">
                <span className="text-slate-400 font-medium">Total Luas Teranalisis:</span>
                <span className="font-mono tabular-nums font-bold text-teal-300 text-sm">
                  {formatNumber(currentStat.tot)} Ha (100%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
