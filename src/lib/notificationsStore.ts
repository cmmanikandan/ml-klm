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
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      return data;
    }
  } catch (e) {
    console.warn('DB notifications fetch error', e);
  }

  return [];
};

export const addAppNotification = async (notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
  const notifUuid = crypto.randomUUID();
  const newNotif: AppNotification = {
    ...notif,
    id: notifUuid,
    is_read: false,
    created_at: new Date().toISOString()
  };

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
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (e) {
    console.warn('DB notification read update fallback', e);
  }
};

export const markAllNotificationsAsRead = async (notifications: AppNotification[]) => {
  const allIds = notifications.map((n) => n.id);
  if (allIds.length === 0) return;

  try {
    await supabase.from('notifications').update({ is_read: true }).in('id', allIds);
  } catch (e) {
    console.warn('DB all notifications read update fallback', e);
  }
};

export const deleteNotification = async (id: string) => {
  try {
    await supabase.from('notifications').delete().eq('id', id);
  } catch (e) {
    console.warn('DB notification delete fallback', e);
  }
};
