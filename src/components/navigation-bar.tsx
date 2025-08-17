import Link from "next/link";
import SiteLogo from "@/components/icons/site-logo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import styles from "./navigation-bar.module.css";

export default function NavigationBar() {
  return (
    <header className={styles.header}>
      <div className="main-container">
        <Link href="/" className={styles.logo}>
          <SiteLogo />
        </Link>
        <div />
        <Link href="/about" className={styles.button}>
          <FontAwesomeIcon icon={faUser} />
        </Link>
      </div>
    </header>
  );
}
