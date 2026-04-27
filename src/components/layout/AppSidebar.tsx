import { Home, Upload, Layout, CreditCard, Settings, Sparkles, LogOut, User, FolderOpen, Users, PanelLeft, Share2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfileRealtime } from "@/hooks/useUserProfile";

const baseMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Templates", url: "/templates", icon: Layout },
  { title: "Social Accounts", url: "/social", icon: Share2 },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminMenuItem = { title: "Users", url: "/admin/users", icon: Users };

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfileRealtime();
  const isCollapsed = state === "collapsed";

  const isAdmin = userProfile?.role === "admin";

  const menuItems = useMemo(() => {
    if (isAdmin) return [baseMenuItems[0], adminMenuItem, ...baseMenuItems.slice(1)];
    return baseMenuItems;
  }, [isAdmin]);

  const displayName = userProfile?.displayName || currentUser?.displayName || "";

  const getUserInitials = () => {
    if (displayName) {
      const names = displayName.trim().split(" ");
      if (names.length >= 2) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      return displayName.substring(0, 2).toUpperCase();
    }
    return currentUser?.email?.substring(0, 2).toUpperCase() ?? "U";
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border" collapsible="icon">
      {/* Header */}
      <SidebarHeader className="p-3 pb-2">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-primary/10 text-sidebar-foreground/60 hover:text-primary transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="flex-1 text-sm font-semibold text-sidebar-foreground">Clip on Fly</span>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-primary/10 text-sidebar-foreground/60 hover:text-primary transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-2 py-1">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => {
                const link = (
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center rounded-md text-sm text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors overflow-hidden",
                        isCollapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2"
                      )}
                      activeClassName="bg-primary/10 text-primary font-semibold border border-primary/20"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                );
                return (
                  <SidebarMenuItem key={item.title}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="z-[100]">{item.title}</TooltipContent>
                      </Tooltip>
                    ) : link}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center w-full hover:bg-primary/10 rounded-md transition-colors focus:outline-none",
                isCollapsed ? "justify-center p-2" : "gap-2.5 px-2 py-2"
              )}
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground text-xs font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-xs font-semibold text-sidebar-foreground truncate">
                    {displayName || "User"}
                  </span>
                  <span className="text-xs text-sidebar-foreground/50 truncate">
                    {currentUser?.email || ""}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg">
            <DropdownMenuLabel className="pb-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{displayName || "User"}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">{currentUser?.email || ""}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer gap-2 py-2 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors rounded-md"
            >
              <User className="h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2 py-2 font-medium transition-colors rounded-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
