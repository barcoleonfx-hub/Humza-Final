import React, { useState, useRef } from 'react';
import { api } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  Copy, 
  Upload, 
  CheckCircle2, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { toast } from "sonner";

export default function ShareMarketPulse() {
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState('story');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [position, setPosition] = useState('top-left');
  const [theme, setTheme] = useState('light');
  const [showConfidence, setShowConfidence] = useState(true);
  const [showBias, setShowBias] = useState(true);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState('');
  
  const canvasRef = useRef(null);

  // Sample pulse data (in real app, pass from AI Analysis)
  const [pulseData] = useState({
    symbol: 'XAUUSD',
    bias: 'Bullish',
    confidence: 78,
    insight: 'Strong momentum above key level. Watch for continuation patterns near previous highs.'
  });

  React.useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const { data } = await api.integrations.Core.UploadFile({ file });
      setUploadedImageUrl(data.file_url);
      setUploadedImage(file);
      toast.success('Chart uploaded');
      setStep(3);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const generateShareImage = async () => {
    if (!canvasRef.current) return;
    
    setLoading(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2
      });

      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'market-pulse-share.png', { type: 'image/png' });
        const { data } = await api.integrations.Core.UploadFile({ file });
        
        await api.entities.ShareablePulseAsset.create({
          user_id: currentUser.email,
          symbol: pulseData.symbol,
          format,
          background_image_url: uploadedImageUrl,
          generated_image_url: data.file_url,
          pulse_data: pulseData,
          overlay_config: { position, theme, showConfidence, showBias }
        });

        setGeneratedImageUrl(data.file_url);
        setCaption(
          `Market Pulse: ${pulseData.symbol} • ${pulseData.bias} (${pulseData.confidence}%)\n${pulseData.insight}\n\nEducational only — not financial advice.\n#TraderJNL`
        );
        setStep(4);
        toast.success('Share image generated!');
      }, 'image/png');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `traderjnl-market-pulse-${pulseData.symbol}.png`;
    link.click();
    toast.success('Downloaded!');
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast.success('Caption copied!');
  };

  const formatDimensions = {
    story: { width: 1080, height: 1920, label: 'Instagram Story' },
    post: { width: 1080, height: 1350, label: 'Instagram Post' },
    square: { width: 1080, height: 1080, label: 'Square' }
  };

  const dims = formatDimensions[format];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Share Market Pulse</h1>
        <p className="text-muted-foreground">Generate premium shareable images for social media</p>
      </div>

      {/* Step 1: Format Selection */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 1: Select Format</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(formatDimensions).map(([key, { width, height, label }]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFormat(key);
                    setStep(2);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all hover:border-blue-500",
                    format === key ? "border-blue-500 bg-primary/10" : "border-border"
                  )}
                >
                  <div className="mb-2 flex justify-center">
                    <div 
                      className="bg-slate-200 rounded"
                      style={{
                        width: key === 'story' ? 40 : key === 'post' ? 40 : 60,
                        height: key === 'story' ? 70 : key === 'post' ? 50 : 60
                      }}
                    />
                  </div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{width}×{height}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Chart */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 2: Upload Chart Screenshot</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <Label htmlFor="chart-upload" className="cursor-pointer">
                <div className="text-sm text-muted-foreground mb-4">
                  Upload your chart screenshot (TradingView, MT5, etc.)
                </div>
                <Button type="button" variant="outline" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Choose Image
                </Button>
              </Label>
              <Input
                id="chart-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Overlay Options */}
      {step === 3 && uploadedImageUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Step 3: Customize Overlay</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label className="mb-2 block">Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPosition(pos)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        position === pos ? "border-blue-500 bg-primary/10 text-primary-foreground/80" : "border-border"
                      )}
                    >
                      {pos.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Theme</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                      theme === 'light' ? "border-blue-500 bg-primary/10 text-primary-foreground/80" : "border-border"
                    )}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                      theme === 'dark' ? "border-blue-500 bg-primary/10 text-primary-foreground/80" : "border-border"
                    )}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showConfidence}
                    onChange={(e) => setShowConfidence(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show Confidence Bar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBias}
                    onChange={(e) => setShowBias(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show Bias Badge</span>
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <Label className="mb-2 block">Preview</Label>
              <div 
                className="relative bg-muted rounded-lg overflow-hidden mx-auto"
                style={{ 
                  width: dims.width / 4, 
                  height: dims.height / 4,
                  backgroundImage: `url(${uploadedImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <PulseOverlayPreview 
                  pulseData={pulseData} 
                  position={position} 
                  theme={theme}
                  showConfidence={showConfidence}
                  showBias={showBias}
                />
              </div>
            </div>

            <Button 
              onClick={generateShareImage} 
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate Share Image
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Download */}
      {step === 4 && generatedImageUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Ready to Share!
            </h3>
            
            <div className="mb-6">
              <img 
                src={generatedImageUrl} 
                alt="Generated share" 
                className="rounded-lg border border-border w-full max-w-md mx-auto"
              />
            </div>

            <div className="space-y-3">
              <Button onClick={handleDownload} className="w-full bg-primary hover:bg-blue-600">
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
              <Button onClick={handleCopyCaption} variant="outline" className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy Caption
              </Button>
              <Button onClick={() => { setStep(1); setGeneratedImageUrl(null); }} variant="ghost" className="w-full">
                Generate Another
              </Button>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Caption:</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{caption}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Canvas for Generation */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div
          ref={canvasRef}
          style={{
            width: dims.width,
            height: dims.height,
            position: 'relative',
            backgroundImage: uploadedImageUrl ? `url(${uploadedImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <PulseOverlay 
            pulseData={pulseData} 
            position={position} 
            theme={theme}
            showConfidence={showConfidence}
            showBias={showBias}
          />
        </div>
      </div>
    </div>
  );
}

function PulseOverlayPreview({ pulseData, position, theme, showConfidence, showBias }) {
  const positionStyles = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 }
  };

  return (
    <div
      className={cn(
        "absolute rounded-xl p-3 max-w-[180px]",
        theme === 'light' ? "bg-card/95 backdrop-blur-sm shadow-lg" : "bg-slate-900/95 backdrop-blur-sm shadow-lg"
      )}
      style={positionStyles[position]}
    >
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <p className={cn("text-xs font-bold", theme === 'light' ? "text-foreground" : "text-white")}>
            {pulseData.symbol}
          </p>
          {showBias && (
            <span className={cn(
              "text-[8px] px-1.5 py-0.5 rounded font-semibold",
              pulseData.bias === 'Bullish' ? "bg-green-100 text-green-700" :
              pulseData.bias === 'Bearish' ? "bg-red-100 text-red-700" :
              "bg-muted text-muted-foreground"
            )}>
              {pulseData.bias}
            </span>
          )}
        </div>
        {showConfidence && (
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${pulseData.confidence}%` }}
              />
            </div>
            <span className={cn("text-[8px] font-semibold", theme === 'light' ? "text-muted-foreground" : "text-slate-300")}>
              {pulseData.confidence}%
            </span>
          </div>
        )}
      </div>
      <p className={cn("text-[8px] leading-tight mb-2", theme === 'light' ? "text-muted-foreground" : "text-slate-300")}>
        {pulseData.insight.substring(0, 100)}...
      </p>
      <div className="flex items-center justify-between">
        <span className={cn("text-[7px] font-semibold", theme === 'light' ? "text-primary" : "text-blue-400")}>
          Market Pulse
        </span>
        <span className={cn("text-[7px]", theme === 'light' ? "text-muted-foreground" : "text-slate-400")}>
          TraderJNL
        </span>
      </div>
      <p className={cn("text-[6px] mt-1", theme === 'light' ? "text-slate-400" : "text-muted-foreground")}>
        Educational only. Not financial advice.
      </p>
    </div>
  );
}

function PulseOverlay({ pulseData, position, theme, showConfidence, showBias }) {
  const positionStyles = {
    'top-left': { top: 60, left: 60 },
    'top-right': { top: 60, right: 60 },
    'bottom-left': { bottom: 60, left: 60 },
    'bottom-right': { bottom: 60, right: 60 }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: 32,
        maxWidth: 480,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <p style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: theme === 'light' ? '#0f172a' : '#fff',
            margin: 0
          }}>
            {pulseData.symbol}
          </p>
          {showBias && (
            <span style={{
              fontSize: 16,
              padding: '6px 16px',
              borderRadius: 20,
              fontWeight: '600',
              backgroundColor: pulseData.bias === 'Bullish' ? '#dcfce7' :
                pulseData.bias === 'Bearish' ? '#fee2e2' : '#f1f5f9',
              color: pulseData.bias === 'Bullish' ? '#15803d' :
                pulseData.bias === 'Bearish' ? '#b91c1c' : '#475569'
            }}>
              {pulseData.bias}
            </span>
          )}
        </div>
        {showConfidence && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1,
              height: 8,
              backgroundColor: theme === 'light' ? '#e2e8f0' : '#334155',
              borderRadius: 999,
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  height: '100%',
                  width: `${pulseData.confidence}%`,
                  backgroundColor: '#3b82f6'
                }}
              />
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme === 'light' ? '#475569' : '#cbd5e1'
            }}>
              {pulseData.confidence}%
            </span>
          </div>
        )}
      </div>
      <p style={{
        fontSize: 18,
        lineHeight: 1.6,
        color: theme === 'light' ? '#475569' : '#cbd5e1',
        marginBottom: 24
      }}>
        {pulseData.insight}
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <span style={{
          fontSize: 16,
          fontWeight: '600',
          color: theme === 'light' ? '#3b82f6' : '#60a5fa'
        }}>
          Market Pulse
        </span>
        <span style={{
          fontSize: 16,
          color: theme === 'light' ? '#64748b' : '#94a3b8'
        }}>
          TraderJNL
        </span>
      </div>
      <p style={{
        fontSize: 12,
        color: theme === 'light' ? '#94a3b8' : '#64748b',
        margin: 0
      }}>
        Educational analysis. Not financial advice.
      </p>
    </div>
  );
}