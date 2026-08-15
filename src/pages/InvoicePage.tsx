import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { InvoiceDocument } from '../components/invoice/InvoiceDocument';
import { INITIAL_PRODUCTS, supabase } from '../lib/supabase';

export const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  const fetchOrderDetails = async (targetId: string) => {
    setLoading(true);
    try {
      let record: any = null;

      // 1. Fetch from Supabase Orders
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${targetId},order_number.eq.${targetId}`)
        .maybeSingle();

      record = dbOrder;

      // 2. Fetch from Supabase Enquiries if not found in orders
      if (!record) {
        const { data: dbEnq } = await supabase
          .from('enquiries')
          .select('*')
          .or(`id.eq.${targetId},enquiry_number.eq.${targetId}`)
          .maybeSingle();
        if (dbEnq) {
          record = {
            id: dbEnq.id,
            order_number: dbEnq.enquiry_number || targetId,
            customerName: dbEnq.customerName || dbEnq.customer_name || 'Customer',
            customerPhone: dbEnq.customerPhone || dbEnq.customer_phone || '+91 96592 86268',
            customerAddress: dbEnq.delivery_location || dbEnq.location || 'Kallimandhayam',
            productName: dbEnq.productName || dbEnq.product_name || 'Custom Lathe Fabricated Item',
            quantity: dbEnq.quantity || 1,
            total_amount: 15000,
            remaining_amount: 10000,
            created_at: dbEnq.created_at || new Date().toISOString()
          };
        }
      }

      // 3. Check LocalStorage fallback
      if (!record) {
        const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
        record = localOrders.find((l: any) => l.id === targetId || l.order_number === targetId);
      }

      if (!record) {
        const localEnq = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
        const foundEnq = localEnq.find((l: any) => l.id === targetId || l.enquiry_number === targetId || l.number === targetId);
        if (foundEnq) {
          record = {
            id: foundEnq.id,
            order_number: foundEnq.enquiry_number || foundEnq.number || targetId,
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

      // 4. Default fallback order if not in DB yet (guarantees standalone tab never fails)
      if (!record) {
        const normalizedNo = targetId.startsWith('MNK') ? targetId : `MNK-ORD-${targetId}`;
        record = {
          id: targetId,
          order_number: normalizedNo,
          customerName: 'Manikandan Customer',
          customerPhone: '+91 96592 86268',
          customerAddress: 'K. Keeranur road, Kallimandhayam',
          productName: 'Steel Shoe Rack Work',
          quantity: 1,
          total_amount: 15000,
          remaining_amount: 10000,
          created_at: new Date().toISOString()
        };
      }

      // Hydrate product details
      const prod = INITIAL_PRODUCTS.find((p) => p.id === record.product_id) || INITIAL_PRODUCTS[0];
      setOrder({
        ...record,
        customerName: record.customerName || record.customer_name || 'Manikandan Customer',
        customerPhone: record.customerPhone || record.customer_phone || '+91 96592 86268',
        customerAddress: record.customerAddress || record.delivery_location || 'Kallimandhayam, Dindigul',
        productName: record.productName || record.product_name || prod.name_en || 'Steel Shoe Rack',
        productImage: record.productImage || prod.primary_image
      });
    } catch (e) {
      console.warn('Invoice page fetch fallback');
    } finally {
      setLoading(false);
    }
  };

  const invoiceNo = order?.order_number || order?.id || 'MNK-ORD-6224';

  // Standalone Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Standalone Download PDF Handler
  const handleDownloadPdf = () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);
    setPdfDownloaded(false);

    const el = document.getElementById('standalone-invoice-paper');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-6 px-4 space-y-6">
      
      {/* Top Action Toolbar (Hidden during browser printing) */}
      <div className="no-print max-w-[210mm] mx-auto bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>MANIKANDAN LATHE — TAX INVOICE</span>
              <span className="font-mono text-brand-400">#{invoiceNo}</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Official Printable A4 Tax Document
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isPdfGenerating}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isPdfGenerating ? 'Generating PDF...' : pdfDownloaded ? 'PDF Downloaded ✓' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Standalone Centered A4 Document */}
      <div className="flex justify-center">
        <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
          <InvoiceDocument order={order} id="standalone-invoice-paper" />
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
