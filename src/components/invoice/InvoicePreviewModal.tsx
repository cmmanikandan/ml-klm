import React, { useState } from 'react';
import { X, Printer, ExternalLink, Download, CheckCircle2 } from 'lucide-react';
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

  if (!isOpen || !order) return null;

  const invoiceNo = order.order_number || order.id || 'MNK-ORD-1';

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
          <title>Manikandan-Lathe-Invoice-${invoiceNo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
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
              }, 300);
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
    const targetId = order.id || order.order_number;
    window.open(`/invoice/${targetId}`, '_blank');
  };

  // 3. DOWNLOAD PDF HANDLER (html2pdf.js)
  const handleDownloadPdf = () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfDownloaded(false);

    const el = document.getElementById('a4-preview-document');
    if (!el) {
      setIsPdfGenerating(false);
      return;
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

    if (typeof html2pdf === 'function') {
      html2pdf()
        .set(opt)
        .from(el)
        .save()
        .then(() => {
          setIsPdfGenerating(false);
          setPdfDownloaded(true);
          setTimeout(() => setPdfDownloaded(false), 3000);
        })
        .catch(() => {
          setIsPdfGenerating(false);
          handlePrint();
        });
    } else {
      setTimeout(() => {
        setIsPdfGenerating(false);
        handlePrint();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      
      {/* Modal Container Card */}
      <div className="bg-slate-100 rounded-3xl shadow-2xl w-full max-w-[1100px] max-h-[92vh] flex flex-col border border-slate-700 overflow-hidden">
        
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
              MANIKANDAN LATHE — Official Printable A4 Tax Bill
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

        {/* MODAL BODY (SCROLLABLE A4 PREVIEW AREA) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-800/90 flex justify-center items-start">
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white scale-[0.85] sm:scale-100 origin-top transition-transform">
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
            ) : (
              <span>Select an action to print, view, or download PDF</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* 1. Print Invoice */}
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            {/* 2. Open in New Tab */}
            <button
              onClick={handleOpenNewTab}
              className="flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold px-4 py-2.5 rounded-2xl text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-brand-400" />
              <span>Open in New Tab</span>
            </button>

            {/* 3. Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
