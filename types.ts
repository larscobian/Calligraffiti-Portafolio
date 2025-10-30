
export interface Image {
  id: string;
  src: string;
  alt: string;
  rotation?: number;
}

export interface Category {
  id: string;
  title: string;
  images: Image[];
}