
import React, { useEffect, useCallback } from 'react';
import { Image } from '../types';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ModalProps {
  image: Image;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Modal: React.FC<ModalProps> = ({ image, onClose, onNext, onPrev }) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight') {
      onNext();
    } else if (e.key === 'ArrowLeft') {
      onPrev();
    }
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Vista de imagen ampliada"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Previous Button */}
        <button
          onClick={onPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Imagen anterior"
        >
          <ChevronLeftIcon />
        </button>

        {/* Image Container */}
        <div className="relative max-w-full max-h-full flex flex-col items-center justify-center">
          <img
            src={image.src}
            alt={image.alt}
            className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          <p className="mt-4 text-center text-gray-300 bg-black bg-opacity-50 px-3 py-1 rounded-md">{image.alt}</p>
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Siguiente imagen"
        >
          <ChevronRightIcon />
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 z-10 m-4 p-2 text-white bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Cerrar"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default Modal;
