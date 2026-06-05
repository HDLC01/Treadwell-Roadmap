import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Renders markdown. No rehype-raw → raw HTML is not executed (safe).
export default function MarkdownView({ markdown }: { markdown: string }) {
  return (
    <div className="prose-doc">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {markdown || "_No content yet._"}
      </ReactMarkdown>
    </div>
  );
}
