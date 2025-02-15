import MarkdownInlineText from "@/components/markdown-inline-text";
import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import styles from "./markdown-paragraph.module.css";

type Props = MarkdownComponent<Tokens.Paragraph>;

export default function MarkdownParagraph({ token }: Props) {
  return (
    <p className={styles.paragraph}>
      <MarkdownInlineText data={token.tokens} />
    </p>
  );
}
