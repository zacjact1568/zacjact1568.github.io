import { join } from "path";
import fs from "fs";
import fm from "front-matter";
import { MarkdownFrontMatter, Post, PostBasic } from "@/models/model";
import { markdownLex, markdownLexInline } from "@/utils/markdown";
import { imageSize } from "image-size";

const RAW_PATH = join(process.cwd(), "raw");

const POST_PATH = join(RAW_PATH, "post");

const PUBLIC_PATH = join(process.cwd(), "public");

export function readPostBasics() {
  return (
    fs
      .readdirSync(POST_PATH)
      .filter((file) => file.endsWith(".md"))
      // slice 是为了去掉 .md 后缀
      .map((file) => readPostBasic(file.slice(0, -3)))
      .filter((post) => post != undefined)
      // 按日期倒序
      .sort((postA, postB) => (postA.date < postB.date ? 1 : -1))
  );
}

export function readPost(id: string): Post {
  const result = readPostFrontMatter(id);
  const attrs = result.attributes;
  const content = markdownLex(result.body);
  return {
    title: attrs.title,
    date: attrs.date,
    content: content,
  };
}

export function readRaw(id: string) {
  const path = join(RAW_PATH, `${id}.md`);
  const file = fs.readFileSync(path).toString();
  return markdownLex(file);
}

export function obtainPostImageSize(src: string): [number, number] {
  // 事实上 Next 也是用的 image-size 这个库来获取图片尺寸
  // 见 image-optimizer
  const path = join(PUBLIC_PATH, src)
  const size = imageSize(path);
  if (!size.width || !size.height) {
    throw Error(`Could not obtain image size from ${src}`);
  }
  return [size.width, size.height];
}

export function readPostBasic(id: string): PostBasic | undefined {
  const attrs = readPostFrontMatter(id).attributes;
  if (attrs.hide) return;
  const excerpt = markdownLexInline(attrs.excerpt);
  return {
    id: id,
    title: attrs.title,
    date: attrs.date,
    excerpt: excerpt,
  };
}

function readPostFrontMatter(id: string) {
  const path = join(POST_PATH, `${id}.md`);
  const file = fs.readFileSync(path).toString();
  return fm<MarkdownFrontMatter>(file);
}
