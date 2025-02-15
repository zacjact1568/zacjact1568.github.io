import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import MarkdownInlineText from "@/components/markdown-inline-text";
import styles from "./markdown-heading.module.css";

type Props = MarkdownComponent<Tokens.IdentifiableHeading>;

export default function MarkdownHeading({ token }: Props) {
  return (
    <>
      {(() => {
        switch (token.depth) {
          case 1:
            return (
              <h1 id={token.id} className={styles["heading-1"]}>
                <MarkdownInlineText data={token.tokens} basicallyMedium />
              </h1>
            );
          case 2:
            return (
              <h2 id={token.id} className={styles["heading-2"]}>
                <MarkdownInlineText data={token.tokens} basicallyMedium />
              </h2>
            );
          default:
            return (
              <h3 id={token.id} className={styles["heading-3"]}>
                <MarkdownInlineText data={token.tokens} basicallyMedium />
              </h3>
            );
        }
      })()}
    </>
  );
}
