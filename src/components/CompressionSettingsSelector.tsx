import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  Sliders,
  Settings2,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { CompressionSettings, CompressionLevel, TargetSizeMode } from '../types';

interface CompressionSettingsSelectorProps {
  settings: CompressionSettings;
  onChange: (newSettings: CompressionSettings) => void;
  originalSizeBytes?: number;
}

export const CompressionSettingsSelector: React.FC<CompressionSettingsSelectorProps> = ({
  settings,
  onChange,
  originalSizeBytes,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleLevelSelect = (level: CompressionLevel) => {
    let updated: CompressionSettings = { ...settings, level };

    if (level === 'max') {
      updated.jpegQuality = 55;
      updated.dpi = 96;
      updated.removeMetadata = true;
      updated.subsetFonts = true;
      updated.compressObjectStreams = true;
    } else if (level === 'balanced') {
      updated.jpegQuality = 75;
      updated.dpi = 150;
      updated.removeMetadata = true;
      updated.subsetFonts = true;
      updated.compressObjectStreams = true;
    } else if (level === 'high') {
      updated.jpegQuality = 90;
      updated.dpi = 220;
      updated.removeMetadata = false;
      updated.subsetFonts = true;
      updated.compressObjectStreams = true;
    }

    onChange(updated);
  };

  const getEstimates = (level: CompressionLevel) => {
    if (!originalSizeBytes) return null;

    let minPct = 50;
    let maxPct = 75;

    if (level === 'max') {
      minPct = 65;
      maxPct = 85;
    } else if (level === 'balanced') {
      minPct = 45;
      maxPct = 70;
    } else if (level === 'high') {
      minPct = 20;
      maxPct = 45;
    }

    const origMB = originalSizeBytes / (1024 * 1024);
    const minEstimatedMB = (origMB * (1 - maxPct / 100)).toFixed(1);
    const maxEstimatedMB = (origMB * (1 - minPct / 100)).toFixed(1);

    return {
      rangeMB: `${minEstimatedMB}–${maxEstimatedMB} MB`,
      reductionRange: `${minPct}–${maxPct}%`,
    };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Compression Strategy
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Choose how aggressively to optimize file size vs visual quality.
          </p>
        </div>

        {/* Target Size Mode Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => onChange({ ...settings, targetMode: 'preset' })}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              settings.targetMode === 'preset'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-mode-preset"
          >
            Presets
          </button>
          <button
            onClick={() => onChange({ ...settings, targetMode: 'target_size', targetSizeMB: settings.targetSizeMB || 2 })}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              settings.targetMode === 'target_size'
                ? 'bg-white text-indigo-600 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="btn-mode-target-size"
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            Target Size Mode
          </button>
        </div>
      </div>

      {/* TARGET SIZE MODE SELECTOR */}
      {settings.targetMode === 'target_size' ? (
        <div className="p-5 bg-indigo-50/50 border border-indigo-200/80 rounded-2xl mb-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Target File Size</h4>
              <p className="text-xs text-slate-600">
                The engine will iteratively tune quality and downsampling parameters to compress your file under this limit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {[0.5, 1, 2, 5, 10].map((sizeMB) => (
              <button
                key={sizeMB}
                onClick={() => onChange({ ...settings, targetSizeMB: sizeMB })}
                id={`btn-target-size-${sizeMB}mb`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settings.targetSizeMB === sizeMB
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                Under {sizeMB < 1 ? `${sizeMB * 1000} KB` : `${sizeMB} MB`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* CARD-BASED LEVEL SELECTOR */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Maximum Compression */}
          <div
            onClick={() => handleLevelSelect('max')}
            id="card-level-max"
            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              settings.level === 'max'
                ? 'bg-indigo-50/30 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-800 text-base">Maximum</span>
              {settings.level === 'max' && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
            </div>
            <p className="text-xs font-semibold text-indigo-600 mb-2">Smallest file size</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Best for email attachments and strict upload limits.
            </p>

            {/* Estimated result pill */}
            {getEstimates('max') && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                <span className="block text-slate-400 font-normal">Est. Size:</span>
                <span className="font-bold text-slate-800">{getEstimates('max')?.rangeMB}</span>
                <span className="text-emerald-600 font-bold ml-1">({getEstimates('max')?.reductionRange})</span>
              </div>
            )}
          </div>

          {/* Balanced (Recommended) */}
          <div
            onClick={() => handleLevelSelect('balanced')}
            id="card-level-balanced"
            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              settings.level === 'balanced'
                ? 'bg-indigo-50/30 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-600 text-white rounded-md shadow-2xs">
              Recommended
            </div>

            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-800 text-base">Balanced</span>
              {settings.level === 'balanced' && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
            </div>
            <p className="text-xs font-semibold text-indigo-600 mb-2">Optimal size & sharpness</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Smart downsampling for high visual fidelity and good reduction.
            </p>

            {/* Estimated result pill */}
            {getEstimates('balanced') && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                <span className="block text-slate-400 font-normal">Est. Size:</span>
                <span className="font-bold text-slate-800">{getEstimates('balanced')?.rangeMB}</span>
                <span className="text-emerald-600 font-bold ml-1">({getEstimates('balanced')?.reductionRange})</span>
              </div>
            )}
          </div>

          {/* High Quality */}
          <div
            onClick={() => handleLevelSelect('high')}
            id="card-level-high"
            className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              settings.level === 'high'
                ? 'bg-indigo-50/30 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-800 text-base">High Quality</span>
              {settings.level === 'high' && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
            </div>
            <p className="text-xs font-semibold text-emerald-600 mb-2">Maximum sharpness</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Best for professional printing and archiving.
            </p>

            {/* Estimated result pill */}
            {getEstimates('high') && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 font-medium">
                <span className="block text-slate-400 font-normal">Est. Size:</span>
                <span className="font-bold text-slate-800">{getEstimates('high')?.rangeMB}</span>
                <span className="text-emerald-600 font-bold ml-1">({getEstimates('high')?.reductionRange})</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCED SETTINGS EXPANDER */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={() => {
            setShowAdvanced(!showAdvanced);
            if (!showAdvanced) {
              onChange({ ...settings, level: 'custom' });
            }
          }}
          className="flex items-center justify-between w-full text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          id="btn-toggle-advanced-settings"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            {showAdvanced ? 'Hide Advanced Settings' : 'Expand Fine-Tune Advanced Settings'}
          </span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JPEG Quality Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center font-semibold text-slate-800">
                  <label htmlFor="input-jpeg-quality">JPEG Image Quality</label>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded">
                    {settings.jpegQuality}%
                  </span>
                </div>
                <input
                  id="input-jpeg-quality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.jpegQuality}
                  onChange={(e) => onChange({ ...settings, jpegQuality: Number(e.target.value), level: 'custom' })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>10% (Smallest)</span>
                  <span>75% (Balanced)</span>
                  <span>100% (Lossless)</span>
                </div>
              </div>

              {/* Resolution DPI Dropdown */}
              <div className="space-y-2">
                <label htmlFor="select-resolution-dpi" className="font-semibold text-slate-800 block">
                  Image Downsampling (DPI)
                </label>
                <select
                  id="select-resolution-dpi"
                  value={settings.dpi.toString()}
                  onChange={(e) => {
                    const val = e.target.value === 'original' ? 'original' : Number(e.target.value);
                    onChange({ ...settings, dpi: val, level: 'custom' });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="original">Keep Original Resolution</option>
                  <option value="300">300 DPI (High Print Quality)</option>
                  <option value="200">200 DPI (Standard Document)</option>
                  <option value="150">150 DPI (Recommended Web/Email)</option>
                  <option value="120">120 DPI (Compact Screen)</option>
                  <option value="96">96 DPI (Maximum Compression)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/20 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.removeMetadata}
                  onChange={(e) => onChange({ ...settings, removeMetadata: e.target.checked, level: 'custom' })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Strip Redundant Metadata</span>
                  <span className="text-[11px] text-slate-500">Remove author, title, and creator tags</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/20 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.colorMode === 'grayscale'}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      colorMode: e.target.checked ? 'grayscale' : 'original',
                      level: 'custom',
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Convert Images to Grayscale</span>
                  <span className="text-[11px] text-slate-500">Ideal for scanned text documents</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/20 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.compressObjectStreams}
                  onChange={(e) => onChange({ ...settings, compressObjectStreams: e.target.checked, level: 'custom' })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Compress Object Streams</span>
                  <span className="text-[11px] text-slate-500">Deflate structural cross-references</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-indigo-50/20 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.subsetFonts}
                  onChange={(e) => onChange({ ...settings, subsetFonts: e.target.checked, level: 'custom' })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Subset & Optimize Fonts</span>
                  <span className="text-[11px] text-slate-500">Remove unused glyphs from embedded fonts</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
