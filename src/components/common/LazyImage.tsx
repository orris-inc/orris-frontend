/**
 * LazyImage Component
 * Optimized image loading with:
 * - Native lazy loading
 * - Intersection Observer fallback
 * - Blur placeholder
 * - Error handling with retry
 * - Responsive images support (srcset)
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ImgHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export interface LazyImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alternative text for accessibility */
  alt: string;
  /** Placeholder image or blur data URL */
  placeholder?: string;
  /** Blur amount for placeholder (px) */
  blurAmount?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: (error: Error) => void;
  /** Number of retry attempts on error */
  retryCount?: number;
  /** Delay between retries (ms) */
  retryDelay?: number;
  /** Aspect ratio for placeholder container (e.g., "16/9", "1/1") */
  aspectRatio?: string;
  /** Whether to use native loading="lazy" only (no intersection observer) */
  nativeOnly?: boolean;
}

export function LazyImage({
  src,
  alt,
  placeholder,
  blurAmount = 20,
  rootMargin = '50px',
  threshold = 0.01,
  onLoad,
  onError,
  retryCount = 2,
  retryDelay = 1000,
  aspectRatio,
  nativeOnly = false,
  className,
  style,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(nativeOnly);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [retries, setRetries] = useState(0);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (nativeOnly || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold, nativeOnly]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;
    setCurrentSrc(src);
  }, [isInView, src]);

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle load error with retry
  const handleError = useCallback(() => {
    if (retries < retryCount) {
      // Retry with exponential backoff
      const delay = retryDelay * Math.pow(2, retries);
      setTimeout(() => {
        setRetries((r) => r + 1);
        // Force reload by adding cache-busting query param
        setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}_retry=${retries + 1}`);
      }, delay);
    } else {
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${src}`));
    }
  }, [src, retries, retryCount, retryDelay, onError]);

  // Container style with aspect ratio
  const containerStyle = aspectRatio
    ? { aspectRatio, ...style }
    : style;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatio && 'w-full',
        className
      )}
      style={containerStyle}
    >
      {/* Placeholder / blur background */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${blurAmount}px)`, transform: 'scale(1.1)' }}
        />
      )}

      {/* Skeleton when no placeholder */}
      {!placeholder && !isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse motion-reduce:animate-none bg-muted" />
      )}

      {/* Main image */}
      {currentSrc && !hasError && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={nativeOnly ? 'lazy' : undefined}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center p-4">
            <svg
              className="mx-auto h-8 w-8 mb-2 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">{alt || 'Image'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ResponsiveImage Component
 * Supports srcset for different screen sizes and WebP format
 */
export interface ResponsiveImageProps extends Omit<LazyImageProps, 'srcSet' | 'onLoad' | 'onError'> {
  /** Array of image sources for different widths */
  sources?: Array<{
    src: string;
    width: number;
  }>;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** WebP version of the image */
  webpSrc?: string;
  /** WebP srcset for responsive images */
  webpSrcSet?: Array<{
    src: string;
    width: number;
  }>;
}

export function ResponsiveImage({
  src,
  sources,
  sizes = '100vw',
  webpSrc,
  webpSrcSet,
  alt,
  className,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate srcset string
  const generateSrcSet = (items?: Array<{ src: string; width: number }>) =>
    items?.map((item) => `${item.src} ${item.width}w`).join(', ');

  const jpegSrcSet = generateSrcSet(sources);
  const webpSrcSetString = generateSrcSet(webpSrcSet);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {/* Skeleton when loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse motion-reduce:animate-none bg-muted" />
      )}

      <picture>
        {/* WebP sources */}
        {webpSrcSetString && (
          <source
            type="image/webp"
            srcSet={webpSrcSetString}
            sizes={sizes}
          />
        )}
        {webpSrc && !webpSrcSetString && (
          <source type="image/webp" srcSet={webpSrc} />
        )}

        {/* JPEG/PNG sources */}
        {jpegSrcSet && (
          <source srcSet={jpegSrcSet} sizes={sizes} />
        )}

        {/* Fallback image */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      </picture>

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <span className="text-sm">{alt}</span>
        </div>
      )}
    </div>
  );
}
