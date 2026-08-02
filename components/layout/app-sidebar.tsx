"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import {
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconPhotoUp,
  IconUserCircle,
  IconLoader2,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Icons } from "../icons";
import { OrgSwitcher } from "../org-switcher";
import { useAuthStore } from "@/stores/auth.store";
import { logout } from "@/service/authApi";
import { toast } from "sonner";
import { filterNavItemsWithCheckers } from "@/lib/filterNavItems";
import { navItems } from "@/constants/data";
import { getStageProjectCount } from '@/service/Stages';
export const company = {
  name: "Acme Inc",
  logo: IconPhotoUp,
  plan: "Enterprise",
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hydrated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);
  const permissions = useAuthStore((s) => s.permissions);
const [stageCounts, setStageCounts] = React.useState<
  { stage: string; projectCount: number }[]
>([]);
  const isLoading = !hydrated;

  // Memoize filtered nav items — no useEffect + setState needed
  const filteredNavItems = React.useMemo(() => {
    if (!user || permissions.length === 0) return [];
    return filterNavItemsWithCheckers(navItems, {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    });
  }, [user, permissions, hasPermission, hasAnyPermission, hasAllPermissions]);

  // Memoize grouped nav items
  const navGroups = React.useMemo(() => {
    return filteredNavItems.reduce<
      Record<string, typeof filteredNavItems>
    >((acc, item) => {
      const section = item.group ?? "Overview";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    }, {});
  }, [filteredNavItems]);

  const handleSignOut = async () => {
    try {
      toast.success("Signed out successfully");
      logout();
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };
React.useEffect(() => {
  const fetchStageCounts = async () => {
    try {
      const data = await getStageProjectCount();
      setStageCounts(data);
    } catch (error) {
      console.error('Failed to fetch stage project counts:', error);
    }
  };

  fetchStageCounts();
}, []);
const getStageCount = React.useCallback(
  (countKey?: string) => {
    if (!countKey) return undefined;

    return stageCounts.find(
      (item) => item.stage === countKey
    )?.projectCount;
  },
  [stageCounts]
);
  if (!user || isLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 p-4">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading navigation...
            </p>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (filteredNavItems.length === 0) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 p-4 text-center">
            <div className="rounded-full bg-muted p-3">
              <IconUserCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No Access</p>
              <p className="text-xs text-muted-foreground">
                You don&apos;t have permission to access any features
              </p>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {Object.entries(navGroups).map(([groupLabel, items]) => (
          <SidebarGroup key={groupLabel} className="py-0">
            <SidebarGroupLabel className="px-1.5 py-0 text-[11px]">
              {groupLabel}
            </SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                const isActive =
                  pathname === item.url ||
                  item.items?.some((child) => pathname === child.url) ||
                  false;

                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={isActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          isActive={isActive}
                        >
                          {item.icon && <Icon />}
                          <span>{item.title}</span>
                          <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                     <SidebarMenuSub>
  {item.items?.map((subItem) => {
    const SubIcon = subItem.icon
      ? Icons[subItem.icon]
      : undefined;

    const count = getStageCount(subItem.countKey);

    return (
      <SidebarMenuSubItem key={subItem.title}>
        <SidebarMenuSubButton
          asChild
          isActive={pathname === subItem.url}
        >
          <Link href={subItem.url}>
            {SubIcon && <SubIcon className="h-4 w-4" />}

            <span className="flex-1">
              {subItem.title}
            </span>

            {count !== undefined && count > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  })}
</SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url || "#"}>
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {user && (
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="px-1 py-1.5">
                    {user && (
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/profile")}
                  >
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
