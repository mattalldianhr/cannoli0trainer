import fs from "fs";
import path from "path";

export interface SpecDoc {
  slug: string;
  filename: string;
  number: string;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
}

const specsDir = path.join(process.cwd(), "specs");
const planPath = path.join(process.cwd(), "docs", "IMPLEMENTATION_PLAN.md");

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(?:Spec:\s*)?(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractNumber(filename: string): string {
  const match = filename.match(/^(\d+)/);
  return match ? match[1] : "0";
}

export function getAllSpecs(): SpecDoc[] {
  if (!fs.existsSync(specsDir)) return [];

  const files = fs
    .readdirSync(specsDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(specsDir, filename), "utf-8");
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 250));

    return {
      slug: filename.replace(/\.md$/, ""),
      filename,
      number: extractNumber(filename),
      title: extractTitle(raw),
      content: raw,
      wordCount,
      readingTime,
    };
  });
}

export function getSpec(slug: string): SpecDoc | undefined {
  const filename = `${slug}.md`;
  const filepath = path.join(specsDir, filename);

  if (!fs.existsSync(filepath)) return undefined;

  const raw = fs.readFileSync(filepath, "utf-8");
  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 250));

  return {
    slug,
    filename,
    number: extractNumber(filename),
    title: extractTitle(raw),
    content: raw,
    wordCount,
    readingTime,
  };
}

export function getImplementationPlan(): { content: string; totalTasks: number; completedTasks: number } | undefined {
  if (!fs.existsSync(planPath)) return undefined;

  const content = fs.readFileSync(planPath, "utf-8");
  const totalTasks = (content.match(/^- \[ \]/gm) || []).length + (content.match(/^- \[x\]/gm) || []).length;
  const completedTasks = (content.match(/^- \[x\]/gm) || []).length;

  return { content, totalTasks, completedTasks };
}

export function getPRD(): { content: string; wordCount: number; readingTime: number } | undefined {
  const prdMdPath = path.join(process.cwd(), "docs", "PRD.md");
  if (!fs.existsSync(prdMdPath)) return undefined;

  const content = fs.readFileSync(prdMdPath, "utf-8");
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 250));

  return { content, wordCount, readingTime };
}

export function getArchitecture(): { content: string; wordCount: number; readingTime: number } | undefined {
  const archPath = path.join(process.cwd(), "docs", "ARCHITECTURE.md");
  if (!fs.existsSync(archPath)) return undefined;

  const content = fs.readFileSync(archPath, "utf-8");
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 250));

  return { content, wordCount, readingTime };
}

export interface CoachDoc {
  slug: string;
  title: string;
  content: string;
  wordCount: number;
  readingTime: number;
}

const COACH_DOC_ORDER = [
  "getting-started",
  "athletes",
  "program-builder",
  "schedule-and-training",
  "exercises",
  "meets",
  "analytics",
  "glossary",
  "walkthroughs",
];

export function getCoachDocs(): CoachDoc[] {
  const coachDir = path.join(process.cwd(), "docs", "coach");
  if (!fs.existsSync(coachDir)) return [];

  const files = fs
    .readdirSync(coachDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md");

  const docMap = new Map<string, CoachDoc>();

  for (const filename of files) {
    const raw = fs.readFileSync(path.join(coachDir, filename), "utf-8");
    const slug = filename.replace(/\.md$/, "");
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 250));

    docMap.set(slug, {
      slug,
      title: extractTitle(raw),
      content: raw,
      wordCount,
      readingTime,
    });
  }

  // Return in display order, then any remaining files alphabetically
  const ordered: CoachDoc[] = [];
  for (const slug of COACH_DOC_ORDER) {
    const doc = docMap.get(slug);
    if (doc) {
      ordered.push(doc);
      docMap.delete(slug);
    }
  }
  for (const doc of Array.from(docMap.values()).sort((a, b) => a.slug.localeCompare(b.slug))) {
    ordered.push(doc);
  }

  return ordered;
}

export function getSurveyPRD(): { content: string } | undefined {
  const localPrd = path.join(process.cwd(), "prd.json");
  if (fs.existsSync(localPrd)) {
    const raw = fs.readFileSync(localPrd, "utf-8");
    return { content: raw };
  }
  return undefined;
}
