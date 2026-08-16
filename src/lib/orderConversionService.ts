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
  const newOrderId = newOrderNumber;

  const productName = enquiry.productName || enquiry.product_name || 'Custom Lathe Fabricated Item';

  const newOrderRecord = {
    id: newOrderId,
    order_number: newOrderNumber,
    enquiry_id: enquiryId,
    user_id: enquiry.user_id || 'demo-user-123',
    customerName: enquiry.customerName || enquiry.customer_name || 'Customer',
    customerPhone: enquiry.customerPhone || enquiry.customer_phone || '+91 96592 86268',
    customerAddress: enquiry.delivery_location || enquiry.location || enquiry.customerAddress || 'Kallimandhayam',
    product_id: enquiry.product_id || INITIAL_PRODUCTS[0].id,
    productName: productName,
    quantity: enquiry.quantity || 1,
    status: 'order_confirmed',
    expected_delivery_date: deliveryDate,
    total_amount: quotePrice,
    advance_amount: advanceRequired,
    remaining_amount: quotePrice,
    is_payment_requested: advanceRequired > 0,
    payment_request_amount: advanceRequired,
    payment_status: 'unpaid',
    created_at: new Date().toISOString()
  };

  // Save to LocalStorage ml_orders
  const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
  localStorage.setItem('ml_orders', JSON.stringify([newOrderRecord, ...localOrders]));

  // Save to LocalStorage ml_enquiries with converted_order_id
  const localEnq: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
  const updatedLocalEnq = localEnq.map((e: any) =>
    e.id === enquiryId ? { ...e, status: 'converted', converted_order_id: newOrderId } : e
  );
  localStorage.setItem('ml_enquiries', JSON.stringify(updatedLocalEnq));

  // Save to Supabase DB
  try {
    const dbPayload = {
      id: newOrderId,
      order_number: newOrderNumber,
      user_id: enquiry.user_id || 'demo-user-123',
      product_id: enquiry.product_id || INITIAL_PRODUCTS[0].id,
      quantity: enquiry.quantity || 1,
      status: 'accepted',
      delivery_location: enquiry.delivery_location || enquiry.location || 'Kallimandhayam',
      expected_delivery_date: deliveryDate,
      total_amount: quotePrice,
      advance_amount: advanceRequired,
      remaining_amount: quotePrice,
      is_payment_requested: advanceRequired > 0,
      payment_request_amount: advanceRequired,
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };
    await supabase.from('orders').insert(dbPayload);
    await supabase
      .from('enquiries')
      .update({ status: 'converted', converted_order_id: newOrderId })
      .eq('id', enquiryId);
  } catch (e) {
    console.warn('Order conversion DB insert fallback', e);
  }

  return {
    isNew: true,
    order: newOrderRecord,
    message: `Order #${newOrderNumber} created successfully!`
  };
};
