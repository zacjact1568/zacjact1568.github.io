import { Token } from "marked";

export interface MarkdownComponent<T extends Token> {
  token: T;
}

export const enum ColoredButtonStyle {
  A = "a",
  B = "b",
}
