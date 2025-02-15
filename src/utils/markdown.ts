import {
  Lexer,
  marked,
  Tokenizer,
  TokenizerExtension,
  TokenizerObject,
  Tokens,
} from "marked";
import {
  MarkdownBasicData,
  MarkdownData,
  MarkdownWidgetData,
  MarkdownWidgetType,
} from "@/models/model";
import { splitLineBreaks, trimEnd } from "@/utils/string";
import emojiRegex from "emoji-regex";
import { common as LowlightLanguages, createLowlight } from "lowlight";
import { Root } from "hast";
import { obtainPostImageSize } from "@/models/source";
import matlab from "highlight.js/lib/languages/matlab";
import markedKatex from "marked-katex-extension";
import { production } from "@/utils/build";

const FULL_QUOTE_REGEXP_START = /[“”’‘]/;

const FULL_QUOTE_REGEXP_TOKENIZER = /^[“”’‘]+/;

const FullQuoteTokenizerExtension: TokenizerExtension = {
  name: "full-quote",
  level: "inline",
  start: (src) => FULL_QUOTE_REGEXP_START.exec(src)?.index,
  tokenizer(src): Tokens.FullQuote | undefined {
    const match = FULL_QUOTE_REGEXP_TOKENIZER.exec(src);
    if (!match) return;
    return {
      type: "full-quote",
      raw: match[0],
      text: match[0],
    };
  },
};

const EMOJI_REGEXP_START = new RegExp(emojiRegex().source);

const EMOJI_REGEXP_TOKENIZER = new RegExp(`^(?:${emojiRegex().source})+`);

const EmojiTokenizerExtension: TokenizerExtension = {
  name: "emoji",
  level: "inline",
  start: (src) => EMOJI_REGEXP_START.exec(src)?.index,
  tokenizer(src): Tokens.Emoji | undefined {
    const match = EMOJI_REGEXP_TOKENIZER.exec(src);
    if (!match) return;
    return {
      type: "emoji",
      raw: match[0],
      text: match[0],
    };
  },
};

const WIDGET_REGEXP_START = /\{# /;

const WIDGET_REGEXP_TOKENIZER = /^\{# (.+) #}/;

const WidgetTokenizerExtension: TokenizerExtension = {
  name: "widget",
  level: "block",
  start: (src) => WIDGET_REGEXP_START.exec(src)?.index,
  tokenizer(src): Tokens.Widget | undefined {
    const match = WIDGET_REGEXP_TOKENIZER.exec(src);
    if (!match) return;
    const object = JSON.parse(match[1]);
    if (object.type === MarkdownWidgetType.NOTICE) {
      // 注意这里不要使用 markdownLexInline，会造成后续语法解析不出来
      // 似乎在解析过程中只能使用 this.lexer.inlineTokens，而不能使用 marked.Lexer.lexInline
      // 可能是 Lexer 内部有某种跟解析位置有关的状态？
      object.content = this.lexer.inlineTokens(object.content as string);
    }
    return {
      type: "widget",
      raw: match[0],
      object: object as MarkdownWidgetData,
    };
  },
};

const DEL_REGEXP_TOKENIZER = /^(~~)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/;

const OverridingTokenizer: TokenizerObject = {
  del(src): Tokens.Del | undefined {
    const cap = DEL_REGEXP_TOKENIZER.exec(src);
    if (!cap) return;
    return {
      type: "del",
      raw: cap[0],
      text: cap[2],
      tokens: this.lexer.inlineTokens(cap[2]),
    };
  },
  fences(src): Tokens.HighlightedCode | undefined {
    const code = DefaultTokenizer.fences(src);
    if (!code) return;
    const [tokens, language] = highlightCodes(code.text, code.lang);
    return {
      type: code.type,
      raw: code.raw,
      lang: language,
      text: code.text,
      tokens: tokens,
    };
  },
  link(src): Tokens.Link | Tokens.SizedImage | undefined {
    const link = DefaultTokenizer.link(src);
    if (link?.type != "image") {
      return link;
    }
    let href = link.href;
    // Next 要求图片尺寸来防止 CLS
    // 如果要它自动获取本地图片的尺寸，需要挨个导入图片为 StaticImageData
    // 但挨个导入图片太麻烦了，所以自己去获取图片尺寸
    // TODO 如果图片是远程的，需要在 md 里面用自定义语法指定尺寸
    if (!href.startsWith("/images/")) {
      throw Error(`Unsupported image link = ${href}`);
    }
    // 将 images 换成 image
    href = "/image" + href.slice(7)
    const [width, height] = obtainPostImageSize(href);
    // 编译时将 jpg 后缀替换为 webp
    if (production && href.endsWith(".jpg")) {
      href = href.slice(0, -3) + "webp";
    }
    return {
      type: link.type,
      raw: link.raw,
      href: href,
      title: link.title,
      text: link.text,
      width: width,
      height: height,
    };
  },
};

function highlightCodes(
  codes: string,
  language: string = "plaintext",
): [Root, string?] {
  let tokens: Root;
  // Highlight 默认导入实例会自动注册一系列的语言
  // Lowlight 有自己的 Highlight 实例，注册的语言是 common
  // 所以不要用默认导入的 Highlight 的 getLanguage 去判断，两个的语言集都不同
  // 而 Lowlight 并未暴露它的 Highlight 实例，只能通过 try-catch 去判断是否支持这个语言
  try {
    // prefix 清除掉 hljs- 前缀
    tokens = Lowlight.highlight(language, codes, { prefix: "" });
  } catch {
    return highlightCodes(codes);
  }
  // console.dir(tokens, { depth: undefined });
  if (language === "plaintext") {
    return [tokens];
  }
  return [tokens, language];
}

const Lowlight = setupLowlight();

function setupLowlight() {
  // common 包含常见的一些语言
  // 如果需要所有语言，改成 all
  const lowlight = createLowlight(LowlightLanguages);
  lowlight.register({ matlab });
  return lowlight;
}

// new Lexer 放到 marked.use 前面，就可以拿到默认配置
// 不要直接 new Tokenizer 或者用 Tokenizer.prototype，里面一些字段是由 Lexer 设置的
// Lexer 的 tokenizer 是 private 的，所以通过 option 去取
// 还有其他更好的方法吗？
const DefaultTokenizer: Tokenizer = new Lexer().options.tokenizer!;

marked.use(
  {
    extensions: [
      FullQuoteTokenizerExtension,
      EmojiTokenizerExtension,
      WidgetTokenizerExtension,
    ],
    tokenizer: OverridingTokenizer,
  },
  // 注意 $xxx$ 前后必须有空格，否则解析不出来
  // 或者设置 nonStandard: true 选项
  markedKatex(),
);

function extractTableOfContents(data: MarkdownBasicData, maxDepth: number) {
  const id = Array(maxDepth).fill(0);
  let lastDepth = 0;
  const toc = data.filter((value) => {
    if (value.type !== "heading") {
      return false;
    }
    const depth = Math.min(value.depth, maxDepth);
    if (depth < lastDepth) {
      id.fill(0, depth, lastDepth);
    }
    id[depth - 1] += 1;
    (value as Tokens.IdentifiableHeading).id = trimEnd(
      id.join("-"),
      "0",
      "0",
      "-",
    );
    lastDepth = depth;
    return true;
  });
  if (toc.length) {
    return toc as Tokens.IdentifiableHeading[];
  }
}

export function markdownLex(source: string): MarkdownData {
  const basic = marked.lexer(source) as MarkdownBasicData;
  const toc = extractTableOfContents(basic, 3);
  return {
    basic: basic,
    toc: toc,
  };
}

export function markdownLexInline(source: string) {
  const data: MarkdownBasicData = [];
  splitLineBreaks(source, (part, last) => {
    data.push(...marked.Lexer.lexInline(part));
    if (!last) {
      data.push({
        type: "br",
        raw: "",
      });
    }
  });
  return data;
}
