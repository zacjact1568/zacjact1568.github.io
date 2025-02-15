import { MarkdownNoticeWidgetData, MarkdownWidgetData } from "@/models/model";
import { Root } from "hast";

declare module "marked" {

  // 把这个扩展放到 *.d.ts 文件里，避免以下 lint 错误
  // ES2015 module syntax is preferred over namespaces
  namespace Tokens {
    interface FullQuote {
      type: "full-quote";
      raw: string;
      text: string;
    }

    interface Emoji {
      type: "emoji";
      raw: string;
      text: string;
    }

    type Widget = WidgetBase<MarkdownWidgetData>;

    type NoticeWidget = WidgetBase<MarkdownNoticeWidgetData>;

    interface IdentifiableHeading extends Tokens.Heading {
      id: string;
    }

    interface HighlightedCode extends Tokens.Code {
      tokens: Root
    }

    interface SizedImage extends Tokens.Image {
      width: number;
      height: number;
    }

    interface Math {
      type: "inlineKatex" | "blockKatex";
      raw: string;
      text: string;
      displayMode: boolean;
    }
  }

  interface WidgetBase<W extends MarkdownWidgetData> {
    type: "widget";
    raw: string;
    object: W;
  }
}
