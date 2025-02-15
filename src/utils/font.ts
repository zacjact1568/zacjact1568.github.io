import { Barlow } from "next/font/google";

export const BarlowFont = Barlow({
  weight: ["500", "700"],
  // Google Fonts 如果 preload 就必须指定 subset
  subsets: ["latin"],
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Helvetica Neue",
    "Arial",
    "Roboto",
    "Source Han Sans SC",
    "Noto Sans SC",
    "PingFang SC",
    "Microsoft YaHei",
    "sans-serif",
  ],
});
