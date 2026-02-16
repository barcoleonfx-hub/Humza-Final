import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { api } from '@/api/apiClient';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Percent,
  Brain,
  Settings,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Calculator,
  BarChart3,
  Info,
  Shield,
  FileText,
  MessageCircle,
  CreditCard,
  Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AccountSelector from '@/components/dashboard/AccountSelector';
import MobileAccountSelector from '@/components/dashboard/MobileAccountSelector';
import FirstAccountOnboarding from '@/components/dashboard/FirstAccountOnboarding';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navSections = [
  {
    title: 'Daily Workflow',
    items: [
      { name: 'Home', icon: LayoutDashboard, page: 'Home' },
      { name: 'Journal', icon: BookOpen, page: 'Journal' },
      { name: 'Session Workspace', icon: FileText, page: 'SessionWorkspace' },
      { name: 'Calendar', icon: Calendar, page: 'Calendar' },
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Discord', icon: MessageCircle, page: 'Discord' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { name: 'Account Discipline', icon: Shield, page: 'AccountDiscipline' },

    ]
  },
  {
    title: 'Coach',
    items: [
      { name: 'Coach Sam', icon: Brain, page: 'CoachSam', isNew: true },
    ]
  },
  {
    title: 'Market & Tools',
    items: [
      { name: 'AI Analysis', icon: Brain, page: 'AIAnalysis' },
      { name: 'FundedHub', icon: Building2, page: 'FundedHub', isNew: true },
      { name: 'News', icon: TrendingUp, page: 'News' },
      { name: 'Playbook', icon: BookOpen, page: 'Playbook' },
      { name: 'Calculator', icon: Calculator, page: 'Calculator' },
    ]
  },
  {
    title: 'Coming Soon',
    items: [
      { name: 'Prop Deals', icon: Percent, page: 'PropDeals', comingSoon: true },
      { name: 'TraderJNL Indicator', icon: TrendingUp, page: 'TraderJNLIndicator', comingSoon: true, description: 'Exclusive TradingView indicator for TraderJNL users' },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Subscription', icon: CreditCard, page: 'SettingsSubscription' },
      { name: 'Settings', icon: Settings, page: 'Settings' },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  // Render Landing, Subscribe, and payment pages without layout wrapper
  if (currentPageName === 'Landing' || currentPageName === 'Subscribe' || currentPageName === 'PaymentSuccess' || currentPageName === 'PaymentCancel') {
    return <>{children}</>;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [hasIncompleteEntry, setHasIncompleteEntry] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);

  // Summary mode flag
  const isSummaryMode = selectedAccountId === 'SUMMARY_ALL';

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Layout: Error fetching user:", error);
        api.auth.redirectToLogin();
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    const initAccount = async () => {
      if (!user?.email) return;

      try {
        const accounts = await api.entities.TradingAccount.filter({ user_id: user.email });

        if (accounts.length === 0) {
          setShowOnboarding(true);
        } else {
          const savedAccountId = localStorage.getItem('selectedAccountId');
          const accountExists = accounts.find(a => a.id === savedAccountId);

          if (accountExists) {
            setSelectedAccountId(savedAccountId);
          } else {
            const defaultAccount = accounts.find(a => a.is_default) || accounts[0];
            setSelectedAccountId(defaultAccount.id);
            localStorage.setItem('selectedAccountId', defaultAccount.id);
          }
        }
      } catch (error) {
        console.error("Layout: Error fetching accounts:", error);
        setShowOnboarding(true);
      } finally {
        setAccountsLoaded(true);
      }
    };

    initAccount();
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    api.entities.JournalEntry.filter({
      created_by: user.email,
      status: 'incomplete'
    }, '-entry_date', 1)
      .then(entries => setHasIncompleteEntry(entries.length > 0))
      .catch(() => { });
  }, [user]);

  const handleLogout = () => {
    api.auth.logout();
  };

  const handleAccountCreated = (newAccount) => {
    setSelectedAccountId(newAccount.id);
    setShowOnboarding(false);
    window.dispatchEvent(new CustomEvent('accountChanged', { detail: newAccount.id }));
  };

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId);
    localStorage.setItem('selectedAccountId', accountId);
    window.dispatchEvent(new CustomEvent('accountChanged', { detail: accountId }));
    setMobileMenuOpen(false);
  };

  if (showOnboarding) {
    return <FirstAccountOnboarding onAccountCreated={handleAccountCreated} />;
  }

  if (!accountsLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Summary Mode Banner */}
      {isSummaryMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium lg:left-64">
          Summary (All Accounts) — Read-only aggregate view
        </div>
      )}

      <style>{`
        .gradient-border {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .glass-card {
          background: hsl(var(--card) / 0.9);
          backdrop-filter: blur(20px);
          border: 1px solid hsl(var(--border) / 0.15);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        @keyframes pulseGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
        .pulse-green {
          animation: pulseGreen 2s ease-in-out infinite;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col glass-card border-r border-border z-40">
        {/* Brand Header */}
        <Link
          to={createPageUrl('Home')}
          className="flex items-center gap-3 px-6 h-16 border-b border-border hover:bg-muted transition-colors"
        >
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-sm">TJ</span>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">TraderJNL</h1>
            <p className="text-xs text-muted-foreground">Verified journal</p>
          </div>
        </Link>

        {/* Interface Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Interface</p>
          <ThemeToggle />
        </div>

        {/* Account Selector Section */}
        {user && selectedAccountId && (
          <div className="px-6 py-4 border-b border-border">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Account</p>
            <AccountSelector
              currentUser={user}
              selectedAccountId={selectedAccountId}
              onAccountChange={handleAccountChange}
            />
          </div>
        )}

        <nav className="flex-1 px-4 pt-3 pb-4 space-y-4 overflow-y-auto">
          <TooltipProvider>
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const isActive = currentPageName === item.page;
                  const showNotification = item.page === 'Journal' && hasIncompleteEntry && !isSummaryMode;
                  const isDisabled = item.comingSoon || (isSummaryMode && (item.page === 'Journal' || item.page === 'SessionWorkspace'));

                  const linkContent = (
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                        isDisabled && "opacity-40 cursor-not-allowed",
                        !isDisabled && isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                          : !isDisabled && "text-muted-foreground hover:text-foreground hover:bg-muted",
                        isDisabled && "text-muted-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium flex-1">{item.name}</span>
                      {item.isNew && !isDisabled && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                          New
                        </span>
                      )}
                      {item.comingSoon && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Soon</span>
                      )}
                      {showNotification && !isDisabled && (
                        <span className="absolute top-2 right-2 text-destructive text-xl animate-pulse">!</span>
                      )}
                    </div>
                  );

                  if (isDisabled) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed">
                            {linkContent}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            {item.comingSoon
                              ? (item.description || 'Coming soon')
                              : isSummaryMode && item.page === 'Journal'
                                ? 'Journal is read-only in Summary. Switch accounts to create entries.'
                                : isSummaryMode && item.page === 'SessionWorkspace'
                                  ? 'Sessions are account-specific. Summary view is read-only.'
                                  : 'Not available'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.page)}
                    >
                      {linkContent}
                    </Link>
                  );
                })}
              </div>
            ))}
          </TooltipProvider>
        </nav>

        {user && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{user.full_name || 'Trader'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-card border-b border-border z-50 flex items-center justify-between px-4">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-xs">TJ</span>
            </div>
          </div>
          <span className="font-semibold text-foreground text-base">TraderJNL</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative glass-card h-full w-64 overflow-y-auto">
            {/* Mobile Account Selector */}
            {user && selectedAccountId && (
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <MobileAccountSelector
                  currentUser={user}
                  selectedAccountId={selectedAccountId}
                  onAccountChange={handleAccountChange}
                />
              </div>
            )}
            <nav className="px-4 pt-3 pb-4 space-y-4">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const isActive = currentPageName === item.page;
                    const showNotification = item.page === 'Journal' && hasIncompleteEntry && !isSummaryMode;
                    const isDisabled = item.comingSoon || (isSummaryMode && (item.page === 'Journal' || item.page === 'SessionWorkspace'));

                    if (isDisabled) {
                      return (
                        <div
                          key={item.name}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative opacity-40 cursor-not-allowed text-muted-foreground"
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.comingSoon && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Soon</span>
                              )}
                            </div>
                            {item.description && item.comingSoon && (
                              <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.name}
                        to={createPageUrl(item.page)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium flex-1">{item.name}</span>
                        {item.isNew && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                            New
                          </span>
                        )}
                        {showNotification && (
                          <span className="absolute top-2 right-2 text-destructive text-xl animate-pulse">!</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Mobile User Profile & Sign Out */}
            {user && (
              <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{user.full_name || 'Trader'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={cn("lg:ml-64 pt-16 lg:pt-0 min-h-screen", isSummaryMode && "pt-20 lg:pt-8")}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}