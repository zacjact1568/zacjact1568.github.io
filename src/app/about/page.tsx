import { readRaw } from "@/models/source";
import styles from "./page.module.css";
import MarkdownArticle from "@/components/markdown-article";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
};

export default function About() {
  const content = readRaw("about");
  return (
    <>
      <div id={styles["top-space"]} />
      <div id={styles.title} className="no-select-default-cursor">
        关于
      </div>
      <MarkdownArticle data={content} idName={styles.content} />
    </>
  );
}
