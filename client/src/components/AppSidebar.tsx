import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  TrendingDown, 
  Landmark, 
  Bell, 
  Search,
  Settings,
  HelpCircle,
  Activity,
  MessageSquare,
  Calendar,
  Crown,
  BellRing,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";
import { DataSourceStatus } from "@/components/data-source-status";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Alert } from "@shared/schema";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  hasDynamicBadge?: boolean;
  premium?: boolean;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Insider Trades", url: "/insider-trades", icon: TrendingDown },
  { title: "Congressional", url: "/congressional", icon: Landmark },
  { title: "Institutional", url: "/institutional", icon: Building2 },
  { title: "Social Buzz", url: "/social-buzz", icon: MessageSquare },
  { title: "IPO Calendar", url: "/ipo-calendar", icon: Calendar, premium: true },
  { title: "Alerts", url: "/alerts", icon: Bell, hasDynamicBadge: true },
  { title: "Search", url: "/search", icon: Search },
];

const secondaryNavItems: NavItem[] = [
  { title: "Alert Settings", url: "/alert-settings", icon: BellRing, premium: true },
  { title: "Membership", url: "/membership", icon: Crown },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isPremium = user?.subscriptionTier === "premium";

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });
  
  const activeAlertCount = alerts.filter(a => !a.dismissed).length;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">InsiderSignal</h1>
            <p className="text-xs text-muted-foreground">Trading Intelligence</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.premium && !isPremium && (
                        <Crown className="h-3 w-3 ml-auto text-amber-500" />
                      )}
                      {item.hasDynamicBadge && activeAlertCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {activeAlertCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.premium && !isPremium && (
                        <Crown className="h-3 w-3 ml-auto text-amber-500" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-4">
        <DataSourceStatus />
        <div className="text-xs text-muted-foreground">
          {isPremium ? (
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-500" />
              <span className="text-amber-500 font-medium">Premium</span>
            </div>
          ) : (
            <p className="mt-1">Free tier - <Link href="/membership" className="text-primary hover:underline">Upgrade</Link></p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
