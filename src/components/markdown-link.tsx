import styles from "./markdown-link.module.css";
import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import MarkdownInlineText from "@/components/markdown-inline-text";

type Props = MarkdownComponent<Tokens.Link>;

export default function MarkdownLink({ token }: Props) {
  return (
    <a
      href={token.href}
      title={token.title ? token.title : undefined}
      className={styles.link}
    >
      <MarkdownInlineText data={token.tokens} />
    </a>
  );
}
