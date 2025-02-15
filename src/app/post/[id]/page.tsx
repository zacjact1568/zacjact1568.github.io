import { BarlowFont } from "@/utils/font";
import styles from "./page.module.css";
import { readPost, readPostBasic, readPostBasics } from "@/models/source";
import DateTime from "@/components/date-time";
import MarkdownArticle from "@/components/markdown-article";
import { Metadata } from "next";

interface Props {
  // 这个 params 是定死的名字，不能用其他的
  // Next >= 15 这个 params 需要异步访问
  params: Promise<Params>;
}

interface Params {
  id: string;
}

export default async function Post({ params }: Props) {
  const post = readPost((await params).id);
  return (
    <>
      <div id={styles["top-space"]} />
      <DateTime dateTime={post.date} idName={styles.date} />
      <div
        id={styles.title}
        className={`${BarlowFont.className} no-select-default-cursor`}
      >
        {post.title}
      </div>
      <MarkdownArticle data={post.content} idName={styles.content} />
    </>
  );
}

// 构建时生成所有文章的路由
// 对于所有文章页面，只会调用一次
export function generateStaticParams(): Params[] {
  return readPostBasics().map((post) => ({ id: post.id }));
}

// 禁用除 generateStaticParams 返回的路由参数
// 即 404
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = readPostBasic((await params).id);
  return {
    title: post?.title || "文章",
  };
}
