import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { supabase } from '../../lib/supabase';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLivePayments();
  }, []);

  const fetchLivePayments = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (data) setPayments(data);
    } catch (e) {
      console.warn('Live payments DB fetch fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>ADMINISTRATOR ONLY</span>
          </div>
          <h1 className="text-2xl font-black text-charcoal-900">Payment & Revenue Audit History</h1>
          <p className="text-xs text-charcoal-500 font-semibold mt-0.5">
            Strictly restricted audit ledger of Razorpay, UPI QR, and workshop cash collections
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-warm-border p-5 shadow-card space-y-4">
        <h3 className="text-base font-extrabold text-charcoal-900">Transaction Records</h3>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500 animate-pulse">
            Syncing payment ledger with Supabase DB...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-charcoal-500">
            No payment transactions recorded in database yet.
          </div>
        ) : (
          <div className="divide-y divide-warm-muted">
            {payments.map((p) => (
              <div key={p.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-brand-600">#{p.order_id || p.id}</span>
                    <span className="font-extrabold text-charcoal-900">• {p.user_name || 'Customer'}</span>
                  </div>
                  <span className="text-charcoal-500 font-bold block mt-0.5">
                    Type: {(p.payment_type || p.type || 'ONLINE').toUpperCase()} | Ref: {p.transaction_id || p.txId || 'N/A'} | Date: {p.created_at?.slice(0, 10) || 'Recent'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-emerald-700 font-mono">
                    +₹{(p.amount || 0).toLocaleString('en-IN')}
                  </span>
                  <Badge variant="paid">PAID</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
