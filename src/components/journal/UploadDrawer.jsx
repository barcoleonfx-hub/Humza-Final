import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, FileText, FileSpreadsheet, FileIcon, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function UploadDrawer({ isOpen, onClose, onUpload, currentDate }) {
  const imageInputRef = useRef(null);
  const chartInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const excelInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const uploadOptions = [
    {
      id: 'pnl_image',
      icon: ImageIcon,
      title: 'Upload P&L Screenshot',
      description: 'Extract daily P&L and trade lines',
      accept: 'image/*',
      ref: imageInputRef,
      fileType: 'PNL_IMAGE'
    },
    {
      id: 'chart_image',
      icon: ImageIcon,
      title: 'Upload Chart Screenshot',
      description: 'Save chart evidence for your journal',
      accept: 'image/*',
      ref: chartInputRef,
      fileType: 'CHART_IMAGE'
    },
    {
      id: 'csv',
      icon: FileText,
      title: 'Upload CSV',
      description: 'Import trade data from CSV file',
      accept: '.csv',
      ref: csvInputRef,
      fileType: 'CSV'
    },
    {
      id: 'excel',
      icon: FileSpreadsheet,
      title: 'Upload Excel',
      description: 'Import trade data from Excel file',
      accept: '.xlsx,.xls',
      ref: excelInputRef,
      fileType: 'EXCEL'
    },
    {
      id: 'pdf',
      icon: FileIcon,
      title: 'Upload PDF',
      description: 'Extract data from PDF reports',
      accept: '.pdf',
      ref: pdfInputRef,
      fileType: 'PDF'
    }
  ];

  const handleFileChange = (fileType, files) => {
    if (files && files.length > 0) {
      onUpload(fileType, files);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full md:w-96 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Upload</h3>
              {currentDate && (
                <p className="text-xs text-muted-foreground mt-1">Attaching to {currentDate}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Upload Options */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {uploadOptions.map((option) => (
              <div key={option.id}>
                <input
                  ref={option.ref}
                  type="file"
                  accept={option.accept}
                  multiple={option.fileType.includes('IMAGE')}
                  onChange={(e) => handleFileChange(option.fileType, e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => option.ref.current?.click()}
                  className="w-full p-4 rounded-lg border border-border hover:border-blue-300 hover:bg-primary/10 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <option.icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        {option.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}