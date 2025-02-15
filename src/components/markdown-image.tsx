import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFeather } from "@fortawesome/free-solid-svg-icons";
import { BarlowFont } from "@/utils/font";
import styles from "./markdown-image.module.css";

type Props = MarkdownComponent<Tokens.SizedImage>;

export default function MarkdownImage({ token }: Props) {
  const caption = token.text || token.title;
  return (
    <>
      {caption ? (
        <figure className={styles.figure}>
          <Image
            src={token.href}
            alt={caption}
            width={token.width}
            height={token.height}
            className={styles.image}
          />
          <figcaption className={styles.caption}>
            <FontAwesomeIcon icon={faFeather} className={styles.icon} />
            <span className={`${styles.text} ${BarlowFont.className}`}>
              {caption}
            </span>
          </figcaption>
        </figure>
      ) : (
        <Image
          src={token.href}
          alt=""
          width={token.width}
          height={token.height}
          className={styles.image}
        />
      )}
    </>
  );
}
