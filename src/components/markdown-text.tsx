import { MarkdownBasicData } from "@/models/model";
import MarkdownInlineText from "@/components/markdown-inline-text";
import styles from "./markdown-text.module.css";

interface Props {
  data: MarkdownBasicData;
  notSelectable?: boolean;
  className?: string;
}

export default function MarkdownText({
  data,
  notSelectable,
  className,
}: Props) {
  return (
    <div
      className={`${className} ${styles.text} ${notSelectable ? "no-select-default-cursor" : ""}`}
    >
      <MarkdownInlineText data={data} />
    </div>
  );
}
