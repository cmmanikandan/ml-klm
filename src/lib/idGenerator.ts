import { supabase } from './supabase';

// Generate sequential human-readable Order IDs starting from MNK-ORD-1
export const getNextOrderId = async (): Promise<string> => {
  const existingNumbers = new Set<string>();
  let maxNumeric = 0;

  // 1. Gather all existing order numbers from Supabase DB
  try {
    const { data: dbOrders } = await supabase.from('orders').select('order_number');
    (dbOrders || []).forEach((o: any) => {
      if (o.order_number) {
        const val = String(o.order_number).trim().toUpperCase();
        existingNumbers.add(val);
        const match = val.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumeric) maxNumeric = num;
        }
      }
    });
  } catch (e) {
    console.warn('DB order scan error:', e);
  }

  // 2. Gather from LocalStorage cache
  try {
    const localOrders: any[] = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    localOrders.forEach((o: any) => {
      if (o.order_number) {
        const val = String(o.order_number).trim().toUpperCase();
        existingNumbers.add(val);
        const match = val.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumeric) maxNumeric = num;
        }
      }
    });
  } catch (e) {}

  // 3. Find first available unique sequential number
  let nextNum = maxNumeric + 1;
  while (existingNumbers.has(`MNK-ORD-${nextNum}`)) {
    nextNum++;
  }

  return `MNK-ORD-${nextNum}`;
};

// Generate sequential human-readable Enquiry IDs starting from MNK-ENQ-1
export const getNextEnquiryId = async (): Promise<string> => {
  const existingNumbers = new Set<string>();
  let maxNumeric = 0;

  try {
    const { data: dbEnqs } = await supabase.from('enquiries').select('enquiry_number');
    (dbEnqs || []).forEach((e: any) => {
      if (e.enquiry_number) {
        const val = String(e.enquiry_number).trim().toUpperCase();
        existingNumbers.add(val);
        const match = val.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumeric) maxNumeric = num;
        }
      }
    });
  } catch (e) {
    console.warn('DB enquiry scan error:', e);
  }

  try {
    const localEnqs: any[] = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    localEnqs.forEach((e: any) => {
      if (e.enquiry_number) {
        const val = String(e.enquiry_number).trim().toUpperCase();
        existingNumbers.add(val);
        const match = val.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNumeric) maxNumeric = num;
        }
      }
    });
  } catch (e) {}

  let nextNum = maxNumeric + 1;
  while (existingNumbers.has(`MNK-ENQ-${nextNum}`)) {
    nextNum++;
  }

  return `MNK-ENQ-${nextNum}`;
};

