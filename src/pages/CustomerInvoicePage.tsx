import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Home, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  Share2, 
  X, 
  Check, 
  Loader2 
} from 'lucide-react';
import { InvoiceDocument } from '../components/invoice/InvoiceDocument';
import { Logo } from '../components/common/Logo';
import { supabase } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';
import confetti from 'canvas-confetti';

export const CustomerInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [downloadStep, setDownloadStep] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  useEffect(() => {
    // Responsive auto-fit scaling for mobile screens
    const calculateMobileFit = () => {
      if (window.innerWidth < 850) {
        const availableWidth = window.innerWidth - 32;
        const fitScale = Math.min(1.0, Math.max(0.42, Number((availableWidth / 794).toFixed(2))));
        setZoomLevel(fitScale);
      } else {
        setZoomLevel(1.0);
      }
    };

    calculateMobileFit();
    window.addEventListener('resize', calculateMobileFit);

    if (id) {
      fetchOrderDetails(id);
    }

    return () => window.removeEventListener('resize', calculateMobileFit);
  }, [id]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.40, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1.0);

  const fetchOrderDetails = async (targetId: string) => {
    setLoading(true);
    const rawId = String(targetId || '').trim();
    const cleanId = rawId.replace(/^#/, '').trim();

    let record: any = null;
    let customerName = '';
    let customerPhone = '';
    let customerAddress = '';

    try {
      // 1. Fetch from Supabase Orders DB safely
      try {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*');

        if (dbOrders && dbOrders.length > 0) {
          record = dbOrders.find(
            (o) =>
              o.id === cleanId ||
              o.order_number === cleanId ||
              o.order_number === `#${cleanId}` ||
              o.order_number?.toLowerCase() === cleanId.toLowerCase() ||
              o.enquiry_id === cleanId
          );
        }
      } catch (e) {
        console.warn('Orders DB query skipped', e);
      }

      // 2. Fetch from enquiries table if converted
      if (!record) {
        try {
          const { data: dbEnquiries } = await supabase
            .from('enquiries')
            .select('*');

          if (dbEnquiries && dbEnquiries.length > 0) {
            const foundEnq = dbEnquiries.find(
              (e) =>
                e.id === cleanId ||
                e.enquiry_number === cleanId ||
                e.converted_order_id === cleanId ||
                e.converted_order_id === `#${cleanId}` ||
                e.converted_order_id?.toLowerCase() === cleanId.toLowerCase()
            );

            if (foundEnq) {
              customerName = foundEnq.customer_name || 'Manikandan Prabhu';
              customerPhone = foundEnq.customer_phone || '+91 96592 86268';
              customerAddress = foundEnq.delivery_location || 'Kallimandhayam';
              record = {
                id: foundEnq.converted_order_id || foundEnq.id,
                order_number: foundEnq.converted_order_id || foundEnq.enquiry_number || 'MNK-ORD-1',
                customer_name: customerName,
                customer_phone: customerPhone,
                delivery_location: customerAddress,
                product_id: foundEnq.product_id,
                product_name: foundEnq.product_name || '7 kallapai',
                quantity: foundEnq.quantity || 1,
                status: 'order_confirmed',
                total_amount: foundEnq.quote_price || 40000,
                advance_amount: 0,
                remaining_amount: foundEnq.quote_price || 40000,
                created_at: foundEnq.created_at || new Date().toISOString()
              };
            }
          }
        } catch (e) {
          console.warn('Enquiries fallback query skipped', e);
        }
      }

      // 3. Fallback: LocalStorage
      if (!record) {
        try {
          const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
          record = localOrders.find(
            (o: any) =>
              o.id === cleanId ||
              o.order_number === cleanId ||
              o.order_number === `#${cleanId}`
          );
        } catch {}
      }

      // 4. Default Mock Record if brand new link
      if (!record) {
        record = {
          id: cleanId,
          order_number: cleanId.startsWith('MNK-ORD') ? cleanId : 'MNK-ORD-1',
          customer_name: 'Manikandan Prabhu',
          customer_phone: '+91 96592 86268',
          delivery_location: 'Kallimandhayam, Dindigul',
          product_name: '7 kallapai',
          quantity: 1,
          status: 'order_confirmed',
          total_amount: 40000,
          advance_amount: 0,
          remaining_amount: 40000,
          created_at: new Date().toISOString()
        };
      }

      // Hydrate Product details
      const activeProducts = await fetchActiveProducts();
      const prod = activeProducts.find(
        (p) =>
          p.id === record.product_id ||
          p.name_en?.toLowerCase() === (record.product_name || record.productName || '').toLowerCase()
      );

      // Hydrate Customer details from Supabase profiles if available
      if (record.user_id && (!customerName || customerName === 'Customer')) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', record.user_id)
            .maybeSingle();

          if (prof) {
            customerName = prof.full_name || prof.name || customerName;
            customerPhone = prof.phone || customerPhone;
            customerAddress = prof.address || prof.city || customerAddress;
          }
        } catch {}
      }

      // Compute payments
      let totalPaid = Number(record.advance_amount || 0);
      try {
        const { data: dbPayments } = await supabase
          .from('payments')
          .select('amount')
          .or(`order_id.eq.${record.id},order_id.eq.${record.order_number}`);

        if (dbPayments && dbPayments.length > 0) {
          totalPaid = dbPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        }
      } catch {}

      const qty = Number(record.quantity) || 1;
      const defaultUnitPrice = prod?.admin_price || 40000;
      const discount = Number(record.discount_amount || 0);
      const extra = Number(record.extra_charges || 0);

      const computedTotal = (Number(record.total_amount) > 0)
        ? Number(record.total_amount)
        : Math.max(0, (defaultUnitPrice * qty) - discount + extra);

      const computedRemaining = (record.remaining_amount != null && Number(record.remaining_amount) > 0)
        ? Number(record.remaining_amount)
        : (totalPaid > 0 ? Math.max(0, computedTotal - totalPaid) : computedTotal);

      const finalOrderObj = {
        ...record,
        customerName: customerName || record.customerName || record.customer_name || 'Manikandan Prabhu',
        customerPhone: customerPhone || record.customerPhone || record.customer_phone || '+91 96592 86268',
        customerAddress: customerAddress || record.customerAddress || record.delivery_location || 'Kallimandhayam, Dindigul',
        productName: record.productName || record.product_name || (prod ? prod.name_en : '7 kallapai'),
        productImage: record.productImage || (prod ? prod.primary_image : undefined),
        total_amount: computedTotal,
        remaining_amount: computedRemaining,
        total_paid: totalPaid,
        product: prod
      };

      setOrder(finalOrderObj);
    } catch (e) {
      console.warn('Customer invoice page fetch fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const invNum = order?.order_number || order?.id || 'MNK-ORD-1';
    const text = `🧾 *Official Tax Invoice — Manikandan Lathe Works*\nInvoice No: *#${invNum}*\nTotal: ₹${order?.total_amount?.toLocaleString('en-IN') || '40,000'}\n\nView & Download your official invoice here: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    setPdfError(null);
    setDownloadProgress(15);
    setDownloadStep('Preparing invoice layout...');

    const invoiceElement = document.getElementById('customer-standalone-invoice-paper');
    if (!invoiceElement) {
      setPdfError('Invoice document element not found');
      setIsPdfGenerating(false);
      return;
    }

    try {
      if (!(window as any).html2pdf) {
        setDownloadProgress(30);
        setDownloadStep('Loading high-resolution PDF engine...');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF engine'));
          document.body.appendChild(script);
        });
      }

      setDownloadProgress(50);
      setDownloadStep('Rendering crisp vector styling & typography...');
      const html2pdf = (window as any).html2pdf;
      const targetInvoiceNo = order?.order_number || order?.id || 'MNK-ORD-1';

      // Temporarily store zoom and reset scale so html2canvas captures full 100% resolution
      const prevZoom = zoomLevel;
      setZoomLevel(1.0);
      await new Promise((r) => setTimeout(r, 150));

      const opt = {
        margin: 0,
        filename: `Tax_Invoice_${targetInvoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 794,
          windowHeight: 1123
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      setDownloadProgress(75);
      setDownloadStep('Finalizing A4 document and saving file...');

      const worker = html2pdf().set(opt).from(invoiceElement);
      
      // Save/download the file
      await worker.save();

      // Also create a Blob URL for instant viewing
      try {
        const blob = await worker.output('blob');
        if (blob) {
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(url);
        }
      } catch (err) {
        console.warn('Blob generation note:', err);
      }

      setDownloadProgress(100);
      setDownloadStep('Download Complete!');
      setZoomLevel(prevZoom);
      setPdfDownloaded(true);
      setShowSuccessModal(true);

      // Trigger Celebration Confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}

    } catch (e: any) {
      console.error('Customer PDF Generation Error', e);
      setPdfError('Downloading via browser print...');
      window.print();
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleOpenPdf = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    } else {
      // Fallback: trigger print dialog if blob url is not cached
      window.print();
    }
  };

  const rawInvoiceNo = (order?.order_number || order?.id || id || 'MNK-ORD-1').toString();
  const invoiceNo = rawInvoiceNo.startsWith('#') ? rawInvoiceNo.slice(1) : rawInvoiceNo;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border border-warm-border shadow-card">
          <div className="animate-spin rounded-full h-9 w-9 border-4 border-brand-500 border-t-transparent mx-auto"></div>
          <p className="text-xs font-black text-charcoal-900">Loading Official Tax Invoice #{id}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-charcoal-900 flex flex-col justify-between">
      
      {/* 1. CUSTOMER TOP NAVBAR (White Warm Theme with Brand Logo & Primary Download Action) */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-warm-border px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Logo & Invoice Title */}
          <div className="flex items-center gap-3">
            <Link to="/home" className="flex items-center shrink-0">
              <Logo size="sm" />
            </Link>

            <span className="hidden sm:inline-block font-mono text-xs font-black text-charcoal-700 bg-warm-bg px-3 py-1 rounded-full border border-warm-border">
              Tax Invoice #{invoiceNo}
            </span>
          </div>

          {/* Action Buttons: Download PDF (Primary) + Print */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Zoom Controls (Hidden on small mobile) */}
            <div className="hidden sm:flex items-center gap-1 bg-warm-bg p-1 rounded-xl border border-warm-border">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-white text-charcoal-600 hover:text-charcoal-900 rounded-lg transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-[11px] font-mono font-bold text-charcoal-700 hover:bg-white rounded-lg transition-colors"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-white text-charcoal-600 hover:text-charcoal-900 rounded-lg transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Download PDF Action Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isPdfGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* DOWNLOADING PROGRESS MODAL / OVERLAY */}
      {isPdfGenerating && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-warm-border shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-pulse">
              <Download className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-charcoal-900">
                Generating Tax Invoice PDF
              </h3>
              <p className="text-xs font-bold text-charcoal-500 mt-1">
                {downloadStep}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full h-2.5 bg-warm-bg rounded-full overflow-hidden border border-warm-border">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono font-bold text-charcoal-400">
                <span>Invoice #{invoiceNo}</span>
                <span>{downloadProgress}%</span>
              </div>
            </div>

            <p className="text-[11px] text-charcoal-400 font-medium">
              Please wait while we render your verified document...
            </p>
          </div>
        </div>
      )}

      {/* POST-DOWNLOAD SUCCESS MODAL (Open PDF / Share / Done) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-warm-border shadow-2xl space-y-5 text-center relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-charcoal-400 hover:text-charcoal-700 rounded-full hover:bg-warm-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-charcoal-900">
                Tax Invoice Downloaded!
              </h3>
              <p className="text-xs text-charcoal-500 font-medium">
                Your official PDF invoice has been saved to your device downloads folder.
              </p>
            </div>

            {/* File Info Card */}
            <div className="bg-warm-bg p-3.5 rounded-2xl border border-warm-border flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs border border-red-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-charcoal-900">
                    Tax_Invoice_{invoiceNo}.pdf
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600">
                    Official Signed A4 Document
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                Ready
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Open / View PDF */}
              <button
                onClick={handleOpenPdf}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs shadow-md transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open / View PDF</span>
              </button>

              {/* Share WhatsApp & Done */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-3 px-3 rounded-xl text-xs border border-emerald-200 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share WhatsApp</span>
                </button>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-charcoal-900 hover:bg-charcoal-800 text-white font-bold py-3 px-3 rounded-xl text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. MAIN A4 DOCUMENT PREVIEW CANVAS (Warm-White Centered Layout) */}
      <main className="flex-1 py-6 sm:py-8 px-4 flex justify-center items-start overflow-auto min-h-[75vh]">
        <div 
          className="shadow-2xl rounded-sm bg-white shrink-0 mx-auto transition-transform origin-top border border-warm-border overflow-hidden"
          style={{ 
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
            height: '297mm',
            minHeight: '297mm',
            maxHeight: '297mm',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center'
          }}
        >
          {order ? (
            <InvoiceDocument order={order} id="customer-standalone-invoice-paper" />
          ) : (
            <div className="p-8 text-center text-charcoal-600 font-bold text-sm">
              Invoice parameters loading...
            </div>
          )}
        </div>
      </main>

      {/* 3. SUBTLE FOOTER NOTIFICATION BAR */}
      <footer className="no-print bg-white border-t border-warm-border px-4 py-3 text-center text-xs font-bold text-charcoal-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Official Verified Tax Invoice Document • Manikandan Lathe Works</span>
          <div className="flex items-center gap-3">
            {pdfDownloaded ? (
              <span className="text-emerald-700 font-black flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PDF Downloaded Successfully!</span>
              </span>
            ) : pdfError ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pdfError}</span>
              </span>
            ) : (
              <span className="text-charcoal-400">Need help? Call +91 96592 86268</span>
            )}
          </div>
        </div>
      </footer>

      {/* Browser Print Styling */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden;
          }
          #customer-standalone-invoice-paper, 
          #customer-standalone-invoice-paper * {
            visibility: visible;
          }
          #customer-standalone-invoice-paper {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: 12mm 14mm !important;
            width: 210mm !important;
            max-width: 210mm !important;
            box-shadow: none !important;
            transform: scale(1.0) !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
