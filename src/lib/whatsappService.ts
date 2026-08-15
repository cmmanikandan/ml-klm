// WhatsApp Notification Helper Service for Manikandan Lathe Shop

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

export const sendOrderConfirmationWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';
  const total = order.total_amount || 0;
  const advance = order.advance_amount || (total - (order.remaining_amount || 0));

  const text = encodeURIComponent(
    `🙏 *வணக்கம் ${customer}! (Manikandan Lathe Works)*\n\n` +
    `உங்கள் ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது! ✅\n\n` +
    `📦 *Order No:* #${orderNo}\n` +
    `🛠️ *Item:* ${product}\n` +
    `💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}\n` +
    `💳 *Advance Paid:* ₹${advance.toLocaleString('en-IN')}\n` +
    `📅 *Expected Delivery:* ${order.expected_delivery_date || 'Within 7 Days'}\n\n` +
    `📄 *Tax Invoice Link:* ${window.location.origin}/invoice/${order.id}\n\n` +
    `தொடர்புக்கு: +91 96592 86268\n` +
    `நன்றி!`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendStatusUpdateWhatsApp = (order: OrderNotificationData, newStatusLabel: string) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const product = order.productName || order.product_name || 'Custom Lathe Fabricated Item';

  const text = encodeURIComponent(
    `🔔 *Order Status Update — Manikandan Lathe Works*\n\n` +
    `வணக்கம் ${customer},\n` +
    `உங்கள் ஆர்டர் #${orderNo} (${product}) நிலை மாற்றப்பட்டுள்ளது:\n\n` +
    `📌 *Current Status:* *${newStatusLabel.toUpperCase()}*\n` +
    `📅 *Expected Delivery:* ${order.expected_delivery_date || 'As scheduled'}\n\n` +
    `📄 *View Invoice:* ${window.location.origin}/invoice/${order.id}\n\n` +
    `Call/WhatsApp: +91 96592 86268`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendInvoiceLinkWhatsApp = (order: OrderNotificationData) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const total = order.total_amount || 0;
  const balance = order.remaining_amount || 0;

  const text = encodeURIComponent(
    `🧾 *Tax Invoice Document — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `Here is your official A4 Tax Invoice for Order #${orderNo}.\n\n` +
    `💰 Total Amount: ₹${total.toLocaleString('en-IN')}\n` +
    `⚖️ Balance Due: ₹${balance.toLocaleString('en-IN')}\n\n` +
    `👇 Click link below to view, print, or download PDF:\n` +
    `${window.location.origin}/invoice/${order.id}\n\n` +
    `Thank you!`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};

export const sendPaymentReceiptWhatsApp = (order: OrderNotificationData, paidAmount: number) => {
  const phone = formatWhatsAppPhone(order.customerPhone || order.customer_phone);
  const orderNo = order.order_number || order.id;
  const customer = order.customerName || order.customer_name || 'Customer';
  const remaining = Math.max(0, (order.remaining_amount || 0) - paidAmount);

  const text = encodeURIComponent(
    `✅ *Payment Received — Manikandan Lathe Works*\n\n` +
    `Dear ${customer},\n` +
    `We received your payment of *₹${paidAmount.toLocaleString('en-IN')}* for Order #${orderNo}.\n\n` +
    `⚖️ Remaining Balance: ₹${remaining.toLocaleString('en-IN')}\n\n` +
    `📄 Updated Invoice: ${window.location.origin}/invoice/${order.id}\n\n` +
    `Thank you!`
  );

  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
};
