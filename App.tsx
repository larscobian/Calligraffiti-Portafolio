import React, { useState, useEffect, useCallback } from 'react';
import ImageGallery from './components/ImageGallery';
import Modal from './components/Modal';
import ConfirmationModal from './components/ConfirmationModal';
import EditModal from './components/EditModal';
import ApiSettingsModal from './components/ApiSettingsModal';
import { SettingsIcon, GoogleIcon } from './components/icons';
import { INITIAL_CATEGORIES } from './constants';
import { Category, Image } from './types';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive";
const ROOT_FOLDER_NAME = "Calligraffiti Portafolio";

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(
    INITIAL_CATEGORIES.map(c => ({ ...c, images: [] }))
  );
  const [apiConfig, setApiConfig] = useState<{apiKey: string, clientId: string} | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [gapiReady, setGapiReady] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [modalState, setModalState] = useState<{ image: Image; gallery: Image[] } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ categoryId: string; imageId: string; } | null>(null);
  const [editingImage, setEditingImage] = useState<{category: Category, image: Image} | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('googleApiConfig');
    if (savedConfig) {
      setApiConfig(JSON.parse(savedConfig));
    }

    // Load Google API scripts
    const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    // FIX: Replaced .onload with .addEventListener to fix TypeScript error. Property 'onload' does not exist on type 'Element'.
    if (gapiScript) gapiScript.addEventListener('load', () => window.gapi.load('client', () => setGapiReady(true)));

    const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    // FIX: Replaced .onload with .addEventListener to fix TypeScript error. Property 'onload' does not exist on type 'Element'.
    if (gisScript) gisScript.addEventListener('load', () => setGisReady(true));
  }, []);
  
  const loadCategoriesFromDrive = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage(`Buscando la carpeta raíz "${ROOT_FOLDER_NAME}"...`);
    try {
      // 1. Find root folder
      const folderRes = await window.gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${ROOT_FOLDER_NAME}' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (!folderRes.result.files || folderRes.result.files.length === 0) {
        throw new Error(`No se encontró la carpeta raíz "${ROOT_FOLDER_NAME}".`);
      }
      const rootFolderId = folderRes.result.files[0].id;

      // 2. Fetch images for each category
      const updatedCategories = await Promise.all(
        INITIAL_CATEGORIES.map(async (category) => {
          setLoadingMessage(`Cargando categoría: ${category.title}...`);

          // Find category subfolder
          const subfolderRes = await window.gapi.client.drive.files.list({
            q: `'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${category.title}' and trashed=false`,
            fields: 'files(id)',
          });

          if (!subfolderRes.result.files || subfolderRes.result.files.length === 0) {
            console.warn(`No se encontró la carpeta para la categoría: ${category.title}`);
            return { ...category, images: [] };
          }
          const categoryFolderId = subfolderRes.result.files[0].id;

          // List images in subfolder
          const imagesRes = await window.gapi.client.drive.files.list({
            q: `'${categoryFolderId}' in parents and mimeType contains 'image/' and trashed=false`,
            fields: 'files(id, name, webContentLink)',
          });

          const images = imagesRes.result.files ? 
            imagesRes.result.files.map(file => ({
              id: file.id,
              src: file.webContentLink,
              alt: file.name,
              rotation: 0
            })) : [];

          return { ...category, id: categoryFolderId, images };
        })
      );
      setCategories(updatedCategories);
    } catch (err: any) {
      console.error("Error loading from Drive:", err);
      alert(`Error al cargar desde Google Drive: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const updateAuthStatus = useCallback((signedIn: boolean) => {
    setIsSignedIn(signedIn);
    if (signedIn) {
      loadCategoriesFromDrive();
    }
  }, [loadCategoriesFromDrive]);

  useEffect(() => {
    if (gapiReady && gisReady && apiConfig) {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: apiConfig.clientId,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            throw tokenResponse.error;
          }
          updateAuthStatus(true);
        },
      });

      window.gapi.client.init({
        apiKey: apiConfig.apiKey,
        discoveryDocs: DISCOVERY_DOCS,
      }).then(() => {
        // No need to check for existing token, user will click connect
      }).catch((err: any) => console.error("Error initializing gapi client:", err));
    }
  }, [gapiReady, gisReady, apiConfig, updateAuthStatus]);
  
  const handleAuthClick = () => {
    if (window.gapi.client.getToken() === null) {
      window.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      window.tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  const showImagePicker = async (categoryId: string) => {
    if (!apiConfig) return;

    const devKey = apiConfig.apiKey;
    const token = window.gapi.client.getToken();
    if (!token) {
      handleAuthClick();
      return;
    }
    const accessToken = token.access_token;
    
    const view = new window.google.picker.View(window.google.picker.ViewId.PHOTOS);
    view.setMimeTypes("image/jpeg,image/png,image/gif");
    const picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(apiConfig.clientId.split('-')[0]) // AppId is the project number
      .setOAuthToken(accessToken)
      .addView(view)
      .addView(new window.google.picker.DocsUploadView().setParent(categoryId))
      .setDeveloperKey(devKey)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED || data.action === window.google.picker.Action.UPLOADED) {
           loadCategoriesFromDrive(); // Reload everything to get new images
        }
      })
      .build();
    picker.setVisible(true);
  };
  
  const handleSaveApiConfig = (config: {apiKey: string, clientId: string}) => {
    localStorage.setItem('googleApiConfig', JSON.stringify(config));
    setApiConfig(config);
    setIsSettingsModalOpen(false);
    window.location.reload(); // Easiest way to re-init all gapi scripts with new config
  };

  const handleImageClick = (image: Image, gallery: Image[]) => setModalState({ image, gallery });
  const handleCloseModal = () => setModalState(null);

  const handleNextImage = () => {
    if (!modalState) return;
    const { image, gallery } = modalState;
    const currentIndex = gallery.findIndex(img => img.id === image.id);
    const nextIndex = (currentIndex + 1) % gallery.length;
    setModalState({ image: gallery[nextIndex], gallery });
  };

  const handlePrevImage = () => {
    if (!modalState) return;
    const { image, gallery } = modalState;
    const currentIndex = gallery.findIndex(img => img.id === image.id);
    const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    setModalState({ image: gallery[prevIndex], gallery });
  };
  
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { categoryId, imageId } = deleteConfirmation;
    try {
      await window.gapi.client.drive.files.delete({ fileId: imageId });
      setCategories(prev => prev.map(cat => ({
        ...cat,
        images: cat.images.filter(img => img.id !== imageId)
      })));
    } catch (err) {
      console.error("Failed to delete file from Drive:", err);
      alert("No se pudo eliminar la imagen de Google Drive.");
    }
    setDeleteConfirmation(null);
  };
  
  const cancelDelete = () => setDeleteConfirmation(null);
  const handleEditImage = (category: Category, image: Image) => setEditingImage({category, image});
  const handleCloseEditModal = () => setEditingImage(null);
  const handleSaveImageEdit = (updatedImage: Image) => {
    // Note: Rotation is a frontend-only feature for now, not saved to Drive.
    if (!editingImage) return;
    setCategories(prev => prev.map(cat => cat.id === editingImage.category.id ? {
      ...cat,
      images: cat.images.map(img => img.id === updatedImage.id ? updatedImage : img),
    } : cat));
    setEditingImage(null);
  };

  const renderContent = () => {
    if (!apiConfig) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Configuración Requerida</h2>
          <p className="text-gray-400 mb-6 max-w-md text-center">Para conectar con Google Drive, por favor provee tu API Key y Client ID.</p>
          <button onClick={() => setIsSettingsModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <SettingsIcon /> Configurar API de Google Drive
          </button>
        </div>
      );
    }

    if (!isSignedIn) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Conectar a Google Drive</h2>
          <p className="text-gray-400 mb-6">Accede a tus imágenes de forma segura.</p>
          <button onClick={handleAuthClick} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <GoogleIcon /> Conectar con Google Drive
          </button>
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400"></div>
            <p className="mt-4 text-gray-300">{loadingMessage || 'Cargando...'}</p>
        </div>
      );
    }

    return (
       <div className="space-y-4">
          {categories.map(category => (
            <ImageGallery
              key={category.id}
              category={category}
              onAddImages={() => showImagePicker(category.id)}
              onImageClick={handleImageClick}
              onDeleteImage={(catId, imgId) => setDeleteConfirmation({ categoryId: catId, imageId: imgId })}
              onEditImage={handleEditImage}
            />
          ))}
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
       <ApiSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveApiConfig}
      />
      {modalState && (
        <Modal
          image={modalState.image}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
        />
      )}
      <ConfirmationModal
        isOpen={!!deleteConfirmation}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar esta imagen? Esta acción la eliminará permanentemente de tu Google Drive."
      />
      {editingImage && (
        <EditModal
          image={editingImage.image}
          onClose={handleCloseEditModal}
          onSave={handleSaveImageEdit}
        />
      )}
    </div>
  );
};

export default App;