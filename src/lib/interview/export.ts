import type { PRDOutput } from './types';

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAsJSON(prd: PRDOutput): void {
  const json = JSON.stringify(prd, null, 2);
  triggerDownload(json, `sc-trainer-prd-${Date.now()}.json`, 'application/json');
}

export function exportAsMarkdown(prd: PRDOutput): void {
  const lines: string[] = [];

  lines.push('# S&C Platform - Trainer Requirements Document');
  lines.push('');
  lines.push(`Generated: ${new Date(prd.generatedAt).toLocaleDateString()}`);
  lines.push('');

  lines.push('## Trainer Profile');
  lines.push('');
  for (const [key, value] of Object.entries(prd.trainerProfile)) {
    lines.push(`- **${key}**: ${value}`);
  }
  lines.push('');

  for (const section of prd.sections) {
    lines.push(`## ${section.title}`);
    lines.push('');
    lines.push(section.content);
    lines.push('');
  }

  const markdown = lines.join('\n');
  triggerDownload(markdown, `sc-trainer-prd-${Date.now()}.md`, 'text/markdown');
}
