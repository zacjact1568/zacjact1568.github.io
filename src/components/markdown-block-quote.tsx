import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import MarkdownParagraph from "@/components/markdown-paragraph";
import styles from "./markdown-block-quote.module.css";

type Props = MarkdownComponent<Tokens.Blockquote>;

export default function MarkdownBlockQuote({ token }: Props) {
  return (
    <blockquote className={`${styles.quote} universal-card`}>
      {token.tokens.map((tokenSub, index) =>
        tokenSub.type === "paragraph" ? (
          <MarkdownParagraph
            // 这里没法指定 key 但又必须有
            key={index}
            token={tokenSub as Tokens.Paragraph}
          />
        ) : (
          tokenSub.raw
        ),
      )}
    </blockquote>
  );
}
