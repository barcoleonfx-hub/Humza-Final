import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogPortal,
    DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/lib/AuthContext';
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Chrome, Apple } from 'lucide-react';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'login') {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
                toast.success("Welcome back!");
                onClose();
            } else {
                const { error } = await signUpWithEmail(email, password, fullName);
                if (error) throw error;
                toast.success("Account created! Please check your email for verification.");
                onClose();
            }
        } catch (error) {
            toast.error(error.message || "An error occurred during authentication.");
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthSignIn = async (provider) => {
        setLoading(true);
        try {
            const { error } = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
            if (error) throw error;
        } catch (error) {
            toast.error(error.message || `Failed to sign in with ${provider}.`);
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] p-6 gap-6 rounded-2xl border-border bg-card shadow-2xl">
                <DialogHeader className="space-y-2 text-center">
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                        {mode === 'login' ? 'Welcome back' : 'Create your TraderJNL account'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Built to protect prop accounts, not just log trades.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full h-11 font-medium border-border hover:bg-muted transition-colors relative"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                    >
                        <Chrome className="w-5 h-5 mr-2" />
                        Continue with Google
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-11 font-medium border-border hover:bg-muted transition-colors"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={loading}
                    >
                        <Apple className="w-5 h-5 mr-2 fill-current" />
                        Continue with Apple
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    className="pl-10 h-11"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={mode === 'signup'}
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                className="pl-10 h-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                className="pl-10 h-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 font-semibold text-base" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : mode === 'login' ? (
                            'Log in'
                        ) : (
                            'Create account'
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="text-primary font-semibold hover:underline"
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        >
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
