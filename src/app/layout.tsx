import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import SiteLogo from "@/components/icons/site-logo";
import Link from "next/link";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import CurrentYear from "@/components/current-year";
import { currentYear } from "@/utils/time";

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
        <header>
          <div className="container">
            <Link href="/" id="home">
              <SiteLogo />
            </Link>
            <div />
            <Link href="/about" className="navigation-button">
              <FontAwesomeIcon icon={faUser} />
            </Link>
          </div>
        </header>
        <main className="container main-content-height">{children}</main>
        <footer>
          <div className="container no-select-default-cursor">
            &copy; 2017-
            <CurrentYear server={currentYear()} />
            <SiteLogo />
          </div>
        </footer>
      </body>
    </html>
  );
}
