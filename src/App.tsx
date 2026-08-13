import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { FileCard } from './components/FileCard';
import { PDFInfoPanel } from './components/PDFInfoPanel';
import { CompressionSettingsSelector } from './components/CompressionSettingsSelector';
import { BeforeAfterViewer } from './components/BeforeAfterViewer';
import { ResultScreen } from './components/ResultScreen';
import { BatchWorkspace } from './components/BatchWorkspace';
import { PDFToolbox } from './components/PDFToolbox';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';

import {
  BatchItem,
  CompressionSettings,
  CompressionResult,
  ActiveTool,
  ProcessingStatus,
} from './types';
import { analyzePDF, compressPDF } from './lib/pdfEngine';
import { Zap, RefreshCw, Layers, ShieldCheck, ArrowRight, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('compress');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Active single result for result view
  const [singleResult, setSingleResult] = useState<CompressionResult | null>(null);
  
  // Active result for Before / After comparison modal
  const [previewResult, setPreviewResult] = useState<CompressionResult | null>(null);

  // Global default compression settings
  const [settings, setSettings] = useState<CompressionSettings>({
    level: 'balanced',
    targetMode: 'target_size',
    targetSizeMB: 0.1, // Default 100 KB
    jpegQuality: 75,
    dpi: 150,
    colorMode: 'original',
    removeMetadata: true,
    subsetFonts: true,
    compressObjectStreams: true,
    linearize: true,
  });

  // Handle new files uploaded
  const handleFilesSelected = async (newFiles: File[]) => {
    const newBatchItems: BatchItem[] = newFiles.map((file) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      settings: { ...settings },
      status: 'analyzing' as ProcessingStatus,
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newBatchItems]);
    if (!selectedItemId && newBatchItems.length > 0) {
      setSelectedItemId(newBatchItems[0].id);
    }

    // Run structural analysis for each file asynchronously
    for (const item of newBatchItems) {
      try {
        const metadata = await analyzePDF(item.file);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, metadata, status: 'idle' } : i))
        );
      } catch (err) {
        console.error('Analysis error for', item.file.name, err);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'idle' } : i))
        );
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
    if (items.length <= 1) {
      setSingleResult(null);
    }
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedItemId(null);
    setSingleResult(null);
  };

  // Start Compression Pipeline
  const handleStartCompression = async () => {
    if (items.length === 0) return;
    setIsCompressing(true);
    setSingleResult(null);

    const updatedItems = [...items];

    for (let i = 0; i < updatedItems.length; i++) {
      const current = updatedItems[i];
      
      // Update status to compressing
      setItems((prev) =>
        prev.map((item) => (item.id === current.id ? { ...item, status: 'compressing', progress: 40 } : item))
      );

      try {
        // Compress PDF file using engine
        const result = await compressPDF(current.file, settings, current.metadata);

        setItems((prev) =>
          prev.map((item) =>
            item.id === current.id
              ? { ...item, status: 'completed', progress: 100, result }
              : item
          )
        );

        // If single file processing, show single result screen
        if (updatedItems.length === 1) {
          setSingleResult(result);
        }
      } catch (err: any) {
        console.error('Compression error:', err);
        setItems((prev) =>
          prev.map((item) =>
            item.id === current.id
              ? { ...item, status: 'error', error: err?.message || 'Compression failed' }
              : item
          )
        );
      }
    }

    setIsCompressing(false);
  };

  // Re-compress single file with new level preset
  const handleRecompress = (newLevel: 'max' | 'balanced' | 'high') => {
    let newSettings = { ...settings, level: newLevel };
    if (newLevel === 'max') {
      newSettings.jpegQuality = 55;
      newSettings.dpi = 96;
    } else if (newLevel === 'balanced') {
      newSettings.jpegQuality = 75;
      newSettings.dpi = 150;
    } else if (newLevel === 'high') {
      newSettings.jpegQuality = 90;
      newSettings.dpi = 220;
    }
    setSettings(newSettings);
    handleStartCompression();
  };

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTool={activeTool}
        setActiveTool={(tool) => {
          setActiveTool(tool);
          if (tool !== 'compress') {
            setSingleResult(null);
          }
        }}
        fileCount={items.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-6">
        {activeTool === 'compress' && (
          <div>
            {/* Show Hero when no files uploaded */}
            {items.length === 0 && <Hero />}

            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              {/* Main Upload Dropzone */}
              {items.length === 0 ? (
                <UploadZone onFilesSelected={handleFilesSelected} />
              ) : (
                <div className="my-2 space-y-6">
                  {/* Single Result Screen if 1 file compressed */}
                  {singleResult ? (
                    <ResultScreen
                      result={singleResult}
                      onPreview={() => setPreviewResult(singleResult)}
                      onCompressAnother={() => {
                        setSingleResult(null);
                        setItems([]);
                      }}
                      onRecompress={handleRecompress}
                    />
                  ) : items.length === 1 ? (
                    /* SINGLE FILE WORKSPACE */
                    <div className="space-y-6 animate-fade-in">
                      {/* File Card */}
                      <FileCard
                        item={items[0]}
                        onRemove={() => handleRemoveItem(items[0].id)}
                      />

                      {/* PDF Information & Analysis */}
                      {items[0].metadata && (
                        <PDFInfoPanel metadata={items[0].metadata} />
                      )}

                      {/* Compression Level Selector */}
                      <CompressionSettingsSelector
                        settings={settings}
                        onChange={setSettings}
                        originalSizeBytes={items[0].file.size}
                      />

                      {/* Compact Add More Files or Start Compression */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          disabled={isCompressing || items[0].status === 'analyzing'}
                          onClick={handleStartCompression}
                          id="btn-compress-single-pdf"
                          className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-base rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.005]"
                        >
                          <Zap className="w-5 h-5 stroke-[2.5]" />
                          {isCompressing ? 'Compressing PDF Document...' : 'Compress PDF Now'}
                        </button>

                        <div className="sm:w-48">
                          <UploadZone onFilesSelected={handleFilesSelected} isCompact />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BATCH FILES WORKSPACE */
                    <div className="space-y-6 animate-fade-in">
                      <BatchWorkspace
                        items={items}
                        onRemoveItem={handleRemoveItem}
                        onCompressAll={handleStartCompression}
                        onClearAll={handleClearAll}
                        isCompressing={isCompressing}
                        selectedItemId={selectedItemId || undefined}
                        onSelectItem={setSelectedItemId}
                      />

                      {/* Selected Item Analysis */}
                      {selectedItem?.metadata && (
                        <PDFInfoPanel metadata={selectedItem.metadata} />
                      )}

                      {/* Global Compression Strategy */}
                      <CompressionSettingsSelector
                        settings={settings}
                        onChange={setSettings}
                        originalSizeBytes={selectedItem?.file.size}
                      />

                      {/* Add More Files Compact Button */}
                      <UploadZone onFilesSelected={handleFilesSelected} isCompact />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UTILITY TOOLBOX TAB (Merge, Rotate, Image to PDF) */}
        {['merge', 'split', 'rotate', 'image_to_pdf'].includes(activeTool) && (
          <PDFToolbox />
        )}

        {/* PDF INSPECTOR TAB */}
        {activeTool === 'inspector' && (
          <div className="max-w-4xl mx-auto px-4 my-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">PDF Structural Inspector</h2>
            <p className="text-sm text-slate-500 mb-6">Upload any PDF to inspect fonts, image resolutions, object streams, and metadata.</p>
            <UploadZone onFilesSelected={handleFilesSelected} />
            {items.length > 0 && items[0].metadata && (
              <div className="mt-6">
                <PDFInfoPanel metadata={items[0].metadata} />
              </div>
            )}
          </div>
        )}

        {/* FAQ & GUIDES TAB */}
        {activeTool === 'faq' && <FAQSection />}
      </main>

      {/* Before / After Comparison Modal */}
      {previewResult && (
        <BeforeAfterViewer
          result={previewResult}
          onClose={() => setPreviewResult(null)}
          onDownload={() => {
            if (!previewResult.compressedBlobUrl) return;
            const link = document.createElement('a');
            link.href = previewResult.compressedBlobUrl;
            link.download = previewResult.outputFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
