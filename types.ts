

export interface Image {
  id: string;
  src: string;
  alt: string;
  rotation?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Category {
  id: string;
  title: string;
  images: Image[];
}