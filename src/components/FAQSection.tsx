import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, ShieldCheck, Zap } from 'lucide-react';
import { FAQItem } from '../types';

export const FAQSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Why did my PDF only shrink 8% (or very little)?',
      answer:
        'If a PDF yields a minor file size reduction, it usually means your document was already well-optimized or consists mainly of vector graphics, compressed fonts, or pre-optimized text streams rather than uncompressed raster images. OptiPDF protects document integrity and will never ruin your file just to force a fake percentage drop.',
      category: 'compression',
    },
    {
      question: 'Does PDF compression reduce visual quality?',
      answer:
        'With Balanced level compression, visual quality reduction is virtually imperceptible to the human eye. We use smart image downsampling (e.g. 150 DPI) and JPEG stream optimization. For high-resolution print jobs, you can choose High Quality mode which keeps images at 220+ DPI.',
      category: 'quality',
    },
    {
      question: 'Is my document uploaded or stored on any server?',
      answer:
        'Your privacy is our highest priority. All PDF parsing and structural compression can run 100% locally in your browser sandbox using client WebAssembly/JavaScript. Any temporary server processing is immediately cleared from memory upon download completion.',
      category: 'privacy',
    },
    {
      question: 'How much can I compress a PDF file?',
      answer:
        'Compression ratios depend on the content. Image-heavy PDFs or high-res scanned documents typically shrink by 60% to 85%. Text-heavy or vector documents shrink by 15% to 40% through object stream compaction.',
      category: 'compression',
    },
    {
      question: 'Can I compress password-protected or signed PDFs?',
      answer:
        'For encrypted PDFs, you must unlock the file prior to compression. For digitally signed PDFs, OptiPDF will display a security warning because re-encoding structural streams will invalidate the original cryptographic signature.',
      category: 'formats',
    },
    {
      question: 'Can I compress multiple PDFs at the same time in batch?',
      answer:
        'Yes! Simply drag and drop multiple PDF files into the upload dropzone. You can apply uniform settings or target file sizes across all files, process them simultaneously, and download everything as a single ZIP archive.',
      category: 'compression',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 sm:p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Everything you need to know about PDF compression, algorithms, quality levels, and privacy.
        </p>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g., 'quality', 'privacy', '8%')..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            id="input-faq-search"
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/40"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-4 text-left flex justify-between items-center gap-3 font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                id={`btn-faq-toggle-${index}`}
              >
                <span>{faq.question}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in bg-white">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
