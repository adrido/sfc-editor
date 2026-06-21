import { describe, expect, it } from 'vitest';
import { renderDiagramToSvgString } from '../render/svgRenderer';
import { createInitialDiagram } from '../model/defaults';
import alternative from '../../examples/alternative.sfc.json';

describe('renderDiagramToSvgString', () => {
  it('returns valid svg markup', () => {
    const svg = renderDiagramToSvgString(createInitialDiagram());
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('Init');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('renders single-line merge branch for alternative branches', () => {
    const svg = renderDiagramToSvgString(alternative as any);
    const mergeGroup = svg.match(/<g class="sfc-branch" data-id="branch-alt-merge">[\s\S]*?<\/g>/);
    expect(mergeGroup).toBeTruthy();
    const lineCount = (mergeGroup?.[0].match(/<line/g) || []).length;
    expect(lineCount).toBe(1);
  });
});
