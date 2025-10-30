import React, { useEffect, useCallback } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto border border-gray-700">
        <h2 id="confirmation-title" className="text-xl font-bold text-white mb-4">
          {title}
        </h2>
        <p id="confirmation-message" className="text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;