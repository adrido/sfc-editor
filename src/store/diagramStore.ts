import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import {
  createBranch,
  createId,
  createInitialDiagram,
  createStep,
  createTransition,
  cloneDiagram,
} from '../model/defaults';
import type {
  ActionQualifier,
  Selection,
  SfcAction,
  SfcBranch,
  SfcDiagram,
  SfcNode,
  ValidationResult,
} from '../model/types';
import { isBranch, isStep, isTransition } from '../model/types';
import { validateDiagram } from '../validation/iecValidator';

const HISTORY_LIMIT = 50;

interface DiagramStore {
  diagram: SfcDiagram;
  selection: Selection;
  past: SfcDiagram[];
  future: SfcDiagram[];
  validation: ValidationResult | null;

  // UI state: whether actions are collapsed globally
  actionsCollapsed: boolean;
  toggleActionsCollapsed: (value?: boolean) => void;

  newDiagram: (title?: string) => void;
  loadDiagram: (diagram: SfcDiagram) => void;
  setTitle: (title: string) => void;
  select: (selection: Selection) => void;
  undo: () => void;
  redo: () => void;
  runValidation: () => ValidationResult;
  clearValidation: () => void;

  updateStep: (id: string, patch: Partial<{ name: string; isInitial: boolean }>) => void;
  updateTransition: (id: string, condition: string) => void;
  updateBranch: (
    id: string,
    patch: Partial<Pick<SfcBranch, 'branchType' | 'role' | 'label'>>,
  ) => void;
  updateAction: (
    stepId: string,
    actionId: string,
    patch: Partial<Pick<SfcAction, 'name' | 'qualifier' | 'time'>>,
  ) => void;

  addTransitionAfterStep: (stepId: string) => void;
  addStepAfterTransition: (transitionId: string) => void;
  addAction: (stepId: string) => void;
  insertAlternativeBranchAfterStep: (stepId: string) => void;
  insertSimultaneousBranchAfterTransition: (transitionId: string) => void;
  insertAlternativeBranchConvergenceAfterTransition: (transitionId: string) => void;
  insertSimultaneousBranchConvergenceAfterStep: (stepId: string) => void;
  addBranchContinuation: (branchId: string) => void;
  addBranchLane: (branchId: string) => void;
  convertBranchType: (branchId: string) => void;
  editStepNameId: string | null;
  setEditStepName: (stepId: string | null) => void;
  deleteSelected: () => void;
}

function pushHistory(state: DiagramStore): void {
  state.past.push(cloneDiagram(current(state.diagram)));
  if (state.past.length > HISTORY_LIMIT) {
    state.past.shift();
  }
  state.future = [];
  state.validation = null;
}

function findNodePath(
  nodes: SfcNode[],
  id: string,
  path: number[] = [],
): { container: SfcNode[]; index: number; path: number[] } | null {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.id === id) {
      return { container: nodes, index: i, path: [...path, i] };
    }
    if (isBranch(node)) {
      for (let laneIndex = 0; laneIndex < node.lanes.length; laneIndex += 1) {
        const found = findNodePath(node.lanes[laneIndex], id, [...path, i, laneIndex]);
        if (found) return found;
      }
    }
  }
  return null;
}

function getNodeById(nodes: SfcNode[], id: string): SfcNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (isBranch(node)) {
      for (const lane of node.lanes) {
        const found = getNodeById(lane, id);
        if (found) return found;
      }
    }
  }
  return null;
}

function normalizeBranchLanes(branch: SfcBranch): void {
  for (const lane of branch.lanes) {
    if (branch.role === 'divergence') {
      if (branch.branchType === 'alternative') {
        if (lane.length === 0) {
          lane.push(createTransition(), createStep());
        } else {
          if (!isTransition(lane[0])) {
            lane.unshift(createTransition());
          }
          if (lane.length === 1) {
            lane.push(createStep());
          }
        }
      } else {
        if (lane.length === 0) {
          lane.push(createStep(), createTransition());
        } else {
          if (!isStep(lane[0])) {
            lane.unshift(createStep());
          }
          if (lane.length === 1) {
            lane.push(createTransition());
          }
        }
      }
    } else {
      const last = lane[lane.length - 1];
      if (branch.branchType === 'alternative') {
        if (!last || !isTransition(last)) {
          lane.push(createTransition());
        }
      } else {
        if (!last || !isStep(last)) {
          lane.push(createStep());
        }
      }
    }
  }
}

export const useDiagramStore = create<DiagramStore>()(
  immer((set, get) => ({
    diagram: createInitialDiagram(),
    selection: { type: 'diagram' },
    past: [],
    future: [],
    validation: null,
    actionsCollapsed: false,
    toggleActionsCollapsed: (value?: boolean) =>
      set((state) => {
        state.actionsCollapsed = value ?? !state.actionsCollapsed;
      }),

    newDiagram: (title) =>
      set((state) => {
        pushHistory(state);
        state.diagram = createInitialDiagram(title);
        state.selection = { type: 'diagram' };
      }),

    loadDiagram: (diagram) =>
      set((state) => {
        pushHistory(state);
        state.diagram = cloneDiagram(diagram);
        state.selection = { type: 'diagram' };
      }),

    setTitle: (title) =>
      set((state) => {
        pushHistory(state);
        state.diagram.title = title;
      }),

    select: (selection) =>
      set((state) => {
        state.selection = selection;
      }),

    undo: () =>
      set((state) => {
        const previous = state.past.pop();
        if (!previous) return;
        state.future.push(cloneDiagram(state.diagram));
        state.diagram = previous;
        state.validation = null;
      }),

    redo: () =>
      set((state) => {
        const next = state.future.pop();
        if (!next) return;
        state.past.push(cloneDiagram(state.diagram));
        state.diagram = next;
        state.validation = null;
      }),

    runValidation: () => {
      const result = validateDiagram(get().diagram);
      set((state) => {
        state.validation = result;
      });
      return result;
    },

    clearValidation: () =>
      set((state) => {
        state.validation = null;
      }),

    editStepNameId: null,

    setEditStepName: (stepId) =>
      set((state) => {
        state.editStepNameId = stepId;
      }),

    updateStep: (id, patch) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, id);
        if (!node || !isStep(node)) return;
        pushHistory(state);
        if (patch.name !== undefined) node.name = patch.name;
        if (patch.isInitial !== undefined) {
          if (patch.isInitial) {
            function clearInitial(nodes: SfcNode[]): void {
              for (const n of nodes) {
                if (isStep(n)) n.isInitial = n.id === id;
                if (isBranch(n)) n.lanes.forEach(clearInitial);
              }
            }
            clearInitial(state.diagram.root);
          } else {
            node.isInitial = false;
          }
        }
      }),

    updateTransition: (id, condition) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, id);
        if (!node || !isTransition(node)) return;
        pushHistory(state);
        node.condition = condition;
      }),

    updateBranch: (id, patch) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, id);
        if (!node || !isBranch(node)) return;
        pushHistory(state);
        if (patch.branchType !== undefined) node.branchType = patch.branchType;
        if (patch.role !== undefined) node.role = patch.role;
        if (patch.label !== undefined) node.label = patch.label;
        normalizeBranchLanes(node);
      }),

    updateAction: (stepId, actionId, patch) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, stepId);
        if (!node || !isStep(node)) return;
        const action = node.actions.find((a) => a.id === actionId);
        if (!action) return;
        pushHistory(state);
        if (patch.name !== undefined) action.name = patch.name;
        if (patch.qualifier !== undefined) action.qualifier = patch.qualifier as ActionQualifier;
        if (patch.time !== undefined) action.time = patch.time;
      }),

    addTransitionAfterStep: (stepId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, stepId);
        if (!found) return;
        pushHistory(state);
        const transition = createTransition();
        found.container.splice(found.index + 1, 0, transition);
        state.selection = { type: 'transition', id: transition.id };
      }),

    addStepAfterTransition: (transitionId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, transitionId);
        if (!found) return;
        pushHistory(state);
        const step = createStep();
        found.container.splice(found.index + 1, 0, step);
        state.selection = { type: 'step', id: step.id };
      }),

    addAction: (stepId) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, stepId);
        if (!node || !isStep(node)) return;
        pushHistory(state);
        node.actions.push({
          id: createId('action'),
          name: 'Action',
          qualifier: 'N',
        });
      }),

    insertAlternativeBranchAfterStep: (stepId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, stepId);
        if (!found) return;
        pushHistory(state);
        found.container.splice(
          found.index + 1,
          0,
          createBranch('alternative', 'divergence', 2) as SfcNode,
        );
      }),

    insertSimultaneousBranchAfterTransition: (transitionId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, transitionId);
        if (!found) return;
        pushHistory(state);
        found.container.splice(
          found.index + 1,
          0,
          createBranch('simultaneous', 'divergence', 2) as SfcNode,
        );
      }),

    insertAlternativeBranchConvergenceAfterTransition: (transitionId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, transitionId);
        if (!found) return;
        pushHistory(state);
        found.container.splice(
          found.index + 1,
          0,
          createBranch('alternative', 'convergence', 2) as SfcNode,
        );
        const newNode = found.container[found.index + 1] as SfcNode;
        state.selection = { type: 'branch', id: newNode.id };
      }),

    insertSimultaneousBranchConvergenceAfterStep: (stepId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, stepId);
        if (!found) return;
        pushHistory(state);
        found.container.splice(
          found.index + 1,
          0,
          createBranch('simultaneous', 'convergence', 2) as SfcNode,
        );
        const newNode = found.container[found.index + 1] as SfcNode;
        state.selection = { type: 'branch', id: newNode.id };
      }),

    addBranchContinuation: (branchId) =>
      set((state) => {
        const found = findNodePath(state.diagram.root, branchId);
        if (!found) return;
        const branchNode = found.container[found.index];
        if (!isBranch(branchNode)) return;
        pushHistory(state);
        const step = createStep();
        found.container.splice(found.index + 1, 0, step);
        state.selection = { type: 'step', id: step.id };
      }),

    addBranchLane: (branchId) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, branchId);
        if (!node || !isBranch(node)) return;
        pushHistory(state);
        if (node.branchType === 'alternative' && node.role === 'divergence') {
          node.lanes.push([createTransition(), createStep()]);
        } else if (node.branchType === 'simultaneous' && node.role === 'divergence') {
          node.lanes.push([createStep(), createTransition()]);
        } else if (node.branchType === 'alternative') {
          node.lanes.push([createTransition()]);
        } else {
          node.lanes.push([createStep()]);
        }
      }),

    convertBranchType: (branchId) =>
      set((state) => {
        const node = getNodeById(state.diagram.root, branchId);
        if (!node || !isBranch(node)) return;
        pushHistory(state);
        node.branchType =
          node.branchType === 'alternative' ? 'simultaneous' : 'alternative';
        normalizeBranchLanes(node);
      }),

    deleteSelected: () =>
      set((state) => {
        const { selection } = state;
        if (selection.type === 'diagram') return;

        if (selection.type === 'action') {
          const step = getNodeById(state.diagram.root, selection.stepId);
          if (!step || !isStep(step)) return;
          pushHistory(state);
          step.actions = step.actions.filter((a) => a.id !== selection.actionId);
          state.selection = { type: 'step', id: selection.stepId };
          return;
        }

        const id = selection.id;
        const found = findNodePath(state.diagram.root, id);
        if (!found) return;

        const node = found.container[found.index];
        if (isStep(node) && node.isInitial) return;

        pushHistory(state);
        found.container.splice(found.index, 1);
        state.selection = { type: 'diagram' };
      }),
  })),
);
