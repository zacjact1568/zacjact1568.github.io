import { MarkdownBasicData } from "@/models/model";
import { Tokens } from "marked";
import MarkdownImage from "@/components/markdown-image";
import MarkdownLink from "@/components/markdown-link";
import MarkdownUnparsed from "@/components/markdown-unparsed";
import styles from "./markdown-inline-text.module.css";
import MarkdownMath from "@/components/markdown-math";
import MarkdownStrong from "@/components/markdown-strong";

interface Props {
  data: MarkdownBasicData;
  /**
   * 基础文本字重是否为中
   * 如果是，有一些特殊处理，例如 strong 会显示为 bold 而不是 medium
   */
  basicallyMedium?: boolean;
  /**
   * 基础文本颜色是否为强调色
   * 如果是，有一些特殊处理，例如 strong 不会变色
   */
  basicallyAccent?: boolean;
}

export default function MarkdownInlineText({
  data,
  basicallyMedium,
  basicallyAccent,
}: Props) {
  return (
    <>
      {data.map((token, index) => {
        switch (token.type) {
          case "text":
            return token.raw;
          case "full-quote":
            return (
              <span key={index} className="full-quote">
                {(token as Tokens.FullQuote).text}
              </span>
            );
          case "emoji":
            return (
              <span key={index} className="emoji">
                {(token as Tokens.Emoji).text}
              </span>
            );
          case "image":
            return (
              <MarkdownImage key={index} token={token as Tokens.SizedImage} />
            );
          case "link":
            return <MarkdownLink key={index} token={token as Tokens.Link} />;
          case "strong":
            return (
              <MarkdownStrong
                key={index}
                token={token as Tokens.Strong}
                basicallyMedium={basicallyMedium}
                basicallyAccent={basicallyAccent}
              />
            );
          case "em":
            return (
              <em key={index} className={styles.emphasis}>
                {token.text}
              </em>
            );
          case "del":
            return (
              <del key={index} className={styles.deletion}>
                {token.text}
              </del>
            );
          case "codespan":
            return (
              <code
                key={index}
                className={`${styles.code} jetbrains-mono-font`}
              >
                {token.text}
              </code>
            );
          case "inlineKatex":
            return <MarkdownMath key={index} token={token as Tokens.Math} />;
          case "br":
            return <br key={index} />;
          default:
            return (
              <MarkdownUnparsed key={index} token={token} display="inline" />
            );
        }
      })}
    </>
  );
}
