import React from 'react';

interface ThermalReceiptDocumentProps {
  order: any;
  id?: string;
}

export const ThermalReceiptDocument: React.FC<ThermalReceiptDocumentProps> = ({ order, id = 'thermal-receipt-paper' }) => {
  if (!order) return null;

  const qty = Number(order.quantity) || 1;
  const discount = Number(order.discount_amount || (order.weight_calculation?.discount) || 0);
  const extraCharges = Number(order.extra_charges_amount || (order.weight_calculation?.extra_subtotal) || 0);

  // 1. Determine Unit Rate & Subtotal
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
  const baseSubtotal = unitRate * qty;

  // 2. Determine Total Order Price
  let total = Number(order.total_amount || 0);
  if (total <= 0) {
    if (order.pricing_type === 'weight' && order.weight_calculation) {
      total = Number(order.weight_calculation.grand_total || order.weight_calculation.weight_subtotal || 0);
    } else {
      total = Math.max(0, baseSubtotal - discount + extraCharges);
    }
  }

  // 3. Determine Paid and Remaining Amount
  const totalPaidHistory = Number(order.total_paid || 0);
  let paid = 0;
  if (totalPaidHistory > 0) {
    paid = totalPaidHistory;
  } else if (order.remaining_amount != null && Number(order.remaining_amount) > 0 && Number(order.remaining_amount) < total) {
    paid = Math.max(0, total - Number(order.remaining_amount));
  } else if (Number(order.advance_amount) > 0) {
    paid = Number(order.advance_amount);
  } else if (order.is_pos) {
    paid = total;
  }

  let remaining = 0;
  if (totalPaidHistory > 0) {
    remaining = Math.max(0, total - totalPaidHistory);
  } else if (order.remaining_amount != null && Number(order.remaining_amount) >= 0) {
    remaining = Number(order.remaining_amount);
  } else {
    remaining = Math.max(0, total - paid);
  }

  const isFullyPaid = remaining === 0 && total > 0;

  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) 
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const rawNo = (order.order_number || order.id || 'MNK-POS-1').toString();
  const billNo = rawNo.startsWith('#') ? rawNo : `#${rawNo}`;

  const isWeightBased = order.pricing_type === 'weight' ||
    (order.weight_calculation &&
     Array.isArray(order.weight_calculation.parts) &&
     order.weight_calculation.parts.some((p: any) => Number(p.weight_kg) > 0));

  return (
    <div
      id={id}
      className="bg-white text-black mx-auto p-3 font-mono text-xs leading-tight shadow-md overflow-hidden box-border"
      style={{
        width: '80mm',
        minWidth: '80mm',
        maxWidth: '80mm',
        fontFamily: "'Courier New', Courier, monospace",
        boxSizing: 'border-box'
      }}
    >
      {/* SHOP HEADER */}
      <div className="text-center space-y-1 pb-2 border-b-2 border-black border-dashed">
        <h2 className="text-sm font-black uppercase tracking-wider">MANIKANDAN LATHE WORKS</h2>
        <p className="text-[10px] font-bold uppercase">Welding & Fabrication Shop</p>
        <p className="text-[10px]">Kallimandhayam, Dindigul - 624616</p>
        <p className="text-[10px] font-bold">Ph: +91 96592 86268</p>
      </div>

      {/* RECEIPT METADATA */}
      <div className="py-2 border-b border-black border-dashed space-y-0.5 text-[11px]">
        <div className="flex justify-between font-bold">
          <span>BILL NO: {billNo}</span>
          <span>{isFullyPaid ? '[PAID IN FULL]' : '[PAYMENT DUE]'}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-700">
          <span>DATE: {orderDate}</span>
          <span className="font-black">MODE: {order.is_pos || (order.admin_notes && order.admin_notes.includes('POS')) || String(order.order_number || '').includes('POS') ? 'POS SALE' : 'ONLINE ORDER'}</span>
        </div>
        <div className="pt-1">
          <span className="font-bold">CUST: </span>
          <span>{order.customerName || order.customer_name || 'Walk-in Customer'}</span>
          {(order.customerPhone || order.customer_phone) && <span className="block text-[10px]">MOB: {order.customerPhone || order.customer_phone}</span>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="py-2 border-b-2 border-black border-dashed space-y-2">
        <div className="flex justify-between text-[10px] font-black border-b border-black border-dotted pb-1">
          <span className="w-1/2">ITEM / DETAILS</span>
          <span className="w-1/4 text-center">QTY/WT</span>
          <span className="w-1/4 text-right">TOTAL</span>
        </div>

        {isWeightBased && order.weight_calculation ? (
          <div className="space-y-1 text-[11px]">
            <p className="font-bold uppercase text-[10px]">
              {order.productName || order.product_name || 'FABRICATION ITEM'} (@ ₹{order.weight_calculation.rate_per_kg || 160}/kg)
            </p>
            {order.weight_calculation.parts.map((p: any, idx: number) => {
              const r = order.weight_calculation.rate_per_kg || 160;
              const cost = Math.round((Number(p.weight_kg) || 0) * r);
              const pName = p.name || `Piece ${idx + 1}`;
              return (
                <div key={idx} className="flex justify-between items-center text-[10px]">
                  <span className="w-1/2 truncate pl-1">- {pName}</span>
                  <span className="w-1/4 text-center font-bold">{p.weight_kg}kg</span>
                  <span className="w-1/4 text-right font-bold">₹{cost.toLocaleString('en-IN')}</span>
                </div>
              );
            })}

            {order.weight_calculation.extra_charges && order.weight_calculation.extra_charges.length > 0 && (
              <div className="pt-1 border-t border-black border-dotted space-y-0.5">
                <span className="text-[9px] font-bold uppercase block">EXTRA CHARGES:</span>
                {order.weight_calculation.extra_charges.map((ext: any, eIdx: number) => (
                  <div key={eIdx} className="flex justify-between text-[10px]">
                    <span className="w-2/3 truncate pl-1">+ {ext.description}</span>
                    <span className="w-1/3 text-right font-bold">₹{Number(ext.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-start font-bold">
              <span className="w-1/2 uppercase text-[10px] leading-tight">
                {order.productName || order.product_name || '7 KALLAPAI'}
              </span>
              <span className="w-1/4 text-center font-bold text-[10px]">
                {qty} {qty === 1 ? 'Unit' : 'Units'}
              </span>
              <span className="w-1/4 text-right font-bold font-mono">
                ₹{baseSubtotal.toLocaleString('en-IN')}
              </span>
            </div>
            {unitRate > 0 && qty > 1 && (
              <div className="text-[9px] text-gray-700 pl-1">
                Rate: @ ₹{unitRate.toLocaleString('en-IN')} / Unit
              </div>
            )}
            {extraCharges > 0 && (
              <div className="flex justify-between text-[10px] text-gray-800">
                <span className="pl-1">+ Extra Charges:</span>
                <span className="font-bold">₹{extraCharges.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOTALS & PAYMENT SUMMARY */}
      <div className="py-2 border-b-2 border-black border-dashed space-y-1 text-xs font-bold">
        {discount > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>DISCOUNT:</span>
            <span>- ₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-black pt-0.5">
          <span>GRAND TOTAL:</span>
          <span>₹{total.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex justify-between text-[11px] pt-1">
          <span>AMOUNT PAID:</span>
          <span>₹{paid.toLocaleString('en-IN')}</span>
        </div>

        {remaining > 0 ? (
          <div className="flex justify-between text-xs font-black text-black border-t border-black pt-1">
            <span>BALANCE DUE:</span>
            <span>₹{remaining.toLocaleString('en-IN')}</span>
          </div>
        ) : (
          <div className="text-center pt-1 text-[10px] font-black uppercase tracking-wider">
            *** PAID IN FULL ***
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="pt-3 text-center space-y-1">
        <p className="text-[10px] font-black uppercase">THANK YOU FOR YOUR VISIT!</p>
        <p className="text-[9px]">MANIKANDAN LATHE • Kallimandhayam - 624616</p>
      </div>
    </div>
  );
};
