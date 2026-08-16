import React from 'react';

interface InvoiceDocumentProps {
  order: any;
  id?: string;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ order, id = 'a4-invoice-paper' }) => {
  if (!order) return null;

  const qty = Number(order.quantity) || 1;
  const discount = Number(order.discount_amount || 0);
  const extraCharges = Number(order.extra_charges_amount || 0);

  // 1. Determine Unit Price & Base Subtotal
  let unitRate = Number(order.unit_price || 0);
  if (unitRate <= 0) {
    if (order.product?.admin_price) {
      unitRate = Number(order.product.admin_price);
    } else if (Number(order.total_amount) > 0) {
      unitRate = Math.round((Number(order.total_amount) + discount - extraCharges) / qty);
    } else {
      unitRate = 40000;
    }
  }

  const baseItemSubtotal = unitRate * qty;

  // 2. Determine Total Order Amount
  let total = Number(order.total_amount || 0);
  if (total <= 0) {
    if (order.pricing_type === 'weight' && order.weight_calculation) {
      total = Number(order.weight_calculation.grand_total || order.weight_calculation.weight_subtotal || 0);
    } else {
      total = Math.max(0, baseItemSubtotal - discount + extraCharges);
    }
  }

  // 3. Determine Paid and Remaining Due
  const totalPaidInHistory = Number(order.total_paid || 0);
  const explicitAdvance = Number(order.advance_amount || 0);

  let advancePaid = 0;
  if (totalPaidInHistory > 0) {
    advancePaid = totalPaidInHistory;
  } else if (order.remaining_amount != null && Number(order.remaining_amount) > 0 && Number(order.remaining_amount) < total) {
    advancePaid = Math.max(0, total - Number(order.remaining_amount));
  } else if (explicitAdvance > 0) {
    advancePaid = explicitAdvance;
  }

  let remaining = 0;
  if (totalPaidInHistory > 0) {
    remaining = Math.max(0, total - totalPaidInHistory);
  } else if (order.remaining_amount != null && Number(order.remaining_amount) > 0) {
    remaining = Number(order.remaining_amount);
  } else {
    remaining = Math.max(0, total - advancePaid);
  }

  const isFullyPaid = remaining === 0 && total > 0 && advancePaid >= total;
  const isPartiallyPaid = advancePaid > 0 && remaining > 0;
  const statusStampText = isFullyPaid ? 'PAID IN FULL' : isPartiallyPaid ? 'PARTIALLY PAID' : 'PAYMENT PENDING';
  const statusBadgeBg = isFullyPaid ? '#d1fae5' : isPartiallyPaid ? '#fef3c7' : '#fee2e2';
  const statusBadgeColor = isFullyPaid ? '#065f46' : isPartiallyPaid ? '#92400e' : '#991b1b';
  const statusBadgeBorder = isFullyPaid ? '#6ee7b7' : isPartiallyPaid ? '#fcd34d' : '#fca5a5';

  const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const rawInvoiceNo = (order.order_number || order.id || 'MNK-1001').toString();
  const invoiceNo = rawInvoiceNo.startsWith('#') ? rawInvoiceNo : `#${rawInvoiceNo}`;

  const isWeightBased = order.pricing_type === 'weight' ||
    (order.weight_calculation &&
     Array.isArray(order.weight_calculation.parts) &&
     order.weight_calculation.parts.some((p: any) => Number(p.weight_kg) > 0));

  return (
    <div
      id={id}
      style={{
        width: '210mm',
        minWidth: '210mm',
        maxWidth: '210mm',
        minHeight: '297mm',
        padding: '12mm 14mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif",
        fontSize: '14px',
        lineHeight: '1.4',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* HEADER SECTION: Left Brand & Right Tax Invoice Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #ea580c', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.png"
              alt="Manikandan Lathe Logo"
              style={{ width: '48px', height: '48px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#ea580c', letterSpacing: '-0.5px' }}>
                MANIKANDAN <span style={{ color: '#0f172a' }}>LATHE</span>
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 800, color: '#ea580c', letterSpacing: '1px', textTransform: 'uppercase' }}>
                WELDING WORKS & FABRICATION SHOP
              </p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#475569', lineHeight: '1.35' }}>
                Kallimandhayam - 624616, Dindigul District, Tamil Nadu<br />
                <strong>Phone:</strong> +91 96592 86268 | <strong>Email:</strong> manikandanlatheklm@gmail.com
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              TAX INVOICE
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: 800, color: '#ea580c', fontFamily: 'monospace' }}>
              Invoice No: {invoiceNo}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              Date: {orderDate}
            </p>
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#334155', textTransform: 'uppercase' }}>
                MODE: {order.is_pos || (order.admin_notes && order.admin_notes.includes('POS')) || String(order.order_number || '').includes('POS') ? 'POS SALE' : 'ONLINE ORDER'}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 10px', borderRadius: '12px', border: `1px solid ${statusBadgeBorder}`, backgroundColor: statusBadgeBg, color: statusBadgeColor, textTransform: 'uppercase' }}>
                {statusStampText}
              </span>
            </div>
          </div>
        </div>

        {/* SUPPLIER & CUSTOMER SECTION (FROM / BILL TO 50/50 GRID) */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          
          {/* Supplier Box */}
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              FROM (SUPPLIER)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>MANIKANDAN LATHE WORKS</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>Kallimandhayam - 624616</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Dindigul District, Tamil Nadu</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>Phone: +91 96592 86268</p>
          </div>

          {/* Customer Box */}
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', backgroundColor: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 900, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              BILL TO (CUSTOMER)
            </h3>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{order.customerName || order.customer_name || 'Customer'}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', fontWeight: 700, color: '#334155' }}>Phone: {order.customerPhone || order.customer_phone || '+91 96592 86268'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>Customer City: {order.customerAddress || order.delivery_location || 'Kallimandhayam'}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#047857' }}>
              Fulfillment Mode: Direct Workshop Counter Pickup Only (Kallimandhayam)
            </p>
          </div>

        </div>

        {/* ITEMIZATION TABLE */}
        {isWeightBased ? (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '6px 12px', border: '1px solid #cbd5e1', borderBottom: 'none', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b', letterSpacing: '0.5px' }}>
                FABRICATION ITEM: {order.productName || order.product_name || 'LATHE ITEM'} - WEIGHT BREAKDOWN (RATE: ₹{order.weight_calculation.rate_per_kg || 160}/KG)
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', fontFamily: 'monospace' }}>
                TOTAL WEIGHT: {order.weight_calculation.total_weight_kg || 0} KG
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '11px', textTransform: 'uppercase', fontWeight: 900 }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '8%', border: '1px solid #0f172a' }}>S.No</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', width: '46%', border: '1px solid #0f172a' }}>Product Item & Section Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', width: '16%', border: '1px solid #0f172a' }}>Weight (KG)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', width: '15%', border: '1px solid #0f172a' }}>Rate / KG</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', width: '15%', border: '1px solid #0f172a' }}>Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.weight_calculation.parts.map((p: any, idx: number) => {
                  const rate = order.weight_calculation.rate_per_kg || 160;
                  const cost = Math.round((Number(p.weight_kg) || 0) * rate);
                  const displayName = p.name ? p.name : `${order.productName || 'Fabrication Item'} Piece ${idx + 1}`;
                  return (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#64748b', border: '1px solid #e2e8f0' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f172a', border: '1px solid #e2e8f0' }}>{displayName}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontFamily: 'monospace', border: '1px solid #e2e8f0' }}>{p.weight_kg} kg</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#475569', border: '1px solid #e2e8f0' }}>₹{rate}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', border: '1px solid #e2e8f0' }}>₹{cost.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 900 }}>
                  <td colSpan={2} style={{ padding: '8px 12px', textAlign: 'right', color: '#1e293b', border: '1px solid #cbd5e1' }}>Base Weight Total:</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#0f172a', border: '1px solid #cbd5e1' }}>{order.weight_calculation.total_weight_kg || 0} kg</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b', border: '1px solid #cbd5e1' }}>-</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#c2410c', border: '1px solid #cbd5e1' }}>
                    ₹{(order.weight_calculation.weight_subtotal || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', fontSize: '11px', textTransform: 'uppercase', fontWeight: 900 }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '8%', border: '1px solid #0f172a' }}>S.No</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '48%', border: '1px solid #0f172a' }}>Product Item & Specifications</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '12%', border: '1px solid #0f172a' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '16%', border: '1px solid #0f172a' }}>Unit Rate (₹)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '16%', border: '1px solid #0f172a' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#64748b', border: '1px solid #e2e8f0' }}>1</td>
                <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>{order.productName || order.product_name || 'Custom Lathe Fabricated Item'}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                    {order.specifications || 'Heavy duty precision steel lathe turning & welding fabrication.'}
                  </p>
                </td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', border: '1px solid #e2e8f0' }}>{qty} Unit(s)</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#334155', border: '1px solid #e2e8f0' }}>₹{unitRate.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', border: '1px solid #e2e8f0' }}>₹{baseItemSubtotal.toLocaleString('en-IN')}</td>
              </tr>

              {discount > 0 && (
                <tr style={{ backgroundColor: '#fff1f2' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#be123c', border: '1px solid #e2e8f0' }}>2</td>
                  <td style={{ padding: '8px 12px', fontWeight: 800, color: '#9f1239', border: '1px solid #e2e8f0' }}>
                    Discount & Special Concession {order.discount_notes ? `(${order.discount_notes})` : ''}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#be123c', border: '1px solid #e2e8f0' }}>-</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#be123c', border: '1px solid #e2e8f0' }}>-₹{discount.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#be123c', border: '1px solid #e2e8f0' }}>-₹{discount.toLocaleString('en-IN')}</td>
                </tr>
              )}

              {extraCharges > 0 && (
                <tr style={{ backgroundColor: '#fffbeb' }}>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: '#92400e', border: '1px solid #e2e8f0' }}>{discount > 0 ? 3 : 2}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 800, color: '#78350f', border: '1px solid #e2e8f0' }}>
                    On-Site Fitting & Transport Add-ons
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#92400e', border: '1px solid #e2e8f0' }}>1</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#92400e', border: '1px solid #e2e8f0' }}>+₹{extraCharges.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#92400e', border: '1px solid #e2e8f0' }}>+₹{extraCharges.toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* FINANCIAL BREAKDOWN SUMMARY */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          
          {/* Note Box */}
          <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #ea580c', maxWidth: '340px', fontSize: '12px' }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
              Thank you for choosing Manikandan Lathe Works!
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
              Quality guaranteed steel welding & lathe fabrication engineered to customer specifications.
            </p>
          </div>

          {/* Totals Table */}
          <div style={{ width: '280px' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <tbody>
                {order.weight_calculation && order.pricing_type === 'weight' ? (
                  <>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px 0', color: '#475569' }}>Base Weight Amount:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>₹{(order.weight_calculation.weight_subtotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {Number(order.weight_calculation.extra_subtotal || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '4px 0', color: '#475569' }}>Extra Expenses Total:</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>₹{(order.weight_calculation.extra_subtotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </>
                ) : (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 0', color: '#475569' }}>Base Subtotal:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>₹{baseItemSubtotal.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                {discount > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 0', color: '#be123c' }}>Special Discount:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#be123c' }}>-₹{discount.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                {extraCharges > 0 && (
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px 0', color: '#92400e' }}>Extra Fitting / Transport:</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#92400e' }}>+₹{extraCharges.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #e2e8f0', fontWeight: 900 }}>
                  <td style={{ padding: '6px 0', color: '#0f172a', fontSize: '13px' }}>Grand Total Amount:</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a', fontFamily: 'monospace', fontSize: '14px' }}>₹{total.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 0', color: '#475569' }}>Advance / Paid:</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857' }}>₹{advancePaid.toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #ea580c', borderBottom: '2px solid #ea580c' }}>
                  <td style={{ padding: '8px 0', fontWeight: 900, fontSize: '14px', color: '#0f172a' }}>Balance Due:</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900, fontSize: '16px', color: '#ea580c', fontFamily: 'monospace' }}>₹{remaining.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* SIGNATURE & FOOTER SECTION */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div style={{ textAlign: 'center', width: '180px' }}>
            <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Customer Signature
            </div>
          </div>

          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ borderTop: '1px solid #64748b', paddingTop: '4px', fontSize: '12px', fontWeight: 900, color: '#0f172a' }}>
              Shop Owner Signature<br />
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                MANIKANDAN LATHE WORKS
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b', fontWeight: 700, borderTop: '1px solid #f1f5f9', paddingTop: '6px', textTransform: 'uppercase' }}>
          Tax Invoice Document • MANIKANDAN LATHE WORKS, Kallimandhayam - 624616, Dindigul District, Tamil Nadu
        </div>
      </div>
    </div>
  );
};
