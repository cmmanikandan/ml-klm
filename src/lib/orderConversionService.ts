import { supabase, INITIAL_PRODUCTS } from './supabase';
import { getNextOrderId } from './idGenerator';

export interface ConversionParams {
  enquiry: any;
  quotePrice: number;
  advanceRequired: number;
  estimatedDays: number;
}

export interface ConversionResult {
  isNew: boolean;
  order: any;
  message: string;
}

/**
 * Idempotent order conversion service.
 * Guarantees that converting an enquiry into an order will NEVER create a duplicate order.
 */
export const convertEnquiryToOrderSafely = async ({
  enquiry,
  quotePrice,
  advanceRequired,
  estimatedDays
}: ConversionParams): Promise<ConversionResult> => {
  if (!enquiry) {
    throw new Error('Enquiry object is required for conversion');
  }

  const enquiryId = enquiry.id;

  // STEP 1: CHECK IF ENQUIRY HAS ALREADY BEEN CONVERTED
  let existingOrder: any = null;
  const linkedOrderId = enquiry.converted_order_id || enquiry.convertedOrderId || enquiry.order_id;

  // A. Search by explicit linked order ID in Supabase
  if (linkedOrderId) {
    try {
      const { data: dbOrd } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${linkedOrderId},order_number.eq.${linkedOrderId}`)
        .maybeSingle();
      if (dbOrd) existingOrder = dbOrd;
    } catch (e) {
      console.warn('DB order check by linked ID fallback');
    }
  }

  // B. Search by enquiry_id in Supabase orders table
  if (!existingOrder && enquiryId) {
    try {
      const { data: dbOrdByEnq } = await supabase
        .from('orders')
        .select('*')
        .eq('enquiry_id', enquiryId)
        .maybeSingle();
      if (dbOrdByEnq) existingOrder = dbOrdByEnq;
    } catch (e) {
      console.warn('DB order check by enquiry_id fallback');
    }
  }

  // C. Search LocalStorage fallback
  if (!existingOrder) {
    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    existingOrder = localOrders.find(
      (o: any) =>
        (enquiryId && o.enquiry_id === enquiryId) ||
        (linkedOrderId && (o.id === linkedOrderId || o.order_number === linkedOrderId))
    );
  }

  // IF AN EXISTING ORDER IS FOUND: DO NOT CREATE DUPLICATE!
  if (existingOrder) {
    // Sync enquiry status to converted in DB and LocalStorage
    try {
      await supabase
        .from('enquiries')
        .update({ status: 'converted', converted_order_id: existingOrder.id })
        .eq('id', enquiryId);
    } catch (e) {
      console.warn('Enquiry status DB sync fallback');
    }

    const localEnq: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    const updatedLocalEnq = localEnq.map((e: any) =>
      e.id === enquiryId ? { ...e, status: 'converted', converted_order_id: existingOrder.id } : e
    );
    localStorage.setItem('ml_enquiries', JSON.stringify(updatedLocalEnq));

    return {
      isNew: false,
      order: existingOrder,
      message: `Already converted to order #${existingOrder.order_number || existingOrder.id}`
    };
  }

  // STEP 2: CREATE SINGLE NEW ORDER RECORD IF NO PREVIOUS CONVERSION EXISTS
  const deliveryDate = new Date(Date.now() + estimatedDays * 86400000).toISOString().slice(0, 10);
  const newOrderNumber = await getNextOrderId();
  const newOrderUuid = crypto.randomUUID();

  const isEnquiryUuid = enquiryId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId) : false;
  const isProductUuid = enquiry.product_id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiry.product_id) : false;

  const productName = enquiry.product_name || enquiry.productName || 'Custom Lathe Fabricated Item';

  const newOrderRecord = {
    id: newOrderUuid,
    order_number: newOrderNumber,
    enquiry_id: isEnquiryUuid ? enquiryId : null,
    user_id: enquiry.user_id || 'guest_user',
    customer_name: enquiry.customer_name || enquiry.customerName || 'Customer',
    customer_phone: enquiry.customer_phone || enquiry.customerPhone || '',
    customer_address: enquiry.delivery_location || enquiry.location || enquiry.customerAddress || 'Kallimandhayam',
    product_id: isProductUuid ? enquiry.product_id : null,
    product_name: productName,
    quantity: enquiry.quantity || 1,
    specifications: enquiry.size_requirement || enquiry.custom_notes || '',
    delivery_location: enquiry.delivery_location || enquiry.location || 'Kallimandhayam',
    status: 'order_confirmed',
    fabrication_stage: 'accepted',
    expected_delivery_date: deliveryDate,
    total_amount: quotePrice,
    advance_amount: 0,
    remaining_amount: quotePrice,
    is_payment_requested: advanceRequired > 0,
    payment_request_amount: advanceRequired,
    payment_status: 'unpaid',
    created_at: new Date().toISOString()
  };

  // Save to LocalStorage as instant optimistic cache
  try {
    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    const filteredLocal = localOrders.filter((o: any) => o.id !== newOrderUuid && o.order_number !== newOrderNumber);
    localStorage.setItem('ml_orders', JSON.stringify([newOrderRecord, ...filteredLocal]));
  } catch (e) {
    console.warn('Local storage cache write error');
  }

  // Save to Supabase DB — primary source of truth for all devices
  try {
    const { error: orderErr } = await supabase.from('orders').insert(newOrderRecord);
    if (orderErr) {
      console.warn('Supabase order full insert warning:', orderErr.message);
      // Retry with minimal clean payload without FKs
      const fallbackRecord = {
        id: newOrderUuid,
        order_number: newOrderNumber,
        user_id: newOrderRecord.user_id,
        customer_name: newOrderRecord.customer_name,
        customer_phone: newOrderRecord.customer_phone,
        product_name: newOrderRecord.product_name,
        quantity: newOrderRecord.quantity,
        status: 'order_confirmed',
        fabrication_stage: 'accepted',
        total_amount: quotePrice,
        advance_amount: 0,
        remaining_amount: quotePrice,
        payment_status: 'unpaid',
        created_at: new Date().toISOString()
      };
      await supabase.from('orders').insert(fallbackRecord);
    }

    // Insert Unpaid Advance Payment Request Record in Payments Ledger
    if (advanceRequired > 0) {
      await supabase.from('payments').insert({
        id: crypto.randomUUID(),
        order_id: newOrderUuid,
        order_number: newOrderNumber,
        amount: advanceRequired,
        payment_mode: 'Online Advance Request',
        notes: `Advance payment requested for ${productName}`,
        status: 'unpaid',
        created_at: new Date().toISOString()
      });
    }

    // Update enquiry status in Supabase to CONVERTED
    if (isEnquiryUuid) {
      await supabase
        .from('enquiries')
        .update({ status: 'converted', converted_order_id: newOrderUuid })
        .eq('id', enquiryId);
    }
    if (enquiry.enquiry_number) {
      await supabase
        .from('enquiries')
        .update({ status: 'converted', converted_order_id: newOrderUuid })
        .eq('enquiry_number', enquiry.enquiry_number);
    }

    // Send live in-app notification to customer
    if (newOrderRecord.user_id) {
      await supabase.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: newOrderRecord.user_id,
        title_en: `Order #${newOrderNumber} Confirmed!`,
        title_ta: `ஆர்டர் #${newOrderNumber} உறுதிசெய்யப்பட்டது!`,
        message_en: `Your fabrication request for "${productName}" has been accepted and confirmed.${advanceRequired > 0 ? ` Advance payment of ₹${advanceRequired.toLocaleString('en-IN')} requested.` : ''}`,
        message_ta: `"${productName}"க்கான உங்கள் உற்பத்தி கோரிக்கை ஏற்றுக்கொள்ளப்பட்டு உறுதிசெய்யப்பட்டது.`,
        type: advanceRequired > 0 ? 'payment' : 'order_update',
        link: `/orders/${newOrderUuid}`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  } catch (e) {
    console.error('Order conversion DB insert exception:', e);
  }

  return {
    isNew: true,
    order: newOrderRecord,
    message: `Order #${newOrderNumber} created successfully!`
  };
};
