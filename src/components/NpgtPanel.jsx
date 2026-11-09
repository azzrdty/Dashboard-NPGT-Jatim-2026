import React from 'react';
import { 
  NPGT_INDICATORS 
} from '../utils/gisUtils';
import { 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  Sparkles, 
  Layers, 
  ChevronRight,
  TrendingUp,
  MapPin,
  Filter
} from 'lucide-react';

export default function NpgtPanel({
  features,
  activeIndicator,
  setActiveIndicator,
  selectedDesa,
  setSelectedDesa,
  onFeatureSelect
}) {
  // Extract distinct villages for dropdown
  const desaList = React.useMemo(() => {
    const set = new Set();
    features.forEach(f => {
      if (f.properties?.WADMKD) set.add(f.properties.WADMKD);
    });
    return Array.from(set).sort();
  }, [features]);

  // Filtered features
  const filteredFeatures = React.useMemo(() => {
    if (!selectedDesa) return features;
    return features.filter(f => f.properties?.WADMKD === selectedDesa);
  }, [features, selectedDesa]);

  // Aggregate stats for current active indicator
  const indicatorStats = React.useMemo(() => {
    const counts = {};
    const areas = {};
    let totalHa = 0;

    filteredFeatures.forEach(f => {
      const val = f.properties?.[activeIndicator] || 'Tidak Terdata';
      const ha = Number(f.properties?.LUAS_HA) || 0;
      counts[val] = (counts[val] || 0) + 1;
      areas[val] = (areas[val] || 0) + ha;
      totalHa += ha;
    });

    const breakdown = Object.entries(counts).map(([name, count]) => {
      const ha = areas[name] || 0;
      const percentage = totalHa > 0 ? (ha / totalHa) * 100 : 0;
      return {
        name,
        count,
        ha,
        percentage
      };
    }).sort((a, b) => b.ha - a.ha);

    return {
      totalHa,
      totalCount: filteredFeatures.length,
      breakdown
    };
  }, [filteredFeatures, activeIndicator]);

  const currentIndConfig = NPGT_INDICATORS[activeIndicator] || {
    label: activeIndicator,
    description: 'Indikator Neraca Penatagunaan Tanah BPN DJPA'
  };

  return (
    <div className="flex flex-col h-full bg-[#0B111B] text-slate-200 select-none overflow-y-auto">
      {/* Indicator Selection Header */}
      <div className="p-4 border-b border-white/10 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-sky-400 tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            8 Indikator DJPA ATR/BPN
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            {filteredFeatures.length} Bidang
          </span>
        </div>

        {/* Indicator Switcher Pills */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {Object.keys(NPGT_INDICATORS).map(key => {
            const isActive = activeIndicator === key;
            return (
              <button
                key={key}
                onClick={() => setActiveIndicator(key)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold font-mono tracking-tight transition-all duration-150 cursor-pointer text-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-blue-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                }`}
                title={NPGT_INDICATORS[key].label}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Indicator Description Card */}
        <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs">
          <h4 className="font-semibold text-blue-200 flex items-center justify-between">
            <span>{currentIndConfig.label}</span>
            <span className="font-mono text-[10px] text-blue-400">({activeIndicator})</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {currentIndConfig.description}
          </p>
        </div>
      </div>

      {/* Filter by Desa / Kelurahan */}
      <div className="p-4 border-b border-white/10 bg-slate-900/30">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            Filter Wilayah Desa/Kelurahan
          </span>
          {selectedDesa && (
            <button
              onClick={() => setSelectedDesa('')}
              className="text-[10px] text-sky-400 hover:underline cursor-pointer"
            >
              Reset Semua
            </button>
          )}
        </label>
        <select
          value={selectedDesa}
          onChange={(e) => setSelectedDesa(e.target.value)}
          aria-label="Filter Wilayah Desa/Kelurahan"
          className="w-full bg-slate-800/90 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">Semua Desa (13 Desa Kec. Ujungpangkah)</option>
          {desaList.map(desa => (
            <option key={desa} value={desa}>
              {desa}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Overview Tiles */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          Ringkasan Neraca Spasial
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Total Luas</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {indicatorStats.totalHa.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
              <span className="text-xs font-normal text-slate-400 ml-1">Ha</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Jumlah Fitur</span>
            <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
              {indicatorStats.totalCount}
              <span className="text-xs font-normal text-slate-400 ml-1">Poligon</span>
            </div>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Proporsi Luas</span>
            <span className="font-mono text-emerald-400 font-semibold">100%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex p-0.5 gap-0.5">
            {indicatorStats.breakdown.map((item, idx) => {
              const color = currentIndConfig.colors?.[item.name] || '#38BDF8';
              return (
                <div
                  key={idx}
                  style={{ width: `${item.percentage}%`, backgroundColor: color }}
                  className="h-full rounded-sm transition-all duration-300"
                  title={`${item.name}: ${item.percentage.toFixed(1)}% (${item.ha.toFixed(1)} Ha)`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="p-4 flex-1">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Distribusi Kategori</span>
          <span className="text-[10px] text-slate-500 font-normal">Hektar &amp; %</span>
        </h3>

        <div className="space-y-2">
          {indicatorStats.breakdown.map((item, idx) => {
            const color = currentIndConfig.colors?.[item.name] || '#64748B';
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-semibold text-slate-200">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold font-mono text-sky-400">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{item.count} Poligon Wilayah</span>
                  <span>{item.ha.toFixed(2)} Ha</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
