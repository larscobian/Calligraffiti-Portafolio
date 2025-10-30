import React, { useState, useEffect, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { apiKey: string; clientId: string }) => void;
}

const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopy = useCallback(() => {
    if (origin) {
      navigator.clipboard.writeText(origin).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }, [origin]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const savedConfig = localStorage.getItem('googleApiConfig');
      if (savedConfig) {
        const { apiKey: savedKey, clientId: savedId } = JSON.parse(savedConfig);
        setApiKey(savedKey || '');
        setClientId(savedId || '');
      }
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim() && clientId.trim()) {
      onSave({ apiKey: apiKey.trim(), clientId: clientId.trim() });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-settings-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto border border-gray-700">
        <h2 id="api-settings-title" className="text-xl font-bold text-white mb-4">
          Configuración de API de Google
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          Ingresa tus credenciales de la Consola de Google Cloud. Estas se guardarán de forma segura en tu navegador.
        </p>

        <div className="mb-6">
          <label htmlFor="originUrl" className="block text-sm font-medium text-gray-300 mb-1">
            URL de Origen Autorizado
          </label>
          <p className="text-gray-400 mb-2 text-xs">
            Copia esta URL y agrégala a los 'Orígenes de JavaScript autorizados' en la configuración de tu Client ID de OAuth para que la autenticación funcione.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              id="originUrl"
              readOnly
              value={origin}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-gray-300 select-all"
            />
            <button
              onClick={handleCopy}
              className="p-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300 flex items-center justify-center w-10 h-10 flex-shrink-0"
              aria-label="Copiar URL"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="AIzaSy..."
            />
          </div>
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-300 mb-1">
              OAuth Client ID
            </label>
            <input
              type="password"
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="... .apps.googleusercontent.com"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md font-semibold text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || !clientId.trim()}
            className="px-4 py-2 rounded-md font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Guardar y Recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiSettingsModal;