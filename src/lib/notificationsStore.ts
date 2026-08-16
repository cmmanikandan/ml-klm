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
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        dbNotifs = data;
      }
    }
  } catch (e) {
    console.warn('DB notifications fetch error', e);
  }

  // Local storage notifications
  const localNotifs: AppNotification[] = JSON.parse(localStorage.getItem('ml_notifications') || '[]');
  let combined = [...dbNotifs, ...localNotifs];

  // Deduplicate
  const seen = new Set();
  combined = combined.filter((n) => {
    const key = n.id || `${n.title_en}_${n.created_at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort descending by date
  combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  // If still empty, generate friendly welcome & system notifications
  if (combined.length === 0) {
    const welcomeNotifs: AppNotification[] = [
      {
        id: 'sys_notif_1',
        user_id: userId || 'guest',
        title_en: 'Welcome to Manikandan Lathe Works!',
        title_ta: 'மணிகண்டன் லேத் ஒர்க்ஸுக்கு நல்வரவு!',
        message_en: 'Your trusted partner for custom steel gates, grills, rolling shutters, and lathe works in Kallimandhayam.',
        message_ta: 'கல்லிமந்தயத்தில் தரமான ஸ்டீல் கேட், கிரில் மற்றும் லேத் வேலைகளுக்கு எங்களை தொடர்பு கொள்ளவும்.',
        type: 'welcome',
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
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    return welcomeNotifs;
  }

  return combined;
};

export const addAppNotification = async (notif: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) => {
  const newNotif: AppNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    is_read: false,
    created_at: new Date().toISOString()
  };

  // Save to LocalStorage
  const localNotifs: AppNotification[] = JSON.parse(localStorage.getItem('ml_notifications') || '[]');
  localStorage.setItem('ml_notifications', JSON.stringify([newNotif, ...localNotifs]));

  // Try saving to Supabase DB
  try {
    await supabase.from('notifications').insert(newNotif);
  } catch (e) {
    console.warn('Supabase notification insert fallback', e);
  }

  return newNotif;
};
