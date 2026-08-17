import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onTranscript,
}) => {
  const { language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'ta-IN' | 'en-IN'>(
    language === 'ta' ? 'ta-IN' : 'en-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (language === 'ta') {
      setSelectedLang('ta-IN');
    } else {
      setSelectedLang('en-IN');
    }
  }, [language]);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen, selectedLang]);

  const startListening = () => {
    setErrorMsg(null);
    setInterimText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் தேடல் வசதி ஆதரிக்கப்படவில்லை.'
          : 'Voice search is not supported on this browser. Try Chrome or Edge.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInterimText(currentTranscript);

        if (event.results[0].isFinal) {
          const finalClean = currentTranscript.trim();
          if (finalClean) {
            setTimeout(() => {
              onTranscript(finalClean);
              onClose();
            }, 500);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அணுகல் அனுமதிக்கப்படவில்லை. அமைப்புகளில் மைக் அனுமதியை வழங்கவும்.'
              : 'Microphone access denied. Please allow microphone permissions.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMsg(
            language === 'ta'
              ? 'குரல் கேட்கவில்லை. மீண்டும் மைக்கை அழுத்திப் பேசவும்.'
              : 'No speech detected. Please tap the mic and speak clearly.'
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 sm:p-7 border border-slate-700 shadow-2xl relative text-center space-y-6 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{selectedLang === 'ta-IN' ? 'தமிழ் குரல் தேடல்' : 'Voice Search'}</span>
          </div>
          <h3 className="text-lg font-black text-white">
            {selectedLang === 'ta-IN' ? 'பொருளின் பெயரைப் பேசவும்' : 'Speak to Search Products'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedLang === 'ta-IN'
              ? 'எ.கா: "7 கலப்பை", "ரோலிங் ஷட்டர்", "மெயின் கேட்"'
              : 'e.g., "7 Kallapai", "Rolling Shutter", "Gate Design"'}
          </p>
        </div>

        {/* Language Switch Toggle */}
        <div className="flex items-center justify-center gap-2 bg-slate-800 p-1 rounded-2xl border border-slate-700 max-w-[220px] mx-auto">
          <button
            type="button"
            onClick={() => setSelectedLang('ta-IN')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedLang === 'ta-IN'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            தமிழ் (Tamil)
          </button>
          <button
            type="button"
            onClick={() => setSelectedLang('en-IN')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              selectedLang === 'en-IN'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>

        {/* Central Animated Mic Sphere */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping opacity-75" />
              <div className="absolute -inset-2 rounded-full border-2 border-brand-500/40 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-95 ${
              isListening
                ? 'bg-gradient-to-tr from-brand-500 to-amber-500 text-white ring-4 ring-brand-400/50'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-600'
            }`}
          >
            {isListening ? (
              <Mic className="w-9 h-9 animate-bounce-subtle" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Live Detected Speech or Instructions */}
        <div className="min-h-[48px] flex items-center justify-center px-2">
          {errorMsg ? (
            <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
          ) : interimText ? (
            <p className="text-sm font-extrabold text-amber-300 bg-slate-800/80 px-4 py-2 rounded-2xl border border-amber-500/30">
              "{interimText}"
            </p>
          ) : isListening ? (
            <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-brand-400 inline" />
              <span>
                {selectedLang === 'ta-IN'
                  ? 'கேட்டுக்கொண்டிருக்கிறது... இப்போது பேசவும்'
                  : 'Listening... Speak now'}
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              {selectedLang === 'ta-IN' ? 'தொடங்க மைக்கை அழுத்தவும்' : 'Tap the microphone to speak'}
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold"
        >
          {language === 'ta' ? 'ரத்து செய்க' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};
