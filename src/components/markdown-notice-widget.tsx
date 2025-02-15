import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import styles from "./markdown-notice-widget.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faCircleInfo,
  faCircleQuestion,
  faFilePen,
  faThumbtack,
  faTriangleExclamation,
  faWandMagicSparkles,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { MarkdownNoticeWidgetLevel } from "@/models/model";
import { BarlowFont } from "@/utils/font";
import MarkdownInlineText from "@/components/markdown-inline-text";

type Props = MarkdownComponent<Tokens.NoticeWidget>;

export default function MarkdownNoticeWidget({ token }: Props) {
  const { level, title, content } = token.object;
  const [icon, defaultTitle] = obtainIconAndDefaultTitle(level);
  return (
    <div className={`${styles.notice} ${styles[level]} universal-card`}>
      <div className={styles.title}>
        <FontAwesomeIcon icon={icon} className={styles.icon} />
        <span
          className={`${styles.text} ${BarlowFont.className} no-select-default-cursor`}
        >
          {title || defaultTitle}
        </span>
      </div>
      <p className={styles.content}>
        <MarkdownInlineText data={content} />
      </p>
    </div>
  );
}

function obtainIconAndDefaultTitle(
  level: MarkdownNoticeWidgetLevel,
): [IconDefinition, string] {
  switch (level) {
    case MarkdownNoticeWidgetLevel.NOTE:
      return [faFilePen, "笔记"];
    case MarkdownNoticeWidgetLevel.TIP:
      return [faThumbtack, "提示"];
    case MarkdownNoticeWidgetLevel.EXAMPLE:
      return [faWandMagicSparkles, "示例"];
    case MarkdownNoticeWidgetLevel.QUESTION:
      return [faCircleQuestion, "疑问"];
    case MarkdownNoticeWidgetLevel.INFO:
      return [faCircleInfo, "信息"];
    case MarkdownNoticeWidgetLevel.WARNING:
      return [faTriangleExclamation, "警告"];
    case MarkdownNoticeWidgetLevel.ERROR:
      return [faCircleExclamation, "错误"];
  }
}
