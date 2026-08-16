import React from 'react';

interface InvoiceDocumentProps {
  order: any;
  id?: string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ order, id = 'a4-invoice-paper' }) => {
  if (!order) return null;

  const total = Number(order.total_amount || 0);
  const remaining = Number(order.remaining_amount || 0);
  const advancePaid = Math.max(0, total - remaining);

  const isFullyPaid = remaining === 0;
  const isPartiallyPaid = advancePaid > 0 && remaining > 0;
  const statusStampText = isFullyPaid ? 'PAID IN FULL' : isPartiallyPaid ? 'PARTIALLY PAID' : 'PAYMENT PENDING';
  const statusBadgeBg = isFullyPaid ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : isPartiallyPaid ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-red-100 text-red-900 border-red-300';

  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const rawInvoiceNo = (order.order_number || order.id || 'MNK-1001').toString();
  const invoiceNo = rawInvoiceNo.startsWith('#') ? rawInvoiceNo : `#${rawInvoiceNo}`;

  return (
    <div
      id={id}
      className="bg-white text-slate-900 mx-auto relative flex flex-col justify-between box-border shadow-lg overflow-hidden"
      style={{
        width: '210mm',
        minWidth: '210mm',
        maxWidth: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '12mm 14mm',
        boxSizing: 'border-box',
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
        fontSize: '10.5pt',
        lineHeight: '1.35',
        position: 'relative'
      }}
    >
      <div>
        {/* HEADER SECTION: Left Brand & Right Tax Invoice Details */}
        <div className="flex justify-between items-start border-b-2 border-brand-600 pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              MANIKANDAN <span className="text-brand-600">LATHE</span>
            </h1>
            <p className="text-[10px] font-extrabold text-brand-600 tracking-widest uppercase mt-0.5">
              WELDING WORKS & FABRICATION SHOP
            </p>
            <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed">
              Kallimandhayam - 624616, Dindigul District, Tamil Nadu<br />
              <strong>Phone:</strong> +91 96592 86268 | <strong>Email:</strong> manikandanlatheklm@gmail.com
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              TAX INVOICE
            </h2>
            <p className="text-sm font-black font-mono text-brand-600 mt-0.5">
              Invoice No: {invoiceNo}
            </p>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Date: {orderDate}
            </p>
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
              <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-800 border-slate-300">
                MODE: {order.is_pos || (order.admin_notes && order.admin_notes.includes('POS')) || String(order.order_number || '').includes('POS') ? 'POS SALE' : 'ONLINE ORDER'}
              </span>
              <span className={`inline-block text-[10px] font-black tracking-wider uppercase px-3 py-0.5 rounded-full border ${statusBadgeBg}`}>
                {statusStampText}
              </span>
            </div>
          </div>
        </div>

        {/* SUPPLIER & CUSTOMER SECTION (FROM / BILL TO 50/50 GRID) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1.5">
              FROM (SUPPLIER)
            </h3>
            <p className="text-xs font-black text-slate-900">MANIKANDAN LATHE WORKS</p>
            <p className="text-[11px] text-slate-700 font-medium">Kallimandhayam - 624616</p>
            <p className="text-[11px] text-slate-700 font-medium">Dindigul District, Tamil Nadu</p>
            <p className="text-[11px] text-slate-800 font-bold mt-0.5">Phone: +91 96592 86268</p>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
            <h3 className="text-[10px] font-black text-brand-600 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1.5">
              BILL TO (CUSTOMER)
            </h3>
            <p className="text-xs font-black text-slate-900">{order.customerName || order.customer_name || 'Customer'}</p>
            <p className="text-[11px] text-slate-800 font-bold">Phone: {order.customerPhone || order.customer_phone || '+91 96592 86268'}</p>
            <p className="text-[11px] text-slate-700 font-medium">Customer City: {order.customerAddress || order.delivery_location || 'Kallimandhayam'}</p>
            <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
              Fulfillment Mode: Direct Workshop Counter Pickup Only (Kallimandhayam)
            </p>
          </div>
        </div>

        {/* ITEMIZATION TABLE - CONDITIONAL BILL TEMPLATE (WEIGHT/PARTS vs NORMAL FIXED INVOICE) */}
        {order.weight_calculation && order.weight_calculation.parts ? (
          <div className="space-y-4 mb-4">
            {/* 1. Parts Breakdown Table */}
            <div>
              <div className="flex justify-between items-center bg-slate-100 px-3 py-1 border border-slate-300 border-b-0 rounded-t-lg">
                <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                  FABRICATION ITEM: {order.productName || order.product_name || 'LATHE ITEM'} - WEIGHT BREAKDOWN (RATE: ₹{order.weight_calculation.rate_per_kg || 160}/KG)
                </span>
                <span className="text-[10px] font-extrabold text-brand-600 font-mono">
                  TOTAL WEIGHT: {order.weight_calculation.total_weight_kg || 0} KG
                </span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider">
                    <th className="py-2 px-3 text-center w-[8%] border border-slate-900">S.No</th>
                    <th className="py-2 px-3 text-left w-[46%] border border-slate-900">Product Item & Section Description</th>
                    <th className="py-2 px-3 text-center w-[16%] border border-slate-900">Weight (KG)</th>
                    <th className="py-2 px-3 text-right w-[15%] border border-slate-900">Rate / KG</th>
                    <th className="py-2 px-3 text-right w-[15%] border border-slate-900">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium divide-y divide-slate-200">
                  {order.weight_calculation.parts.map((p: any, idx: number) => {
                    const rate = order.weight_calculation.rate_per_kg || 160;
                    const cost = Math.round((Number(p.weight_kg) || 0) * rate);
                    const displayName = p.name ? p.name : `${order.productName || 'Fabrication Item'} Piece ${idx + 1}`;
                    return (
                      <tr key={p.id || idx}>
                        <td className="py-2 px-3 text-center font-bold text-slate-600 border border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 border border-slate-200 font-extrabold text-slate-900">{displayName}</td>
                        <td className="py-2 px-3 text-center font-bold font-mono text-slate-900 border border-slate-200">{p.weight_kg} kg</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700 border border-slate-200">₹{rate}</td>
                        <td className="py-2 px-3 text-right font-black font-mono text-slate-900 border border-slate-200">₹{cost.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-black">
                    <td colSpan={2} className="py-2 px-3 text-right text-slate-800 border border-slate-300">Base Weight Total:</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-900 border border-slate-300">{order.weight_calculation.total_weight_kg || 0} kg</td>
                    <td className="py-2 px-3 text-right text-slate-600 border border-slate-300">-</td>
                    <td className="py-2 px-3 text-right font-mono text-brand-700 border border-slate-300">
                      ₹{(order.weight_calculation.weight_subtotal || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. Extra Shop Charges / Outsourced Expenses Table */}
            {order.weight_calculation.extra_charges && order.weight_calculation.extra_charges.length > 0 && (
              <div>
                <div className="bg-amber-100/70 px-3 py-1 border border-amber-300 border-b-0 rounded-t-lg">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                    EXTRA SHOP CHARGES & OUTSOURCED ITEMS
                  </span>
                </div>
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white text-[10px] uppercase font-black">
                      <th className="py-1.5 px-3 text-center w-[8%] border border-slate-800">#</th>
                      <th className="py-1.5 px-3 text-left border border-slate-800">Description of Extra Item / Service</th>
                      <th className="py-1.5 px-3 text-right w-[20%] border border-slate-800">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.weight_calculation.extra_charges.map((ext: any, eIdx: number) => (
                      <tr key={ext.id || eIdx}>
                        <td className="py-1.5 px-3 text-center font-bold border border-slate-200">{eIdx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800 border border-slate-200">{ext.description}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold border border-slate-200">₹{Number(ext.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD NORMAL FIXED PRICE INVOICE TABLE */
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider">
                <th className="py-2 px-3 text-center w-[8%] border border-slate-900">S.No</th>
                <th className="py-2 px-3 text-left w-[52%] border border-slate-900">Product / Fabrication Description</th>
                <th className="py-2 px-3 text-center w-[12%] border border-slate-900">Qty</th>
                <th className="py-2 px-3 text-right w-[14%] border border-slate-900">Rate (₹)</th>
                <th className="py-2 px-3 text-right w-[14%] border border-slate-900">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3 text-center font-bold text-slate-600 border border-slate-200">1</td>
                <td className="py-2.5 px-3 border border-slate-200">
                  <p className="font-extrabold text-slate-900 text-sm">{order.productName || order.product_name || 'Custom Lathe Fabricated Item'}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Precision heavy duty steel lathe work & welding fabrication.
                  </p>
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-900 border border-slate-200">{order.quantity || 1}</td>
                <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-800 border border-slate-200">₹{total.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 border border-slate-200">₹{total.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* FINANCIAL BREAKDOWN SUMMARY */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-slate-100/80 p-3 rounded-xl border-l-4 border-brand-600 max-w-[340px] text-xs">
            <p className="font-bold text-slate-800">
              <strong>Thank you for choosing Manikandan Lathe Works!</strong>
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
              Quality guaranteed steel welding & lathe fabrication engineered to specifications.
            </p>
          </div>

          <div className="w-[280px]">
            <table className="w-full text-xs font-semibold">
              <tbody>
                {order.weight_calculation && (
                  <>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 text-slate-600">Base Weight Amount:</td>
                      <td className="py-1 text-right font-bold text-slate-900 font-mono">₹{(order.weight_calculation.weight_subtotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {Number(order.weight_calculation.extra_subtotal || 0) > 0 && (
                      <tr className="border-b border-slate-200">
                        <td className="py-1 text-slate-600">Extra Expenses Total:</td>
                        <td className="py-1 text-right font-bold text-slate-900 font-mono">₹{(order.weight_calculation.extra_subtotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </>
                )}
                <tr className="border-b border-slate-200 font-black">
                  <td className="py-1 text-slate-900">Grand Total Amount:</td>
                  <td className="py-1 text-right text-slate-900 font-mono">₹{total.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 text-slate-600">Advance / Paid:</td>
                  <td className="py-1 text-right font-bold text-emerald-700 font-mono">₹{advancePaid.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-t-2 border-b-2 border-brand-600">
                  <td className="py-2 font-black text-sm text-slate-900">Balance Due:</td>
                  <td className="py-2 text-right font-black text-base text-brand-600 font-mono">₹{remaining.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SIGNATURE & FOOTER SECTION (ABSOLUTE PINNED INSIDE 297mm A4) */}
      <div className="absolute bottom-[8mm] left-[14mm] right-[14mm]">
        <div className="flex justify-between items-end border-t border-slate-200 pt-3 mb-2">
          <div className="text-center w-[180px]">
            <div className="border-t border-slate-500 pt-1 text-xs font-bold text-slate-800">
              Customer Signature
            </div>
          </div>

          <div className="text-center w-[220px]">
            <div className="border-t border-slate-500 pt-1 text-xs font-black text-slate-900">
              Shop Owner Signature<br />
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mt-0.5">
                MANIKANDAN LATHE WORKS
              </span>
            </div>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-500 font-bold border-t border-slate-100 pt-1.5 uppercase">
          Tax Invoice Document • MANIKANDAN LATHE WORKS, Kallimandhayam - 624616, Dindigul District, Tamil Nadu
        </div>
      </div>
    </div>
  );
};
