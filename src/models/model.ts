import { Token, Tokens } from "marked";

export interface PostBase {
  title: string;
  date: string;
}

export interface MarkdownFrontMatter extends PostBase {
  excerpt: string;
  hide?: boolean;
}

export interface PostBasic extends PostBase {
  id: string;
  excerpt: MarkdownBasicData;
}

export interface Post extends PostBase {
  content: MarkdownData;
}

export type MarkdownBasicData = Token[];

export interface MarkdownData {
  basic: MarkdownBasicData;
  toc?: Tokens.IdentifiableHeading[];
}

export interface MarkdownWidgetData {
  type: MarkdownWidgetType;
}

export const enum MarkdownWidgetType {
  NOTICE = "notice",
}

export interface MarkdownNoticeWidgetData extends MarkdownWidgetData {
  level: MarkdownNoticeWidgetLevel;
  title?: string;
  content: MarkdownBasicData;
}

export const enum MarkdownNoticeWidgetLevel {
  NOTE = "note",
  TIP = "tip",
  EXAMPLE = "example",
  QUESTION = "question",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}
