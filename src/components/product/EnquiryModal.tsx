import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, DEFAULT_SHOP_INFO } from '../../lib/supabase';
import { getNextEnquiryId } from '../../lib/idGenerator';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose, product }) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isTamil = language === 'ta';
  const title = isTamil ? product.name_ta || product.name_en : product.name_en;

  const [quantity, setQuantity] = useState<number>(1);
  const [sizeRequirement, setSizeRequirement] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>(user?.address || user?.city_area || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [successEnquiryId, setSuccessEnquiryId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const generatedId = await getNextEnquiryId();

    const enquiryRecord = {
      enquiry_number: generatedId,
      user_id: user?.id || 'demo-user-123',
      product_id: product.id,
      quantity,
      size_requirement: sizeRequirement || product.available_sizes || 'Standard',
      custom_notes: customNotes,
      delivery_location: deliveryLocation,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('enquiries').insert(enquiryRecord);
    } catch (err) {
      console.warn('Enquiry fallback save');
    }

    // Save locally for instant preview responsiveness
    const existingEnquiries = JSON.parse(localStorage.getItem('ml_enquiries') || '[]');
    localStorage.setItem('ml_enquiries', JSON.stringify([enquiryRecord, ...existingEnquiries]));

    setLoading(false);
    setSuccessEnquiryId(generatedId);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `*MANIKANDAN LATHE - NEW ENQUIRY*\n` +
      `--------------------------------\n` +
      `📌 *Enquiry ID:* ${successEnquiryId}\n` +
      `👤 *Customer Name:* ${user?.full_name || 'Customer'}\n` +
      `📞 *Phone:* ${user?.phone || 'Not provided'}\n` +
      `🛠️ *Product:* ${title}\n` +
      `📦 *Quantity:* ${quantity}\n` +
      `📐 *Size:* ${sizeRequirement || 'Standard'}\n` +
      `📍 *Location:* ${deliveryLocation}\n` +
      `📝 *Notes:* ${customNotes || 'None'}\n` +
      `--------------------------------\n` +
      `Please review and send quote price.`
    );
    window.open(`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('enquiry_title')} maxWidth="md">
      {successEnquiryId ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-extrabold text-charcoal-900">{t('enquiry_success')}</h3>
          <p className="text-sm text-charcoal-600 max-w-sm mx-auto">
            {isTamil
              ? 'உங்கள் விசாரணை பதிவு செய்யப்பட்டது. நிர்வாகி சரிபார்த்து விரைவாக தொடர்புகொள்வார்.'
              : 'Your enquiry has been registered. The shop admin will review specifications and update status.'}
          </p>

          <div className="bg-warm-bg p-3.5 rounded-xl border border-warm-border inline-block">
            <span className="text-xs text-charcoal-500 block mb-0.5">{t('enquiry_id')}</span>
            <span className="text-base font-extrabold text-brand-600 font-mono tracking-wide">{successEnquiryId}</span>
          </div>

          <div className="pt-4 flex flex-col gap-2.5">
            <Button
              onClick={handleOpenWhatsApp}
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              icon={<MessageSquare className="w-4 h-4" />}
              fullWidth
            >
              {isTamil ? 'வாட்ஸ்அப் வழியாக அனுப்புக' : 'Send via WhatsApp to Shop'}
            </Button>

            <Button
              onClick={() => {
                onClose();
                navigate('/orders');
              }}
              variant="secondary"
              fullWidth
            >
              {isTamil ? 'என் விசாரணைகளைப் பார்' : 'View My Enquiries & Orders'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected Product Banner */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-bg border border-warm-border">
            <img
              src={product.primary_image || (product.images && product.images[0]) || ''}
              alt={title}
              className="w-14 h-14 rounded-lg object-cover border border-warm-border"
            />
            <div>
              <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider block">
                {t('enquiry_product')}
              </span>
              <h4 className="text-sm font-bold text-charcoal-900 line-clamp-1">{title}</h4>
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">{t('enquiry_qty')} *</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-warm-muted font-bold text-lg hover:bg-brand-100 text-charcoal-800 border border-brand-200"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-extrabold text-base py-2 border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-warm-muted font-bold text-lg hover:bg-brand-100 text-charcoal-800 border border-brand-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Size / Dimensions Requirement */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">{t('enquiry_size')}</label>
            <input
              type="text"
              placeholder={product.available_sizes || 'e.g. 10ft x 6ft / Standard'}
              value={sizeRequirement}
              onChange={(e) => setSizeRequirement(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Delivery Location */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">{t('enquiry_location')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Madurai Main / Anna Nagar"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Custom Notes */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1">{t('enquiry_notes')}</label>
            <textarea
              rows={2}
              placeholder="e.g. Metal thickness preference, color, special hinge requirements..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-warm-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
              size="lg"
              icon={<Send className="w-4 h-4" />}
            >
              {t('enquiry_submit')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
