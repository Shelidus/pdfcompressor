export type DocumentClassification = 'image_heavy' | 'text_heavy' | 'scanned' | 'vector_heavy' | 'mixed';

export interface PDFMetadata {
  filename: string;
  size: number;
  pageCount: number;
  pdfVersion: string;
  documentType: DocumentClassification;
  hasEmbeddedFonts: boolean;
  fontCount: number;
  imageCount: number;
  estimatedImageDpi: number;
  isEncrypted: boolean;
  isSigned: boolean;
  hasForms: boolean;
  isPdfA: boolean;
  metadataFields: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
  };
  thumbnailDataUrl?: string;
  securityWarning?: string;
  alreadyOptimized: boolean;
}

export type CompressionLevel = 'max' | 'balanced' | 'high' | 'custom';
export type TargetSizeMode = 'preset' | 'target_size';

export interface CompressionSettings {
  level: CompressionLevel;
  targetMode: TargetSizeMode;
  targetSizeMB?: number; // e.g. 2, 5, 1, 0.5
  jpegQuality: number; // 10 - 100
  dpi: number | 'original'; // e.g., 96, 120, 150, 200, 300
  colorMode: 'original' | 'grayscale';
  removeMetadata: boolean;
  subsetFonts: boolean;
  compressObjectStreams: boolean;
  linearize: boolean;
}

export interface CompressionResult {
  id: string;
  filename: string;
  outputFilename: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  savedBytes: number;
  processingTimeMs: number;
  qualityProfile: string;
  strategyUsed: string;
  explanationText: string;
  pageCount: number;
  compressedBlobUrl?: string;
  originalBlobUrl?: string;
  compressedArrayBuffer?: ArrayBuffer;
  warnings?: string[];
  isWorseThanOriginal?: boolean;
  targetSizeMB?: number;
  targetMet?: boolean;
}

export type ProcessingStatus = 'idle' | 'analyzing' | 'compressing' | 'completed' | 'error';

export interface BatchItem {
  id: string;
  file: File;
  metadata?: PDFMetadata;
  settings: CompressionSettings;
  status: ProcessingStatus;
  progress: number;
  currentStage?: string;
  result?: CompressionResult;
  error?: string;
}

export type ActiveTool = 'compress' | 'merge' | 'organize' | 'split' | 'rotate' | 'image_to_pdf' | 'inspector' | 'faq';

export interface FAQItem {
  question: string;
  answer: string;
  category: 'compression' | 'privacy' | 'quality' | 'formats';
}
