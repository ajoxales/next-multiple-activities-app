import "./globals.css";

import { Metadata } from "next";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Multiple Activities App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="container max-w-6xl mx-auto px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
