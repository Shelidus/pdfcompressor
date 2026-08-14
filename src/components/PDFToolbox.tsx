import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Layers,
  FilePlus,
  RotateCw,
  Split,
  Image,
  Download,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Plus,
  MoveHorizontal,
  FileText,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Scissors,
  Eye,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
  FileDown
} from 'lucide-react';
import '../polyfills';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PageThumbnailItem {
  id: string;
  sourceDocIndex: number; // index in loadedDocuments array
  sourcePageIndex: number; // 0-indexed in source PDF
  displayPageNumber: number; // original 1-indexed page
  thumbnailUrl: string;
  rotation: number; // 0, 90, 180, 270
  isImage?: boolean;
  isBlank?: boolean;
  imageFile?: File;
  sourceFileName: string;
}

interface LoadedDoc {
  id: number;
  name: string;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
}

export const PDFToolbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'organize' | 'merge' | 'split' | 'rotate' | 'image_to_pdf'>('organize');

  // ==========================================
  // 1. ORGANIZE / REORDER / ADD / REMOVE STATE
  // ==========================================
  const [organizeFiles, setOrganizeFiles] = useState<File[]>([]);
  const [loadedDocs, setLoadedDocs] = useState<LoadedDoc[]>([]);
  const [pages, setPages] = useState<PageThumbnailItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [organizeBlobUrl, setOrganizeBlobUrl] = useState<string | null>(null);
  const [organizeResultStats, setOrganizeResultStats] = useState<{ pageCount: number; sizeBytes: number } | null>(null);

  // ==========================================
  // 2. MERGE STATE
  // ==========================================
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);

  // ==========================================
  // 3. SPLIT STATE
  // ==========================================
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageRange, setSplitPageRange] = useState<string>('1-2');
  const [splitTotalPages, setSplitTotalPages] = useState<number>(0);
  const [splitBlobUrl, setSplitBlobUrl] = useState<string | null>(null);

  // ==========================================
  // 4. ROTATE STATE
  // ==========================================
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [rotatedBlobUrl, setRotatedBlobUrl] = useState<string | null>(null);

  // ==========================================
  // 5. IMAGE TO PDF STATE
  // ==========================================
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePdfBlobUrl, setImagePdfBlobUrl] = useState<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (organizeBlobUrl) URL.revokeObjectURL(organizeBlobUrl);
      if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
      if (splitBlobUrl) URL.revokeObjectURL(splitBlobUrl);
      if (rotatedBlobUrl) URL.revokeObjectURL(rotatedBlobUrl);
      if (imagePdfBlobUrl) URL.revokeObjectURL(imagePdfBlobUrl);
      pages.forEach((p) => {
        if (p.thumbnailUrl && p.thumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(p.thumbnailUrl);
        }
      });
    };
  }, []);

  // -------------------------------------------------------------
  // ORGANIZE: Load Primary PDF and extract thumbnails
  // -------------------------------------------------------------
  const handleLoadOrganizePDF = async (file: File) => {
    setIsGeneratingThumbnails(true);
    setOrganizeBlobUrl(null);
    setOrganizeResultStats(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const newDocId = loadedDocs.length;
      const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
      const count = pdfJsDoc.numPages;

      const loadedDoc: LoadedDoc = {
        id: newDocId,
        name: file.name,
        arrayBuffer,
        pageCount: count,
      };

      setLoadedDocs([loadedDoc]);
      setOrganizeFiles([file]);

      const newPageList: PageThumbnailItem[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const page = await pdfJsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            newPageList.push({
              id: `page_${newDocId}_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sourceDocIndex: newDocId,
              sourcePageIndex: i - 1,
              displayPageNumber: i,
              thumbnailUrl: dataUrl,
              rotation: 0,
              sourceFileName: file.name,
            });
          }
        } catch (pageErr) {
          console.warn(`Error generating thumbnail for page ${i}:`, pageErr);
        }
      }

      setPages(newPageList);
      setSelectedPageIds([]);
    } catch (err) {
      console.error('Error loading PDF for organization:', err);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  // -------------------------------------------------------------
  // ORGANIZE: Append Pages from Another PDF
  // -------------------------------------------------------------
  const handleAddAnotherPDF = async (file: File) => {
    setIsGeneratingThumbnails(true);
    setOrganizeBlobUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const newDocId = loadedDocs.length;
      const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
      const count = pdfJsDoc.numPages;

      const loadedDoc: LoadedDoc = {
        id: newDocId,
        name: file.name,
        arrayBuffer,
        pageCount: count,
      };

      setLoadedDocs((prev) => [...prev, loadedDoc]);
      setOrganizeFiles((prev) => [...prev, file]);

      const addedPages: PageThumbnailItem[] = [];

      for (let i = 1; i <= count; i++) {
        try {
          const page = await pdfJsDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport } as any).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            addedPages.push({
              id: `page_${newDocId}_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sourceDocIndex: newDocId,
              sourcePageIndex: i - 1,
              displayPageNumber: i,
              thumbnailUrl: dataUrl,
              rotation: 0,
              sourceFileName: file.name,
            });
          }
        } catch (pageErr) {
          console.warn('Error rendering added page thumbnail:', pageErr);
        }
      }

      setPages((prev) => [...prev, ...addedPages]);
    } catch (err) {
      console.error('Error appending PDF pages:', err);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  // -------------------------------------------------------------
  // ORGANIZE: Insert Blank Page
  // -------------------------------------------------------------
  const handleInsertBlankPage = (afterIndex?: number) => {
    // Generate a simple white placeholder dataURL
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 200, 280);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 180, 260);
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Blank Page', 100, 145);
    }
    const blankThumb = canvas.toDataURL('image/png');

    const blankPageItem: PageThumbnailItem = {
      id: `blank_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sourceDocIndex: -1,
      sourcePageIndex: -1,
      displayPageNumber: 0,
      thumbnailUrl: blankThumb,
      rotation: 0,
      isBlank: true,
      sourceFileName: 'Blank Page',
    };

    setPages((prev) => {
      if (typeof afterIndex === 'number' && afterIndex >= 0 && afterIndex < prev.length) {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, blankPageItem);
        return copy;
      }
      return [...prev, blankPageItem];
    });
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Add Images as Pages
  // -------------------------------------------------------------
  const handleAddImagesAsPages = async (files: File[]) => {
    const newImagePages: PageThumbnailItem[] = [];
    for (const file of files) {
      const dataUrl = URL.createObjectURL(file);
      newImagePages.push({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sourceDocIndex: -2,
        sourcePageIndex: -1,
        displayPageNumber: 0,
        thumbnailUrl: dataUrl,
        rotation: 0,
        isImage: true,
        imageFile: file,
        sourceFileName: file.name,
      });
    }
    setPages((prev) => [...prev, ...newImagePages]);
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Reorder Operations
  // -------------------------------------------------------------
  const handleMovePage = (index: number, direction: 'left' | 'right' | 'first' | 'last') => {
    if (pages.length <= 1) return;
    const newPages = [...pages];
    const item = newPages[index];

    if (direction === 'left' && index > 0) {
      newPages[index] = newPages[index - 1];
      newPages[index - 1] = item;
    } else if (direction === 'right' && index < newPages.length - 1) {
      newPages[index] = newPages[index + 1];
      newPages[index + 1] = item;
    } else if (direction === 'first' && index > 0) {
      newPages.splice(index, 1);
      newPages.unshift(item);
    } else if (direction === 'last' && index < newPages.length - 1) {
      newPages.splice(index, 1);
      newPages.push(item);
    }

    setPages(newPages);
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Remove Page
  // -------------------------------------------------------------
  const handleRemovePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Rotate Individual Page
  // -------------------------------------------------------------
  const handleRotateIndividualPage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Remove Selected Pages
  // -------------------------------------------------------------
  const handleRemoveSelectedPages = () => {
    if (selectedPageIds.length === 0) return;
    setPages((prev) => prev.filter((p) => !selectedPageIds.includes(p.id)));
    setSelectedPageIds([]);
    setOrganizeBlobUrl(null);
  };

  // -------------------------------------------------------------
  // ORGANIZE: Toggle Page Selection
  // -------------------------------------------------------------
  const handleToggleSelectPage = (id: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------------
  // ORGANIZE: Save & Export Reordered/Modified PDF
  // -------------------------------------------------------------
  const handleSaveOrganizedPDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      // 1. Create a fresh target PDF document
      const outPdf = await PDFDocument.create();

      // 2. Pre-load all referenced source PDF documents
      const pdfLibSourceDocs: Map<number, PDFDocument> = new Map();
      for (const loadedDoc of loadedDocs) {
        const doc = await PDFDocument.load(loadedDoc.arrayBuffer, { ignoreEncryption: true });
        pdfLibSourceDocs.set(loadedDoc.id, doc);
      }

      // 3. Process every page in custom user sequence
      for (const pageItem of pages) {
        if (pageItem.isBlank) {
          // Add standard A4 blank page (595.28 x 841.89 pt)
          outPdf.addPage([595.28, 841.89]);
        } else if (pageItem.isImage && pageItem.imageFile) {
          // Embed image file
          const imgBuf = await pageItem.imageFile.arrayBuffer();
          let embeddedImage;
          if (pageItem.imageFile.type.includes('png')) {
            embeddedImage = await outPdf.embedPng(imgBuf);
          } else {
            embeddedImage = await outPdf.embedJpg(imgBuf);
          }
          const page = outPdf.addPage([embeddedImage.width, embeddedImage.height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height,
          });
          if (pageItem.rotation !== 0) {
            page.setRotation(degrees(pageItem.rotation));
          }
        } else if (pageItem.sourceDocIndex >= 0) {
          // Copy from source PDF
          const sourcePdf = pdfLibSourceDocs.get(pageItem.sourceDocIndex);
          if (sourcePdf) {
            const [copiedPage] = await outPdf.copyPages(sourcePdf, [pageItem.sourcePageIndex]);
            if (pageItem.rotation !== 0) {
              const currentRot = copiedPage.getRotation().angle;
              copiedPage.setRotation(degrees((currentRot + pageItem.rotation) % 360));
            }
            outPdf.addPage(copiedPage);
          }
        }
      }

      // 4. Save with optimal object stream compression
      const outBytes = await outPdf.save({ useObjectStreams: true, updateFieldAppearances: false });
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOrganizeBlobUrl(url);
      setOrganizeResultStats({
        pageCount: outPdf.getPageCount(),
        sizeBytes: outBytes.byteLength,
      });
    } catch (err) {
      console.error('Error creating organized PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // MERGE HANDLER
  // -------------------------------------------------------------
  const handleMergePDFs = async () => {
    if (mergeFiles.length < 2) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        const arrayBuf = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      setMergedBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Merge error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // SPLIT HANDLER
  // -------------------------------------------------------------
  const handleLoadSplitPDF = async (file: File) => {
    setSplitFile(file);
    setSplitBlobUrl(null);
    try {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setSplitTotalPages(count);
      setSplitPageRange(count > 1 ? `1-${Math.min(3, count)}` : '1');
    } catch (e) {
      console.error('Error inspecting PDF for split:', e);
    }
  };

  const handleExecuteSplit = async () => {
    if (!splitFile || splitTotalPages === 0) return;
    setIsProcessing(true);
    try {
      const arrayBuf = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();

      // Parse range string: e.g. "1-3, 5, 7-8"
      const pageIndicesToKeep: number[] = [];
      const parts = splitPageRange.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
              if (p >= 1 && p <= splitTotalPages) pageIndicesToKeep.push(p - 1);
            }
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= splitTotalPages) {
            pageIndicesToKeep.push(p - 1);
          }
        }
      }

      // Deduplicate and sort
      const uniqueIndices = Array.from(new Set(pageIndicesToKeep));
      if (uniqueIndices.length === 0) {
        alert('Please specify a valid page range within 1 to ' + splitTotalPages);
        setIsProcessing(false);
        return;
      }

      const copied = await outDoc.copyPages(srcDoc, uniqueIndices);
      copied.forEach((cp) => outDoc.addPage(cp));

      const splitBytes = await outDoc.save({ useObjectStreams: true });
      const blob = new Blob([splitBytes], { type: 'application/pdf' });
      setSplitBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Split error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // ROTATE HANDLER
  // -------------------------------------------------------------
  const handleRotatePDF = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    try {
      const arrayBuf = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const docPages = pdfDoc.getPages();
      docPages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotateAngle) % 360));
      });
      const rotatedBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      setRotatedBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Rotate error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // IMAGE TO PDF HANDLER
  // -------------------------------------------------------------
  const handleConvertImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const imgFile of imageFiles) {
        const arrayBuf = await imgFile.arrayBuffer();
        let image;
        if (imgFile.type.includes('png')) {
          image = await pdfDoc.embedPng(arrayBuf);
        } else {
          image = await pdfDoc.embedJpg(arrayBuf);
        }
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setImagePdfBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Image to PDF error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto my-6 p-6 sm:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">PDF Convert & Page Toolbox</h2>
            <p className="text-xs text-slate-500 font-medium">
              Organize, reorder, add, remove, rotate, merge, and split PDF pages.
            </p>
          </div>
        </div>

        {/* 100% Client-Side Privacy pill */}
        <span className="self-start sm:self-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200/60 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> 100% In-Browser Execution
        </span>
      </div>

      {/* Utility Sub-tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60 mb-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('organize')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'organize' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-organize"
        >
          <MoveHorizontal className="w-4 h-4 text-indigo-600" />
          Organize & Reorder Pages
        </button>
        <button
          onClick={() => setActiveTab('merge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'merge' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-merge"
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          Merge PDFs
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'split' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-split"
        >
          <Scissors className="w-4 h-4 text-indigo-600" />
          Split / Extract Pages
        </button>
        <button
          onClick={() => setActiveTab('rotate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rotate' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-rotate"
        >
          <RotateCw className="w-4 h-4 text-indigo-600" />
          Rotate Document
        </button>
        <button
          onClick={() => setActiveTab('image_to_pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'image_to_pdf' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-image-to-pdf"
        >
          <Image className="w-4 h-4 text-indigo-600" />
          JPG / PNG to PDF
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ORGANIZE & REORDER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'organize' && (
        <div className="space-y-6">
          {/* If no PDF loaded yet, show upload banner */}
          {pages.length === 0 ? (
            <div className="p-8 sm:p-12 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-3xl text-center">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleLoadOrganizePDF(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="input-organize-file"
              />
              <label htmlFor="input-organize-file" className="cursor-pointer block space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  <MoveHorizontal className="w-8 h-8" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-base block">
                    Choose a PDF to Organize, Add, or Reorder Pages
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Extracts pages into an interactive visual grid for effortless reordering, page deletion, adding new pages, and rotation.
                  </span>
                </div>
                <div className="inline-block pt-2">
                  <span className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all">
                    Select PDF Document
                  </span>
                </div>
              </label>
            </div>
          ) : (
            /* Interactive Visual Page Organizer Workspace */
            <div className="space-y-5">
              {/* Workspace Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-indigo-700 font-bold">
                    {pages.length} Pages
                  </span>
                  <span className="text-slate-500">
                    Source: <strong className="text-slate-800">{organizeFiles[0]?.name}</strong>
                  </span>
                </div>

                {/* Insertion & Management Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Add Another PDF Button */}
                  <label
                    htmlFor="input-add-more-pdf"
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                    Add Another PDF
                  </label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleAddAnotherPDF(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="input-add-more-pdf"
                  />

                  {/* Add Images as Pages */}
                  <label
                    htmlFor="input-add-image-page"
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    <Image className="w-3.5 h-3.5 text-emerald-600" />
                    Insert Image
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleAddImagesAsPages(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="input-add-image-page"
                  />

                  {/* Insert Blank Page */}
                  <button
                    onClick={() => handleInsertBlankPage()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs"
                    id="btn-insert-blank-page"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-blue-600" />
                    Insert Blank Page
                  </button>

                  {/* Delete Selected (if any selected) */}
                  {selectedPageIds.length > 0 && (
                    <button
                      onClick={handleRemoveSelectedPages}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all shadow-2xs"
                      id="btn-delete-selected-pages"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Selected ({selectedPageIds.length})
                    </button>
                  )}

                  {/* Reset / Reload Button */}
                  <button
                    onClick={() => {
                      if (organizeFiles[0]) {
                        handleLoadOrganizePDF(organizeFiles[0]);
                      }
                    }}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
                    title="Reset to original order"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Loader indicator when processing thumbnails */}
              {isGeneratingThumbnails && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-indigo-700 text-xs font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Extracting and rendering page thumbnails...
                </div>
              )}

              {/* Grid of Pages */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-slate-100/70 rounded-3xl border border-slate-200/80 max-h-[600px] overflow-y-auto">
                {pages.map((page, idx) => {
                  const isSelected = selectedPageIds.includes(page.id);
                  return (
                    <div
                      key={page.id}
                      className={`relative flex flex-col bg-white rounded-2xl border transition-all shadow-2xs group ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header inside page card */}
                      <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPage(page.id)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="font-bold text-slate-700">#{idx + 1}</span>
                        </div>

                        {/* Rotation or Source Tag */}
                        <div className="flex items-center gap-1">
                          {page.rotation > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[9px]">
                              {page.rotation}°
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[60px]" title={page.sourceFileName}>
                            {page.isBlank ? 'Blank' : page.isImage ? 'Image' : `p.${page.displayPageNumber}`}
                          </span>
                        </div>
                      </div>

                      {/* Thumbnail Preview Area */}
                      <div className="relative p-2.5 flex items-center justify-center bg-slate-50/50 min-h-[140px] max-h-[180px] overflow-hidden">
                        <img
                          src={page.thumbnailUrl}
                          alt={`Page ${idx + 1}`}
                          className="max-h-[140px] w-auto object-contain rounded shadow-2xs transition-transform duration-200"
                          style={{
                            transform: `rotate(${page.rotation}deg)`,
                          }}
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Action Bar per page */}
                      <div className="flex items-center justify-between p-1.5 bg-slate-50/80 border-t border-slate-100 text-xs">
                        {/* Move Left / First */}
                        <div className="flex items-center">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMovePage(idx, 'left')}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 text-slate-600"
                            title="Move Left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Rotate 90 deg */}
                        <button
                          onClick={() => handleRotateIndividualPage(idx)}
                          className="p-1 hover:bg-indigo-50 hover:text-indigo-600 rounded text-slate-500"
                          title="Rotate 90° clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Page */}
                        <button
                          onClick={() => handleRemovePage(idx)}
                          className="p-1 hover:bg-rose-50 hover:text-rose-600 rounded text-slate-400"
                          title="Remove this page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Right / Last */}
                        <div className="flex items-center">
                          <button
                            disabled={idx === pages.length - 1}
                            onClick={() => handleMovePage(idx, 'right')}
                            className="p-1 hover:bg-slate-200 rounded disabled:opacity-20 text-slate-600"
                            title="Move Right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Execution Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3">
                <button
                  disabled={isProcessing || pages.length === 0}
                  onClick={handleSaveOrganizedPDF}
                  className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                  id="btn-save-organized-pdf"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Generating Organized PDF...' : `Export Organized PDF (${pages.length} Pages)`}
                </button>

                <button
                  onClick={() => {
                    setPages([]);
                    setOrganizeFiles([]);
                    setLoadedDocs([]);
                    setOrganizeBlobUrl(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Start Over with New PDF
                </button>
              </div>

              {/* Download Banner when Ready */}
              {organizeBlobUrl && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <span className="font-bold text-emerald-800 text-sm block">
                      Organized PDF successfully generated!
                    </span>
                    <span className="text-xs text-emerald-600 block">
                      {organizeResultStats?.pageCount} total pages •{' '}
                      {((organizeResultStats?.sizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <a
                    href={organizeBlobUrl}
                    download="organized_document.pdf"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" /> Download Organized PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MERGE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'merge' && (
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center bg-slate-50/50">
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setMergeFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
              id="input-merge-files"
            />
            <label htmlFor="input-merge-files" className="cursor-pointer block space-y-2">
              <FilePlus className="w-10 h-10 text-indigo-600 mx-auto" />
              <span className="font-bold text-slate-800 text-sm block">Select 2 or more PDFs to combine</span>
              <span className="text-xs text-slate-500 block">Click to browse or drag & drop PDF files</span>
            </label>
          </div>

          {mergeFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">Files to merge ({mergeFiles.length}):</h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {mergeFiles.map((f, idx) => (
                  <li key={idx} className="p-2.5 bg-slate-100 rounded-xl flex justify-between font-medium">
                    <span>
                      {idx + 1}. {f.name}
                    </span>
                    <span className="text-slate-400">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isProcessing || mergeFiles.length < 2}
                onClick={handleMergePDFs}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                id="btn-execute-merge"
              >
                {isProcessing ? 'Merging PDF Streams...' : 'Merge PDFs into One File'}
              </button>
            </div>
          )}

          {mergedBlobUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-sm">Merged PDF ready!</span>
              <a
                href={mergedBlobUrl}
                download="merged_document.pdf"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Merged PDF
              </a>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SPLIT / EXTRACT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'split' && (
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center bg-slate-50/50">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleLoadSplitPDF(e.target.files[0]);
                }
              }}
              className="hidden"
              id="input-split-file"
            />
            <label htmlFor="input-split-file" className="cursor-pointer block space-y-2">
              <Scissors className="w-10 h-10 text-indigo-600 mx-auto" />
              <span className="font-bold text-slate-800 text-sm block">Select PDF to split or extract pages</span>
            </label>
          </div>

          {splitFile && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Selected: {splitFile.name}</span>
                <span className="text-indigo-600 font-bold">{splitTotalPages} total pages</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Pages to Extract / Keep:</label>
                <input
                  type="text"
                  value={splitPageRange}
                  onChange={(e) => setSplitPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[11px] text-slate-400 block">
                  Example: "1-3, 5" will extract pages 1, 2, 3, and 5 into a new PDF.
                </span>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleExecuteSplit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                id="btn-execute-split"
              >
                {isProcessing ? 'Extracting Pages...' : 'Extract Specified Pages to PDF'}
              </button>
            </div>
          )}

          {splitBlobUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-sm">Extracted PDF ready!</span>
              <a
                href={splitBlobUrl}
                download="extracted_pages.pdf"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Extracted PDF
              </a>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ROTATE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'rotate' && (
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center bg-slate-50/50">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setRotateFile(e.target.files[0]);
                }
              }}
              className="hidden"
              id="input-rotate-file"
            />
            <label htmlFor="input-rotate-file" className="cursor-pointer block space-y-2">
              <RotateCw className="w-10 h-10 text-indigo-600 mx-auto" />
              <span className="font-bold text-slate-800 text-sm block">Select PDF to rotate pages</span>
            </label>
          </div>

          {rotateFile && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Selected File: {rotateFile.name}</div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-600">Rotation Angle:</span>
                {[90, 180, 270].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotateAngle(angle)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold border ${
                      rotateAngle === angle ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700'
                    }`}
                  >
                    {angle}° Clockwise
                  </button>
                ))}
              </div>

              <button
                disabled={isProcessing}
                onClick={handleRotatePDF}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
                id="btn-execute-rotate"
              >
                {isProcessing ? 'Rotating PDF...' : `Apply ${rotateAngle}° Rotation`}
              </button>
            </div>
          )}

          {rotatedBlobUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-sm">Rotated PDF ready!</span>
              <a
                href={rotatedBlobUrl}
                download="rotated_document.pdf"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Rotated PDF
              </a>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. IMAGE TO PDF TAB */}
      {/* ========================================================================= */}
      {activeTab === 'image_to_pdf' && (
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl text-center bg-slate-50/50">
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setImageFiles(Array.from(e.target.files));
                }
              }}
              className="hidden"
              id="input-image-files"
            />
            <label htmlFor="input-image-files" className="cursor-pointer block space-y-2">
              <Image className="w-10 h-10 text-emerald-600 mx-auto" />
              <span className="font-bold text-slate-800 text-sm block">Select JPG / PNG images to combine into PDF</span>
            </label>
          </div>

          {imageFiles.length > 0 && (
            <div className="space-y-3">
              <div className="font-bold text-xs text-slate-800">Selected Images ({imageFiles.length}):</div>
              <ul className="space-y-1 text-xs text-slate-700">
                {imageFiles.map((img, idx) => (
                  <li key={idx} className="p-2.5 bg-slate-100 rounded-xl font-medium">
                    {img.name}
                  </li>
                ))}
              </ul>

              <button
                disabled={isProcessing}
                onClick={handleConvertImagesToPdf}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-all"
                id="btn-execute-image-to-pdf"
              >
                {isProcessing ? 'Converting Images to PDF...' : 'Convert Images to PDF'}
              </button>
            </div>
          )}

          {imagePdfBlobUrl && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-sm">PDF created from images!</span>
              <a
                href={imagePdfBlobUrl}
                download="images_converted.pdf"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
