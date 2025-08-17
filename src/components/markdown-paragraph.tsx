import MarkdownInlineText from "@/components/markdown-inline-text";
import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import styles from "./markdown-paragraph.module.css";

interface Props extends MarkdownComponent<Tokens.Paragraph> {
  className?: string;
}

export default function MarkdownParagraph({ token, className }: Props) {
  return (
    <p className={`${className || ""} ${styles.paragraph}`}>
      <MarkdownInlineText data={token.tokens} />
    </p>
  );
}
