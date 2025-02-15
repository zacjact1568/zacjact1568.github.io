import styles from "./date-time.module.css";
import { BarlowFont } from "@/utils/font";

interface Props {
  dateTime: string;
  idName?: string;
  className?: string;
}

export default function DateTime({ dateTime, idName, className }: Props) {
  return (
    <time
      id={idName}
      dateTime={dateTime}
      className={`${className || ""} ${styles.time} ${BarlowFont.className} no-select-default-cursor`}
    >
      {dateTime}
    </time>
  );
}
