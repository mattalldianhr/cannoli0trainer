"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

const components: Components = {
  h1: ({ children, ...props }) => {
    const text = String(children);
    return (
      <h1 id={slugify(text)} {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    const text = String(children);
    return (
      <h2 id={slugify(text)} {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const text = String(children);
    return (
      <h3 id={slugify(text)} {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }) => {
    const text = String(children);
    return (
      <h4 id={slugify(text)} {...props}>
        {children}
      </h4>
    );
  },
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table {...props}>{children}</table>
    </div>
  ),
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
