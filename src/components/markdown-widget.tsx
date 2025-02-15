import { MarkdownComponent } from "@/models/component";
import { Tokens } from "marked";
import { MarkdownWidgetType } from "@/models/model";
import MarkdownUnparsed from "@/components/markdown-unparsed";
import MarkdownNoticeWidget from "@/components/markdown-notice-widget";

type Props = MarkdownComponent<Tokens.Widget>;

export default function MarkdownWidget({ token }: Props) {
  return (
    <>
      {(() => {
        switch (token.object.type) {
          case MarkdownWidgetType.NOTICE:
            return (
              <MarkdownNoticeWidget token={token as Tokens.NoticeWidget} />
            );
          default:
            return <MarkdownUnparsed token={token} display="block" />;
        }
      })()}
    </>
  );
}
