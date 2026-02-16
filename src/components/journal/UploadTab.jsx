import React from 'react';
import { Upload, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function UploadTab({ onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 z-30",
        "bg-primary text-primary-foreground",
        "px-3 py-6 rounded-l-lg shadow-lg",
        "flex flex-col items-center gap-2",
        "transition-all duration-200 hover:px-4",
        "group"
      )}
    >
      <ChevronLeft className="w-4 h-4 group-hover:animate-pulse" />
      <div className="writing-mode-vertical text-sm font-semibold tracking-wide">
        Upload
      </div>
      <Upload className="w-4 h-4" />
      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </button>
  );
}