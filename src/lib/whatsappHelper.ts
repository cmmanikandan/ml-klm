import { DEFAULT_SHOP_INFO } from './supabase';

/**
 * Normalizes phone number into WhatsApp format (e.g., 919659286268)
 */
export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits || '919659286268';
}

/**
 * Formats a currency amount into Indian Rupee format
 */
export function formatINR(amount: number | string): string {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Generates formatted WhatsApp text for a Counter Sale / Invoice Bill
 */
export function generateInvoiceWhatsAppText(
  order: {
    order_number?: string;
    id?: string;
    customer_name?: string;
    items?: Array<{ name: string; quantity: number; price: number; total: number }>;
    productName?: string;
    quantity?: number;
    total_amount?: number;
    advance_amount?: number;
    remaining_amount?: number;
    payment_status?: string;
  },
  lang: 'en' | 'ta' = 'en'
): string {
  const isTamil = lang === 'ta';
  const orderNum = order.order_number || order.id || 'N/A';
  const custName = order.customer_name || (isTamil ? 'அன்புள்ள வாடிக்கையாளர்' : 'Valued Customer');
  const invoiceUrl = `${window.location.origin}/invoice/${order.id || orderNum}`;

  let itemsSummary = '';
  if (order.items && order.items.length > 0) {
    itemsSummary = order.items
      .map((item, i) => `${i + 1}. *${item.name}* (x${item.quantity}) — ${formatINR(item.total)}`)
      .join('\n');
  } else {
    itemsSummary = `1. *${order.productName || 'Metal Fabrication Work'}* (x${order.quantity || 1}) — ${formatINR(order.total_amount || 0)}`;
  }

  const total = Number(order.total_amount || 0);
  const advance = Number(order.advance_amount || 0);
  const balance = Number(order.remaining_amount !== undefined ? order.remaining_amount : total - advance);

  if (isTamil) {
    return (
      `*மணிகண்டன் லேத் & வெல்டிங் பட்டறை*\n` +
      `கள்ளிமந்தையம், திண்டுக்கல் மாவட்டம்\n` +
      `📞 தொலைபேசி: ${DEFAULT_SHOP_INFO.phone}\n` +
      `--------------------------------\n` +
      `🧾 *ரசீது / பணி ஆணை எண்:* #${orderNum}\n` +
      `👤 *வாடிக்கையாளர்:* ${custName}\n\n` +
      `🛠️ *விவரங்கள்:*\n` +
      `${itemsSummary}\n\n` +
      `💰 *மொத்த தொகை:* ${formatINR(total)}\n` +
      `💵 *செலுத்திய முன்பணம்:* ${formatINR(advance)}\n` +
      `⏳ *மீதி செலுத்த வேண்டியது:* ${formatINR(balance)}\n` +
      `--------------------------------\n` +
      `📄 *முழு ரசீதைப் பார்க்க & பதிவிறக்க:*\n` +
      `${invoiceUrl}\n\n` +
      `📍 *பொருட்கள் பட்டறையிலேயே நேரடியாக ஒப்படைக்கப்படும்.*`
    );
  }

  return (
    `*MANIKANDAN LATHE & WELDING WORKS*\n` +
    `Kallimandhayam, Tamil Nadu\n` +
    `📞 Phone: ${DEFAULT_SHOP_INFO.phone}\n` +
    `--------------------------------\n` +
    `🧾 *Invoice / Bill No:* #${orderNum}\n` +
    `👤 *Customer:* ${custName}\n\n` +
    `🛠️ *Items & Machining Works:*\n` +
    `${itemsSummary}\n\n` +
    `💰 *Total Amount:* ${formatINR(total)}\n` +
    `💵 *Advance Paid:* ${formatINR(advance)}\n` +
    `⏳ *Balance Due:* ${formatINR(balance)}\n` +
    `--------------------------------\n` +
    `📄 *View & Download Digital Invoice Bill:*\n` +
    `${invoiceUrl}\n\n` +
    `📍 *Workshop Counter Pickup (Kallimandhayam).*`
  );
}

/**
 * Generates formatted WhatsApp text for Advance Payment Request
 */
export function generatePaymentRequestWhatsAppText(
  order: {
    order_number?: string;
    id?: string;
    customer_name?: string;
    productName?: string;
    payment_request_amount?: number;
    advance_amount?: number;
    remaining_amount?: number;
  },
  lang: 'en' | 'ta' = 'en'
): string {
  const isTamil = lang === 'ta';
  const orderNum = order.order_number || order.id || 'N/A';
  const custName = order.customer_name || 'Customer';
  const payAmt = order.payment_request_amount || order.advance_amount || order.remaining_amount || 0;
  const payUrl = `${window.location.origin}/orders/${order.id}`;

  if (isTamil) {
    return (
      `*மணிகண்டன் லேத் — கட்டண அறிவிப்பு*\n` +
      `--------------------------------\n` +
      `வணக்கம் ${custName},\n` +
      `உங்கள் ஆர்டர் *#${orderNum}* (${order.productName || 'லேத் தயாரிப்பு'})-க்கு கட்டணத் தொகை நிர்ணயிக்கப்பட்டுள்ளது.\n\n` +
      `💳 *செலுத்த வேண்டிய தொகை:* ${formatINR(payAmt)}\n\n` +
      `📲 *Razorpay / UPI மூலம் பாதுகாப்பாக ஆன்லைனில் செலுத்த:*\n` +
      `${payUrl}\n\n` +
      `நன்றி, மணிகண்டன் லேத் பட்டறை (கள்ளிமந்தையம்).`
    );
  }

  return (
    `*MANIKANDAN LATHE — Payment Request*\n` +
    `--------------------------------\n` +
    `Hello ${custName},\n` +
    `A payment has been requested for your order *#${orderNum}* (${order.productName || 'Fabrication Work'}).\n\n` +
    `💳 *Payable Due Amount:* ${formatINR(payAmt)}\n\n` +
    `📲 *Pay Securely Online via Razorpay / UPI:*\n` +
    `${payUrl}\n\n` +
    `Thank you, Manikandan Lathe (Kallimandhayam).`
  );
}

/**
 * Generates formatted WhatsApp text for Order Status Updates
 */
export function generateOrderStatusWhatsAppText(
  order: {
    order_number?: string;
    id?: string;
    customer_name?: string;
    productName?: string;
    status?: string;
  },
  statusText: string,
  lang: 'en' | 'ta' = 'en'
): string {
  const isTamil = lang === 'ta';
  const orderNum = order.order_number || order.id || 'N/A';
  const custName = order.customer_name || 'Customer';
  const orderUrl = `${window.location.origin}/orders/${order.id}`;

  if (isTamil) {
    return (
      `*மணிகண்டன் லேத் — ஆர்டர் நிலை தகவல்*\n` +
      `--------------------------------\n` +
      `வணக்கம் ${custName},\n` +
      `உங்கள் ஆர்டர் *#${orderNum}* (${order.productName || 'லேத் தயாரிப்பு'}) தற்போது:\n\n` +
      `🚀 *நிலை:* ${statusText}\n\n` +
      `🔍 *நேரடி நிலையை கண்காணிக்க:*\n` +
      `${orderUrl}\n\n` +
      `மணிகண்டன் லேத், கள்ளிமந்தையம் | 📞 ${DEFAULT_SHOP_INFO.phone}`
    );
  }

  return (
    `*MANIKANDAN LATHE — Order Status Update*\n` +
    `--------------------------------\n` +
    `Hello ${custName},\n` +
    `Your order *#${orderNum}* (${order.productName || 'Fabrication Product'}) status has been updated:\n\n` +
    `🚀 *Status:* ${statusText}\n\n` +
    `🔍 *Track Live Status Online:*\n` +
    `${orderUrl}\n\n` +
    `Manikandan Lathe, Kallimandhayam | 📞 ${DEFAULT_SHOP_INFO.phone}`
  );
}

/**
 * Direct WhatsApp Link Launcher
 */
export function sendToWhatsApp(phone: string, message: string): void {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(url, '_blank');
}
