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
      // 如果 className 是字符串插值，缺省用空字符串而不是 undefined
      // 否则会被解析成 class="xxx undefined yyy"
      // 如果不是插值，则可以用 className={undefined}
      // 这种情况解析出来没有 class
      className={`${basicallyMedium ? "" : styles.medium} ${basicallyAccent ? "" : styles.accent}`}
    >
      <MarkdownInlineText data={token.tokens} basicallyMedium basicallyAccent />
    </strong>
  );
}
