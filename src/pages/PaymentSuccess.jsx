import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { createPageUrl } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Finalising your access...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Get session_id from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          setStatus('error');
          setMessage('No session ID found. Please contact support.');
          return;
        }

        // Verify the session with backend
        const response = await api.functions.invoke('verifyCheckoutSession', {
          session_id: sessionId
        });

        if (response.data.success) {
          setStatus('success');
          setMessage('Payment confirmed! Redirecting to your dashboard...');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate(createPageUrl('Home'));
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.error || 'We couldn\'t confirm your payment yet. Please refresh or contact support.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('We couldn\'t confirm your payment yet. Please refresh or contact support.');
      }
    };

    verifySession();
  }, [navigate]);

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

        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Confirmed</h2>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">All Set!</h2>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Verification Issue</h2>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-2 border border-slate-300 hover:bg-muted/50 text-muted-foreground rounded-lg font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => navigate(createPageUrl('Home'))}
                className="flex-1 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Go to Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}