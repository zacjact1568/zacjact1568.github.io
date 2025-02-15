import { PostBasic } from "@/models/model";
import styles from "./post-card.module.css";
import DateTime from "@/components/date-time";
import MarkdownText from "@/components/markdown-text";
import FocusableTitle from "@/components/focusable-title";
import focusableTitleStyles from "./focusable-title.module.css";

interface Props {
  data: PostBasic;
  className?: string;
}

export default function PostCard({ data, className }: Props) {
  return (
    <section
      className={`${className} ${styles.card} ${focusableTitleStyles.inside} universal-card`}
    >
      <DateTime dateTime={data.date} className={styles.date} />
      <FocusableTitle link={`/post/${data.id}`} className={styles.title}>
        {data.title}
      </FocusableTitle>
      <MarkdownText data={data.excerpt} className={styles.excerpt} />
    </section>
  );
}
