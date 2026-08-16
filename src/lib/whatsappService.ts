// WhatsApp & SMS Automated Notification & Alert Helper Service for Manikandan Lathe Works

export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return '919659286268';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

export const formatSMSPhone = (phone?: string): string => {
  if (!phone) return '+919659286268';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  return cleaned;
};

export interface OrderNotificationData {
  id: string;
  order_number?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  productName?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  discount_notes?: string;
  extra_charges_amount?: number;
  pricing_type?: 'fixed' | 'weight' | 'sqft';
  weight_calculation?: any;
  sqft_calculation?: any;
  total_amount?: number;
  remaining_amount?: number;
  advance_amount?: number;
  status?: string;
  fabrication_stage?: string;
  expected_delivery_date?: string;
  specifications?: string;
  delivery_location?: string;
}

export interface EnquiryNotificationData {
  id: string;
  enquiry_number?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  productName?: string;
  product_name?: string;
  size_requirement?: string;
  custom_notes?: string;
  quoted_price?: number;
  total_amount?: number;
  advance_amount?: number;
}

/**
 * Builds an itemized price/weight breakdown string formatted for messaging
 */
export const buildItemizedBreakdownText = (order: OrderNotificationData, isSMS = false): string => {
  const isWeight = order.pricing_type === 'weight' || (order.weight_calculation && order.weight_calculation.parts && order.weight_calculation.parts.length > 0);

  if (isWeight && order.weight_calculation) {
    const wc = order.weight_calculation;
    const rate = wc.rate_per_kg || 160;
    const parts = wc.parts || [];
    const partsText = parts
      .filter((p: any) => Number(p.weight_kg) > 0)
      .map((p: any, idx: number) => `  ${idx + 1}. ${p.name || `Part ${idx + 1}`}: ${p.weight_kg}kg (@ ₹${rate}/kg)`)
      .join('\n');

    let extraText = '';
    if (wc.extra_charges && wc.extra_charges.length > 0) {
      extraText = '\n' + wc.extra_charges.map((e: any) => `  + Extra: ${e.description} (₹${e.amount})`).join('\n');
    }

    if (isSMS) {
      return `Weight Breakdown: Total ${wc.total_weight_kg || 0}kg @ Rs.${rate}/kg.`;
    }

    return (
      `⚖️ *Itemized Fabrication Breakdown:*\n` +
      `${partsText || `  Total Weight: ${wc.total_weight_kg || 0} kg`}\n` +
      `• Weight Subtotal: ₹${(wc.weight_subtotal || 0).toLocaleString('en-IN')}` +
      `${extraText}`
    );
  }

  // Fixed Price Breakdown
  const qty = Number(order.quantity) || 1;
  const total = Number(order.total_amount) || 0;
  const unitPrice = Number(order.unit_price) || (qty > 0 && total > 0 ? Math.round(total / qty) : 40000);
  const discount = Number(order.discount_amount) || 0;
  const extra = Number(order.extra_charges_amount) || 0;
  const subtotal = unitPrice * qty;

  if (isSMS) {
    return `Qty: ${qty} | Rate: Rs.${unitPrice.toLocaleString('en-IN')}${discount > 0 ? ` | Disc: -Rs.${discount}` : ''}`;
  }

  let text = `🏷️ *Itemized Order Details:*\n`;
  text += `• Rate: ₹${unitPrice.toLocaleString('en-IN')} x ${qty} Unit${qty > 1 ? 's' : ''}\n`;
  text += `• Subtotal: ₹${subtotal.toLocaleString('en-IN')}`;
  if (discount > 0) {
    text += `\n• Concession Discount: -₹${discount.toLocaleString('en-IN')}${order.discount_notes ? ` (${order.discount_notes})` : ''}`;
  }
  if (extra > 0) {
    text += `\n• Extra Charges / Fittings: +₹${extra.toLocaleString('en-IN')}`;
  }
  return text;
};

// ====================================================================
// 1. ORDER CONFIRMATION
// ====================================================================

export const sendOrderConfirmationWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';
  const total = Number(order.total_amount || 0);
  const remaining = Number(order.remaining_amount != null ? order.remaining_amount : total);
  const advance = Number(order.advance_amount || Math.max(0, total - remaining));
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;
  const breakdown = buildItemizedBreakdownText(order);

  const text = encodeURIComponent(
    `🙏 *வணக்கம் ${customer}! (MANIKANDAN LATHE WORKS)*\n\n` +
    `உங்கள் ஆர்டர் வெற்றிகரமாக உறுதி செய்யப்பட்டுள்ளது! ✅\n\n` +
    `📦 *Order No:* #${orderNo}\n` +
    `🛠️ *Item:* ${product}\n\n` +
    `${breakdown}\n\n` +
    `--------------------------------------\n` +
    `💰 *Grand Total Amount:* ₹${total.toLocaleString('en-IN')}\n` +
    `💳 *Advance Paid / Recorded:* ₹${advance.toLocaleString('en-IN')}\n` +
    `⚖️ *Remaining Balance Due:* ₹${remaining.toLocaleString('en-IN')}\n` +
    `🏬 *Pickup:* Workshop Counter, Kallimandhayam\n` +
    `--------------------------------------\n\n` +
    `📄 *Official Tax Invoice PDF & Receipt:* \n${invoiceUrl}\n\n` +
    `📞 தொடர்புக்கு: +91 96592 86268\n` +
    `*மணிகண்டன் லேத் ஒர்க்ஸ், கள்ளிமந்தையம்*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendOrderConfirmationSMS = (order: OrderNotificationData) => {
  const phone = formatSMSPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Lathe Item';
  const total = Number(order.total_amount || 0);
  const remaining = Number(order.remaining_amount != null ? order.remaining_amount : total);
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;

  const body = encodeURIComponent(
    `MANIKANDAN LATHE: Dear ${customer}, Order #${orderNo} (${product}) confirmed. Total: Rs.${total.toLocaleString('en-IN')}, Due: Rs.${remaining.toLocaleString('en-IN')}. View Invoice: ${invoiceUrl} Ph: 9659286268`
  );

  window.open(`sms:${phone}?body=${body}`, '_blank');
};

// ====================================================================
// 2. STATUS & FABRICATION MILESTONE UPDATE
// ====================================================================

export const sendStatusUpdateWhatsApp = (order: OrderNotificationData, newStatusLabel: string) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;
  const orderUrl = `${window.location.origin}/orders/${order.order_number || order.id}`;

  const statusProgressMap: Record<string, { label: string; progress: string; desc: string }> = {
    accepted: { label: '1. Order Accepted', progress: '[✓] 1. Accepted ── 2. Confirmed ── 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Order received & queued at workshop.' },
    pending: { label: '1. Order Accepted', progress: '[✓] 1. Accepted ── 2. Confirmed ── 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Order received & queued at workshop.' },
    order_confirmed: { label: '2. Confirmed & Locked', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Advance received & fabrication specs finalized.' },
    confirmed: { label: '2. Confirmed & Locked', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Advance received & fabrication specs finalized.' },
    processing: { label: '3. Fabrication in Progress', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── [▶] 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Precision lathe machining & ARC welding underway.' },
    fabrication: { label: '3. Fabrication in Progress', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── [▶] 3. Fabrication ── 4. Ready ── 5. Delivered', desc: 'Precision lathe machining & ARC welding underway.' },
    ready: { label: '4. Ready for Workshop Pickup', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── [✓] 3. Fabrication ── [★] 4. READY ── 5. Delivered', desc: 'Fabrication completed & quality inspected. Ready for customer pickup!' },
    out_for_delivery: { label: '4. Out for Delivery / Dispatch', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── [✓] 3. Fabrication ── [★] 4. Dispatch ── 5. Delivered', desc: 'Dispatched for direct delivery or counter pickup.' },
    delivered: { label: '5. Order Delivered', progress: '[✓] 1. Accepted ── [✓] 2. Confirmed ── [✓] 3. Fabrication ── [✓] 4. Ready ── [✓] 5. DELIVERED', desc: 'Successfully handed over to customer. Thank you!' },
    cancelled: { label: 'Order Cancelled', progress: '[X] Order Cancelled', desc: 'Order has been cancelled.' }
  };

  const key = newStatusLabel.toLowerCase().replace(/ /g, '_');
  const stageInfo = statusProgressMap[key] || {
    label: newStatusLabel.toUpperCase(),
    progress: `Stage: ${newStatusLabel}`,
    desc: 'Work status has been updated.'
  };

  const text = encodeURIComponent(
    `🔔 *Fabrication Stage Update — MANIKANDAN LATHE WORKS*\n\n` +
    `வணக்கம் ${customer},\n` +
    `உங்கள் ஆர்டர் *#${orderNo}* (${product}) நிலை புதுப்பிக்கப்பட்டுள்ளது:\n\n` +
    `📌 *Current Stage:* *${stageInfo.label}*\n` +
    `⚙️ *Status Note:* ${stageInfo.desc}\n\n` +
    `📊 *Milestone Track:*\n` +
    `${stageInfo.progress}\n\n` +
    `🏬 *Workshop Location:* K. Keeranur Road, Kallimandhayam - 624616\n\n` +
    `📱 *Live Order Tracking:* \n${orderUrl}\n\n` +
    `📄 *Tax Invoice PDF:* \n${invoiceUrl}\n\n` +
    `Need assistance? Call +91 96592 86268\n` +
    `*மணிகண்டன் லேத் ஒர்க்ஸ்*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendStatusUpdateSMS = (order: OrderNotificationData, statusLabel: string) => {
  const phone = formatSMSPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Lathe Item';
  const orderUrl = `${window.location.origin}/orders/${order.order_number || order.id}`;

  const body = encodeURIComponent(
    `MANIKANDAN LATHE: Dear ${customer}, Order #${orderNo} (${product}) status updated to: ${statusLabel.toUpperCase()}. Track live: ${orderUrl} Ph: 9659286268`
  );

  window.open(`sms:${phone}?body=${body}`, '_blank');
};

// ====================================================================
// 3. OFFICIAL TAX INVOICE LINK
// ====================================================================

export const sendInvoiceLinkWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const total = Number(order.total_amount || 0);
  const balance = Number(order.remaining_amount != null ? order.remaining_amount : total);
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;
  const breakdown = buildItemizedBreakdownText(order);

  const text = encodeURIComponent(
    `🧾 *Official Tax Invoice Document — MANIKANDAN LATHE WORKS*\n\n` +
    `Dear ${customer},\n` +
    `Here is your official A4 Tax Invoice document for Order *#${orderNo}*.\n\n` +
    `${breakdown}\n\n` +
    `💰 *Grand Total:* ₹${total.toLocaleString('en-IN')}\n` +
    `⚖️ *Balance Due:* ₹${balance.toLocaleString('en-IN')}\n\n` +
    `👇 Click link below to view, print or download PDF:\n` +
    `${invoiceUrl}\n\n` +
    `Thank you for choosing Manikandan Lathe Works!\n` +
    `*K. Keeranur Road, Kallimandhayam - 624616*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// ====================================================================
// 4. PAYMENT RECEIPT & BALANCE CONFIRMATION
// ====================================================================

export const sendPaymentReceiptWhatsApp = (order: OrderNotificationData, paidAmount: number, paymentMode = 'Counter Payment') => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const total = Number(order.total_amount || 0);
  const remaining = Math.max(0, (Number(order.remaining_amount) || 0) - paidAmount);
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;

  const text = encodeURIComponent(
    `✅ *Payment Received & Acknowledged — MANIKANDAN LATHE WORKS*\n\n` +
    `Dear ${customer},\n` +
    `We have received your payment of *₹${paidAmount.toLocaleString('en-IN')}* for Order *#${orderNo}*.\n\n` +
    `--------------------------------------\n` +
    `💵 *Payment Amount:* ₹${paidAmount.toLocaleString('en-IN')}\n` +
    `💳 *Payment Mode:* ${paymentMode}\n` +
    `💰 *Total Order Value:* ₹${total.toLocaleString('en-IN')}\n` +
    `⚖️ *Remaining Balance Due:* ₹${remaining.toLocaleString('en-IN')}\n` +
    `--------------------------------------\n\n` +
    `📄 *Updated Tax Invoice & Payment Ledger:* \n${invoiceUrl}\n\n` +
    `Thank you!\n` +
    `*Manikandan Lathe Works, Kallimandhayam*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// ====================================================================
// 5. ADVANCE OR PENDING BALANCE PAYMENT REQUEST
// ====================================================================

export const sendPaymentReminderWhatsApp = (order: OrderNotificationData, requestedAmount: number) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const orderUrl = `${window.location.origin}/orders/${order.order_number || order.id}`;
  const invoiceUrl = `${window.location.origin}/invoice/${order.order_number || order.id}`;
  const total = Number(order.total_amount || 0);

  const text = encodeURIComponent(
    `🔔 *Payment Request — MANIKANDAN LATHE WORKS*\n\n` +
    `Dear ${customer},\n` +
    `An advance / payment of *₹${requestedAmount.toLocaleString('en-IN')}* has been requested for Order *#${orderNo}* (Total: ₹${total.toLocaleString('en-IN')}).\n\n` +
    `💳 *Pay Securely Online via UPI / Razorpay / Net Banking:*\n` +
    `${orderUrl}\n\n` +
    `📄 *View Tax Invoice:* \n${invoiceUrl}\n\n` +
    `Thank you!\n` +
    `*Manikandan Lathe Works*\n` +
    `Phone: +91 96592 86268`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendPaymentReminderSMS = (order: OrderNotificationData, requestedAmount: number) => {
  const phone = formatSMSPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const orderUrl = `${window.location.origin}/orders/${order.order_number || order.id}`;

  const body = encodeURIComponent(
    `MANIKANDAN LATHE: Dear ${customer}, payment of Rs.${requestedAmount.toLocaleString('en-IN')} requested for Order #${orderNo}. Pay online: ${orderUrl} Ph: 9659286268`
  );

  window.open(`sms:${phone}?body=${body}`, '_blank');
};

// ====================================================================
// 6. CUSTOM PRICE QUOTE READY (FOR ENQUIRIES)
// ====================================================================

export const sendQuoteReadyWhatsApp = (enquiry: EnquiryNotificationData) => {
  const phone = formatWhatsAppPhone(enquiry.customerPhone || enquiry.customer_phone);
  const enquiryNo = enquiry.enquiry_number || enquiry.id;
  const customer = enquiry.customerName || enquiry.customer_name || 'Customer';
  const product = enquiry.productName || enquiry.product_name || 'Custom Fabrication Work';
  const quotePrice = Number(enquiry.quoted_price || enquiry.total_amount || 0);
  const advance = Number(enquiry.advance_amount || Math.round(quotePrice * 0.3));

  const text = encodeURIComponent(
    `📋 *Custom Price Quote Ready — MANIKANDAN LATHE WORKS*\n\n` +
    `வணக்கம் ${customer},\n` +
    `உங்கள் கோரிக்கை *#${enquiryNo}* (${product}) க்கான பிரத்யேக விலை நிர்ணயிக்கப்பட்டுள்ளது:\n\n` +
    `💰 *Quoted Fabrication Price:* *₹${quotePrice.toLocaleString('en-IN')}*\n` +
    `💳 *Required Advance Deposit:* ₹${advance.toLocaleString('en-IN')}\n\n` +
    `${enquiry.size_requirement ? `📐 *Specifications:* ${enquiry.size_requirement}\n\n` : ''}` +
    `Please contact us at +91 96592 86268 or reply to this message to confirm your order.\n\n` +
    `*மணிகண்டன் லேத் ஒர்க்ஸ், கள்ளிமந்தையம்*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendQuoteReadySMS = (enquiry: EnquiryNotificationData) => {
  const phone = formatSMSPhone(enquiry.customerPhone || enquiry.customer_phone);
  const enquiryNo = enquiry.enquiry_number || enquiry.id;
  const customer = enquiry.customerName || enquiry.customer_name || 'Customer';
  const product = enquiry.productName || enquiry.product_name || 'Fabrication Work';
  const quotePrice = Number(enquiry.quoted_price || enquiry.total_amount || 0);

  const body = encodeURIComponent(
    `MANIKANDAN LATHE: Dear ${customer}, Quote ready for Enquiry #${enquiryNo} (${product}): Rs.${quotePrice.toLocaleString('en-IN')}. Call 9659286268 to confirm.`
  );

  window.open(`sms:${phone}?body=${body}`, '_blank');
};

// ====================================================================
// 7. POS COUNTER INSTANT BILL RECEIPT
// ====================================================================

export const sendPosReceiptWhatsApp = (posOrder: any) => {
  const phone = formatWhatsAppPhone(posOrder.customer_phone || posOrder.customerPhone);
  const billNo = posOrder.order_number || posOrder.id;
  const customer = posOrder.customer_name || posOrder.customerName || 'Customer';
  const product = posOrder.product_name || posOrder.productName || 'Lathe Workshop Item';
  const total = Number(posOrder.total_amount || 0);
  const invoiceUrl = `${window.location.origin}/invoice/${posOrder.order_number || posOrder.id}`;

  const text = encodeURIComponent(
    `🧾 *Workshop POS Counter Receipt — MANIKANDAN LATHE WORKS*\n\n` +
    `Dear ${customer},\n` +
    `Thank you for your purchase at our workshop counter!\n\n` +
    `📋 *Bill No:* #${billNo}\n` +
    `🛠️ *Item:* ${product}\n` +
    `💰 *Total Amount Paid:* ₹${total.toLocaleString('en-IN')} (PAID IN FULL)\n\n` +
    `📄 *View & Download Tax Invoice / POS Receipt:* \n${invoiceUrl}\n\n` +
    `Visit us again at K. Keeranur Road, Kallimandhayam - 624616!\n` +
    `*Manikandan Lathe Works*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};
