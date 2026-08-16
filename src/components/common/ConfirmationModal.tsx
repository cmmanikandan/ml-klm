import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm & Proceed',
  cancelText = 'Cancel',
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="text-center py-4 space-y-4">
        <div className={`w-14 h-14 rounded-2xl ${isDanger ? 'bg-rose-100 text-rose-600 border-rose-300' : 'bg-amber-100 text-amber-600 border-amber-300'} border flex items-center justify-center mx-auto shadow-sm`}>
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-charcoal-900">{title}</h3>
          <p className="text-xs text-charcoal-600 font-medium whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            fullWidth
            className="py-2.5 text-xs font-bold"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant="primary"
            fullWidth
            className={`py-2.5 text-xs font-black shadow-md ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
