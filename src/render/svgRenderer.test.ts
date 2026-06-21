import { describe, expect, it } from 'vitest';
import { renderDiagramToSvgString } from '../render/svgRenderer';
import { createInitialDiagram } from '../model/defaults';

describe('renderDiagramToSvgString', () => {
  it('returns valid svg markup', () => {
    const svg = renderDiagramToSvgString(createInitialDiagram());
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('Init');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
