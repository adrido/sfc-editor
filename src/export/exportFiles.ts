import type { SfcDiagram } from '../model/types';
import { renderDiagramToSvgString } from '../render/svgRenderer';

export function exportSvg(diagram: SfcDiagram, filename?: string): void {
  const svg = renderDiagramToSvgString(diagram, { background: '#ffffff' });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename ?? `${sanitizeFilename(diagram.title)}.svg`);
}

export async function exportPng(diagram: SfcDiagram, filename?: string, scale = 2): Promise<void> {
  const svg = renderDiagramToSvgString(diagram, { background: '#ffffff' });
  const blob = await svgToPngBlob(svg, scale);
  downloadBlob(blob, filename ?? `${sanitizeFilename(diagram.title)}.png`);
}

export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const svgElement = doc.documentElement;

  const width = Number(svgElement.getAttribute('width') ?? 800);
  const height = Number(svgElement.getAttribute('height') ?? 600);

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const serialized = new XMLSerializer().serializeToString(svgElement);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0);
      resolve();
    };
    image.onerror = () => reject(new Error('Failed to render SVG to PNG'));
    image.src = url;
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[^\w\-]+/g, '_') || 'diagram';
}

export function serializeDiagramFile(diagram: SfcDiagram): string {
  return JSON.stringify(diagram, null, 2);
}

export function parseDiagramFile(content: string): SfcDiagram {
  const parsed = JSON.parse(content) as SfcDiagram;
  if (parsed.version !== 1 || !Array.isArray(parsed.root)) {
    throw new Error('Invalid SFC file format');
  }
  return parsed;
}

export function saveDiagramJson(diagram: SfcDiagram): void {
  const json = serializeDiagramFile(diagram);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, `${sanitizeFilename(diagram.title)}.sfc.json`);
}

export function loadDiagramJsonFromFile(file: File): Promise<SfcDiagram> {
  return file.text().then(parseDiagramFile);
}
