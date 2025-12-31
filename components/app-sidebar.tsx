"use client";

import type * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ListTodo,
  BookImage,
  User,
  Soup,
  NotebookText,
  LogOut,
} from "lucide-react";
import Pokeball from "@/public/icons/Pokeball";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/supabase/auth-actions";

export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: false,
    },
    {
      title: "Activities",
      icon: ListTodo,
      subItems: [
        {
          title: "Todo List",
          url: "/todolist",
          icon: ListTodo,
          isActive: false,
        },
        {
          title: "Photos Lite",
          url: "/drive-lite",
          icon: BookImage,
          isActive: false,
        },
        {
          title: "Food Review",
          url: "/food-review",
          icon: Soup,
          isActive: false,
        },
        {
          title: "Pokemon Review",
          url: "/pokemon",
          icon: Pokeball,
          isActive: false,
        },
        {
          title: "Notes Markdown",
          url: "/notes",
          icon: NotebookText,
          isActive: false,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // If user is not logged in, don't render sidebar
  if (!user) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Activity Hub</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const Icon = item.icon;

                if (item.subItems) {
                  // check if any subitem is active
                  const isParentActive = item.subItems.some(
                    (sub) => sub.url === pathname
                  );

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isParentActive}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                      <SidebarMenu>
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <SidebarMenuItem key={sub.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={pathname === sub.url}
                              >
                                <a
                                  href={sub.url}
                                  className="flex items-center gap-2 pl-6"
                                >
                                  <SubIcon className="w-4 h-4" />
                                  <span>{sub.title}</span>
                                </a>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarMenuItem>
                  );
                } else {
                  // normal top-level item
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        tooltip={item.title}
                      >
                        <a href={item.url} className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
          <Popover>
            <PopoverTrigger asChild>
              <SidebarMenuButton size="lg" className="w-full">
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs">Signed in as</span>
                    <span className="truncate font-semibold">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-48 p-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 w-full"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
