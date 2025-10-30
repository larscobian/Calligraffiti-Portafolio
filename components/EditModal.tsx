import React, { useState, useEffect, useCallback } from 'react';
import { Image } from '../types';

interface EditModalProps {
  image: Image;
  onClose: () => void;
  onSave: (image: Image) => void;
}

const EditModal: React.FC<EditModalProps> = ({ image, onClose, onSave }) => {
  const [rotation, setRotation] = useState(image.rotation || 0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

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

  const rotateLeft = () => setRotation(prev => (prev - 90) % 360);
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  const handleSave = () => {
    onSave({ ...image, rotation });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-auto border border-gray-700 flex flex-col">
        <header className="p-4 border-b border-gray-700">
            <h2 id="edit-modal-title" className="text-xl font-bold text-white">
            Editar Imagen
            </h2>
        </header>
        
        <main className="p-6 flex-grow flex items-center justify-center overflow-hidden">
             <img
                src={image.src}
                alt={image.alt}
                className="max-w-full max-h-[60vh] object-contain transition-transform duration-300"
                style={{ transform: `rotate(${rotation}deg)` }}
            />
        </main>
        
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
                onClick={rotateLeft}
                className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
            >
                Rotar Izquierda
            </button>
            <button
                onClick={rotateRight}
                className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
            >
                Rotar Derecha
            </button>
          </div>
          <div className="flex gap-4">
             <button
                onClick={onClose}
                className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
            >
                Cancelar
            </button>
            <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            >
                Guardar Cambios
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EditModal;
