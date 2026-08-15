import { supabase } from './supabase';

// Generate sequential human-readable Order IDs starting from MNK-ORD-1
export const getNextOrderId = async (): Promise<string> => {
  let count = 0;
  try {
    const { data } = await supabase.from('orders').select('id', { count: 'exact' });
    if (data) count = data.length;
  } catch (e) {
    const local = JSON.parse(localStorage.getItem('ml_orders') || '[]');
    count = local.length;
  }

  const localOrders = JSON.parse(localStorage.getItem('ml_orders') || '[]');
  const totalCount = Math.max(count, localOrders.length) + 1;

  return `MNK-ORD-${totalCount}`;
};

// Generate sequential human-readable Enquiry IDs starting from MNK-ENQ-1
export const getNextEnquiryId = async (): Promise<string> => {
  let count = 0;
  try {
    const { data } = await supabase.from('enquiries').select('id', { count: 'exact' });
    if (data) count = data.length;
  } catch (e) {
    const local = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    count = local.length;
  }

  const localEnquiries = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
  const totalCount = Math.max(count, localEnquiries.length) + 1;

  return `MNK-ENQ-${totalCount}`;
};
