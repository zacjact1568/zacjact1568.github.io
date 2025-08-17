import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import styles from "./markdown-list.module.css";
import MarkdownInlineText from "@/components/markdown-inline-text";
import MarkdownUnparsed from "@/components/markdown-unparsed";

interface Props extends MarkdownComponent<Tokens.List> {
  className?: string;
}

export default function MarkdownList({ token, className }: Props) {
  return (
    <ul
      className={`${className || ""} ${styles.list} ${token.ordered ? styles.ordered : ""}`}
    >
      {token.items.map((item, index) => (
        <li key={index} className={styles.item}>
          {item.tokens.map((token, index) =>
            (() => {
              switch (token.type) {
                case "list":
                  return (
                    <MarkdownList key={index} token={token as Tokens.List} />
                  );
                case "text":
                  return (
                    <MarkdownInlineText
                      key={index}
                      data={(token as Tokens.Text).tokens!}
                    />
                  );
                default:
                  return (
                    <MarkdownUnparsed
                      key={index}
                      token={token}
                      display="block"
                    />
                  );
              }
            })(),
          )}
        </li>
      ))}
    </ul>
  );
}
