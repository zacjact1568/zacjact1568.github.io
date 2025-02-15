import type { NextConfig } from "next";
import { production } from "@/utils/build";

const nextConfig: NextConfig = {
  // 编译为 SSG
  // 开发的时候不要指定这个参数，加载图片会报错
  output: production ? "export" : undefined,
  // 编译产物禁用图片优化
  // SSG 无法动态优化，图片链接会 404
  images: {
    unoptimized: production,
  },
};

export default nextConfig;
