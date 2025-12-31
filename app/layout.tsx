import "./globals.css";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata = {
  title: "Activity Hub -Your personal dashboard & activity center",
  description: "Your personal dashboard & activity center",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
};

export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
    },
    {
      title: "Activities",
      subItems: [
        {
          title: "Todo List",
          url: "/todolist",
        },
        {
          title: "Photos Lite",
          url: "/drive-lite",
        },
        {
          title: "Food Review",
          url: "/food-review",
        },
        {
          title: "Pokemon Review",
          url: "/pokemon",
        },
        {
          title: "Notes Markdown",
          url: "/notes",
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 pt-0">
              <ToastProvider />
              <main className="mx-auto w-full max-w-7xl">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
