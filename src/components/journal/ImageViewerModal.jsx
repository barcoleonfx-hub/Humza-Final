import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ImageViewerModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-card/20"
      >
        <X className="w-6 h-6" />
      </Button>
      
      <img
        src={imageUrl}
        alt="Full size view"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}