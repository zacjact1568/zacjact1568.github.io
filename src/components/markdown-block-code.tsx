import styles from "./markdown-block-code.module.css";
import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import { RootContent } from "hast";

type Props = MarkdownComponent<Tokens.HighlightedCode>;

export default function MarkdownBlockCode({ token }: Props) {
  return (
    // Highlight 11 已经移除 useBR
    // <pre> 自带 white-space: pre
    <pre className={`${styles.presentation} universal-card`}>
      <code className={`${styles.content} jetbrains-mono-font`}>
        <MarkdownBlockCodeSpans tokens={token.tokens.children} />
      </code>
      {token.lang && (
        <div className={styles.language}>{token.lang}</div>
      )}
    </pre>
  );
}

function MarkdownBlockCodeSpans({ tokens }: { tokens: RootContent[] }) {
  return (
    <>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "element":
            // 有些样式有两个
            // 比如 ['title', 'class_']
            const classNames = token.properties.className;
            const className =
              classNames instanceof Array
                ? classNames
                    .filter((cls) => typeof cls == "string" && cls in styles)
                    .map((cls) => styles[cls])
                    .join(" ")
                : undefined;
            return (
              <span key={index} className={className}>
                <MarkdownBlockCodeSpans tokens={token.children} />
              </span>
            );
          case "text":
          case "comment":
            return token.value;
          case "doctype":
            return "";
        }
      })}
    </>
  );
}
