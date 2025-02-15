import { production } from "@/utils/build";
import { Token } from "marked";
import styles from "./markdown-unparsed.module.css";

interface Props {
  token: Token;
  display: "block" | "inline";
}

export default function MarkdownUnparsed({ token, display }: Props) {
  return (
    <>
      {production ? (
        token.raw
      ) : display === "block" ? (
        <div className={styles.debug}>
          {token.raw}
          <div className={`${styles.type} jetbrains-mono-font`}>
            {token.type}
          </div>
        </div>
      ) : (
        // In HTML, <div> cannot be a descendant of <p>.
        // This will cause a hydration error.
        <span className={styles.debug}>
          {token.raw}
          <span className={`${styles.type} jetbrains-mono-font`}>
            {token.type}
          </span>
        </span>
      )}
    </>
  );
}
