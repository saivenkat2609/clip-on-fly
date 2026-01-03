import { Home, Upload, Layout, CreditCard, Settings, Sparkles, LogOut, User, FolderOpen, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
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
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminMenuItem = {
  title: "Users",
  url: "/admin/users",
  icon: Users,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfileRealtime();
  const isCollapsed = state === "collapsed";

  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';

  // Build menu items based on user role
  const menuItems = useMemo(() => {
    if (isAdmin) {
      // Insert admin menu item after Dashboard (at index 1)
      return [
        baseMenuItems[0], // Dashboard
        adminMenuItem,    // Users (Admin only)
        ...baseMenuItems.slice(1), // Rest of items
      ];
    }
    return baseMenuItems;
  }, [isAdmin]);

  const getUserInitials = () => {
    if (!currentUser) return "??";
    if (currentUser.displayName) {
      const names = currentUser.displayName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return currentUser.displayName.substring(0, 2).toUpperCase();
    }
    if (currentUser.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return "U";
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
    <Sidebar className={cn(
      isCollapsed ? "w-16" : "w-64",
      "border-r border-sidebar-border shadow-sm"
    )} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md group-hover:shadow-lg transition-all">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              NebulaAI
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground transition-all hover:bg-primary/10 hover:text-primary hover:shadow-md group"
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20"
                    >
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-sidebar-accent rounded-xl p-2.5 transition-all hover:shadow-sm group focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0">
              <Avatar className="h-9 w-9 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-sm font-semibold text-sidebar-foreground truncate">
                    {currentUser?.displayName || "User"}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {currentUser?.email || ""}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg">
            <DropdownMenuLabel className="pb-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">{currentUser?.displayName || "User"}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">
                  {currentUser?.email || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer gap-2 py-2 hover:bg-primary/10 hover:text-primary hover:shadow-sm focus:bg-primary/10 focus:text-primary transition-all rounded-lg group"
            >
              <User className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:shadow-sm focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2 py-2 font-medium transition-all rounded-lg group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
