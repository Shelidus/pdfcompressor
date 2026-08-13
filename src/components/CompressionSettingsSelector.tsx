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

  // Local state for custom target size typing
  const [customInputVal, setCustomInputVal] = useState<string>(() => {
    if (settings.targetSizeMB) {
      if (settings.targetSizeMB < 1) {
        return String(Math.round(settings.targetSizeMB * 1024));
      }
      return String(settings.targetSizeMB);
    }
    return '10';
  });

  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>(() => {
    if (settings.targetSizeMB && settings.targetSizeMB >= 1) {
      return 'MB';
    }
    return 'KB';
  });

  const handleCustomInputChange = (valueStr: string, unit: 'KB' | 'MB') => {
    setCustomInputVal(valueStr);
    const num = parseFloat(valueStr);
    if (!isNaN(num) && num > 0) {
      const computedMB = unit === 'KB' ? num / 1024 : num;
      onChange({
        ...settings,
        targetMode: 'target_size',
        targetSizeMB: computedMB,
      });
    }
  };

  const handleUnitToggle = (newUnit: 'KB' | 'MB') => {
    setCustomUnit(newUnit);
    const num = parseFloat(customInputVal);
    if (!isNaN(num) && num > 0) {
      const computedMB = newUnit === 'KB' ? num / 1024 : num;
      onChange({
        ...settings,
        targetMode: 'target_size',
        targetSizeMB: computedMB,
      });
    }
  };

  const handlePresetSelect = (numVal: number, unit: 'KB' | 'MB') => {
    setCustomInputVal(String(numVal));
    setCustomUnit(unit);
    const computedMB = unit === 'KB' ? numVal / 1024 : numVal;
    onChange({
      ...settings,
      targetMode: 'target_size',
      targetSizeMB: computedMB,
    });
  };

  const presets = [
    { label: '10 KB', num: 10, unit: 'KB' as const, sizeMB: 10 / 1024 },
    { label: '20 KB', num: 20, unit: 'KB' as const, sizeMB: 20 / 1024 },
    { label: '50 KB', num: 50, unit: 'KB' as const, sizeMB: 50 / 1024 },
    { label: '100 KB', num: 100, unit: 'KB' as const, sizeMB: 100 / 1024 },
    { label: '500 KB', num: 500, unit: 'KB' as const, sizeMB: 500 / 1024 },
    { label: '850 KB', num: 850, unit: 'KB' as const, sizeMB: 850 / 1024 },
    { label: '1 MB', num: 1, unit: 'MB' as const, sizeMB: 1 },
    { label: '2 MB', num: 2, unit: 'MB' as const, sizeMB: 2 },
    { label: '5 MB', num: 5, unit: 'MB' as const, sizeMB: 5 },
  ];

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

  // Helper to format current active target
  const activeTargetMB = settings.targetSizeMB || 0.01;
  const activeTargetKB = Math.round(activeTargetMB * 1024);
  const activeTargetBytes = Math.round(activeTargetMB * 1024 * 1024);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-indigo-600" />
          Compression Strategy
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Type an exact custom file size (e.g. 10 KB, 50 KB) or select a quality level preset.
        </p>

        {/* Prominent Full-Width Strategy Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 mt-4">
          <button
            type="button"
            onClick={() => {
              const num = parseFloat(customInputVal) || 10;
              const computedMB = customUnit === 'KB' ? num / 1024 : num;
              onChange({ ...settings, targetMode: 'target_size', targetSizeMB: computedMB });
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              settings.targetMode === 'target_size'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            id="btn-mode-target-size"
          >
            <Target className="w-4 h-4" />
            <span>Type Exact Size (e.g., 10 KB)</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...settings, targetMode: 'preset' })}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              settings.targetMode === 'preset'
                ? 'bg-white text-slate-900 shadow-xs ring-2 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            id="btn-mode-preset"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Quality Presets (Max / Balanced)</span>
          </button>
        </div>
      </div>

      {/* TARGET SIZE MODE SELECTOR */}
      {settings.targetMode === 'target_size' ? (
        <div className="p-5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl mb-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Set Exact Target Size</h4>
                <p className="text-xs text-slate-500">
                  Type any custom target size in KB or MB (e.g. 10 KB, 50 KB, 100 KB, 2 MB).
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOM TYPED INPUT BOX WITH UNIT SELECTOR */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <label htmlFor="input-custom-target-size" className="text-xs font-bold text-slate-700 block">
              Type Custom Target Limit:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="input-custom-target-size"
                  type="number"
                  min="1"
                  step="any"
                  value={customInputVal}
                  onChange={(e) => handleCustomInputChange(e.target.value, customUnit)}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-base text-slate-800 focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>

              {/* KB / MB Unit Selector Buttons */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('KB')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    customUnit === 'KB'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="btn-unit-kb"
                >
                  KB
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('MB')}
                  className={`px-3 py-2 rounded-lg transition-all ${
                    customUnit === 'MB'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id="btn-unit-mb"
                >
                  MB
                </button>
              </div>
            </div>

            {/* Target Display Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100 text-slate-600">
              <span className="font-semibold text-slate-700">
                🎯 Target set to:{' '}
                <span className="font-extrabold text-indigo-600">
                  {activeTargetMB < 1 ? `${activeTargetKB} KB` : `${activeTargetMB.toFixed(2)} MB`}
                </span>{' '}
                <span className="text-slate-400 font-normal">({activeTargetBytes.toLocaleString()} bytes)</span>
              </span>

              {originalSizeBytes && (
                <span className="text-slate-500 font-medium">
                  Original: <span className="font-bold text-slate-700">{(originalSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-xs font-bold text-slate-600 mb-2 block">Quick Presets:</span>
            <div className="flex flex-wrap items-center gap-2">
              {presets.map((preset) => {
                const isSelected =
                  settings.targetSizeMB && Math.abs(settings.targetSizeMB - preset.sizeMB) < 0.0001;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetSelect(preset.num, preset.unit)}
                    id={`btn-target-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs scale-105'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    Under {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Low Target Size Notice */}
          {activeTargetKB <= 100 && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold text-amber-800">Ultra-low target ({activeTargetKB} KB):</span> The engine will apply maximum grayscale image downsampling, metadata stripping, and font subsetting to shrink your PDF under {activeTargetKB} KB.
              </p>
            </div>
          )}
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
