import styles from "./colored-button.module.css";
import { BarlowFont } from "@/utils/font";
import { ColoredButtonStyle } from "@/models/component";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { CSSProperties } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Props {
  leftIcon?: IconProp;
  rightIcon?: IconProp;
  iconSpace?: number;
  styling?: ColoredButtonStyle;
  idName?: string;
  onClick: () => void;
  // 插槽元素 children 这个名字是定死的
  children: React.ReactNode;
}

export default function ColoredButton({
  leftIcon,
  rightIcon,
  iconSpace,
  styling = ColoredButtonStyle.A,
  idName,
  onClick,
  children,
}: Props) {
  return (
    <button
      id={idName}
      className={`${styles.button} ${BarlowFont.className} color-transition ${styling === ColoredButtonStyle.A ? styles["style-a"] : ""} ${styling === ColoredButtonStyle.B ? styles["style-b"] : ""}`}
      style={
        {
          "--iconSpacePx": iconSpace ? iconSpace + "px" : "unset",
        } as CSSProperties
      }
      onClick={onClick}
    >
      {leftIcon && (
        // 注意这里 styles 里面的类不能直接用 camel case 引用，识别不出来
        <FontAwesomeIcon icon={leftIcon} className={styles["left-icon"]} />
      )}
      {children}
      {rightIcon && (
        <FontAwesomeIcon icon={rightIcon} className={styles["right-icon"]} />
      )}
    </button>
  );
}
