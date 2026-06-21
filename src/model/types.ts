export type ActionQualifier =
  | 'N'
  | 'S'
  | 'R'
  | 'P'
  | 'D'
  | 'L'
  | 'SD'
  | 'DS'
  | 'SL'
  | 'P1'
  | 'P0';

export const ACTION_QUALIFIERS: ActionQualifier[] = [
  'N',
  'S',
  'R',
  'P',
  'D',
  'L',
  'SD',
  'DS',
  'SL',
  'P1',
  'P0',
];

export const TIME_REQUIRED_QUALIFIERS: ActionQualifier[] = [
  'L',
  'D',
  'SD',
  'DS',
  'SL',
];

export interface ActionQualifierDef {
  id: ActionQualifier;
  label: string;
  description: string;
  vendorExtension?: boolean;
}

export const ACTION_QUALIFIERS_META: ActionQualifierDef[] = [
  { id: 'N', label: 'N', description: 'Non-stored: runs while step is active' },
  { id: 'S', label: 'S', description: 'Set (stored): set output on activation' },
  { id: 'R', label: 'R', description: 'Reset: clear stored output' },
  { id: 'P', label: 'P', description: 'Pulse: single scan on step entry' },
  { id: 'D', label: 'D', description: 'Delay: execute after configured delay' },
  { id: 'L', label: 'L', description: 'Timed: execute for configured time' },
  { id: 'SD', label: 'SD', description: 'Set then delay', vendorExtension: true },
  { id: 'DS', label: 'DS', description: 'Delay then set', vendorExtension: true },
  { id: 'SL', label: 'SL', description: 'Set and hold for time', vendorExtension: true },
  { id: 'P1', label: 'P1', description: 'Pulse on activation (vendor)', vendorExtension: true },
  { id: 'P0', label: 'P0', description: 'Pulse on deactivation (vendor)', vendorExtension: true },
];

export function getQualifierById(id: ActionQualifier | string): ActionQualifierDef | undefined {
  return ACTION_QUALIFIERS_META.find((q) => q.id === id);
}

export type ElementKind = 'step' | 'transition' | 'branch';

export type BranchType = 'alternative' | 'simultaneous';
export type BranchRole = 'divergence' | 'convergence';

export interface SfcAction {
  id: string;
  name: string;
  qualifier: ActionQualifier;
  time?: string;
}

export interface SfcStep {
  id: string;
  kind: 'step';
  name: string;
  isInitial?: boolean;
  actions: SfcAction[];
}

export interface SfcTransition {
  id: string;
  kind: 'transition';
  condition: string;
}

export interface SfcBranch {
  id: string;
  kind: 'branch';
  branchType: BranchType;
  role: BranchRole;
  label?: string;
  lanes: SfcNode[][];
}

export type SfcNode = SfcStep | SfcTransition | SfcBranch;

export interface SfcDiagram {
  version: 1;
  title: string;
  root: SfcNode[];
}

export type Selection =
  | { type: 'diagram' }
  | { type: 'step'; id: string }
  | { type: 'transition'; id: string }
  | { type: 'branch'; id: string }
  | { type: 'action'; stepId: string; actionId: string };

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutNode {
  id: string;
  kind: ElementKind;
  rect: LayoutRect;
  branchType?: BranchType;
  role?: BranchRole;
  label?: string;
}

export interface LayoutAction {
  id: string;
  stepId: string;
  rect: LayoutRect;
  text: string;
}

export interface LayoutEdge {
  id: string;
  points: Array<{ x: number; y: number }>;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  actions: LayoutAction[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface ValidationDiagnostic {
  id: string;
  elementId?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  diagnostics: ValidationDiagnostic[];
}

export function isStep(node: SfcNode): node is SfcStep {
  return node.kind === 'step';
}

export function isTransition(node: SfcNode): node is SfcTransition {
  return node.kind === 'transition';
}

export function isBranch(node: SfcNode): node is SfcBranch {
  return node.kind === 'branch';
}

export function formatAction(action: SfcAction): string {
  if (action.time) {
    return `${action.qualifier} ${action.name}(${action.time})`;
  }
  return `${action.qualifier} ${action.name}`;
}
