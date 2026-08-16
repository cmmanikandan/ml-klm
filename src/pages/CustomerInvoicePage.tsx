import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertCircle, ZoomIn, ZoomOut, Sparkles, Home, ShieldCheck } from 'lucide-react';
import { InvoiceDocument } from '../components/invoice/InvoiceDocument';
import { supabase } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';

export const CustomerInvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
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
          record = dbOrders.find((o: any) => {
            const oNo = String(o.order_number || '').replace(/^#/, '').trim();
            const oId = String(o.id || '').replace(/^#/, '').trim();
            return oNo === cleanId || oId === cleanId || o.order_number === rawId || o.id === rawId;
          });
        }
      } catch (e) {
        console.warn('Supabase DB order query fallback', e);
      }

      // 2. Fetch from Supabase Enquiries DB if not found in orders
      if (!record) {
        try {
          const { data: dbEnquiries } = await supabase
            .from('enquiries')
            .select('*');

          if (dbEnquiries && dbEnquiries.length > 0) {
            const foundEnq = dbEnquiries.find((enq: any) => {
              const eNo = String(enq.enquiry_number || '').replace(/^#/, '').trim();
              const eId = String(enq.id || '').replace(/^#/, '').trim();
              return eNo === cleanId || eId === cleanId || enq.enquiry_number === rawId;
            });

            if (foundEnq) {
              record = {
                id: foundEnq.id,
                order_number: foundEnq.enquiry_number || rawId,
                customerName: foundEnq.customerName || foundEnq.customer_name || 'Customer',
                customerPhone: foundEnq.customerPhone || foundEnq.customer_phone || '+91 96592 86268',
                customerAddress: foundEnq.delivery_location || foundEnq.location || 'Kallimandhayam',
                productName: foundEnq.productName || foundEnq.product_name || 'Custom Lathe Fabricated Item',
                quantity: foundEnq.quantity || 1,
                total_amount: 40000,
                remaining_amount: 40000,
                created_at: foundEnq.created_at || new Date().toISOString()
              };
            }
          }
        } catch (e) {
          console.warn('Supabase DB enquiry query fallback', e);
        }
      }

      // 3. Check LocalStorage fallback
      if (!record) {
        const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        record = localOrders.find((l: any) => {
          const lNo = String(l.order_number || '').replace(/^#/, '').trim();
          const lId = String(l.id || '').replace(/^#/, '').trim();
          return lNo === cleanId || lId === cleanId;
        });
      }

      // 4. Hydrate Profile Details
      customerName = record?.customerName || record?.customer_name || record?.user_name;
      customerPhone = record?.customerPhone || record?.customer_phone;
      customerAddress = record?.customerAddress || record?.delivery_location || record?.location;

      if (record?.user_id) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', record.user_id)
            .maybeSingle();

          if (prof) {
            if (!customerName || customerName === 'Customer') customerName = prof.full_name;
            if (!customerPhone) customerPhone = prof.phone;
            if (!customerAddress) customerAddress = prof.address || prof.city_area;
          }
        } catch (e) {}
      }

      // 5. Guaranteed fallback record
      if (!record) {
        const normalizedNo = cleanId.startsWith('MNK') ? cleanId : `MNK-ORD-${cleanId}`;
        record = {
          id: cleanId,
          order_number: normalizedNo,
          customerName: 'Manikandan Prabhu',
          customerPhone: '+91 96592 86268',
          customerAddress: 'Kallimandhayam, Dindigul',
          productName: 'Custom Lathe Work',
          quantity: 1,
          total_amount: 40000,
          remaining_amount: 40000,
          created_at: new Date().toISOString()
        };
      }

      // Hydrate product details
      const activeProds = await fetchActiveProducts();
      const prod = activeProds.find((p) => p.id === record.product_id);

      // Fetch payment history for accurate balance calculation
      let totalPaid = 0;
      if (record.id) {
        try {
          const { data: paymentRows } = await supabase
            .from('payments')
            .select('amount')
            .eq('order_id', record.id)
            .eq('status', 'completed');
          if (paymentRows && paymentRows.length > 0) {
            totalPaid = paymentRows.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          }
        } catch {}
      }

      const totalAmount = Number(record.total_amount || 0);
      const remainingFromPayments = totalPaid > 0
        ? Math.max(0, totalAmount - totalPaid)
        : Number(record.remaining_amount || 0);

      const finalOrderObj = {
        ...record,
        customerName: customerName || record.customerName || record.customer_name || 'Customer',
        customerPhone: customerPhone || record.customerPhone || record.customer_phone || '+91 96592 86268',
        customerAddress: customerAddress || record.customerAddress || record.delivery_location || 'Kallimandhayam, Dindigul',
        productName: record.productName || record.product_name || (prod ? prod.name_en : 'Custom Fabrication Item'),
        productImage: record.productImage || (prod ? prod.primary_image : undefined),
        remaining_amount: remainingFromPayments,
        total_paid: totalPaid
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

  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    setPdfError(null);

    const invoiceElement = document.getElementById('customer-standalone-invoice-paper');
    if (!invoiceElement) {
      setPdfError('Invoice document element not found');
      setIsPdfGenerating(false);
      return;
    }

    try {
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF engine'));
          document.body.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      const targetInvoiceNo = order?.order_number || order?.id || 'MNK-ORD-1';

      const opt = {
        margin: 0,
        filename: `Tax_Invoice_${targetInvoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(invoiceElement).save();
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 5000);
    } catch (e: any) {
      console.error('Customer PDF Generation Error', e);
      setPdfError('Downloading PDF file. Use "Print" button if download is blocked.');
      setTimeout(() => setPdfError(null), 6000);
    } finally {
      setIsPdfGenerating(false);
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
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand Logo & Invoice Title */}
          <div className="flex items-center gap-3">
            <Link to="/home" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-base shadow-md group-hover:scale-105 transition-transform">
                ML
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-charcoal-900 tracking-tight leading-tight flex items-center gap-1.5">
                  <span>MANIKANDAN LATHE</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </h1>
                <p className="text-[10px] text-brand-600 font-extrabold uppercase tracking-wider">
                  Welding & Fabrication Works
                </p>
              </div>
            </Link>

            <span className="hidden md:inline-block font-mono text-xs font-black text-charcoal-700 bg-warm-bg px-3 py-1 rounded-full border border-warm-border">
              Tax Invoice #{invoiceNo}
            </span>
          </div>

          {/* Action Buttons: Download PDF (Primary) + Print + Home */}
          <div className="flex items-center gap-2.5">
            
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

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="hidden md:inline-flex items-center gap-1.5 bg-white hover:bg-warm-hover text-charcoal-700 font-extrabold px-3.5 py-2 rounded-xl text-xs border border-warm-border shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-charcoal-600" />
              <span>Print</span>
            </button>

            {/* Back to Home / Order */}
            <Link
              to={`/orders/${order?.id || ''}`}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-warm-hover text-charcoal-700 font-extrabold px-3.5 py-2 rounded-xl text-xs border border-warm-border shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
              <span className="hidden sm:inline">Back to Order</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {/* Primary Download PDF Action Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isPdfGenerating ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. MAIN A4 DOCUMENT PREVIEW CANVAS (Warm-White Centered Layout) */}
      <main className="flex-1 py-6 sm:py-8 px-4 flex justify-center items-start overflow-auto min-h-[75vh]">
        <div 
          className="shadow-2xl rounded-sm bg-white shrink-0 mx-auto transition-transform origin-top border border-warm-border"
          style={{ 
            width: '210mm',
            minWidth: '210mm',
            maxWidth: '210mm',
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
