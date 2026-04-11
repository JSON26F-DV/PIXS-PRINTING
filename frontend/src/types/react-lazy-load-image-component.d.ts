declare module 'react-lazy-load-image-component' {
  import { ImgHTMLAttributes, ReactNode } from 'react';

  export type LazyLoadImageEffect = 'blur' | 'black-and-white' | 'opacity';

  export interface ScrollPosition {
    x: number;
    y: number;
  }

  export interface LazyLoadImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    afterLoad?: () => void;
    beforeLoad?: () => void;
    delayMethod?: string;
    delayTime?: number;
    effect?: LazyLoadImageEffect;
    placeholder?: ReactNode;
    placeholderSrc?: string;
    threshold?: number;
    useIntersectionObserver?: boolean;
    visibleByDefault?: boolean;
    wrapperClassName?: string;
    wrapperProps?: object;
    scrollPosition?: ScrollPosition;
  }

  export const LazyLoadImage: React.FC<LazyLoadImageProps>;
  export const LazyLoadComponent: React.FC<{ children: ReactNode; placeholder?: ReactNode; threshold?: number; scrollPosition?: ScrollPosition }>;
  export function trackWindowScroll<P>(component: React.ComponentType<P>): React.ComponentType<Omit<P, 'scrollPosition'>>;
}

declare module 'react-lazy-load-image-component/src/effects/blur.css' {
  const content: string;
  export default content;
}

declare module 'react-lazy-load-image-component/src/effects/black-and-white.css' {
  const content: string;
  export default content;
}

declare module 'react-lazy-load-image-component/src/effects/opacity.css' {
  const content: string;
  export default content;
}
