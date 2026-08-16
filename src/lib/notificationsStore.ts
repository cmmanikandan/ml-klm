import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  title_en: string;
  title_ta: string;
  message_en: string;
  message_ta: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const fetchUserNotifications = async (userId?: string): Promise<AppNotification[]> => {
  let dbNotifs: AppNotification[] = [];
  try {
    if (userId) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.all,user_id.eq.guest`)
        .order('created_at', { ascending: false });

      if (data && !error) {
        dbNotifs = data;
      }
    } else {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.all,user_id.eq.guest`)
        .order('created_at', { ascending: false });

      if (data) dbNotifs = data;
    }
  } catch (e) {
    console.warn('DB notifications fetch error', e);
  }

  // If no notifications yet, provide default helpful links
  if (dbNotifs.length === 0) {
    return [
      {
        id: 'sys_notif_1',
        user_id: userId || 'guest',
        title_en: 'Welcome to Manikandan Lathe Works!',
        title_ta: 'மணிகண்டன் லேத் ஒர்க்ஸுக்கு நல்வரவு!',
        message_en: 'Your trusted partner for custom steel gates, grills, rolling shutters, and lathe works in Kallimandhayam.',
        message_ta: 'கல்லிமந்தயத்தில் தரமான ஸ்டீல் கேட், கிரில் மற்றும் லேத் வேலைகளுக்கு எங்களை தொடர்பு கொள்ளவும்.',
        type: 'welcome',
        link: '/products',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'sys_notif_2',
        user_id: userId || 'guest',
        title_en: 'Live Workshop Fabrication Tracking Active',
        title_ta: 'லைவ் வொர்க்ஷாப் உற்பத்தி நிலை ஆக்டிவ்',
        message_en: 'Track your order progress step-by-step from raw steel cutting to lathe turning, welding, and painting.',
        message_ta: 'உங்கள் ஆர்டர் உற்பத்தி நிலையை ஸ்டீல் கட்டிங் முதல் பெயிண்டிங் வரை நேரடியாக கண்காணிக்கலாம்.',
        type: 'feature',
        link: '/orders',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  }

  return dbNotifs;
};

export const addAppNotification = async (notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
  const notifUuid = crypto.randomUUID();
  const newNotif: AppNotification = {
    ...notif,
    id: notifUuid,
    is_read: false,
    created_at: new Date().toISOString()
  };

  // Save directly to Supabase DB
  try {
    const { error } = await supabase.from('notifications').insert(newNotif);
    if (error) {
      console.error('Supabase notification insert error:', error.message);
    }
  } catch (e) {
    console.error('Supabase notification insert exception:', e);
  }

  return newNotif;
};

export const markNotificationAsRead = async (id: string) => {
  const readIds: string[] = JSON.parse(localStorage.getItem('ml_read_notification_ids') || '[]');
  if (!readIds.includes(id)) {
    localStorage.setItem('ml_read_notification_ids', JSON.stringify([...readIds, id]));
  }

  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (e) {
    console.warn('DB notification read update fallback', e);
  }
};

export const markAllNotificationsAsRead = async (notifications: AppNotification[]) => {
  const allIds = notifications.map((n) => n.id);
  const readIds: string[] = JSON.parse(localStorage.getItem('ml_read_notification_ids') || '[]');
  const combined = Array.from(new Set([...readIds, ...allIds]));
  localStorage.setItem('ml_read_notification_ids', JSON.stringify(combined));

  try {
    await supabase.from('notifications').update({ is_read: true }).in('id', allIds);
  } catch (e) {
    console.warn('DB all notifications read update fallback', e);
  }
};

export const deleteNotification = async (id: string) => {
  const deletedIds: string[] = JSON.parse(localStorage.getItem('ml_deleted_notification_ids') || '[]');
  if (!deletedIds.includes(id)) {
    localStorage.setItem('ml_deleted_notification_ids', JSON.stringify([...deletedIds, id]));
  }

  const localNotifs: AppNotification[] = JSON.parse(localStorage.getItem('ml_notifications') || '[]');
  const updatedLocal = localNotifs.filter((n) => n.id !== id);
  localStorage.setItem('ml_notifications', JSON.stringify(updatedLocal));

  try {
    await supabase.from('notifications').delete().eq('id', id);
  } catch (e) {
    console.warn('DB notification delete fallback', e);
  }
};
