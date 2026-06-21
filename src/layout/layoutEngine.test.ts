import { describe, expect, it } from 'vitest';
import { layoutDiagram } from '../layout/layoutEngine';
import { createInitialDiagram } from '../model/defaults';
import linear from '../../examples/linear.sfc.json';
import nested from '../../examples/nested.sfc.json';
import alternative from '../../examples/alternative.sfc.json';
import type { SfcDiagram } from '../model/types';

describe('layoutDiagram', () => {
  it('produces positive dimensions for default diagram', () => {
    const layout = layoutDiagram(createInitialDiagram());
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.nodes.length).toBeGreaterThan(0);
  });

  it('lays out steps, transitions, and actions for linear example', () => {
    const layout = layoutDiagram(linear as SfcDiagram);
    expect(layout.nodes.filter((node) => node.kind === 'step').length).toBe(3);
    expect(layout.nodes.filter((node) => node.kind === 'transition').length).toBe(2);
    expect(layout.actions.length).toBe(3);
  });

  it('includes branch nodes for nested example', () => {
    const layout = layoutDiagram(nested as SfcDiagram);
    expect(layout.nodes.some((node) => node.kind === 'branch')).toBe(true);
    expect(layout.width).toBeGreaterThan(200);
  });

  it('creates a merge branch node for alternative branches', () => {
    const layout = layoutDiagram(alternative as SfcDiagram);
    const mergeBranch = layout.nodes.find((node) => node.id === 'branch-alt-merge');
    expect(mergeBranch).toBeDefined();
    expect(mergeBranch?.kind).toBe('branch');
    expect(mergeBranch?.branchType).toBe('alternative');
  });
});
