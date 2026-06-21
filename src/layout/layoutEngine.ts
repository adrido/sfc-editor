import type {
  LayoutAction,
  LayoutEdge,
  LayoutNode,
  LayoutRect,
  LayoutResult,
  SfcAction,
  SfcBranch,
  SfcDiagram,
  SfcNode,
  SfcStep,
} from '../model/types';
import { formatAction, isBranch, isStep, isTransition } from '../model/types';

export const STEP_WIDTH = 120;
export const STEP_HEIGHT = 44;
export const TRANSITION_WIDTH = 120;
export const TRANSITION_HEIGHT = 12;
export const VERTICAL_GAP = 36;
export const BRANCH_BAR_HEIGHT = 8;
export const LANE_GAP = 48;
export const ACTION_GAP = 8;
export const ACTION_HEIGHT = 28;
export const ACTION_MIN_WIDTH = 100;
export const PADDING = 40;

interface LaneLayout {
  nodes: LayoutNode[];
  actions: LayoutAction[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  entry: { x: number; y: number };
  exit: { x: number; y: number };
}

function measureActionWidth(action: SfcAction): number {
  const text = formatAction(action);
  return Math.max(ACTION_MIN_WIDTH, text.length * 7 + 16);
}

function layoutStepActions(step: SfcStep, stepRect: LayoutRect): LayoutAction[] {
  let x = stepRect.x + stepRect.width + ACTION_GAP;
  const y = stepRect.y + (stepRect.height - ACTION_HEIGHT) / 2;
  const actions: LayoutAction[] = [];

  for (const action of step.actions) {
    const width = measureActionWidth(action);
    actions.push({
      id: action.id,
      stepId: step.id,
      rect: { x, y, width, height: ACTION_HEIGHT },
      text: formatAction(action),
    });
    x += width + ACTION_GAP;
  }

  return actions;
}

function layoutSequence(
  nodes: SfcNode[],
  originX: number,
  originY: number,
): LaneLayout {
  const layoutNodes: LayoutNode[] = [];
  const layoutActions: LayoutAction[] = [];
  const layoutEdges: LayoutEdge[] = [];

  let cursorY = originY;
  let maxWidth = 0;
  let entry = { x: originX, y: originY };
  let exit = { x: originX, y: originY };
  let previousCenter: { x: number; y: number } | null = null;
  let previousKind: 'step' | 'transition' | 'branch' | null = null;

  for (const node of nodes) {
    if (isStep(node)) {
      const laneWidth = STEP_WIDTH + node.actions.reduce((sum, action, index) => {
        const gap = index === 0 ? ACTION_GAP : ACTION_GAP;
        return sum + gap + measureActionWidth(action);
      }, 0);

      const stepX = originX - STEP_WIDTH / 2;
      const rect: LayoutRect = {
        x: stepX,
        y: cursorY,
        width: STEP_WIDTH,
        height: STEP_HEIGHT,
      };

      layoutNodes.push({
        id: node.id,
        kind: 'step',
        rect,
      });

      layoutActions.push(...layoutStepActions(node, rect));

      const center = { x: originX, y: cursorY + STEP_HEIGHT / 2 };
      if (!previousCenter) {
        entry = center;
      }
      if (previousCenter && previousKind) {
        layoutEdges.push({
          id: `edge-${previousCenter.x}-${center.x}-${layoutEdges.length}`,
          points: [
            previousCenter,
            { x: previousCenter.x, y: (previousCenter.y + center.y) / 2 },
            { x: center.x, y: (previousCenter.y + center.y) / 2 },
            center,
          ],
        });
      }

      previousCenter = { x: center.x, y: cursorY + STEP_HEIGHT };
      previousKind = 'step';
      maxWidth = Math.max(maxWidth, laneWidth);
      cursorY += STEP_HEIGHT + VERTICAL_GAP;
      exit = { x: center.x, y: cursorY - VERTICAL_GAP / 2 };
    } else if (isTransition(node)) {
      const rect: LayoutRect = {
        x: originX - TRANSITION_WIDTH / 2,
        y: cursorY,
        width: TRANSITION_WIDTH,
        height: TRANSITION_HEIGHT,
      };

      layoutNodes.push({
        id: node.id,
        kind: 'transition',
        rect,
      });

      const center = { x: originX, y: cursorY + TRANSITION_HEIGHT / 2 };
      if (!previousCenter) {
        entry = center;
      }
      if (previousCenter && previousKind) {
        layoutEdges.push({
          id: `edge-${previousCenter.x}-${center.x}-${layoutEdges.length}`,
          points: [
            previousCenter,
            { x: previousCenter.x, y: (previousCenter.y + center.y) / 2 },
            { x: center.x, y: (previousCenter.y + center.y) / 2 },
            center,
          ],
        });
      }

      previousCenter = { x: center.x, y: cursorY + TRANSITION_HEIGHT };
      previousKind = 'transition';
      maxWidth = Math.max(maxWidth, TRANSITION_WIDTH);
      cursorY += TRANSITION_HEIGHT + VERTICAL_GAP;
      exit = { x: center.x, y: cursorY - VERTICAL_GAP / 2 };
    } else if (isBranch(node)) {
      const branchLayout = layoutBranch(node, originX, cursorY);
      layoutNodes.push(...branchLayout.nodes);
      layoutActions.push(...branchLayout.actions);
      layoutEdges.push(...branchLayout.edges);

      if (!previousCenter) {
        entry = branchLayout.entry;
      }
      if (previousCenter && previousKind) {
        layoutEdges.push({
          id: `edge-into-branch-${node.id}`,
          points: [
            previousCenter,
            { x: previousCenter.x, y: (previousCenter.y + branchLayout.entry.y) / 2 },
            { x: branchLayout.entry.x, y: (previousCenter.y + branchLayout.entry.y) / 2 },
            branchLayout.entry,
          ],
        });
      }

      previousCenter = { x: branchLayout.exit.x, y: branchLayout.exit.y };
      previousKind = 'branch';
      maxWidth = Math.max(maxWidth, branchLayout.width);
      cursorY = branchLayout.exit.y + VERTICAL_GAP;
      exit = branchLayout.exit;
    }
  }

  return {
    nodes: layoutNodes,
    actions: layoutActions,
    edges: layoutEdges,
    width: maxWidth,
    height: cursorY - originY,
    entry,
    exit,
  };
}

function layoutBranch(branch: SfcBranch, centerX: number, startY: number): LaneLayout {
  const laneLayouts = branch.lanes.map((lane, index) => {
    const offsetX = (index - (branch.lanes.length - 1) / 2) * (STEP_WIDTH + LANE_GAP);
    return layoutSequence(lane, centerX + offsetX, startY + BRANCH_BAR_HEIGHT + VERTICAL_GAP / 2);
  });

  const totalWidth =
    laneLayouts.reduce((sum, lane) => sum + lane.width, 0) +
    LANE_GAP * Math.max(0, laneLayouts.length - 1);

  const barY = startY;
  const barWidth = Math.max(totalWidth, TRANSITION_WIDTH * branch.lanes.length);
  const barRect: LayoutRect = {
    x: centerX - barWidth / 2,
    y: barY,
    width: barWidth,
    height: branch.branchType === 'simultaneous' ? BRANCH_BAR_HEIGHT * 2 + 2 : BRANCH_BAR_HEIGHT,
  };

  const branchNode: LayoutNode = {
    id: branch.id,
    kind: 'branch',
    rect: barRect,
    branchType: branch.branchType,
    role: branch.role,
    label: branch.label,
  };

  const nodes = [branchNode, ...laneLayouts.flatMap((lane) => lane.nodes)];
  const actions = laneLayouts.flatMap((lane) => lane.actions);
  const edges = [...laneLayouts.flatMap((lane) => lane.edges)];

  const entryY = barY + barRect.height / 2;
  const exitY = Math.max(...laneLayouts.map((lane) => lane.exit.y));

  for (const lane of laneLayouts) {
    edges.push({
      id: `edge-branch-${branch.id}-to-${lane.entry.x}`,
      points: [
        { x: lane.entry.x, y: entryY },
        { x: lane.entry.x, y: lane.entry.y - VERTICAL_GAP / 4 },
        lane.entry,
      ],
    });
    edges.push({
      id: `edge-branch-${branch.id}-from-${lane.exit.x}`,
      points: [
        lane.exit,
        { x: lane.exit.x, y: exitY },
        { x: centerX, y: exitY },
      ],
    });
  }

  edges.push({
    id: `edge-branch-merge-${branch.id}`,
    points: laneLayouts.map((lane) => ({ x: lane.exit.x, y: exitY })).concat([{ x: centerX, y: exitY + VERTICAL_GAP / 2 }]),
  });

  // For alternative and simultaneous branches, create an explicit merge branch
  // node so the renderer can draw the end bar with the same style as the start.
  const mergeBarHeight = branch.branchType === 'simultaneous' ? BRANCH_BAR_HEIGHT * 2 + 2 : BRANCH_BAR_HEIGHT;
  const mergeRect: LayoutRect = {
    x: centerX - barWidth / 2,
    y: exitY - mergeBarHeight / 2,
    width: barWidth,
    height: mergeBarHeight,
  };
  const mergeNode: LayoutNode = {
    id: `${branch.id}-merge`,
    kind: 'branch',
    rect: mergeRect,
    branchType: branch.branchType,
    role: branch.role,
  };

  return {
    nodes: [...nodes, mergeNode],
    actions,
    edges,
    width: barWidth,
    height: exitY - startY + VERTICAL_GAP,
    entry: { x: centerX, y: entryY },
    exit: { x: centerX, y: exitY + VERTICAL_GAP / 2 },
  };
}

export function layoutDiagram(diagram: SfcDiagram): LayoutResult {
  const lane = layoutSequence(diagram.root, PADDING + STEP_WIDTH, PADDING);
  // compute bounding box across nodes, actions and edge points
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of lane.nodes) {
    minX = Math.min(minX, n.rect.x);
    maxX = Math.max(maxX, n.rect.x + n.rect.width);
    minY = Math.min(minY, n.rect.y);
    maxY = Math.max(maxY, n.rect.y + n.rect.height);
  }
  for (const a of lane.actions) {
    minX = Math.min(minX, a.rect.x);
    maxX = Math.max(maxX, a.rect.x + a.rect.width);
    minY = Math.min(minY, a.rect.y);
    maxY = Math.max(maxY, a.rect.y + a.rect.height);
  }
  for (const e of lane.edges) {
    for (const p of e.points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }

  // include lane entry/exit points
  if (lane.entry) {
    minX = Math.min(minX, lane.entry.x);
    maxX = Math.max(maxX, lane.entry.x);
    minY = Math.min(minY, lane.entry.y);
    maxY = Math.max(maxY, lane.entry.y);
  }
  if (lane.exit) {
    minX = Math.min(minX, lane.exit.x);
    maxX = Math.max(maxX, lane.exit.x);
    minY = Math.min(minY, lane.exit.y);
    maxY = Math.max(maxY, lane.exit.y);
  }

  if (!isFinite(minX)) {
    minX = 0;
    maxX = STEP_WIDTH + PADDING * 2;
    minY = 0;
    maxY = STEP_HEIGHT + PADDING * 2;
  }

  const dx = PADDING - minX;
  const dy = PADDING - minY;

  const nodes = lane.nodes.map((n) => ({
    ...n,
    rect: { ...n.rect, x: n.rect.x + dx, y: n.rect.y + dy },
  }));
  const actions = lane.actions.map((a) => ({
    ...a,
    rect: { ...a.rect, x: a.rect.x + dx, y: a.rect.y + dy },
  }));
  const edges = lane.edges.map((e) => ({
    ...e,
    points: e.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  }));

  const width = maxX - minX + PADDING * 2;
  const height = maxY - minY + PADDING * 2;

  return {
    nodes,
    actions,
    edges,
    width,
    height,
  };
}
