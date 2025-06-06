import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Create a placeholder aspect ratio if dimensions are provided
  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        ...(aspectRatio && !height && { paddingBottom: `${aspectRatio}%` })
      }}
    >
      {!imageError && (
        <>
          {/* Placeholder background while loading */}
          {!imageLoaded && (
            <div 
              className="absolute inset-0 bg-parchment/50 animate-pulse flex items-center justify-center"
              style={{ width: '100%', height: '100%' }}
            >
              <div className="text-biblical-brown/50 text-sm">Loading...</div>
            </div>
          )}
          
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : loading}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`${aspectRatio ? 'absolute inset-0' : ''} w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              maxWidth: '100%',
              height: aspectRatio ? '100%' : 'auto',
            }}
          />
        </>
      )}
      
      {/* Error fallback */}
      {imageError && (
        <div 
          className="absolute inset-0 bg-parchment/30 flex items-center justify-center border border-parchment-dark"
          style={{ width: '100%', height: height || 200 }}
        >
          <div className="text-biblical-brown/50 text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 