export type StatusKey = 
  | 'pending'
  | 'new'
  | 'accepted'
  | 'confirmed'
  | 'order_confirmed'
  | 'processing'
  | 'in_production'
  | 'quality_check'
  | 'ready'
  | 'ready_for_pickup'
  | 'delivered'
  | 'rejected'
  | 'cancelled'
  | 'paid'
  | 'unpaid';

export interface StatusStyle {
  label: string;
  badgeClass: string;
  activeBtnClass: string;
  inactiveBtnClass: string;
  dotColor: string;
  textColor: string;
}

export const STATUS_CONFIG: Record<string, StatusStyle> = {
  pending: {
    label: 'PENDING',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold',
    activeBtnClass: 'bg-amber-500 text-white border-amber-500 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-amber-50 hover:text-amber-950',
    dotColor: '#F59E0B',
    textColor: 'text-amber-950'
  },
  new: {
    label: 'NEW',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold',
    activeBtnClass: 'bg-amber-500 text-white border-amber-500 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-amber-50 hover:text-amber-950',
    dotColor: '#F59E0B',
    textColor: 'text-amber-950'
  },
  accepted: {
    label: 'ACCEPTED',
    badgeClass: 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold',
    activeBtnClass: 'bg-blue-600 text-white border-blue-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-blue-50 hover:text-blue-950',
    dotColor: '#2563EB',
    textColor: 'text-blue-950'
  },
  confirmed: {
    label: 'ORDER CONFIRMED',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300 font-extrabold',
    activeBtnClass: 'bg-brand-600 text-white border-brand-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-orange-50 hover:text-orange-950',
    dotColor: '#EA580C',
    textColor: 'text-orange-950'
  },
  order_confirmed: {
    label: 'ORDER CONFIRMED',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300 font-extrabold',
    activeBtnClass: 'bg-brand-600 text-white border-brand-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-orange-50 hover:text-orange-950',
    dotColor: '#EA580C',
    textColor: 'text-orange-950'
  },
  processing: {
    label: 'PROCESSING',
    badgeClass: 'bg-purple-100 text-purple-950 border-purple-300 font-extrabold',
    activeBtnClass: 'bg-purple-600 text-white border-purple-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-purple-50 hover:text-purple-950',
    dotColor: '#9333EA',
    textColor: 'text-purple-950'
  },
  in_production: {
    label: 'PROCESSING',
    badgeClass: 'bg-purple-100 text-purple-950 border-purple-300 font-extrabold',
    activeBtnClass: 'bg-purple-600 text-white border-purple-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-purple-50 hover:text-purple-950',
    dotColor: '#9333EA',
    textColor: 'text-purple-950'
  },
  ready: {
    label: 'READY',
    badgeClass: 'bg-green-100 text-green-950 border-green-300 font-extrabold',
    activeBtnClass: 'bg-green-600 text-white border-green-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-green-50 hover:text-green-950',
    dotColor: '#16A34A',
    textColor: 'text-green-950'
  },
  ready_for_pickup: {
    label: 'READY',
    badgeClass: 'bg-green-100 text-green-950 border-green-300 font-extrabold',
    activeBtnClass: 'bg-green-600 text-white border-green-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-green-50 hover:text-green-950',
    dotColor: '#16A34A',
    textColor: 'text-green-950'
  },
  delivered: {
    label: 'DELIVERED',
    badgeClass: 'bg-teal-100 text-teal-950 border-teal-300 font-extrabold',
    activeBtnClass: 'bg-teal-700 text-white border-teal-700 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-teal-50 hover:text-teal-950',
    dotColor: '#0D9488',
    textColor: 'text-teal-950'
  },
  rejected: {
    label: 'REJECTED',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold',
    activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-rose-50 hover:text-rose-950',
    dotColor: '#E11D48',
    textColor: 'text-rose-950'
  },
  cancelled: {
    label: 'CANCELLED',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold',
    activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-rose-50 hover:text-rose-950',
    dotColor: '#E11D48',
    textColor: 'text-rose-950'
  },
  paid: {
    label: 'PAID',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold',
    activeBtnClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-emerald-50 hover:text-emerald-950',
    dotColor: '#059669',
    textColor: 'text-emerald-950'
  },
  unpaid: {
    label: 'UNPAID',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold',
    activeBtnClass: 'bg-rose-600 text-white border-rose-600 shadow-md font-black',
    inactiveBtnClass: 'bg-white text-charcoal-700 border-warm-border hover:bg-rose-50 hover:text-rose-950',
    dotColor: '#E11D48',
    textColor: 'text-rose-950'
  }
};

export const getStatusConfig = (statusStr: string | null | undefined): StatusStyle => {
  const key = String(statusStr || '').trim().toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG['pending'];
};
