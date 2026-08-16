import React from 'react';

interface ThermalReceiptDocumentProps {
  order: any;
  id?: string;
}

export const ThermalReceiptDocument: React.FC<ThermalReceiptDocumentProps> = ({ order, id = 'thermal-receipt-paper' }) => {
  if (!order) return null;

  const total = Number(order.total_amount || 0);
  const paid = Number(order.advance_amount || order.total_amount || 0);
  const remaining = Number(order.remaining_amount || 0);
  const isFullyPaid = remaining === 0;

  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) 
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const rawNo = (order.order_number || order.id || 'MNK-POS-1').toString();
  const billNo = rawNo.startsWith('#') ? rawNo : `#${rawNo}`;

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
          <span>{isFullyPaid ? '[PAID]' : '[DUE]'}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-700">
          <span>DATE: {orderDate}</span>
          <span className="font-black">MODE: {order.is_pos || (order.admin_notes && order.admin_notes.includes('POS')) || String(order.order_number || '').includes('POS') ? 'POS' : 'ONLINE'}</span>
        </div>
        <div className="pt-1">
          <span className="font-bold">CUST: </span>
          <span>{order.customerName || 'Walk-in Customer'}</span>
          {order.customerPhone && <span className="block text-[10px]">MOB: {order.customerPhone}</span>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="py-2 border-b-2 border-black border-dashed space-y-2">
        <div className="flex justify-between text-[10px] font-black border-b border-black border-dotted pb-1">
          <span className="w-1/2">ITEM / DETAILS</span>
          <span className="w-1/4 text-center">QTY/WT</span>
          <span className="w-1/4 text-right">TOTAL</span>
        </div>

        {order.weight_calculation && order.weight_calculation.parts ? (
          <div className="space-y-1 text-[11px]">
            <p className="font-bold uppercase text-[10px]">
              {order.productName || 'FABRICATION ITEM'} (@ ₹{order.weight_calculation.rate_per_kg}/kg)
            </p>
            {order.weight_calculation.parts.map((p: any, idx: number) => {
              const r = order.weight_calculation.rate_per_kg || 160;
              const cost = Math.round((Number(p.weight_kg) || 0) * r);
              const pName = p.name || `Piece ${idx + 1}`;
              return (
                <div key={idx} className="flex justify-between items-center text-[10px]">
                  <span className="w-1/2 truncate pl-1">- {pName}</span>
                  <span className="w-1/4 text-center font-bold">{p.weight_kg}kg</span>
                  <span className="w-1/4 text-right font-bold">₹{cost}</span>
                </div>
              );
            })}

            {order.weight_calculation.extra_charges && order.weight_calculation.extra_charges.length > 0 && (
              <div className="pt-1 border-t border-black border-dotted space-y-0.5">
                <span className="text-[9px] font-bold uppercase block">EXTRA CHARGES:</span>
                {order.weight_calculation.extra_charges.map((ext: any, eIdx: number) => (
                  <div key={eIdx} className="flex justify-between text-[10px]">
                    <span className="w-2/3 truncate pl-1">+ {ext.description}</span>
                    <span className="w-1/3 text-right font-bold">₹{ext.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between text-[11px]">
            <span className="w-1/2 font-bold truncate">{order.productName || 'Lathe Item'}</span>
            <span className="w-1/4 text-center font-bold">{order.quantity || 1}</span>
            <span className="w-1/4 text-right font-bold">₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      {/* TOTALS & PAYMENT SUMMARY */}
      <div className="py-2 border-b-2 border-black border-dashed space-y-1 text-xs font-bold">
        {order.weight_calculation?.discount > 0 && (
          <div className="flex justify-between text-[11px]">
            <span>DISCOUNT:</span>
            <span>- ₹{order.weight_calculation.discount}</span>
          </div>
        )}

        <div className="flex justify-between text-sm font-black pt-0.5">
          <span>GRAND TOTAL:</span>
          <span>₹{(order.total_amount || 0).toLocaleString('en-IN')}</span>
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
          <div className="text-center pt-1 text-[10px] font-black uppercase">
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
