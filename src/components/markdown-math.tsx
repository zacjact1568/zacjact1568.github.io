import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import katex from "katex";
import styles from "./markdown-math.module.css";
// 不加这个也可以，现代浏览器貌似有内置的公式样式
// 但实测用了这个字体会大点
// TODO 它会和其他 CSS 一起打包，但并不是所有文章都有公式，可考虑按需加载
import "katex/dist/katex.min.css";

type Props = MarkdownComponent<Tokens.Math>;

export default function MarkdownMath({ token }: Props) {
  const html = katex.renderToString(token.text, {
    output: "mathml",
    // 不要设置 displayMode: token.displayMode
    // 块级公式 token.displayMode 为 true
    // displayMode 为 true 会让公式居中
  });
  return (
    <>
      {token.displayMode ? (
        <p
          className={`${styles.block} universal-card`}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      ) : (
        <span
          className={styles.inline}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
      )}
    </>
  );
}
