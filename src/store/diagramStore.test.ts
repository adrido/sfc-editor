import { describe, expect, it, beforeEach } from 'vitest';
import { useDiagramStore } from './diagramStore';
import { createInitialDiagram } from '../model/defaults';

function resetStore() {
  useDiagramStore.setState({
    diagram: createInitialDiagram(),
    selection: { type: 'diagram' },
    past: [],
    future: [],
    validation: null,
  });
}

describe('diagram store actions', () => {
  beforeEach(() => {
    resetStore();
  });

  it('adds a transition after a selected step and selects the new transition', () => {
    const { diagram } = useDiagramStore.getState();
    const step = diagram.root[0];
    expect(step.kind).toBe('step');

    useDiagramStore.setState({ selection: { type: 'step', id: step.id } });
    useDiagramStore.getState().addTransitionAfterStep(step.id);

    const updated = useDiagramStore.getState();
    expect(updated.diagram.root.length).toBe(2);
    expect(updated.diagram.root[1]?.kind).toBe('transition');
    expect(updated.selection).toEqual({ type: 'transition', id: updated.diagram.root[1]?.id });
  });

  it('adds a step after a selected transition and selects the new step', () => {
    const initial = createInitialDiagram();
    const transition = { id: 'transition-1', kind: 'transition', condition: 'TRUE' };
    initial.root.push(transition as any);

    useDiagramStore.setState({ diagram: initial, selection: { type: 'transition', id: 'transition-1' } });
    useDiagramStore.getState().addStepAfterTransition('transition-1');

    const updated = useDiagramStore.getState();
    expect(updated.diagram.root.length).toBe(3);
    expect(updated.diagram.root[2]?.kind).toBe('step');
    expect(updated.selection.type).toBe('step');
    if (updated.selection.type === 'step') {
      expect(updated.selection.id).toBe(updated.diagram.root[2]?.id);
    }
  });

  it('normalizes branch lanes when converting branch type', () => {
    const initial = createInitialDiagram();
    const branch = {
      id: 'branch-1',
      kind: 'branch',
      branchType: 'alternative',
      role: 'divergence',
      lanes: [
        [{ id: 'transition-1', kind: 'transition', condition: 'TRUE' }],
        [{ id: 'transition-2', kind: 'transition', condition: 'FALSE' }],
      ],
    } as any;
    initial.root.push(branch);

    useDiagramStore.setState({ diagram: initial, selection: { type: 'branch', id: 'branch-1' } });
    useDiagramStore.getState().convertBranchType('branch-1');

    const updated = useDiagramStore.getState();
    const updatedBranch = updated.diagram.root.find((node) => node.id === 'branch-1');
    expect(updatedBranch).toBeDefined();
    if (updatedBranch && updatedBranch.kind === 'branch') {
      expect(updatedBranch.branchType).toBe('simultaneous');
      expect(updatedBranch.lanes[0].length).toBeGreaterThanOrEqual(2);
      expect(updatedBranch.lanes[1].length).toBeGreaterThanOrEqual(2);
      expect(updatedBranch.lanes[0][0]?.kind).toBe('step');
      expect(updatedBranch.lanes[1][0]?.kind).toBe('step');
    }
  });

  it('adds a continuation step after a selected branch', () => {
    const initial = createInitialDiagram();
    const branch = {
      id: 'branch-1',
      kind: 'branch',
      branchType: 'alternative',
      role: 'divergence',
      lanes: [
        [
          { id: 'transition-1', kind: 'transition', condition: 'cond_1' },
          { id: 'step-3', kind: 'step', name: 'Step_3', actions: [] },
        ],
        [
          { id: 'transition-2', kind: 'transition', condition: 'cond_2' },
          { id: 'step-4', kind: 'step', name: 'Step_4', actions: [] },
        ],
      ],
    } as any;
    initial.root.push(branch);

    useDiagramStore.setState({ diagram: initial, selection: { type: 'step', id: 'step-3' } });
    useDiagramStore.getState().addBranchContinuation('branch-1');

    const updated = useDiagramStore.getState();
    expect(updated.diagram.root.length).toBe(3);
    expect(updated.diagram.root[2]?.kind).toBe('step');
    if (updated.diagram.root[2]?.kind === 'step') {
      expect(updated.selection).toEqual({ type: 'step', id: updated.diagram.root[2]?.id });
    }
  });
});
