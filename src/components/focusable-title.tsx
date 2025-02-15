import styles from "./focusable-title.module.css";
import { BarlowFont } from "@/utils/font";
import Link from "next/link";
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareArrowUpRight } from "@fortawesome/free-solid-svg-icons";

interface Props {
  link: string;
  className?: string;
  children: React.ReactNode;
}

export default function FocusableTitle({ link, className, children }: Props) {
  return (
    <div className={`${className} ${styles.title} no-select`}>
      <Link href={link} className={`${styles.link} ${BarlowFont.className}`}>
        {children}
      </Link>
      <FontAwesomeIcon icon={faSquareArrowUpRight} className={styles.icon} />
    </div>
  );
}
