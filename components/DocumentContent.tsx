import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "./Card";

// Renders SOW/MSA content directly in the portal -- no PDF needed to read it.
// Custom component overrides here match the same visual language used in the
// exported PDF (numbered-feeling section headers, warm-gray secondary text,
// generous spacing) so reading it here and seeing the final signed PDF later
// feel like the same document, not two different experiences.

export function DocumentContent({
  title,
  markdown,
}: {
  title: string;
  markdown: string;
}) {
  return (
    <Card className="px-9 py-9 md:px-12 md:py-10">
      <h2 className="text-[19px] font-bold text-[var(--color-ink)] mb-5">
        {title}
      </h2>
      <div className="prose-fonder">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => (
              <h3
                className="text-[16px] font-bold text-[var(--color-ink)] mt-6 mb-2 first:mt-0"
                {...props}
              />
            ),
            h2: (props) => (
              <h4
                className="text-[14.5px] font-bold text-[var(--color-ink)] mt-5 mb-2"
                {...props}
              />
            ),
            h3: (props) => (
              <h5
                className="text-[13.5px] font-semibold text-[var(--color-ink)] mt-4 mb-1.5"
                {...props}
              />
            ),
            p: (props) => (
              <p
                className="text-[14px] text-[var(--color-ink)] leading-relaxed mb-3"
                {...props}
              />
            ),
            ul: (props) => (
              <ul className="mb-3 space-y-1.5 pl-1" {...props} />
            ),
            li: ({ children, ...props }) => (
              <li
                className="text-[14px] text-[var(--color-ink)] leading-relaxed flex gap-2"
                {...props}
              >
                <span className="text-[var(--color-faint)]">–</span>
                <span>{children}</span>
              </li>
            ),
            strong: (props) => (
              <strong className="font-semibold text-[var(--color-ink)]" {...props} />
            ),
            em: (props) => (
              <em className="text-[var(--color-muted)]" {...props} />
            ),
            table: (props) => (
              <div className="overflow-x-auto mb-4">
                <table
                  className="w-full text-[13.5px] border-collapse"
                  {...props}
                />
              </div>
            ),
            th: (props) => (
              <th
                className="text-left font-semibold text-[var(--color-muted)] uppercase text-[11px] tracking-wide border-b border-[var(--color-border)] py-2 pr-4"
                {...props}
              />
            ),
            td: (props) => (
              <td
                className="text-[var(--color-ink)] border-b border-[var(--color-border)] py-2 pr-4"
                {...props}
              />
            ),
            hr: () => (
              <hr className="my-6 border-[var(--color-border)]" />
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </Card>
  );
}
