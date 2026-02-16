import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from 'lucide-react';
import { api } from '@/api/apiClient';
import { cn } from "@/lib/utils";

export default function ScreenshotsSection({ 
  beforeScreenshots, 
  afterScreenshots,
  onBeforeChange,
  onAfterChange,
  onContinue 
}) {
  const [uploading, setUploading] = useState(false);
  const beforeInputRef = useRef(null);
  const afterInputRef = useRef(null);

  const handleUpload = async (files, type) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        api.integrations.Core.UploadFile({ file })
      );
      
      const results = await Promise.all(uploadPromises);
      const newScreenshots = results.map(r => ({ url: r.file_url, comment: '' }));
      
      if (type === 'before') {
        onBeforeChange([...beforeScreenshots, ...newScreenshots]);
      } else {
        onAfterChange([...afterScreenshots, ...newScreenshots]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleCommentChange = (type, index, comment) => {
    if (type === 'before') {
      const updated = [...beforeScreenshots];
      updated[index].comment = comment;
      onBeforeChange(updated);
    } else {
      const updated = [...afterScreenshots];
      updated[index].comment = comment;
      onAfterChange(updated);
    }
  };

  const handleRemove = (type, index) => {
    if (type === 'before') {
      onBeforeChange(beforeScreenshots.filter((_, i) => i !== index));
    } else {
      onAfterChange(afterScreenshots.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">Trade Evidence</h3>
          <p className="text-sm text-muted-foreground">Upload your charts and results with optional comments</p>
        </div>

        {/* Before Screenshots */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-muted-foreground">📊 Before Charts</h4>
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files, 'before')}
              className="hidden"
            />
            <Button
              onClick={() => beforeInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Add Before
            </Button>
          </div>

          {beforeScreenshots.length > 0 ? (
            <div className="space-y-3">
              {beforeScreenshots.map((screenshot, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex gap-3">
                    <img 
                      src={screenshot.url} 
                      alt={`Before ${idx + 1}`} 
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Add a comment for this chart (optional)"
                        value={screenshot.comment}
                        onChange={(e) => handleCommentChange('before', idx, e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove('before', idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-slate-300 rounded-lg">
              No before charts yet
            </p>
          )}
        </div>

        {/* After Screenshots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-muted-foreground">💰 After Results</h4>
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files, 'after')}
              className="hidden"
            />
            <Button
              onClick={() => afterInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Add After
            </Button>
          </div>

          {afterScreenshots.length > 0 ? (
            <div className="space-y-3">
              {afterScreenshots.map((screenshot, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex gap-3">
                    <img 
                      src={screenshot.url} 
                      alt={`After ${idx + 1}`} 
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0" 
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Add a comment for this result (optional)"
                        value={screenshot.comment}
                        onChange={(e) => handleCommentChange('after', idx, e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove('after', idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-slate-300 rounded-lg">
              No after results yet
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={onContinue}
        className="w-full bg-primary text-primary-foreground h-12"
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          'Save & Continue'
        )}
      </Button>
    </div>
  );
}