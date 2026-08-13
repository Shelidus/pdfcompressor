import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, ArrowUpRight, Plus, AlertTriangle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isCompact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, isCompact = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(fileList);
    const pdfFiles: File[] = [];
    const invalidFiles: string[] = [];

    filesArray.forEach((file) => {
      // Validate PDF extension or MIME type
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      if (isPdf) {
        if (file.size > 200 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (exceeds 200MB limit)`);
        } else {
          pdfFiles.push(file);
        }
      } else {
        invalidFiles.push(`${file.name} (not a PDF)`);
      }
    });

    if (invalidFiles.length > 0) {
      setErrorMessage(`Some files could not be added: ${invalidFiles.join(', ')}`);
    }

    if (pdfFiles.length > 0) {
      onFilesSelected(pdfFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  if (isCompact) {
    return (
      <div className="w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          id="compact-file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          id="btn-add-more-pdfs"
          className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 rounded-xl flex items-center justify-center gap-2 text-slate-700 hover:text-indigo-700 font-semibold transition-all group"
        >
          <Plus className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
          Add More PDF Files
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-4 px-4 sm:px-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        id="main-file-input"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="drag-drop-area"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 outline-none focus:ring-4 focus:ring-indigo-500/20 ${
          isDragOver
            ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01] shadow-md'
            : 'border-slate-200 hover:border-indigo-400 bg-white hover:bg-slate-50/50 shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Animated Upload Icon Box */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragOver
                ? 'bg-indigo-600 text-white scale-110 shadow-md shadow-indigo-600/20'
                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105'
            }`}
          >
            <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <p className="text-lg sm:text-xl font-bold text-slate-800">
              Drop your PDF document here
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              or <span className="text-indigo-600 underline underline-offset-2 font-semibold">browse files</span> from your device
            </p>
          </div>

          {/* Format & Limit Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold">
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
              PDF up to 200 MB
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
              Batch Mode Supported
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600">
              🔒 100% Client-Side Private
            </span>
          </div>
        </div>

        {/* Hover prompt */}
        <div className="absolute top-4 right-4 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Click to choose</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
