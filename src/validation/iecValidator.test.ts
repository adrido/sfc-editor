import { describe, expect, it } from 'vitest';
import { createInitialDiagram } from '../model/defaults';
import { validateDiagram } from '../validation/iecValidator';
import linear from '../../examples/linear.sfc.json';
import alternative from '../../examples/alternative.sfc.json';
import simultaneous from '../../examples/simultaneous.sfc.json';
import nested from '../../examples/nested.sfc.json';
import type { SfcDiagram } from '../model/types';

describe('validateDiagram', () => {
  it('accepts a default initial diagram', () => {
    const result = validateDiagram(createInitialDiagram());
    expect(result.valid).toBe(true);
  });

  it('accepts example linear sequence', () => {
    const result = validateDiagram(linear as SfcDiagram);
    expect(result.valid).toBe(true);
  });

  it('accepts example alternative branch', () => {
    const result = validateDiagram(alternative as SfcDiagram);
    expect(result.valid).toBe(true);
  });

  it('accepts example simultaneous branch', () => {
    const result = validateDiagram(simultaneous as SfcDiagram);
    expect(result.valid).toBe(true);
  });

  it('accepts nested branch example', () => {
    const result = validateDiagram(nested as SfcDiagram);
    expect(result.valid).toBe(true);
  });

  it('reports missing initial step', () => {
    const diagram = createInitialDiagram();
    if (diagram.root[0]?.kind === 'step') {
      diagram.root[0].isInitial = false;
    }
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('initial step'))).toBe(true);
  });

  it('reports duplicate step names', () => {
    const diagram = createInitialDiagram();
    diagram.root.push(
      { id: 't1', kind: 'transition', condition: 'TRUE' },
      { id: 's2', kind: 'step', name: 'Init', actions: [] },
    );
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('Duplicate step name'))).toBe(true);
  });

  it('requires time for L qualifier', () => {
    const diagram = createInitialDiagram();
    if (diagram.root[0]?.kind === 'step') {
      diagram.root[0].actions.push({
        id: 'a1',
        name: 'TimedAction',
        qualifier: 'L',
      });
    }
    const result = validateDiagram(diagram);
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((d) => d.message.includes('requires a time interval'))).toBe(true);
  });
});
