import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Chrome, Apple, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUpWithEmail, signInWithGoogle, signInWithApple, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo') || '/Home';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(returnTo, { replace: true });
        }
    }, [isAuthenticated, navigate, returnTo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await signUpWithEmail(email, password, fullName);
            if (error) throw error;
            toast.success("Account created! Please check your email for verification.");
        } catch (error) {
            toast.error(error.message || "Failed to create account.");
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
            toast.error(error.message || `Failed to sign up with ${provider}.`);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to home
            </Link>

            <div className="w-full max-w-[400px] space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                        <span className="font-bold text-primary-foreground text-xl">TJ</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Start your trial</h1>
                    <p className="text-muted-foreground">
                        7 days of professional journaling, free.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full h-12 font-medium border-border hover:bg-muted transition-colors"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                    >
                        <Chrome className="w-5 h-5 mr-3" />
                        Continue with Google
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 font-medium border-border hover:bg-muted transition-colors"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={loading}
                    >
                        <Apple className="w-5 h-5 mr-3 fill-current" />
                        Continue with Apple
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or create account</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                className="pl-10 h-12"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                className="pl-10 h-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                className="pl-10 h-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 font-semibold text-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            'Create account'
                        )}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{' '}
                        <Link
                            to={createPageUrl('Login')}
                            className="text-primary font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <p>Access all features: Verified Metrics, Coach Sam, AI Analysis, and Discipline Tracking.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
