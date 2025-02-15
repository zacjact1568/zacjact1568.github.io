import { Metadata } from "next";
import NotFoundPage from "@/components/not-found-page";

export const metadata: Metadata = {
  title: "404",
};

export default function NotFound() {
  // 客户端组件无法设置 metadata
  // 所以把它单独提出来
  return <NotFoundPage />;
}
