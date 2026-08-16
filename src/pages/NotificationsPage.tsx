import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCircle2, Sparkles, ShoppingBag, Clock, X, CheckCheck, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  fetchUserNotifications, 
  AppNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../lib/notificationsStore';

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

  const handleCardClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDeleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatNotificationDateTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timePart = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isToday) {
      return `Today, ${timePart}`;
    }

    const datePart = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${datePart} • ${timePart}`;
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-warm-bg pb-24 md:pb-12 pt-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-warm-border shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-charcoal-700 bg-warm-bg rounded-full border border-warm-border shadow-sm hover:bg-warm-hover transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-black text-charcoal-900">{t('nav_notifications')}</h1>
              <p className="text-xs font-semibold text-charcoal-500">Live order status, payment cards & workshop updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-black px-3.5 py-2 rounded-2xl border border-brand-200 transition-all shadow-sm"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isTamil ? 'அனைத்தையும் வாசித்ததாக குறிக்க' : 'Mark All Read'}</span>
              </button>
            )}

            <span className={`text-xs font-black px-3 py-2 rounded-2xl shadow-sm ${
              unreadCount > 0 ? 'bg-brand-600 text-white' : 'bg-warm-bg text-charcoal-700 border border-warm-border'
            }`}>
              {unreadCount > 0 ? `${unreadCount} Unread` : `${notifications.length} Total`}
            </span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 text-center rounded-3xl border border-warm-border text-xs font-bold text-charcoal-500 animate-pulse">
              Syncing notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-warm-border space-y-3 shadow-card">
              <Bell className="w-12 h-12 text-brand-500 mx-auto opacity-40 animate-bounce-subtle" />
              <h3 className="text-base font-black text-charcoal-800">No Notifications</h3>
              <p className="text-xs text-charcoal-500 font-medium">Order updates and price quotes will appear here automatically.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleCardClick(notif)}
                className={`group relative p-5 rounded-3xl border transition-all duration-200 cursor-pointer ${
                  notif.is_read
                    ? 'bg-white border-warm-border hover:border-brand-300 hover:shadow-md'
                    : 'bg-amber-50/90 border-amber-300 shadow-md hover:shadow-lg hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-white border border-warm-border shrink-0 shadow-sm">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-1.5 pr-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-charcoal-900">
                          {isTamil ? notif.title_ta || notif.title_en : notif.title_en}
                        </h4>
                        {!notif.is_read ? (
                          <span className="bg-brand-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            <span>Unread</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span>Seen</span>
                            <span>✓</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-bold text-charcoal-500 shrink-0">
                        {formatNotificationDateTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-700 font-medium leading-relaxed">
                      {isTamil ? notif.message_ta || notif.message_en : notif.message_en}
                    </p>

                    {notif.link && (
                      <span className="text-[11px] font-extrabold text-brand-600 group-hover:underline inline-flex items-center gap-1 pt-1">
                        <span>View Order Details</span>
                        <span>→</span>
                      </span>
                    )}
                  </div>

                  {/* Delete Button (X) */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotif(e, notif.id)}
                    className="p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Delete Notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
