// WhatsApp Automated Notification & Alert Helper Service for Manikandan Lathe Works

export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return '919659286268';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
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
  total_amount?: number;
  remaining_amount?: number;
  advance_amount?: number;
  status?: string;
  expected_delivery_date?: string;
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
  quoted_price?: number;
  total_amount?: number;
}

// 1. Order Confirmation WhatsApp Alert
export const sendOrderConfirmationWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';
  const total = Number(order.total_amount || 0);
  const remaining = Number(order.remaining_amount != null ? order.remaining_amount : total);
  const advance = Number(order.advance_amount || Math.max(0, total - remaining));
  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;

  const text = encodeURIComponent(
    `🙏 *வணக்கம் ${customer}! (மணிகண்டன் லேத் ஒர்க்ஸ்)*\n\n` +
    `உங்கள் ஆர்டர் வெற்றிகரமாக உறுதி செய்யப்பட்டுள்ளது! ✅\n\n` +
    `📦 *Order No:* #${orderNo}\n` +
    `🛠️ *Item:* ${product}\n` +
    `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}\n` +
    `💳 *Advance Paid:* ₹${advance.toLocaleString('en-IN')}\n` +
    `⚖️ *Balance Due:* ₹${remaining.toLocaleString('en-IN')}\n` +
    `🏬 *Fulfillment:* Direct Workshop Counter Pickup (Kallimandhayam)\n\n` +
    `📄 *Official Tax Invoice & PDF Download:* \n${invoiceUrl}\n\n` +
    `📞 தொடர்புக்கு: +91 96592 86268\n` +
    `*மணிகண்டன் லேத் ஒர்க்ஸ், கள்ளிமந்தையம்*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 2. Status & Fabrication Milestone Update Alert
export const sendStatusUpdateWhatsApp = (order: OrderNotificationData, newStatusLabel: string) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';
  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
  const orderUrl = `${window.location.origin}/orders/${order.id}`;

  const statusDescriptions: Record<string, string> = {
    pending: '1. Order Accepted / ஆர்டர் ஏற்றுக்கொள்ளப்பட்டது',
    confirmed: '2. Confirmed & Specs Locked / முன்பணம் & விவரங்கள் உறுதி செய்யப்பட்டது',
    processing: '3. Workshop Fabrication in Progress / லேத் பணி & வெல்டிங் வேலை நடக்கிறது',
    fabrication: '3. Workshop Fabrication in Progress / லேத் பணி & வெல்டிங் வேலை நடக்கிறது',
    ready: '4. Ready for Workshop Pickup / ஆர்டர் தயார் - வொர்க்ஷாப் வந்து பெற்றுக்கொள்ளலாம்',
    delivered: '5. Order Delivered / வெற்றிகரமாக வழங்கப்பட்டது',
    cancelled: 'Cancelled / ரத்து செய்யப்பட்டது'
  };

  const currentStageText = statusDescriptions[newStatusLabel.toLowerCase()] || newStatusLabel.toUpperCase();

  const text = encodeURIComponent(
    `🔔 *Fabrication Status Update — Manikandan Lathe Works*\n\n` +
    `வணக்கம் ${customer},\n` +
    `உங்கள் ஆர்டர் *#${orderNo}* (${product}) நிலை புதுப்பிக்கப்பட்டுள்ளது:\n\n` +
    `📌 *Current Stage:* *${currentStageText}*\n` +
    `🏬 *Workshop Location:* Kallimandhayam, Dindigul Dist\n\n` +
    `📱 *Track Order & Specs:* \n${orderUrl}\n\n` +
    `📄 *View Tax Invoice:* \n${invoiceUrl}\n\n` +
    `Need help? Call +91 96592 86268\n` +
    `*Manikandan Lathe Works*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 3. Official Tax Invoice Link Alert
export const sendInvoiceLinkWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const total = Number(order.total_amount || 0);
  const balance = Number(order.remaining_amount != null ? order.remaining_amount : total);
  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;

  const text = encodeURIComponent(
    `🧾 *Official Tax Invoice — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `Here is your official A4 Tax Invoice document for Order *#${orderNo}*.\n\n` +
    `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}\n` +
    `⚖️ *Balance Due:* ₹${balance.toLocaleString('en-IN')}\n\n` +
    `👇 Click link below to view, print, or download PDF Invoice:\n` +
    `${invoiceUrl}\n\n` +
    `Thank you for your business!\n` +
    `*Manikandan Lathe Works, Kallimandhayam*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 4. Payment Receipt & Balance Confirmation
export const sendPaymentReceiptWhatsApp = (order: OrderNotificationData, paidAmount: number) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const total = Number(order.total_amount || 0);
  const remaining = Math.max(0, (order.remaining_amount || 0) - paidAmount);
  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;

  const text = encodeURIComponent(
    `✅ *Payment Received — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `We have received your payment of *₹${paidAmount.toLocaleString('en-IN')}* for Order *#${orderNo}*.\n\n` +
    `💰 *Total Order Price:* ₹${total.toLocaleString('en-IN')}\n` +
    `💳 *Amount Paid Just Now:* ₹${paidAmount.toLocaleString('en-IN')}\n` +
    `⚖️ *Remaining Balance Due:* ₹${remaining.toLocaleString('en-IN')}\n\n` +
    `📄 *Updated Tax Invoice:* \n${invoiceUrl}\n\n` +
    `Thank you!\n` +
    `*Manikandan Lathe Works*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 5. Advance or Pending Balance Payment Request Alert
export const sendPaymentReminderWhatsApp = (order: OrderNotificationData, requestedAmount: number) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const orderUrl = `${window.location.origin}/orders/${order.id}`;
  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;

  const text = encodeURIComponent(
    `🔔 *Payment Request — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `An advance / payment of *₹${requestedAmount.toLocaleString('en-IN')}* has been requested for Order *#${orderNo}*.\n\n` +
    `💳 *Pay Securely Online via UPI / Razorpay:* \n${orderUrl}\n\n` +
    `📄 *View Order Tax Invoice:* \n${invoiceUrl}\n\n` +
    `Thank you!\n` +
    `*Manikandan Lathe Works*\n` +
    `Phone: +91 96592 86268`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 6. Custom Price Quote Ready Alert (for Enquiries)
export const sendQuoteReadyWhatsApp = (enquiry: EnquiryNotificationData) => {
  const phone = formatWhatsAppPhone(enquiry.customerPhone || enquiry.customer_phone);
  const enquiryNo = enquiry.enquiry_number || enquiry.id;
  const customer = enquiry.customerName || enquiry.customer_name || 'Customer';
  const product = enquiry.productName || enquiry.product_name || 'Custom Fabrication Work';
  const quotePrice = Number(enquiry.quoted_price || enquiry.total_amount || 0);

  const text = encodeURIComponent(
    `📋 *Custom Price Quote Ready — Manikandan Lathe Works*\n\n` +
    `வணக்கம் ${customer},\n` +
    `உங்கள் கோரிக்கை *#${enquiryNo}* (${product}) க்கான விலை நிர்ணயிக்கப்பட்டுள்ளது:\n\n` +
    `💰 *Quoted Fabrication Price:* *₹${quotePrice.toLocaleString('en-IN')}*\n\n` +
    `Please contact us at +91 96592 86268 or reply here to confirm your order.\n\n` +
    `*மணிகண்டன் லேத் ஒர்க்ஸ், கள்ளிமந்தையம்*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

// 7. POS Counter Instant Bill Receipt Alert
export const sendPosReceiptWhatsApp = (posOrder: any) => {
  const phone = formatWhatsAppPhone(posOrder.customer_phone || posOrder.customerPhone);
  const billNo = posOrder.order_number || posOrder.id;
  const customer = posOrder.customer_name || posOrder.customerName || 'Customer';
  const product = posOrder.product_name || posOrder.productName || 'Lathe Workshop Item';
  const total = Number(posOrder.total_amount || 0);
  const invoiceUrl = `${window.location.origin}/invoice/${posOrder.order_number || posOrder.id}`;

  const text = encodeURIComponent(
    `🧾 *Workshop POS Counter Receipt — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `Thank you for your purchase at our counter!\n\n` +
    `📋 *Bill No:* #${billNo}\n` +
    `🛠️ *Item:* ${product}\n` +
    `💰 *Total Amount Paid:* ₹${total.toLocaleString('en-IN')} (PAID IN FULL)\n\n` +
    `📄 *View & Download Tax Invoice / POS Receipt:* \n${invoiceUrl}\n\n` +
    `*Manikandan Lathe Works, Kallimandhayam*`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};
