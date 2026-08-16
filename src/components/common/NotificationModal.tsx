import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface NotificationState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: NotificationType;
  onClose?: () => void;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: NotificationType;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-600',
          borderColor: 'border-rose-300',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-300',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-300',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'warning':
      default:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-600',
          borderColor: 'border-amber-300',
          btnClass: 'bg-brand-600 hover:bg-brand-700 text-white'
        };
    }
  };

  const config = getIconConfig();
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center py-4 space-y-4">
        <div className={`w-14 h-14 rounded-2xl ${config.bgColor} ${config.textColor} border ${config.borderColor} flex items-center justify-center mx-auto shadow-sm`}>
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-charcoal-900">{title}</h3>
          <p className="text-xs text-charcoal-600 font-medium whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-black shadow-md transition-all ${config.btnClass}`}
          >
            Got it, Continue
          </button>
        </div>
      </div>
    </Modal>
  );
};
