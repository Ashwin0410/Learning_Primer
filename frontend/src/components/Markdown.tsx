import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";

// Register the languages Prakruthi will meet across the curriculum. Anything not
// listed still renders as clean (unhighlighted) monospace — never broken.
const LANGS: Record<string, any> = {
  python,
  javascript,
  typescript,
  jsx,
  tsx,
  bash,
  sql,
  json,
  css,
  markup,
  yaml,
  markdown,
  docker,
};
for (const [name, lang] of Object.entries(LANGS)) SyntaxHighlighter.registerLanguage(name, lang);
// Common aliases Primer might emit.
const ALIASES: Record<string, any> = {
  py: python,
  js: javascript,
  ts: typescript,
  sh: bash,
  shell: bash,
  html: markup,
  xml: markup,
  yml: yaml,
  md: markdown,
  dockerfile: docker,
};
for (const [name, lang] of Object.entries(ALIASES)) SyntaxHighlighter.registerLanguage(name, lang);

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be blocked */
    }
  };
  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-slate-200 bg-[#fafafa]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5">
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-slate-400">
          {language === "text" ? "code" : language}
        </span>
        <button
          onClick={copy}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={oneLight}
          customStyle={{
            margin: 0,
            padding: "0.9rem 1rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
          codeTagProps={{ style: { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="lesson">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Let CodeBlock own the <pre>; rendering a div inside <pre> is invalid HTML.
          pre: ({ children }) => <>{children}</>,
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (match) return <CodeBlock language={match[1]} value={text} />;
            if (text.includes("\n")) return <CodeBlock language="text" value={text} />;
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
