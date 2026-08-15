import React from 'react';
import { Phone, MessageSquare, MapPin, Clock, ShieldCheck, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_SHOP_INFO } from '../lib/supabase';

export const ContactPage: React.FC = () => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  return (
    <div className="min-h-screen bg-warm-bg pb-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-white via-warm-bg to-warm-bg py-10 border-b border-warm-border text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-widest block">
            {isTamil ? 'தொடர்பு கொள்ள' : 'CONTACT US'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-charcoal-900 tracking-tight">
            {isTamil ? (
              <>மணிகண்டன் லேத் <span className="text-brand-600">பட்டறை முகவரி</span> & தொடர்பு</>
            ) : (
              <>Visit Workshop or <span className="text-brand-600">Contact Us</span></>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 font-medium">
            {isTamil ? 'அனைத்து வகையான வெல்டிங் மற்றும் லேத் தேவைகளுக்கும் எங்களை தொடர்பு கொள்ளவும்.' : 'Get in touch for custom measurements, price quotes, and workshop visits.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Contact Info Cards */}
          <div className="space-y-4">
            
            {/* Workshop Address Card */}
            <div className="bg-white p-6 rounded-3xl border border-warm-border shadow-card space-y-4">
              <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>MANIKANDAN LATHE – WELDING WORKS</span>
              </div>

              <div className="space-y-4 text-sm text-charcoal-800 font-medium">
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-warm-bg border border-warm-border">
                  <MapPin className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-extrabold text-charcoal-500 block">Workshop Location</span>
                    <span className="font-bold text-charcoal-900">{DEFAULT_SHOP_INFO.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-warm-bg border border-warm-border">
                  <Clock className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-xs font-extrabold text-charcoal-500 block">Working Hours</span>
                    <span className="font-bold text-charcoal-900">
                      {isTamil ? DEFAULT_SHOP_INFO.working_hours_ta : DEFAULT_SHOP_INFO.working_hours_en}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-warm-bg border border-warm-border">
                  <Mail className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <span className="text-xs font-extrabold text-charcoal-500 block">Email Address</span>
                    <span className="font-bold text-charcoal-900">{DEFAULT_SHOP_INFO.email}</span>
                  </div>
                </div>
              </div>

              {/* Direct Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${DEFAULT_SHOP_INFO.phone}`}
                  className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-md transition-all text-sm"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call {DEFAULT_SHOP_INFO.phone}</span>
                </a>

                <a
                  href={`https://wa.me/${DEFAULT_SHOP_INFO.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-4 rounded-2xl shadow-md transition-all text-sm"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Embedded Google Map Frame */}
          <div className="bg-white p-4 rounded-3xl border border-warm-border shadow-card space-y-3">
            <h3 className="text-sm font-extrabold text-charcoal-900 px-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Workshop Location Map (Kallimandhayam, Dindigul Dist.)</span>
            </h3>

            <div className="w-full h-[360px] sm:h-[400px] rounded-2xl overflow-hidden border border-warm-border shadow-inner">
              <iframe
                title="Manikandan Lathe Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3930.1257412852726!2d78.1189445147926!3d9.91950599290637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00c582b1189269%3A0x86915155799a770!2sMadurai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1690000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              href={DEFAULT_SHOP_INFO.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-charcoal-900 hover:bg-black text-white font-extrabold py-3 px-4 rounded-2xl shadow-md transition-all text-xs"
            >
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>{isTamil ? 'கூகிள் மேப் செயலில் திறக்க' : 'Open Location in Google Maps App'}</span>
            </a>
          </div>

        </div>
      </div>

    </div>
  );
};
