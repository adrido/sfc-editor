import type { SfcDiagram, SfcNode } from './types';

let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function resetIdCounter(): void {
  counter = 0;
}

export function createInitialDiagram(title = 'Untitled SFC'): SfcDiagram {
  return {
    version: 1,
    title,
    root: [
      {
        id: createId('step'),
        kind: 'step',
        name: 'Init',
        isInitial: true,
        actions: [],
      },
    ],
  };
}

export function createStep(name = 'Step', isInitial = false): SfcNode {
  return {
    id: createId('step'),
    kind: 'step',
    name,
    isInitial,
    actions: [],
  };
}

export function createTransition(condition = 'TRUE'): SfcNode {
  return {
    id: createId('transition'),
    kind: 'transition',
    condition,
  };
}

export function createBranch(
  branchType: 'alternative' | 'simultaneous',
  role: 'divergence' | 'convergence',
  laneCount = 2,
): SfcNode {
  const lanes: SfcNode[][] = [];
  for (let i = 0; i < laneCount; i += 1) {
    if (branchType === 'alternative' && role === 'divergence') {
      lanes.push([createTransition(`cond_${i + 1}`), createStep(`Step_${i + 1}`)]);
    } else if (branchType === 'simultaneous' && role === 'divergence') {
      lanes.push([createStep(`ParStep_${i + 1}`), createTransition('TRUE')]);
    } else if (branchType === 'alternative' && role === 'convergence') {
      lanes.push([createTransition(`merge_${i + 1}`)]);
    } else {
      lanes.push([createStep(`mergeStep_${i + 1}`)]);
    }
  }

  return {
    id: createId('branch'),
    kind: 'branch',
    branchType,
    role,
    lanes,
  };
}

export function cloneDiagram(diagram: SfcDiagram): SfcDiagram {
  return structuredClone(diagram);
}
