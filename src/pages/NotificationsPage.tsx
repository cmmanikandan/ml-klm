import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCircle2, Sparkles, ShoppingBag, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchUserNotifications, AppNotification } from '../lib/notificationsStore';

export const NotificationsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTamil = language === 'ta';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchUserNotifications(user?.id);
      setNotifications(data);
    } catch (e) {
      console.warn('Notifications load error', e);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-brand-600" />;
      case 'payment':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'welcome':
      case 'feature':
      default:
        return <Sparkles className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-charcoal-700 bg-white rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-charcoal-900">{t('nav_notifications')}</h1>
              <p className="text-xs font-bold text-charcoal-500">Live order status, payment cards & workshop updates</p>
            </div>
          </div>

          <span className="bg-brand-100 text-brand-800 text-xs font-black px-3 py-1 rounded-full border border-brand-300">
            {notifications.length} Active
          </span>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 text-center rounded-3xl border border-warm-border text-xs font-bold text-charcoal-500 animate-pulse">
              Syncing notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-warm-border space-y-3">
              <Bell className="w-12 h-12 text-brand-500 mx-auto opacity-40 animate-bounce-subtle" />
              <h3 className="text-base font-black text-charcoal-800">No Notifications Yet</h3>
              <p className="text-xs text-charcoal-500 font-medium">Order updates and price quotes will appear here automatically.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => notif.link && navigate(notif.link)}
                className={`p-4 rounded-3xl border transition-all ${
                  notif.link ? 'cursor-pointer hover:shadow-md hover:border-brand-400' : ''
                } ${
                  notif.is_read ? 'bg-white border-warm-border' : 'bg-amber-50/80 border-brand-300 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-white border border-warm-border shrink-0 shadow-sm">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-charcoal-900">
                        {isTamil ? notif.title_ta || notif.title_en : notif.title_en}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-charcoal-400 shrink-0">
                        {notif.created_at ? new Date(notif.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-600 font-medium leading-snug">
                      {isTamil ? notif.message_ta || notif.message_en : notif.message_en}
                    </p>

                    {notif.link && (
                      <span className="text-[11px] font-extrabold text-brand-600 hover:underline inline-flex items-center gap-1 pt-1">
                        <span>View Order Details</span>
                        <span>→</span>
                      </span>
                    )}
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
