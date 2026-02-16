import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle } from 'lucide-react';
import SessionCoach from '@/components/coachsam/SessionCoach';
import Protocols from '@/components/coachsam/Protocols';
import History from '@/components/coachsam/History';

export default function CoachSam() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  useEffect(() => {
    api.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    const savedAccountId = localStorage.getItem('selectedAccountId');
    setSelectedAccountId(savedAccountId);

    const handleAccountChange = (e) => {
      setSelectedAccountId(e.detail);
    };

    window.addEventListener('accountChanged', handleAccountChange);
    return () => window.removeEventListener('accountChanged', handleAccountChange);
  }, []);

  if (!currentUser || !selectedAccountId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-blue-500" />
          Coach Sam
        </h1>
        <p className="text-muted-foreground mt-2">Performance psychology and financial discipline support</p>
      </div>

      <Tabs defaultValue="session" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="session">Session Coach</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="session" className="mt-6">
          <SessionCoach 
            currentUser={currentUser} 
            selectedAccountId={selectedAccountId} 
          />
        </TabsContent>

        <TabsContent value="protocols" className="mt-6">
          <Protocols 
            currentUser={currentUser} 
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <History 
            currentUser={currentUser} 
            selectedAccountId={selectedAccountId} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}