import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Layers, FilePlus, RotateCw, Split, Image, Download, Sparkles, AlertCircle } from 'lucide-react';

export const PDFToolbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'rotate' | 'image_to_pdf'>('merge');
  
  // Merge state
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);

  // Rotate state
  const [rotateFile, setRotateFile] = useState<File | null>(null);
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [rotatedBlobUrl, setRotatedBlobUrl] = useState<string | null>(null);

  // Image to PDF state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePdfBlobUrl, setImagePdfBlobUrl] = useState<string | null>(null);

  // Merge Handler
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

  // Rotate Handler
  const handleRotatePDF = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    try {
      const arrayBuf = await rotateFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
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

  // Image to PDF Handler
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
    <div className="max-w-4xl mx-auto my-6 p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">PDF Utility Toolbox</h2>
          <p className="text-xs text-slate-500 font-medium">Merge, rotate, convert images, and manipulate PDF documents.</p>
        </div>
      </div>

      {/* Utility Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60 mb-6 text-xs font-semibold">
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
          onClick={() => setActiveTab('rotate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rotate' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          id="tab-toolbox-rotate"
        >
          <RotateCw className="w-4 h-4 text-indigo-600" />
          Rotate PDF Pages
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

      {/* MERGE TAB */}
      {activeTab === 'merge' && (
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50">
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
              <FilePlus className="w-10 h-10 text-blue-600 mx-auto" />
              <span className="font-bold text-slate-800 text-sm block">Select 2 or more PDFs to combine</span>
              <span className="text-xs text-slate-500 block">Click to browse or drag & drop PDF files</span>
            </label>
          </div>

          {mergeFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs">Files to merge ({mergeFiles.length}):</h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {mergeFiles.map((f, idx) => (
                  <li key={idx} className="p-2.5 bg-slate-100 rounded-lg flex justify-between font-medium">
                    <span>{idx + 1}. {f.name}</span>
                    <span className="text-slate-400">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isProcessing || mergeFiles.length < 2}
                onClick={handleMergePDFs}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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

      {/* ROTATE TAB */}
      {activeTab === 'rotate' && (
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50">
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
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Selected File: {rotateFile.name}</div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-600">Rotation Angle:</span>
                {[90, 180, 270].map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotateAngle(angle)}
                    className={`px-3 py-1.5 rounded-lg font-bold border ${
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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

      {/* IMAGE TO PDF TAB */}
      {activeTab === 'image_to_pdf' && (
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center bg-slate-50/50">
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
                  <li key={idx} className="p-2 bg-slate-100 rounded-lg font-medium">{img.name}</li>
                ))}
              </ul>

              <button
                disabled={isProcessing}
                onClick={handleConvertImagesToPdf}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md transition-all"
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
