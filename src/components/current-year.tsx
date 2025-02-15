"use client";

import { useEffect, useState } from "react";
import { currentYear } from "@/utils/time";

export default function CurrentYear({ server }: { server: number }) {
  const [year, setYear] = useState(server);
  // 第二个参数指定为空数组，表明 effect 不依赖任何状态，它不会重启，即仅在挂载时运行一次
  useEffect(() => {
    setYear(currentYear());
  }, []);
  // 直接获取年份会导致 hydration 错误，需要在 useEffect 中获取
  // https://nextjs.org/docs/messages/react-hydration-error
  return <span>{year}</span>;
}
