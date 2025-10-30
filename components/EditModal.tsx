import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Image } from '../types';

interface EditModalProps {
  image: Image;
  onClose: () => void;
  onSave: (image: Image) => void;
}

const EditModal: React.FC<EditModalProps> = ({ image, onClose, onSave }) => {
  const [rotation, setRotation] = useState(image.rotation || 0);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState(image.crop || { x: 25, y: 25, width: 50, height: 50 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<{ type: string, startX: number, startY: number, startCrop: any } | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    actionRef.current = { type, startX: e.clientX, startY: e.clientY, startCrop: { ...crop } };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!actionRef.current || !containerRef.current) return;
    
    const { type, startX, startY, startCrop } = actionRef.current;
    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
    
    const dx = ((e.clientX - startX) / containerWidth) * 100;
    const dy = ((e.clientY - startY) / containerHeight) * 100;
    
    let newCrop = { ...crop };
    
    if (type === 'move') {
      newCrop.x = Math.max(0, Math.min(startCrop.x + dx, 100 - newCrop.width));
      newCrop.y = Math.max(0, Math.min(startCrop.y + dy, 100 - newCrop.height));
    } else {
      if (type.includes('l')) {
        const newX = Math.max(0, startCrop.x + dx);
        newCrop.width = Math.min(100, startCrop.width - (newX - startCrop.x));
        newCrop.x = newX;
      }
      if (type.includes('r')) {
        newCrop.width = Math.max(0, Math.min(startCrop.width + dx, 100 - startCrop.x));
      }
      if (type.includes('t')) {
        const newY = Math.max(0, startCrop.y + dy);
        newCrop.height = Math.min(100, startCrop.height - (newY - startCrop.y));
        newCrop.y = newY;
      }
      if (type.includes('b')) {
        newCrop.height = Math.max(0, Math.min(startCrop.height + dy, 100 - startCrop.y));
      }
    }
    setCrop(newCrop);
  }, [crop]);

  const handleMouseUp = useCallback(() => {
    actionRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleSave = () => {
    onSave({ ...image, rotation, crop: isCropping ? crop : image.crop });
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={(e) => { if(e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-labelledby="edit-modal-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-auto border border-gray-700 flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-gray-700 flex-shrink-0">
          <h2 id="edit-modal-title" className="text-xl font-bold text-white">Editar Imagen</h2>
        </header>
        
        <main className="p-6 flex-grow flex items-center justify-center overflow-hidden">
          <div ref={containerRef} className="relative select-none" style={{ aspectRatio: naturalSize.width && naturalSize.height ? `${naturalSize.width}/${naturalSize.height}`: 'auto', maxHeight: '100%', maxWidth: '100%'}}>
            <img
              ref={imgRef}
              src={image.src}
              alt={image.alt}
              onLoad={handleImageLoad}
              className="max-w-full max-h-full object-contain"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                clipPath: isCropping ? `inset(${crop.y}% ${100 - crop.x - crop.width}% ${100 - crop.y - crop.height}% ${crop.x}%)` : 'none',
              }}
            />
            {isCropping && (
              <div className="absolute inset-0 cursor-move" onMouseDown={(e) => handleMouseDown(e, 'move')} style={{
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                top: `${crop.y}%`,
                left: `${crop.x}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}>
                <div className="absolute inset-0 border-2 border-dashed border-white">
                  {['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'].map(handle => (
                    <div key={handle} onMouseDown={(e) => handleMouseDown(e, handle)} className="absolute w-3 h-3 bg-white rounded-full" style={{
                      top: handle.includes('t') ? '-6px' : handle.includes('b') ? 'auto' : '50%',
                      bottom: handle.includes('b') ? '-6px' : 'auto',
                      left: handle.includes('l') ? '-6px' : handle.includes('r') ? 'auto' : '50%',
                      right: handle.includes('r') ? '-6px' : 'auto',
                      transform: 'translate(-50%, -50%)',
                      cursor: `${handle.length === 1 ? (handle === 't' || handle === 'b' ? 'ns-resize' : 'ew-resize') : (handle === 'tl' || handle === 'br' ? 'nwse-resize' : 'nesw-resize')}`
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        
        <footer className="p-4 bg-gray-800/50 border-t border-gray-700 flex-shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
             <label htmlFor="rotation" className="flex items-center gap-3 text-sm font-medium text-gray-300">
              Rotación:
              <input
                type="range"
                id="rotation"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full sm:w-48"
              />
              <span className="font-mono bg-gray-700 px-2 py-1 rounded w-16 text-center">{rotation}°</span>
            </label>
            <button onClick={() => setIsCropping(!isCropping)} className={`px-4 py-2 text-sm rounded-md font-semibold transition-colors w-full ${isCropping ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}>
              {isCropping ? 'Desactivar Recorte' : 'Activar Recorte'}
            </button>
          </div>
          <div className="flex gap-4">
             <button onClick={onClose} className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors">Cancelar</button>
             <button onClick={handleSave} className="px-4 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors">Guardar Cambios</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default EditModal;
