"use client";

import { MarkdownData } from "@/models/model";
import MarkdownHeading from "@/components/markdown-heading";
import { Tokens } from "marked";
import MarkdownUnparsed from "@/components/markdown-unparsed";
import styles from "./markdown-article.module.css";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import MarkdownParagraph from "@/components/markdown-paragraph";
import MarkdownBlockQuote from "@/components/markdown-block-quote";
import MarkdownList from "@/components/markdown-list";
import MarkdownWidget from "@/components/markdown-widget";
import MarkdownTableOfContents from "@/components/markdown-table-of-contents";
import MarkdownBlockCode from "@/components/markdown-block-code";
import MarkdownTable from "@/components/markdown-table";
import MarkdownMath from "@/components/markdown-math";

interface Props {
  data: MarkdownData;
  notSelectable?: boolean;
  idName?: string;
}

export default function MarkdownArticle({
  data,
  notSelectable,
  idName,
}: Props) {
  const { toc, basic } = data;
  const [width, setWidth] = useState(0);
  // 不要在这里初始化为 window.innerHeight
  // 编译时会报错 window is not defined
  const [height, setHeight] = useState(0);
  const compact = useMemo(() => width < 760 || height < 860, [width, height]);
  const contentElementRef = useRef<HTMLElement>(null);
  const [tocTop, setTocTop] = useState(0);
  useEffect(() => {
    // 因为 useEffect 只在初始执行一次，这个 ResizeObserver 直接放到里面即可
    // 放到外面会在组件重新渲染时重新创建
    const resizeObserver = new ResizeObserver((entries) => {
      setWidth(entries[0].contentBoxSize[0].inlineSize);
    });
    const windowResizeListener = () => {
      setHeight(window.innerHeight);
    };
    // windowResizeListener 不会在订阅时立刻调用一次
    // 这里手动调用，否则 height 是 0
    windowResizeListener();
    // ref 在提交（DOM 更新）阶段被设置，useEffect 回调在提交、页面更新之后
    // 所以现在 contentElement 一定不为空
    const contentElement = contentElementRef.current!;
    resizeObserver.observe(contentElement);
    addEventListener("resize", windowResizeListener);
    // 如果第一个元素就是标题，contentElement 的 top 会把标题 ::before 的 padding-top 算进去
    // 造成目录偏高，所以这里需要把 tocTop 加上这个 padding-top
    const first = contentElement.firstElementChild;
    const extra = first
      ? Number(
          // slice 用于去掉末尾的 px
          // 如果 CSS 没有 ::before，paddingTop 是 0px
          window.getComputedStyle(first, "::before").paddingTop.slice(0, -2),
        )
      : 0;
    setTocTop(contentElement.getBoundingClientRect().top + 2 + extra);
    return () => {
      resizeObserver.disconnect();
      removeEventListener("resize", windowResizeListener);
    };
  }, []);
  return (
    <div id={idName} style={{ "--tocTopPx": tocTop + "px" } as CSSProperties}>
      {toc && tocTop > 0 && (
        // 注意 tocTop 要用 > 0 判断
        // 否则在 setTocTop 之前这里会显示一个 0，造成 top 测量偏大
        // 可能是因为 React 的 && 只处理了 false 和 undefined？
        <MarkdownTableOfContents
          data={toc}
          compact={compact}
          idName={styles.toc}
          className={compact ? styles.compact : undefined}
        />
      )}
      <article
        id={styles.content}
        ref={contentElementRef}
        // 用空字符串而不是 undefined，否则会被解析成 class="undefined"
        className={`${notSelectable ? "no-select-default-cursor" : ""}`}
      >
        {basic.map((token, index) => {
          switch (token.type) {
            case "heading":
              return (
                <MarkdownHeading
                  key={index}
                  token={token as Tokens.IdentifiableHeading}
                />
              );
            case "paragraph":
              return (
                <MarkdownParagraph
                  key={index}
                  token={token as Tokens.Paragraph}
                />
              );
            case "blockquote":
              return (
                <MarkdownBlockQuote
                  key={index}
                  token={token as Tokens.Blockquote}
                />
              );
            case "list":
              return <MarkdownList key={index} token={token as Tokens.List} />;
            case "code":
              return (
                <MarkdownBlockCode
                  key={index}
                  token={token as Tokens.HighlightedCode}
                />
              );
            case "table":
              return (
                <MarkdownTable key={index} token={token as Tokens.Table} />
              );
            case "blockKatex":
              return <MarkdownMath key={index} token={token as Tokens.Math} />;
            case "widget":
              return (
                <MarkdownWidget key={index} token={token as Tokens.Widget} />
              );
            case "hr":
              return <hr key={index} className={styles.line} />;
            case "space":
              return <div key={index} className={styles.space} />;
            default:
              return (
                <MarkdownUnparsed key={index} token={token} display="block" />
              );
          }
        })}
      </article>
    </div>
  );
}
