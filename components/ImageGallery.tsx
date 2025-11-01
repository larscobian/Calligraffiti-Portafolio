import React, { useRef, useEffect, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import { Category, Image } from '../types';
import { UploadIcon, TrashIcon, EditIcon } from './icons';

interface ImageGalleryProps {
  category: Category;
  onAddImages: () => void;
  onImageClick: (image: Image, gallery: Image[]) => void;
  onDeleteImage: (categoryId: string, imageId: string) => void;
  onEditImage: (category: Category, image: Image) => void;
  isEditMode: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ category, onAddImages, onImageClick, onDeleteImage, onEditImage, isEditMode }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isJumpingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const IS_INFINITE = category.images.length > 4;
  const IS_PERSPECTIVE = IS_INFINITE && !isMobile;
  const CLONE_COUNT = IS_INFINITE ? Math.min(3, category.images.length) : 0;

  const extendedImages = useMemo(() => {
    if (!IS_INFINITE) return category.images;
    return [
      ...category.images.slice(-CLONE_COUNT),
      ...category.images,
      ...category.images.slice(0, CLONE_COUNT),
    ];
  }, [category.images, IS_INFINITE, CLONE_COUNT]);

  const getItems = useCallback(() => {
    // FIX: The type of `el` was being inferred as `unknown`. Using a type predicate
    // with `instanceof HTMLElement` ensures type safety before accessing `classList`.
    return Array.from(scrollContainerRef.current?.children || []).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('gallery-image-item')
    );
  }, []);

  useEffect(() => {
    if (!IS_PERSPECTIVE) {
      getItems().forEach(item => {
        const el = item as HTMLElement;
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.opacity = '';
        el.style.boxShadow = '';
      });
    }
  }, [IS_PERSPECTIVE, getItems, category.images]);
  
  const handleScrollEffects = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const items = getItems();
    if (items.length === 0) return;
    
    const containerWidth = container.offsetWidth;
    const scrollCenter = container.scrollLeft + containerWidth / 2;

    let closestIndex = -1;
    let minDistance = Infinity;

    items.forEach((itemEl, index) => {
      const el = itemEl as HTMLDivElement;
      const imageCenter = el.offsetLeft + el.offsetWidth / 2;
      const distanceFromCenter = imageCenter - scrollCenter;
      
      const absDistance = Math.abs(distanceFromCenter);
      
      if (absDistance < minDistance) {
        minDistance = absDistance;
        closestIndex = index;
      }
      
      if (IS_PERSPECTIVE) {
        const scale = Math.max(0.85, 1 - absDistance / (containerWidth * 1.5));
        const rotationY = (distanceFromCenter / (containerWidth / 2)) * -15;
        const zIndex = Math.round(100 - absDistance / 10);
        const opacity = Math.max(0.4, 1 - absDistance / containerWidth);

        el.style.transform = `rotateY(${rotationY}deg) scale(${scale})`;
        el.style.zIndex = String(zIndex);
        el.style.opacity = `${opacity}`;
        el.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
      }
    });
    
    if (closestIndex !== -1) {
      if (IS_PERSPECTIVE) {
        const centeredEl = items[closestIndex] as HTMLDivElement;
        centeredEl.style.transform = `rotateY(0deg) scale(1.05)`;
        centeredEl.style.boxShadow = `0 10px 30px -5px rgba(0,0,0,0.7)`;
        centeredEl.style.zIndex = `101`;
        centeredEl.style.opacity = `1`;
      }
      
      const realIndex = (closestIndex - CLONE_COUNT + category.images.length) % category.images.length;
      setActiveIndex(realIndex);
    }

  }, [getItems, IS_PERSPECTIVE, CLONE_COUNT, category.images.length]);

  const handleInfiniteJump = useCallback(() => {
    if (!IS_INFINITE || isJumpingRef.current) return;

    const container = scrollContainerRef.current;
    const items = getItems();
    if (!container || items.length < 2) return;
    
    const { offsetWidth: itemWidth } = items[0] as HTMLElement;
    const gap = (items[1] as HTMLElement).offsetLeft - ((items[0] as HTMLElement).offsetLeft + itemWidth);
    const totalItemWidth = itemWidth + gap;
    
    // Jump from prefix clones to real items
    if (container.scrollLeft < totalItemWidth * (CLONE_COUNT - 0.5)) {
        isJumpingRef.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollLeft += category.images.length * totalItemWidth;
        // Force style recalculation before re-enabling smooth scroll
        container.getBoundingClientRect();
        container.style.scrollBehavior = 'smooth';
        setTimeout(() => { isJumpingRef.current = false; }, 50);
    } 
    // Jump from suffix clones to real items
    else if (container.scrollLeft > totalItemWidth * (category.images.length + CLONE_COUNT - 1.5)) {
        isJumpingRef.current = true;
        container.style.scrollBehavior = 'auto';
        container.scrollLeft -= category.images.length * totalItemWidth;
        container.getBoundingClientRect();
        container.style.scrollBehavior = 'smooth';
        setTimeout(() => { isJumpingRef.current = false; }, 50);
    }
  }, [IS_INFINITE, CLONE_COUNT, category.images.length, getItems]);

  const onScroll = useCallback(() => {
    if (isJumpingRef.current) return;
    handleScrollEffects();
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(handleInfiniteJump, 150);
  }, [handleScrollEffects, handleInfiniteJump]);
  
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    if (IS_INFINITE) {
        const items = getItems();
        if(items.length > CLONE_COUNT) {
          const firstRealImage = items[CLONE_COUNT] as HTMLElement;
          const newScrollLeft = firstRealImage.offsetLeft - (container.offsetWidth - firstRealImage.offsetWidth) / 2;
          container.scrollLeft = newScrollLeft;
        }
    }
    handleScrollEffects();
  }, [IS_INFINITE, CLONE_COUNT, getItems, extendedImages.length, handleScrollEffects]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container?.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [onScroll]);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };
  
  const handleDotClick = (index: number) => {
    const container = scrollContainerRef.current;
    const items = getItems();
    if (!container || items.length === 0) return;
    
    const targetIndex = IS_INFINITE ? index + CLONE_COUNT : index;
    const targetElement = items[targetIndex] as HTMLElement;
    if(targetElement) {
        const newScrollLeft = targetElement.offsetLeft - (container.offsetWidth - targetElement.offsetWidth) / 2;
        container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <section aria-labelledby={`gallery-title-${category.id}`} className="mb-8 w-full">
      <div className="relative text-center mb-4">
        <h2 id={`gallery-title-${category.id}`} className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 to-violet-600 bg-clip-text text-transparent tracking-wide inline-block">
          {category.title}
        </h2>
        {isEditMode && (
          <button
            onClick={onAddImages}
            className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center justify-center p-2 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
            aria-label={`Añadir fotos a ${category.title}`}
          >
            <UploadIcon />
          </button>
        )}
      </div>
      <div 
        ref={scrollContainerRef} 
        className={`flex overflow-x-auto space-x-2 py-4 custom-scrollbar ${IS_PERSPECTIVE ? 'perspective-scroll' : ''} ${!IS_INFINITE ? 'justify-center' : ''}`}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {extendedImages.map((image, index) => (
          <div 
            key={`${image.id}-${index}`} 
            className="gallery-image-item relative flex-shrink-0 w-64 md:w-72 rounded-lg overflow-hidden shadow-lg shadow-black/50 cursor-pointer group" 
            style={{ scrollSnapAlign: 'center' }}
            onClick={() => onImageClick(image, category.images)}
            onKeyPress={(e) => e.key === 'Enter' && onImageClick(image, category.images)}
            tabIndex={0}
            role="button"
            aria-label={`Ver imagen ${image.alt} en grande`}
          >
            <div className="aspect-[3/4] bg-gray-800 overflow-hidden">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out"
                style={{transform: `rotate(${image.rotation || 0}deg)`}}
                loading="lazy"
              />
            </div>
            {isEditMode && (
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => handleActionClick(e, () => onEditImage(category, image))}
                  className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Editar imagen ${image.alt}`}
                >
                  <EditIcon />
                </button>
                <button
                  onClick={(e) => handleActionClick(e, () => onDeleteImage(category.id, image.id))}
                  className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Eliminar imagen ${image.alt}`}
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {IS_INFINITE && (
        <div className="flex justify-center items-center mt-2 space-x-3" aria-hidden="true">
            {category.images.map((_, index) => (
                <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-purple-400 scale-125' : 'bg-gray-600 hover:bg-gray-500'}`}
                    aria-label={`Ir a la imagen ${index + 1}`}
                />
            ))}
        </div>
      )}
    </section>
  );
};

export default ImageGallery;