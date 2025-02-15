import styles from "@/components/markdown-strong.module.css";
import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import MarkdownInlineText from "@/components/markdown-inline-text";

interface Props extends MarkdownComponent<Tokens.Strong> {
  basicallyMedium?: boolean;
  basicallyAccent?: boolean;
}

export default function MarkdownStrong({
  token,
  basicallyMedium,
  basicallyAccent,
}: Props) {
  return (
    <strong
      className={`${basicallyMedium ? "" : styles.medium} ${basicallyAccent ? "" : styles.accent}`}
    >
      <MarkdownInlineText data={token.tokens} basicallyMedium basicallyAccent />
    </strong>
  );
}
