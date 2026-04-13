import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, TrendingUp, TrendingDown, Bell, Shield, BarChart3, Users, Building2, ArrowRight, Mail, Lock, User, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [hasAcknowledgedDisclaimer, setHasAcknowledgedDisclaimer] = useState(false);
  const { loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const canRegister = hasReadDisclaimer && hasAcknowledgedDisclaimer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            onSuccess();
            setLocation("/dashboard");
          },
        }
      );
    } else {
      if (!canRegister) return;
      registerMutation.mutate(
        { email, password, firstName, lastName, disclaimerAccepted: true },
        {
          onSuccess: () => {
            onSuccess();
            setLocation("/dashboard");
          },
        }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="pl-9"
                data-testid="input-firstname"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="pl-9"
                data-testid="input-lastname"
              />
            </div>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="pl-9"
            data-testid="input-email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            minLength={6}
            className="pl-9"
            data-testid="input-password"
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
                id="read-disclaimer"
                checked={hasReadDisclaimer}
                onCheckedChange={(checked) => setHasReadDisclaimer(checked === true)}
                data-testid="checkbox-read-disclaimer"
              />
              <label htmlFor="read-disclaimer" className="text-xs leading-relaxed cursor-pointer">
                I have read and understood the legal disclaimer above
              </label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="acknowledge-disclaimer"
                checked={hasAcknowledgedDisclaimer}
                onCheckedChange={(checked) => setHasAcknowledgedDisclaimer(checked === true)}
                data-testid="checkbox-acknowledge-disclaimer"
              />
              <label htmlFor="acknowledge-disclaimer" className="text-xs leading-relaxed cursor-pointer">
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
        data-testid="button-submit-auth"
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
              data-testid="button-switch-to-register"
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
              data-testid="button-switch-to-login"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function SignInDialog({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="signin-description">
        <DialogHeader>
          <DialogTitle>Welcome to InsiderSignal</DialogTitle>
          <DialogDescription id="signin-description">
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">InsiderSignal</span>
          </div>
          <SignInDialog>
            <Button data-testid="button-login">Sign In</Button>
          </SignInDialog>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Real-Time Institutional Intelligence
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Track CEO, Congressional & Major Fund Trades
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered pattern detection helps you spot unusual trading activity before market movements. Track 
              SEC Form 4 filings, STOCK Act disclosures, and 13F institutional filings from Softbank, BlackRock, Berkshire and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" data-testid="button-view-demo">
                  View Demo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <SignInDialog>
                <Button size="lg" variant="outline" data-testid="button-get-started">
                  Sign In
                </Button>
              </SignInDialog>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-12">What You Get</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="p-2 w-fit rounded-md bg-primary/10 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>SEC Insider Trades</CardTitle>
                  <CardDescription>Real-time Form 4 filings from Fortune 500 executives</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" /> Executive buy signals
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" /> Insider sell patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Volume analysis
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="p-2 w-fit rounded-md bg-primary/10 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Congressional Trading</CardTitle>
                  <CardDescription>STOCK Act disclosures from House & Senate members</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Committee conflict detection
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Party-based analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Timing alerts
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="p-2 w-fit rounded-md bg-primary/10 mb-2">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>AI Pattern Detection</CardTitle>
                  <CardDescription>Machine learning identifies unusual activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Cluster sell detection
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" /> Unusual volume alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Coordinated trading patterns
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="p-2 w-fit rounded-md bg-primary/10 mb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Institutional Whale Trades</CardTitle>
                  <CardDescription>13F filings from major funds like Softbank, BlackRock & Berkshire</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" /> Major position increases
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" /> Large fund sell-offs
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Portfolio allocation changes
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="p-2 w-fit rounded-md bg-primary/10 mb-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Social Sentiment</CardTitle>
                  <CardDescription>Reddit buzz from r/wallstreetbets, r/stocks and more</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Trending stock mentions
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Sentiment analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Momentum tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-8">
              Explore our demo to see how InsiderSignal helps you stay ahead of market movements.
            </p>
            <Link href="/dashboard">
              <Button size="lg" data-testid="button-cta-demo">
                Explore Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          InsiderSignal - Track institutional trading activity
        </div>
      </footer>
    </div>
  );
}
