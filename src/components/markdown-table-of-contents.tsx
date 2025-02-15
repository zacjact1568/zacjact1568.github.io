"use client";

import styles from "./markdown-table-of-contents.module.css";
import { Tokens } from "marked";
import ColoredButton from "@/components/colored-button";
import { useEffect, useMemo, useState } from "react";
import {
  faCircleChevronDown,
  faCircleChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { ColoredButtonStyle } from "@/models/component";
import Link from "next/link";
import MarkdownInlineText from "@/components/markdown-inline-text";

interface Props {
  data: Tokens.IdentifiableHeading[];
  compact: boolean;
  idName?: string;
  className?: string;
}

export default function MarkdownTableOfContents({
  data,
  compact,
  idName,
  className,
}: Props) {
  const [displayedManual, setDisplayedManual] = useState(false);
  const displayed = useMemo(
    () => !compact || displayedManual,
    [compact, displayedManual],
  );
  useEffect(() => setDisplayedManual(false), [compact]);
  return (
    <div id={idName} className={`${className || ""} ${styles.toc} no-select`}>
      {compact && (
        <ColoredButton
          leftIcon={displayed ? faCircleChevronUp : faCircleChevronDown}
          iconSpace={4}
          styling={ColoredButtonStyle.B}
          idName={styles.title}
          onClick={() => setDisplayedManual(!displayedManual)}
        >
          目录
        </ColoredButton>
      )}
      <div id={styles.content} className={`${displayed ? "" : styles.hide}`}>
        {data.map((token) => (
          <Link
            key={token.id}
            href={`#${token.id}`}
            className={`${styles.item} ${compact ? "" : styles.compact} ${token.depth === 1 ? styles["heading-1"] : ""} ${token.depth === 2 ? styles["heading-2"] : ""} ${token.depth != 1 && token.depth != 2 ? styles["heading-3"] : ""} ellipsis-text`}
          >
            <MarkdownInlineText
              data={token.tokens}
              basicallyMedium={token.depth === 1}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
