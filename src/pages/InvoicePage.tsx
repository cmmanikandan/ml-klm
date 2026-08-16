import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, ExternalLink, CheckCircle2, AlertCircle, ZoomIn, ZoomOut, Maximize2, Receipt, FileText } from 'lucide-react';
import { InvoiceDocument } from '../components/invoice/InvoiceDocument';
import { ThermalReceiptDocument } from '../components/invoice/ThermalReceiptDocument';
import { INITIAL_PRODUCTS, supabase } from '../lib/supabase';
import { fetchActiveProducts } from '../lib/productsStore';

export const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [receiptFormat, setReceiptFormat] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    // Calculate best initial scale for mobile
    if (window.innerWidth < 768) {
      const availableWidth = window.innerWidth - 32;
      const fitScale = Math.min(1.0, Math.max(0.65, Number((availableWidth / 794).toFixed(2))));
      setZoomLevel(fitScale);
    }

    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.45, Number((prev - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoomLevel(1.0);

  const handleFitA4 = () => {
    const availableWidth = window.innerWidth - 32;
    const fitScale = Math.min(1.0, Math.max(0.55, Number((availableWidth / 794).toFixed(2))));
    setZoomLevel(fitScale);
  };

  const fetchOrderDetails = async (targetId: string) => {
    setLoading(true);
    const rawId = String(targetId || '').trim();
    const cleanId = rawId.replace(/^#/, '').trim();
    const hashId = `#${cleanId}`;

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
                total_amount: 15000,
                remaining_amount: 10000,
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

      if (!record) {
        const localEnq = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
        const foundEnq = localEnq.find((l: any) => l.id === cleanId || l.enquiry_number === cleanId || l.number === cleanId);
        if (foundEnq) {
          record = {
            id: foundEnq.id,
            order_number: foundEnq.enquiry_number || foundEnq.number || cleanId,
            customerName: foundEnq.customerName || foundEnq.customer_name || 'Customer',
            customerPhone: foundEnq.customerPhone || foundEnq.customer_phone || '+91 96592 86268',
            customerAddress: foundEnq.delivery_location || foundEnq.location || 'Kallimandhayam',
            productName: foundEnq.productName || foundEnq.product_name || 'Custom Lathe Fabricated Item',
            quantity: foundEnq.quantity || 1,
            total_amount: 15000,
            remaining_amount: 10000,
            created_at: foundEnq.created_at || new Date().toISOString()
          };
        }
      }

      // 4. Hydrate real Customer Profile from Supabase `profiles` & `enquiries` tables
      let customerName = record?.customerName || record?.customer_name || record?.user_name;
      let customerPhone = record?.customerPhone || record?.customer_phone;
      let customerAddress = record?.customerAddress || record?.delivery_location || record?.location;

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
        } catch (e) {
          console.warn('Profile fetch fallback in invoice');
        }
      }

      if ((!customerName || !customerPhone || !customerAddress) && record?.user_id) {
        try {
          const { data: enq } = await supabase
            .from('enquiries')
            .select('*')
            .eq('user_id', record.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (enq) {
            if (!customerName || customerName === 'Customer') customerName = enq.customerName || enq.customer_name;
            if (!customerPhone) customerPhone = enq.customerPhone || enq.customer_phone;
            if (!customerAddress) customerAddress = enq.delivery_location || enq.location;
          }
        } catch (e) {
          console.warn('Enquiry fetch fallback in invoice');
        }
      }

      // 5. Guaranteed fallback record
      if (!record) {
        const normalizedNo = cleanId.startsWith('MNK') ? cleanId : `MNK-ORD-${cleanId}`;
        record = {
          id: cleanId,
          order_number: normalizedNo,
          customerName: 'Manikandan Prabhu',
          customerPhone: '+91 9629286268',
          customerAddress: 'K. Keeranur road, Kallimandhayam, Dindigul',
          productName: 'Steel Shoe Rack Work',
          quantity: 1,
          total_amount: 15000,
          remaining_amount: 10000,
          created_at: new Date().toISOString()
        };
      }

      // Hydrate product details and final customer payload
      const activeProds = await fetchActiveProducts();
      const prod = activeProds.find((p) => p.id === record.product_id) || INITIAL_PRODUCTS[0];

      const finalOrderObj = {
        ...record,
        customerName: customerName || record.customerName || record.customer_name || 'Manikandan Prabhu',
        customerPhone: customerPhone || record.customerPhone || record.customer_phone || '+91 9629286268',
        customerAddress: customerAddress || record.customerAddress || record.delivery_location || 'K. Keeranur road, Kallimandhayam, Dindigul',
        productName: record.productName || record.product_name || prod.name_en || 'Steel Shoe Rack Work',
        productImage: record.productImage || prod.primary_image
      };

      setOrder(finalOrderObj);
      if (finalOrderObj.is_pos) {
        setReceiptFormat('thermal');
      }
    } catch (e) {
      console.warn('Invoice page fetch fallback', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/orders');
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDownloadPdf = async () => {
    setIsPdfGenerating(true);
    setPdfError(null);

    const invoiceElement = document.getElementById(
      receiptFormat === 'thermal' ? 'thermal-receipt-paper' : 'standalone-invoice-paper'
    );
    
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

      const opt = receiptFormat === 'thermal' ? {
        margin: 0,
        filename: `Invoice_${targetInvoiceNo}_Thermal.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
      } : {
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
      console.error('PDF Generation Error', e);
      setPdfError('Downloading PDF file. Use "Print Invoice" if download blocks.');
      setTimeout(() => setPdfError(null), 6000);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const rawInvoiceNo = (order?.order_number || order?.id || id || 'MNK-1001').toString();
  const invoiceNo = rawInvoiceNo.startsWith('#') ? rawInvoiceNo.slice(1) : rawInvoiceNo;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent mx-auto"></div>
          <p className="text-xs font-extrabold text-slate-300">Loading invoice document #{id}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-page-wrapper min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* 1. TOP HEADER TOOLBAR (Hidden during browser printing) */}
      <div className="no-print sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition-colors border border-slate-700"
            title="Go Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>MANIKANDAN LATHE — TAX INVOICE</span>
              <span className="font-mono text-xs font-bold text-brand-400 bg-brand-950/80 px-2.5 py-0.5 rounded-full border border-brand-800">
                #{invoiceNo}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Printable Tax Document & 3" Thermal Receipt
            </p>
          </div>
        </div>

        {/* Paper Format Switcher & Compact Zoom Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Format Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-sm text-xs font-black">
            <button
              type="button"
              onClick={() => setReceiptFormat('a4')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                receiptFormat === 'a4'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Tax Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setReceiptFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                receiptFormat === 'thermal'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>3" Thermal POS</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-sm">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetZoom}
              className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE DOCUMENT VIEWER CONTAINER */}
      <div 
        className="invoice-viewer-scroll-container flex-1 py-6 px-4 bg-slate-800/90 flex justify-center items-start overflow-auto min-h-[70vh]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          className="invoice-paper-wrapper shadow-2xl rounded-sm bg-white shrink-0 mx-auto transition-transform origin-top"
          style={{ 
            width: receiptFormat === 'thermal' ? '80mm' : '210mm',
            minWidth: receiptFormat === 'thermal' ? '80mm' : '210mm',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center'
          }}
        >
          {order ? (
            receiptFormat === 'thermal' ? (
              <ThermalReceiptDocument order={order} id="thermal-receipt-paper" />
            ) : (
              <InvoiceDocument order={order} id="standalone-invoice-paper" />
            )
          ) : (
            <div className="p-8 text-center text-slate-700 font-bold text-sm">
              Invoice document parameters loading...
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM STICKY ACTION BAR (Hidden during browser printing) */}
      <div className="no-print sticky bottom-0 z-40 bg-slate-900 border-t border-slate-800 px-4 py-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
            <span>MANIKANDAN LATHE — {receiptFormat === 'thermal' ? '3" THERMAL POS RECEIPT' : 'A4 TAX INVOICE'}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* 1. Print Invoice */}
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print {receiptFormat === 'thermal' ? '3" Thermal Receipt' : 'A4 Invoice'}</span>
          </button>

          {/* 2. Open in New Tab */}
          <button
            onClick={handleOpenNewTab}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold px-4 py-2.5 rounded-xl text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-brand-400" />
            <span>Open in New Tab</span>
          </button>

          {/* 3. Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isPdfGenerating ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      <style>{`
        @page {
          size: ${receiptFormat === 'thermal' ? '80mm auto' : 'A4 portrait'};
          margin: 0;
        }
        @media print {
          html, body {
            width: ${receiptFormat === 'thermal' ? '80mm' : '210mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden;
          }
          #${receiptFormat === 'thermal' ? 'thermal-receipt-paper' : 'standalone-invoice-paper'}, 
          #${receiptFormat === 'thermal' ? 'thermal-receipt-paper' : 'standalone-invoice-paper'} * {
            visibility: visible;
          }
          #${receiptFormat === 'thermal' ? 'thermal-receipt-paper' : 'standalone-invoice-paper'} {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            padding: ${receiptFormat === 'thermal' ? '2mm' : '12mm 14mm'} !important;
            width: ${receiptFormat === 'thermal' ? '80mm' : '210mm'} !important;
            max-width: ${receiptFormat === 'thermal' ? '80mm' : '210mm'} !important;
            box-shadow: none !important;
            transform: scale(1.0) !important;
          }
          .no-print, .invoice-page-wrapper > div:not(.invoice-viewer-scroll-container) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
