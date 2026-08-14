import '../polyfills';
import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Columns,
  X,
  Download,
  Sparkles,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { CompressionResult } from '../types';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface BeforeAfterViewerProps {
  result: CompressionResult;
  onClose: () => void;
  onDownload: () => void;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({ result, onClose, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(result.pageCount || 1);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'split' | 'side_by_side'>('side_by_side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [docsReady, setDocsReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const origCanvasRef = useRef<HTMLCanvasElement>(null);
  const compCanvasRef = useRef<HTMLCanvasElement>(null);
  const origPdfDocRef = useRef<any>(null);
  const compPdfDocRef = useRef<any>(null);

  const origRenderTaskRef = useRef<any>(null);
  const compRenderTaskRef = useRef<any>(null);

  // Load PDF documents via PDF.js using ArrayBuffers
  useEffect(() => {
    let isSubscribed = true;

    async function loadPDFs() {
      try {
        setLoadingError(null);
        setDocsReady(false);

        // 1. Load Original PDF
        if (result.originalBlobUrl) {
          const resp = await fetch(result.originalBlobUrl);
          const buf = await resp.arrayBuffer();
          const origTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
          const origDoc = await origTask.promise;
          if (isSubscribed) {
            origPdfDocRef.current = origDoc;
            setTotalPages(origDoc.numPages);
          }
        }

        // 2. Load Compressed PDF
        if (result.compressedArrayBuffer) {
          const compTask = pdfjsLib.getDocument({ data: new Uint8Array(result.compressedArrayBuffer) });
          const compDoc = await compTask.promise;
          if (isSubscribed) {
            compPdfDocRef.current = compDoc;
          }
        } else if (result.compressedBlobUrl) {
          const resp = await fetch(result.compressedBlobUrl);
          const buf = await resp.arrayBuffer();
          const compTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
          const compDoc = await compTask.promise;
          if (isSubscribed) {
            compPdfDocRef.current = compDoc;
          }
        }

        if (isSubscribed) {
          setDocsReady(true);
        }
      } catch (err: any) {
        console.warn('PDF load warning in viewer:', err);
        if (isSubscribed) {
          setLoadingError('Could not load PDF document preview. You can still download the optimized file.');
        }
      }
    }

    loadPDFs();

    return () => {
      isSubscribed = false;
      if (origRenderTaskRef.current) {
        try { origRenderTaskRef.current.cancel(); } catch (_) {}
      }
      if (compRenderTaskRef.current) {
        try { compRenderTaskRef.current.cancel(); } catch (_) {}
      }
    };
  }, [result]);

  // Render current page onto canvases
  const renderCurrentPage = async () => {
    if (!docsReady) return;

    // Render Original Canvas
    if (origPdfDocRef.current && origCanvasRef.current) {
      if (origRenderTaskRef.current) {
        try {
          origRenderTaskRef.current.cancel();
        } catch (_) {}
      }
      try {
        const page = await origPdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale, rotation });
        const canvas = origCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const task = page.render({ canvasContext: ctx, viewport } as any);
          origRenderTaskRef.current = task;
          await task.promise;
        }
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') {
          console.warn('Error rendering orig page:', e);
        }
      }
    }

    // Render Compressed Canvas
    if (compPdfDocRef.current && compCanvasRef.current) {
      if (compRenderTaskRef.current) {
        try {
          compRenderTaskRef.current.cancel();
        } catch (_) {}
      }
      try {
        const page = await compPdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoomScale, rotation });
        const canvas = compCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const task = page.render({ canvasContext: ctx, viewport } as any);
          compRenderTaskRef.current = task;
          await task.promise;
        }
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') {
          console.warn('Error rendering comp page:', e);
        }
      }
    }
  };

  useEffect(() => {
    if (docsReady) {
      renderCurrentPage();
    }
  }, [currentPage, zoomScale, rotation, viewMode, docsReady]);

  const formatSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col animate-fade-in">
      {/* Top Bar Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            PDF
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 truncate max-w-[200px] sm:max-w-[300px]">
              {result.filename}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{formatSize(result.originalSize)}</span>
              <span>→</span>
              <span className="text-emerald-400 font-bold">{formatSize(result.compressedSize)}</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-bold rounded text-[10px]">
                {result.reductionPercentage}% Smaller
              </span>
            </div>
          </div>
        </div>

        {/* View Controls & Page Navigation */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          {/* Page Prev/Next */}
          <button
            disabled={currentPage <= 1 || !docsReady}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            id="btn-viewer-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages || !docsReady}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            id="btn-viewer-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.2))}
            className="p-1.5 hover:bg-slate-700 rounded-lg"
            title="Zoom Out"
            id="btn-viewer-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300 text-[11px] min-w-[40px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 hover:bg-slate-700 rounded-lg"
            title="Zoom In"
            id="btn-viewer-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* View Mode Toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'side_by_side' ? 'split' : 'side_by_side')}
            className={`p-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold ${
              viewMode === 'side_by_side' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Split / Side-by-side Mode"
            id="btn-viewer-toggle-mode"
          >
            <Columns className="w-4 h-4" />
            <span className="hidden sm:inline">{viewMode === 'side_by_side' ? 'Side-by-Side' : 'Split Slider'}</span>
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300"
            title="Rotate Page"
            id="btn-viewer-rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all"
            id="btn-viewer-download"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            id="btn-viewer-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/60">
        {loadingError ? (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 text-center max-w-md">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h4 className="text-white font-bold text-sm mb-1">Preview Unavailable</h4>
            <p className="text-xs text-slate-400 mb-6">{loadingError}</p>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
            >
              Download PDF Directly
            </button>
          </div>
        ) : !docsReady ? (
          <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span>Rendering side-by-side comparison...</span>
          </div>
        ) : viewMode === 'side_by_side' ? (
          /* SIDE BY SIDE MODE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl max-h-full">
            {/* Original Panel */}
            <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl overflow-auto max-h-[75vh]">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold text-slate-300 mb-4">
                <span className="px-2.5 py-1 bg-slate-800 rounded-md">Original Document</span>
                <span className="text-slate-400">{formatSize(result.originalSize)}</span>
              </div>
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-white shadow-lg flex justify-center items-center">
                <canvas ref={origCanvasRef} className="max-w-full h-auto block" />
              </div>
            </div>

            {/* Compressed Panel */}
            <div className="flex flex-col items-center bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 shadow-2xl overflow-auto max-h-[75vh]">
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold text-slate-300 mb-4">
                <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Compressed Output
                </span>
                <span className="text-emerald-400 font-bold">{formatSize(result.compressedSize)}</span>
              </div>
              <div className="border border-indigo-500/30 rounded-lg overflow-hidden bg-white shadow-lg flex justify-center items-center">
                <canvas ref={compCanvasRef} className="max-w-full h-auto block" />
              </div>
            </div>
          </div>
        ) : (
          /* SPLIT SLIDER MODE */
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-4xl w-full flex flex-col items-center shadow-2xl overflow-hidden">
            <div className="w-full flex justify-between text-xs font-bold text-slate-300 mb-3 px-2">
              <span className="text-slate-400">Original ({formatSize(result.originalSize)})</span>
              <span className="text-emerald-400">Compressed ({formatSize(result.compressedSize)})</span>
            </div>

            <div className="relative overflow-hidden border border-slate-800 rounded-xl bg-white max-h-[70vh] flex justify-center items-center">
              <canvas ref={origCanvasRef} className="block max-w-full h-auto" />
              {/* Overlay Compressed Canvas with Clip Path based on slider position */}
              <div
                className="absolute inset-0 overflow-hidden flex justify-center items-center"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <canvas ref={compCanvasRef} className="block max-w-full h-auto" />
              </div>

              {/* Draggable Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-indigo-500 cursor-ew-resize z-20 flex items-center justify-center shadow-lg"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-6 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md">
                  ↔
                </div>
              </div>
            </div>

            {/* Slider Range Control */}
            <div className="w-full max-w-md mt-4 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono">Original</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xs text-emerald-400 font-mono">Compressed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

