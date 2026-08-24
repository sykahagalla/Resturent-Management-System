import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

interface ImageFallbackProps {
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const ImageFallback: React.FC<ImageFallbackProps> = ({ 
  className = '', 
  iconSize = 'md' 
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-orange-100 via-red-50 to-orange-50 ${className}`}>
      <div className="flex flex-col items-center justify-center text-orange-300">
        <UtensilsCrossed className={`${sizeMap[iconSize]} drop-shadow-sm`} />
      </div>
    </div>
  );
};

export default ImageFallback;
