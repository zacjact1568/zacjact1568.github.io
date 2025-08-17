import styles from "./bottom-bar.module.css";
import CurrentYear from "@/components/current-year";
import { currentYear } from "@/utils/time";
import SiteLogo from "@/components/icons/site-logo";

export default function BottomBar() {
  return (
    <footer className={styles.footer}>
      <div className="main-container no-select default-cursor">
        &copy; 2017-
        <CurrentYear server={currentYear()} />
        <SiteLogo />
      </div>
    </footer>
  );
}
