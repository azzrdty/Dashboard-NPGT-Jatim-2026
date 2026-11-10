import React, { useState, useMemo } from 'react';
import {
  X,
  Crosshair,
  Copy,
  Check,
  Search,
  Square,
  Ruler,
  MapPin,
  Layers
} from 'lucide-react';
import {
  calculatePolygonArea,
  calculateLineLength,
  formatArea,
  formatLength
} from '../utils/spatialCalculations';
import { FIELD_LABELS, getFeatureAreaHa } from '../utils/npgtData';

const ADMIN_KEY_SET = new Set([
  'WADMPR',
  'WADMKK',
  'WADMKC',
  'WADMKD',
  'KDPPUM',
  'KDPKAB',
  'KDCPUM',
  'KDEPUM',
  'LUAS_HA',
  'LUASHA',
  'LUAS',
  'AREA_HA',
  'AREAHA',
  'AREA',
  'LUAS_HEKTAR',
  'LUAS_BIDANG',
  'SHAPE_AREA'
]);

export default function FeatureInspector({
  feature,
  layer,
  onClose,
  onZoomToFeature
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const geomType = feature?.geometry?.type || 'Unknown';
  const props = feature?.properties || {};

  // Primary title from analysis indicator or common attributes
  const activeCol = layer?.thematic?.column || layer?.npgtKey;
  const npgtVal = activeCol ? props[activeCol] : null;
  const swatchColor =
    (activeCol && layer?.thematic?.colorMap?.[String(npgtVal || '').trim() || '(kosong)']) ||
    layer?.color ||
    '#2dd4bf';
  const baseTitle =
    props.WADMKD ||
    props.NAMOBJ ||
    props.QNAME5 ||
    props.namobj ||
    props.wadmkd ||
    props.WADMKC ||
    props.name ||
    props.NAME ||
    (feature?.id !== undefined ? String(feature.id) : null) ||
    'Fitur Spasial';
  const title = String(npgtVal ? npgtVal : baseTitle);
  const subtitle = [
    props.WADMKD ? `Desa ${props.WADMKD}` : '',
    props.WADMKC ? `Kec. ${props.WADMKC}` : ''
  ]
    .filter(Boolean)
    .map(String)
    .join(' • ');

  // Calculate geometric properties safely
  const geoStats = useMemo(() => {
    if (!feature?.geometry) return null;
    try {
      const type = feature.geometry.type;
      const coords = feature.geometry.coordinates;

      if (type === 'Polygon' || type === 'MultiPolygon') {
        const luasAttr = getFeatureAreaHa(feature);
        const areaDisplay =
          Number.isFinite(luasAttr) && luasAttr > 0
            ? `${luasAttr.toLocaleString('id-ID', { maximumFractionDigits: 3 })} Ha`
            : formatArea(calculatePolygonArea(coords, type));
        return {
          area: areaDisplay
        };
      } else if (type === 'LineString' || type === 'MultiLineString') {
        const lengthM = calculateLineLength(coords, type);
        return {
          length: formatLength(lengthM)
        };
      }
    } catch (err) {
      console.warn('FeatureInspector geoStats error:', err);
    }
    return null;
  }, [feature]);

  // Separate properties into technical lineage vs administrative
  const { technicalProps, adminProps, totalPropCount } = useMemo(() => {
    const entries = Object.entries(props);
    const term = searchTerm.trim().toLowerCase();
    const matched = !term
      ? entries
      : entries.filter(([k, v]) => {
          const label = FIELD_LABELS[k] || '';
          return (
            k.toLowerCase().includes(term) ||
            label.toLowerCase().includes(term) ||
            String(v).toLowerCase().includes(term)
          );
        });

    return {
      technicalProps: matched.filter(([k]) => !ADMIN_KEY_SET.has(k)),
      adminProps: matched.filter(([k]) => ADMIN_KEY_SET.has(k)),
      totalPropCount: matched.length
    };
  }, [props, searchTerm]);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(props, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!feature) return null;

  const renderPropRow = ([k, v]) => {
    const label = FIELD_LABELS[k];
    const isPrimaryAnalysis = activeCol === k || layer?.npgtKey === k;
    const isAreaCol = [
      'LUAS_HA',
      'LUASHA',
      'LUAS',
      'AREA_HA',
      'AREAHA',
      'LUAS_HEKTAR',
      'LUAS_BIDANG',
      'LUASAN'
    ].includes(String(k).toUpperCase());
    const displayVal =
      isAreaCol && Number.isFinite(Number(v))
        ? `${Number(v).toLocaleString('id-ID', { maximumFractionDigits: 4 })} Ha`
        : v !== undefined && v !== null && v !== ''
        ? (typeof v === 'object' ? JSON.stringify(v) : String(v))
        : '(kosong)';

    return (
      <div
        key={k}
        className={`rounded-xl p-2.5 transition-colors ${
          isPrimaryAnalysis
            ? 'bg-teal-500/12 border border-teal-500/35'
            : 'bg-[#0E1621]/90 border border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-400 truncate">
            {label || k}
          </span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
              isPrimaryAnalysis
                ? 'bg-teal-400 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            {k}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isPrimaryAnalysis && (
            <span
              className="size-2.5 rounded-sm shrink-0 shadow-xs border border-white/20"
              style={{ backgroundColor: swatchColor }}
            />
          )}
          <span className="text-xs font-semibold text-white break-words">
            {displayVal}
          </span>
        </div>
      </div>
    );
  };

  return (
    <aside className="flex flex-col h-full w-80 sm:w-88 bg-[#0A0F16] border-l border-slate-800/80 text-slate-200 shrink-0 z-10">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-slate-800/80 bg-[#070B10]/60">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-teal-400">
            <span
              className="size-2.5 rounded-sm shrink-0 shadow-xs border border-white/20"
              style={{ backgroundColor: swatchColor }}
            />
            <span className="truncate">{layer?.shortTitle || layer?.name || 'Rincian Poligon'}</span>
          </div>
          <h3 className="font-bold text-sm text-white truncate mt-1" title={title}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="size-3 text-amber-400 shrink-0" />
              <span className="truncate">{subtitle}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          title="Tutup Inspector"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Geometry Measurement Stats */}
      {geoStats && (
        <div className="px-3.5 py-2.5 bg-[#070B10]/40 border-b border-slate-800/80 text-xs">
          {geoStats.area && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0E1621] border border-slate-800/90">
              <Square className="size-3.5 text-teal-400 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] text-slate-400">Luas Poligon</span>
                <span className="font-mono font-semibold text-white tabular-nums truncate block">
                  {geoStats.area}
                </span>
              </div>
            </div>
          )}

          {geoStats.length && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0E1621] border border-slate-800/90">
              <Ruler className="size-3.5 text-teal-400 shrink-0" />
              <div>
                <span className="block text-[10px] text-slate-400">Panjang Garis</span>
                <span className="font-mono font-semibold text-white tabular-nums">{geoStats.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari atribut atau nilai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-[#0E1621] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-teal-400"
          />
        </div>

        <button
          type="button"
          title="Fokuskan Peta ke Poligon Ini"
          onClick={() => onZoomToFeature && onZoomToFeature(feature)}
          className="p-1.5 rounded-xl bg-[#0E1621] hover:bg-slate-800 text-teal-400 border border-slate-800 transition-colors"
        >
          <Crosshair className="size-4" />
        </button>

        <button
          type="button"
          title="Salin Atribut (JSON)"
          onClick={handleCopy}
          className="p-1.5 rounded-xl bg-[#0E1621] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          {copied ? <Check className="size-4 text-teal-400" /> : <Copy className="size-4" />}
        </button>
      </div>

      {/* Categorized Properties List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {totalPropCount === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Tidak ada atribut yang cocok dengan "{searchTerm}"
          </div>
        ) : (
          <>
            {technicalProps.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5 text-[11px] font-semibold text-slate-400">
                  <span>Atribut & Silsilah Analisis</span>
                  <span className="font-mono text-[10px] text-slate-500">{technicalProps.length}</span>
                </div>
                <div className="space-y-1.5">{technicalProps.map(renderPropRow)}</div>
              </div>
            )}

            {adminProps.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5 text-[11px] font-semibold text-slate-400">
                  <span>Identitas Wilayah & Luas</span>
                  <span className="font-mono text-[10px] text-slate-500">{adminProps.length}</span>
                </div>
                <div className="space-y-1.5">{adminProps.map(renderPropRow)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2.5 border-t border-slate-800/80 bg-[#070B10]/60 text-[11px] text-slate-500 flex items-center justify-between">
        <span>{totalPropCount} atribut ditampilkan</span>
        <span className="font-mono text-slate-400">{geomType}</span>
      </div>
    </aside>
  );
}
