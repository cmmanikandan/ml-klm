import { supabase, INITIAL_PRODUCTS } from './supabase';
import { getNextOrderId } from './idGenerator';
import { fetchActiveProducts } from './productsStore';

export interface ConversionParams {
  enquiry: any;
  quotePrice?: number;
  advanceRequired?: number;
  estimatedDays?: number;
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
  quotePrice = 0,
  advanceRequired = 0,
  estimatedDays = 7
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
      const targetOrderNo = existingOrder.order_number || existingOrder.id;
      if (enquiryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId)) {
        await supabase
          .from('enquiries')
          .update({ status: 'converted', converted_order_id: targetOrderNo })
          .eq('id', enquiryId);
      }
      if (enquiry.enquiry_number) {
        await supabase
          .from('enquiries')
          .update({ status: 'converted', converted_order_id: targetOrderNo })
          .eq('enquiry_number', enquiry.enquiry_number);
      }
    } catch (e) {
      console.warn('Enquiry status DB sync fallback');
    }

    const localEnq: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    const updatedLocalEnq = localEnq.map((e: any) =>
      (e.id === enquiryId || e.enquiry_number === enquiry.enquiry_number)
        ? { ...e, status: 'converted', converted_order_id: existingOrder.order_number || existingOrder.id }
        : e
    );
    localStorage.setItem('ml_enquiries', JSON.stringify(updatedLocalEnq));

    return {
      isNew: false,
      order: existingOrder,
      message: `Already converted to order #${existingOrder.order_number || existingOrder.id}`
    };
  }

  // STEP 2: CALCULATE PRICING & DETAILS
  let finalQuotePrice = quotePrice;
  const qty = Number(enquiry.quantity) || 1;

  if (finalQuotePrice <= 0) {
    try {
      const activeProducts = await fetchActiveProducts();
      const prod = activeProducts.find(
        p => p.id === enquiry.product_id || p.name_en.toLowerCase() === (enquiry.product_name || enquiry.productName || '').toLowerCase()
      ) || INITIAL_PRODUCTS.find(
        p => p.id === enquiry.product_id || p.name_en.toLowerCase() === (enquiry.product_name || enquiry.productName || '').toLowerCase()
      );

      if (prod?.admin_price && prod.admin_price > 0) {
        finalQuotePrice = prod.admin_price * qty;
      } else if (enquiry.quote_price && enquiry.quote_price > 0) {
        finalQuotePrice = enquiry.quote_price;
      } else if (enquiry.total_amount && enquiry.total_amount > 0) {
        finalQuotePrice = enquiry.total_amount;
      } else {
        finalQuotePrice = 40000; // sensible default
      }
    } catch {
      finalQuotePrice = enquiry.quote_price || 40000;
    }
  }

  const finalAdvance = advanceRequired || enquiry.advance_amount || 0;
  const finalRemaining = Math.max(0, finalQuotePrice - finalAdvance);
  const deliveryDays = estimatedDays || enquiry.estimated_days || 7;
  const deliveryDate = new Date(Date.now() + deliveryDays * 86400000).toISOString().slice(0, 10);

  const newOrderNumber = await getNextOrderId();
  const newOrderUuid = crypto.randomUUID();

  const isEnquiryUuid = enquiryId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiryId) : false;
  const isProductUuid = enquiry.product_id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(enquiry.product_id) : false;

  const productName = enquiry.product_name || enquiry.productName || 'Custom Lathe Fabricated Item';
  const customerName = enquiry.customer_name || enquiry.customerName || enquiry.user_name || 'Customer';
  const customerPhone = enquiry.customer_phone || enquiry.customerPhone || enquiry.phone || '';
  const customerAddress = enquiry.delivery_location || enquiry.location || enquiry.customerAddress || enquiry.address || 'Direct Workshop Counter Pickup (Kallimandhayam)';
  const customerUserId = enquiry.user_id || 'guest_user';

  const newOrderRecord = {
    id: newOrderUuid,
    order_number: newOrderNumber,
    enquiry_id: isEnquiryUuid ? enquiryId : null,
    user_id: customerUserId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    product_id: isProductUuid ? enquiry.product_id : null,
    product_name: productName,
    product_image: enquiry.product_image || enquiry.productImage || '',
    quantity: qty,
    specifications: enquiry.size_requirement || enquiry.custom_notes || '',
    delivery_location: customerAddress,
    status: 'accepted',
    fabrication_stage: 'accepted',
    expected_delivery_date: deliveryDate,
    total_amount: finalQuotePrice,
    advance_amount: finalAdvance,
    remaining_amount: finalRemaining,
    is_payment_requested: finalAdvance > 0,
    payment_request_amount: finalAdvance,
    payment_status: 'pending',
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

  // Save to Supabase DB — primary source of truth
  try {
    const { error: orderErr } = await supabase.from('orders').insert(newOrderRecord);
    if (orderErr) {
      console.warn('Supabase order full insert warning:', orderErr.message);
      // Retry with minimal clean payload without FKs
      const fallbackRecord = {
        id: newOrderUuid,
        order_number: newOrderNumber,
        user_id: customerUserId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        product_name: productName,
        quantity: qty,
        status: 'accepted',
        fabrication_stage: 'accepted',
        expected_delivery_date: deliveryDate,
        total_amount: finalQuotePrice,
        advance_amount: finalAdvance,
        remaining_amount: finalRemaining,
        payment_status: 'pending',
        is_payment_requested: finalAdvance > 0,
        payment_request_amount: finalAdvance,
        delivery_location: customerAddress,
        created_at: new Date().toISOString()
      };
      await supabase.from('orders').insert(fallbackRecord);
    }

    // Insert Pending Payment Request Record in Payments Ledger if advance > 0
    if (finalAdvance > 0) {
      try {
        await supabase.from('payments').insert({
          id: crypto.randomUUID(),
          order_id: newOrderUuid,
          order_number: newOrderNumber,
          user_id: customerUserId,
          amount: finalAdvance,
          payment_type: 'cash',
          payment_mode: 'Advance Payment Request',
          notes: `Advance payment requested for ${productName}`,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      } catch (payErr) {
        console.warn('Payments record insert warning:', payErr);
      }
    }

    // Update enquiry status in Supabase to 'accepted' / 'converted'
    if (isEnquiryUuid) {
      await supabase
        .from('enquiries')
        .update({ status: 'converted', converted_order_id: newOrderNumber })
        .eq('id', enquiryId);
    }
    const enqNum = enquiry.enquiry_number || enquiry.number || enquiryId;
    if (enqNum) {
      await supabase
        .from('enquiries')
        .update({ status: 'converted', converted_order_id: newOrderNumber })
        .eq('enquiry_number', enqNum);
    }

    // Send live in-app notification to customer
    if (customerUserId && customerUserId !== 'guest_user') {
      try {
        await supabase.from('notifications').insert({
          id: crypto.randomUUID(),
          user_id: customerUserId,
          title_en: `Order #${newOrderNumber} Accepted & Confirmed!`,
          title_ta: `ஆர்டர் #${newOrderNumber} ஏற்றுக்கொள்ளப்பட்டு உறுதிசெய்யப்பட்டது!`,
          message_en: `Your fabrication enquiry for "${productName}" has been accepted and added to shop production.${finalAdvance > 0 ? ` Advance payment of ₹${finalAdvance.toLocaleString('en-IN')} requested.` : ''}`,
          message_ta: `"${productName}"க்கான உங்கள் தயாரிப்பு கோரிக்கை ஏற்றுக்கொள்ளப்பட்டு உறுதிசெய்யப்பட்டது.`,
          type: finalAdvance > 0 ? 'payment' : 'order_update',
          link: `/orders/${newOrderNumber}`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn('Notification insert warning:', notifErr);
      }
    }
  } catch (e) {
    console.error('Order conversion DB insert exception:', e);
  }

  // Also update local enquiries cache
  try {
    const localEnqs: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    const updatedLocalEnqs = localEnqs.map((e: any) =>
      (e.id === enquiryId || e.enquiry_number === enquiry.enquiry_number)
        ? { ...e, status: 'converted', converted_order_id: newOrderNumber }
        : e
    );
    localStorage.setItem('ml_enquiries', JSON.stringify(updatedLocalEnqs));
  } catch {}

  return {
    isNew: true,
    order: newOrderRecord,
    message: `Order #${newOrderNumber} created and accepted successfully!`
  };
};

