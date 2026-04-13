import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  TrendingUp, 
  Sparkles, 
  Bell, 
  Calendar,
  Eye,
  Check
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface DemoRegistrationPromptProps {
  open: boolean;
  onClose: () => void;
  sessionCount: number;
  maxReached?: boolean;
}

export function DemoRegistrationPrompt({ open, onClose, sessionCount, maxReached }: DemoRegistrationPromptProps) {
  const [isLogin, setIsLogin] = useState(false);
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
            onClose();
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
            onClose();
            setLocation("/dashboard");
          },
        }
      );
    }
  };

  const benefits = [
    { icon: TrendingUp, text: "7-day trade history", tier: "free" },
    { icon: Eye, text: "All insider & congressional trades", tier: "free" },
    { icon: Calendar, text: "Full institutional data", tier: "free" },
    { icon: Sparkles, text: "AI-powered trade insights", tier: "premium" },
    { icon: Bell, text: "Email notifications", tier: "premium" },
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !maxReached && onClose()}>
      <DialogContent className="sm:max-w-lg" aria-describedby="registration-prompt-description">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              <Eye className="h-3 w-3 mr-1" />
              Demo Session {sessionCount}
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {maxReached 
              ? "Create a Free Account to Continue" 
              : "Unlock Full Access"}
          </DialogTitle>
          <DialogDescription id="registration-prompt-description">
            {maxReached 
              ? "You've explored the demo. Register now to access all features."
              : "You're seeing limited demo data. Create a free account to unlock more."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="bg-muted/30 rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">What you'll get with a free account:</p>
            <div className="grid gap-1.5">
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <benefit.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{benefit.text}</span>
                  {benefit.tier === "premium" && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4">Premium</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="prompt-firstName" className="text-xs">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="prompt-firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="pl-9"
                      data-testid="input-prompt-firstname"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prompt-lastName" className="text-xs">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="prompt-lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="pl-9"
                      data-testid="input-prompt-lastname"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="prompt-email" className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prompt-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-9"
                  data-testid="input-prompt-email"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-password" className="text-xs">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prompt-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={6}
                  className="pl-9"
                  data-testid="input-prompt-password"
                />
              </div>
            </div>
            
            {!isLogin && (
              <div className="space-y-2 border rounded-md p-2 bg-muted/30">
                <div className="text-xs font-medium flex items-center gap-2">
                  <Shield className="h-3 w-3 text-destructive" />
                  Legal Disclaimer
                </div>
                <ScrollArea className="h-20 pr-4">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    The information provided on InsiderSignal is for general informational and educational purposes only. 
                    Nothing on this platform constitutes financial advice, investment advice, or trading advice. InsiderSignal 
                    is not a registered investment advisor or broker-dealer. Trading and investing involves substantial risk 
                    of loss. Past performance does not guarantee future results. AI-generated analysis should not be considered 
                    investment recommendations. You assume full responsibility for all investment decisions you make.
                  </p>
                </ScrollArea>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="prompt-read-disclaimer"
                      checked={hasReadDisclaimer}
                      onCheckedChange={(checked) => setHasReadDisclaimer(checked === true)}
                      data-testid="checkbox-prompt-read-disclaimer"
                    />
                    <label htmlFor="prompt-read-disclaimer" className="text-[10px] leading-relaxed cursor-pointer">
                      I have read and understood the legal disclaimer
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="prompt-acknowledge-disclaimer"
                      checked={hasAcknowledgedDisclaimer}
                      onCheckedChange={(checked) => setHasAcknowledgedDisclaimer(checked === true)}
                      data-testid="checkbox-prompt-acknowledge-disclaimer"
                    />
                    <label htmlFor="prompt-acknowledge-disclaimer" className="text-[10px] leading-relaxed cursor-pointer">
                      I am solely responsible for my own investment decisions
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || (!isLogin && !canRegister)} 
              data-testid="button-prompt-submit"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : isLogin ? (
                <>Sign In</>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary underline-offset-4 hover:underline"
                    data-testid="button-prompt-switch-register"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary underline-offset-4 hover:underline"
                    data-testid="button-prompt-switch-login"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>

          {!maxReached && (
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-muted-foreground"
              data-testid="button-continue-demo"
            >
              Continue with limited demo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
