import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import MarkdownInlineText from "@/components/markdown-inline-text";
import styles from "./markdown-table.module.css";

type Props = MarkdownComponent<Tokens.Table>;

export default function MarkdownTable({ token }: Props) {
  return (
    <table className={styles.table}>
      {token.header.length > 0 && (
        <thead className={styles.head}>
          <tr className={styles.row}>
            {token.header.map((cell, index) => (
              <td
                key={index}
                className={`${styles.cell} ${styles[`align-${cell.align || "center"}`]}`}
              >
                <MarkdownInlineText
                  data={cell.tokens}
                  basicallyMedium
                  basicallyAccent
                />
              </td>
            ))}
          </tr>
        </thead>
      )}
      <tbody className={styles.body}>
        {token.rows.map((row, index) => (
          <tr key={index} className={styles.row}>
            {row.map((cell, index) => (
              <td
                key={index}
                className={`${styles.cell} ${styles[`align-${cell.align || "center"}`]}`}
              >
                <MarkdownInlineText data={cell.tokens} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
