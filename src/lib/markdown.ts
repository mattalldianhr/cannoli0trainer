import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ResearchDoc {
  slug: string;
  content: string;
  wordCount: number;
  readingTime: number;
}

export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

const summariesDir = path.join(process.cwd(), "summaries");

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

export function getAllResearchDocs(): ResearchDoc[] {
  const files = fs
    .readdirSync(summariesDir)
    .filter((f) => f.endsWith(".md"));

  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(summariesDir, filename), "utf-8");
    const { content } = matter(raw);
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 250));

    return {
      slug: slugFromFilename(filename),
      content,
      wordCount,
      readingTime,
    };
  });
}

export function getResearchDoc(slug: string): ResearchDoc | undefined {
  const filename = `${slug}.md`;
  const filepath = path.join(summariesDir, filename);

  if (!fs.existsSync(filepath)) return undefined;

  const raw = fs.readFileSync(filepath, "utf-8");
  const { content } = matter(raw);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 250));

  return { slug, content, wordCount, readingTime };
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      const text = h2Match[1].trim();
      headings.push({
        level: 2,
        text,
        id: text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-"),
      });
      continue;
    }

    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      const text = h3Match[1].trim();
      headings.push({
        level: 3,
        text,
        id: text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-"),
      });
    }
  }

  return headings;
}
