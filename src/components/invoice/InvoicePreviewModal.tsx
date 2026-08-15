import React, { useState } from 'react';
import { X, Printer, ExternalLink, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { InvoiceDocument } from './InvoiceDocument';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const invoiceNo = order.order_number || order.id || 'MNK-ORD-6224';

  // 1. PRINT HANDLER
  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const el = document.getElementById('a4-preview-document');
    if (!el) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>MANIKANDAN LATHE — TAX INVOICE</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }
            }
            * { box-sizing: border-box; }
            body { background: #fff; margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${el.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
  };

  // 2. OPEN IN NEW TAB HANDLER
  const handleOpenNewTab = () => {
    const targetId = order.order_number || order.id || 'MNK-ORD-6224';
    window.open(`/invoice/${targetId}`, '_blank');
  };

  // Ensure html2pdf script is dynamically available
  const loadHtml2PdfScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve();
        return;
      }
      const existingScript = document.getElementById('html2pdf-cdn-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'html2pdf-cdn-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load html2pdf script'));
      document.head.appendChild(script);
    });
  };

  // 3. DOWNLOAD PDF HANDLER
  const handleDownloadPdf = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfDownloaded(false);
    setPdfError(null);

    try {
      await loadHtml2PdfScript();

      const el = document.getElementById('a4-preview-document');
      if (!el) {
        throw new Error('Invoice element missing');
      }

      const filename = `Manikandan-Lathe-Invoice-${invoiceNo}.pdf`;

      const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const html2pdf = (window as any).html2pdf;
      await html2pdf().set(opt).from(el).save();

      setIsPdfGenerating(false);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err) {
      console.warn('PDF generation fallback to print:', err);
      setIsPdfGenerating(false);
      setPdfError('Unable to generate PDF. Please try again.');
      setTimeout(() => setPdfError(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      
      {/* Modal Container Card */}
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-[1150px] max-h-[94vh] flex flex-col border border-slate-700 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>Invoice Preview</span>
              <span className="text-xs font-extrabold font-mono text-brand-400 bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-800">
                #{invoiceNo}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              MANIKANDAN LATHE — TAX INVOICE
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (BI-DIRECTIONAL SCROLLABLE A4 PREVIEW AREA) */}
        <div 
          className="flex-1 p-4 sm:p-8 bg-slate-800/90 flex justify-start sm:justify-center items-start overflow-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="shadow-2xl rounded-sm bg-white shrink-0 my-auto sm:my-0">
            <InvoiceDocument order={order} id="a4-preview-document" />
          </div>
        </div>

        {/* MODAL ACTION BAR (FIXED FOOTER) */}
        <div className="bg-slate-900 px-5 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-extrabold text-slate-400">
            {pdfDownloaded ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Downloaded ({invoiceNo}.pdf)</span>
              </span>
            ) : pdfError ? (
              <span className="text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{pdfError}</span>
              </span>
            ) : (
              <span>Select an action to print, view, or download PDF</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* 1. Print Invoice */}
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            {/* 2. Open in New Tab */}
            <button
              onClick={handleOpenNewTab}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold px-4 py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-brand-400" />
              <span>Open in New Tab</span>
            </button>

            {/* 3. Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isPdfGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
