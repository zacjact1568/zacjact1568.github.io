import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import NavigationBar from "@/components/navigation-bar";
import BottomBar from "@/components/bottom-bar";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: {
    default: "Zack Zhang",
    template: "%s - Zack Zhang",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <NavigationBar />
        <main className="main-container main-content-height">{children}</main>
        <BottomBar />
      </body>
    </html>
  );
}
