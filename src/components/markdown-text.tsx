import { MarkdownBasicData } from "@/models/model";
import MarkdownInlineText from "@/components/markdown-inline-text";
import styles from "./markdown-text.module.css";

interface Props {
  data: MarkdownBasicData;
  className?: string;
}

export default function MarkdownText({ data, className }: Props) {
  return (
    <div className={`${className || ""} ${styles.text}`}>
      <MarkdownInlineText data={data} />
    </div>
  );
}
