import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SearchBar } from "@/components/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Bell, LogIn, LogOut, User, Mail, Lock, Menu, ChevronLeft, Activity, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";
import { useState, useEffect } from "react";

import Dashboard from "@/pages/Dashboard";
import InsiderTrades from "@/pages/InsiderTrades";
import Congressional from "@/pages/Congressional";
import Alerts from "@/pages/Alerts";
import SearchPage from "@/pages/SearchPage";
import SocialBuzz from "@/pages/social-buzz";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import IpoCalendar from "@/pages/ipo-calendar";
import AlertSettings from "@/pages/alert-settings";
import InstitutionalTrades from "@/pages/institutional-trades";
import Membership from "@/pages/Membership";

function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(false);
  const { loginMutation, registerMutation } = useAuth();

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const canRegister = hasReadDisclaimer && hasAcknowledgedDisclaimer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate(
        { email, password },
        { onSuccess }
      );
    } else {
      if (!canRegister) return;
      registerMutation.mutate(
        { email, password, firstName, lastName, disclaimerAccepted: true },
        { onSuccess }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName-app">First Name</Label>
            <Input
              id="firstName-app"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              data-testid="input-firstname-app"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName-app">Last Name</Label>
            <Input
              id="lastName-app"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              data-testid="input-lastname-app"
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email-app">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email-app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="pl-9"
            data-testid="input-email-app"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-app">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password-app"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            minLength={6}
            className="pl-9"
            data-testid="input-password-app"
          />
        </div>
      </div>
      
      {!isLogin && (
        <div className="space-y-3 border rounded-md p-3 bg-muted/30">
          <div className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            Legal Disclaimer
          </div>
          <ScrollArea className="h-32 pr-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The information provided on InsiderSignal is for general informational and educational purposes only. 
              Nothing on this platform constitutes financial advice, investment advice, or trading advice. InsiderSignal 
              is not a registered investment advisor or broker-dealer. Trading and investing involves substantial risk 
              of loss - you may lose some or all of your initial investment. Past performance does not guarantee future 
              results. We make no warranties regarding the accuracy or completeness of any information displayed. AI-generated 
              analysis should not be considered investment recommendations. You assume full responsibility for all investment 
              decisions you make. By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </ScrollArea>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id="read-disclaimer-app"
                checked={hasReadDisclaimer}
                onCheckedChange={(checked) => setHasReadDisclaimer(checked === true)}
                data-testid="checkbox-read-disclaimer-app"
              />
              <label htmlFor="read-disclaimer-app" className="text-xs leading-relaxed cursor-pointer">
                I have read and understood the legal disclaimer above
              </label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="acknowledge-disclaimer-app"
                checked={hasAcknowledgedDisclaimer}
                onCheckedChange={(checked) => setHasAcknowledgedDisclaimer(checked === true)}
                data-testid="checkbox-acknowledge-disclaimer-app"
              />
              <label htmlFor="acknowledge-disclaimer-app" className="text-xs leading-relaxed cursor-pointer">
                I acknowledge that InsiderSignal does not provide financial advice and I am solely responsible for my own investment decisions
              </label>
            </div>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || (!isLogin && !canRegister)} 
        data-testid="button-submit-auth-app"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : isLogin ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="text-primary underline-offset-4 hover:underline"
              data-testid="button-switch-to-register-app"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className="text-primary underline-offset-4 hover:underline"
              data-testid="button-switch-to-login-app"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <User className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Sign In Required</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need to sign in to access your personal settings and preferences.
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-signin-protected">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" aria-describedby="signin-protected-description">
            <DialogHeader>
              <DialogTitle>Sign In to Continue</DialogTitle>
              <DialogDescription id="signin-protected-description">
                Sign in to access your personal settings.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <AuthForm onSuccess={() => setDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <Component />;
}

const pageConfig: Record<string, { title: string; showBack: boolean }> = {
  "/dashboard": { title: "Dashboard", showBack: false },
  "/insider-trades": { title: "Insider Trades", showBack: true },
  "/congressional": { title: "Congressional", showBack: true },
  "/social-buzz": { title: "Social Buzz", showBack: true },
  "/alerts": { title: "Alerts", showBack: true },
  "/search": { title: "Search", showBack: true },
  "/settings": { title: "Settings", showBack: true },
  "/help": { title: "Help", showBack: true },
  "/ipo-calendar": { title: "IPO Calendar", showBack: true },
  "/alert-settings": { title: "Alert Settings", showBack: true },
  "/upgrade": { title: "Upgrade", showBack: true },
};

function MainRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/insider-trades" component={InsiderTrades} />
      <Route path="/congressional" component={Congressional} />
      <Route path="/social-buzz" component={SocialBuzz} />
      <Route path="/institutional" component={InstitutionalTrades} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/search" component={SearchPage} />
      <Route path="/ipo-calendar" component={IpoCalendar} />
      <Route path="/alert-settings">
        <ProtectedRoute component={AlertSettings} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/help" component={Help} />
      <Route path="/membership" component={Membership} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UserControls() {
  const { user, isAuthenticated, isLoading, logoutMutation } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" data-testid="button-signin-header">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" aria-describedby="signin-header-description">
          <DialogHeader>
            <DialogTitle>Welcome to InsiderSignal</DialogTitle>
            <DialogDescription id="signin-header-description">
              Sign in to access your personalized settings and track your favorite stocks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <AuthForm onSuccess={() => setDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()} data-testid="button-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getPageTitle(path: string): { title: string; showBack: boolean } {
  const exactMatch = pageConfig[path];
  if (exactMatch) return exactMatch;
  
  for (const [route, config] of Object.entries(pageConfig)) {
    if (path.startsWith(route + "/") || path.startsWith(route + "?")) {
      return config;
    }
  }
  
  return { title: "InsiderSignal", showBack: path !== "/dashboard" };
}

function MobileHeader() {
  const [location, setLocation] = useLocation();
  const { toggleSidebar, isMobile } = useSidebar();
  const currentPage = getPageTitle(location);
  
  const { data: alerts = [] } = useQuery<{ id: string; dismissed: number }[]>({
    queryKey: ["/api/alerts"],
  });
  const activeAlertCount = alerts.filter(a => a.dismissed !== 1).length;

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/dashboard");
    }
  };

  return (
    <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background sticky top-0 z-50">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isMobile ? (
          currentPage.showBack ? (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="shrink-0"
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
              className="shrink-0"
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )
        ) : (
          <SidebarTrigger data-testid="button-sidebar-toggle" />
        )}
        
        {isMobile ? (
          <div className="flex items-center gap-2 min-w-0">
            {!currentPage.showBack && (
              <div className="p-1.5 rounded-md bg-primary shrink-0">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-semibold truncate" data-testid="text-page-title">
              {currentPage.title}
            </span>
          </div>
        ) : (
          <SearchBar 
            onSearch={(q) => console.log("Global search:", q)}
            onResultClick={(r) => console.log("Navigate to:", r)}
          />
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isMobile && currentPage.showBack && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            data-testid="button-menu-secondary"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/search")}
            data-testid="button-mobile-search"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          onClick={() => setLocation("/alerts")}
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {activeAlertCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeAlertCount > 99 ? "99+" : activeAlertCount}
            </Badge>
          )}
        </Button>
        <ThemeToggle />
        <UserControls />
      </div>
    </header>
  );
}

function AppShellContent() {
  const [location] = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location, isMobile, setOpenMobile]);

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <MainRouter />
        </main>
      </div>
    </div>
  );
}

function AppShell() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <AppShellContent />
    </SidebarProvider>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route>
        <AppShell />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
