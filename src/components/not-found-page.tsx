"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/not-found-page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export default function NotFoundPage() {
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();
  useEffect(() => {
    // 这里无需用 setInterval
    // 因为 1s 过后 countdown 变化，本函数会再次被调用
    const id = setTimeout(() => {
      if (countdown > 1) {
        setCountdown((prev) => prev - 1);
      } else {
        router.replace("/");
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown, router]);
  return (
    <div id={styles.page} className="main-content-height">
      <FontAwesomeIcon id={styles.icon} icon={faCircleExclamation} />
      <div id={styles.redirect} className="no-select-default-cursor">
        <span className="emoji">{COUNTDOWN_EMOJIS[countdown - 1]}</span>{" "}
        秒后跳转到
        <Link id={styles.link} href="/" replace>
          主页
        </Link>
      </div>
    </div>
  );
}

const COUNTDOWN_EMOJIS = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];
