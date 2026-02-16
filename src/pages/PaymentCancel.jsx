import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/api/apiClient';

export default function PaymentCancel() {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const response = await api.functions.invoke('createCheckoutSession', {});
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        alert('Failed to restart checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to restart checkout:', error);
      alert('Failed to restart checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/api-prod/public/696e4aebba4c7c3eaf2c83eb/1b098787c_ChatGPTImageFeb1202611_41_47PM.png" 
            alt="TraderJNL" 
            className="h-8 w-auto"
          />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Checkout Canceled</h2>
        <p className="text-muted-foreground mb-6">
          No payment was made. You can try again or explore other options.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground"
          >
            {loading ? 'Loading...' : 'Try Again'}
          </Button>
          <div className="flex gap-3">
            <Link to={createPageUrl('Landing') + '#pricing'} className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Pricing
              </Button>
            </Link>
            <Link to={createPageUrl('Home')} className="flex-1">
              <Button variant="outline" className="w-full">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}