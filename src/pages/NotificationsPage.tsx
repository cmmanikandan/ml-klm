import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const NotificationsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveNotifications();
  }, [user?.id]);

  const fetchLiveNotifications = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.warn('Notifications fetch fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-black text-charcoal-900">{t('nav_notifications')}</h1>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 text-center rounded-3xl border border-warm-border text-xs font-bold text-charcoal-500 animate-pulse">
              Syncing notifications with Supabase DB...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-warm-border space-y-2">
              <Bell className="w-12 h-12 text-brand-500 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-charcoal-800">No notifications yet</h3>
              <p className="text-xs text-charcoal-500">Order updates and price quotes will appear here automatically.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-3xl border transition-all ${
                  notif.is_read ? 'bg-white border-warm-border' : 'bg-brand-50/50 border-brand-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-brand-100 text-brand-600 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-bold text-charcoal-900">
                      {isTamil ? notif.title_ta || notif.title_en : notif.title_en}
                    </h4>
                    <p className="text-xs text-charcoal-600 font-medium">
                      {isTamil ? notif.message_ta || notif.message_en : notif.message_en}
                    </p>
                    <span className="text-[10px] text-charcoal-400 font-bold block pt-1">
                      {notif.created_at?.slice(0, 10) || 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
