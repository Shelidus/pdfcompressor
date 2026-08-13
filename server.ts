import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { PDFDocument, degrees } from 'pdf-lib';
import { createServer as createViteServer } from 'vite';

const upload = multer({
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB limit
  },
  storage: multer.memoryStorage(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));

  // API Routes
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'OptiPDF Compressor Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // Server-side PDF Analysis Endpoint
  app.post('/api/analyze', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const pdfBytes = req.file.buffer;
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      res.json({
        filename: req.file.originalname,
        size: req.file.size,
        pageCount,
        title: pdfDoc.getTitle(),
        author: pdfDoc.getAuthor(),
        producer: pdfDoc.getProducer(),
        creationDate: pdfDoc.getCreationDate()?.toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to analyze PDF', details: err?.message });
    }
  });

  // Server-side PDF Compression Endpoint
  app.post('/api/compress', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No PDF file uploaded' });
        return;
      }

      const settings = JSON.parse(req.body.settings || '{}');
      const pdfBytes = req.file.buffer;
      const originalSize = req.file.size;

      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      if (settings.removeMetadata) {
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('OptiPDF Compression Engine');
      }

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: settings.compressObjectStreams !== false,
        addDefaultPage: false,
        objectsPerTick: 100,
        updateFieldAppearances: false,
      });

      const compressedSize = compressedBytes.byteLength;
      const savedBytes = Math.max(0, originalSize - compressedSize);
      const reductionPercentage = Number((((originalSize - compressedSize) / originalSize) * 100).toFixed(1));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Original-Size', originalSize.toString());
      res.setHeader('X-Compressed-Size', compressedSize.toString());
      res.setHeader('X-Reduction-Percentage', reductionPercentage.toString());
      res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace('.pdf', '_compressed.pdf')}"`);
      res.send(Buffer.from(compressedBytes));
    } catch (err: any) {
      res.status(500).json({ error: 'Server compression failed', details: err?.message });
    }
  });

  // Server-side Merge PDFs Tool
  app.post('/api/merge', upload.array('files', 20), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 2) {
        res.status(400).json({ error: 'At least 2 PDF files are required for merging.' });
        return;
      }

      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="merged_document.pdf"');
      res.send(Buffer.from(mergedBytes));
    } catch (err: any) {
      res.status(500).json({ error: 'Merge failed', details: err?.message });
    }
  });

  // Server-side Rotate PDF Tool
  app.post('/api/rotate', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const angle = parseInt(req.body.angle || '90', 10);
      const pdfDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + angle) % 360));
      });

      const rotatedBytes = await pdfDoc.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${req.file.originalname.replace('.pdf', '_rotated.pdf')}"`);
      res.send(Buffer.from(rotatedBytes));
    } catch (err: any) {
      res.status(500).json({ error: 'Rotate failed', details: err?.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF Compressor Express & Vite server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
