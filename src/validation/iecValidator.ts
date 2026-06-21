import {
  TIME_REQUIRED_QUALIFIERS,
  type SfcAction,
  type SfcBranch,
  type SfcDiagram,
  type SfcNode,
  type ValidationDiagnostic,
  type ValidationResult,
  isBranch,
  isStep,
  isTransition,
} from '../model/types';

function diag(
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  elementId?: string,
): ValidationDiagnostic {
  return {
    id: `${severity}-${elementId ?? 'global'}-${message}`,
    elementId,
    severity,
    message,
  };
}

function validateAction(action: SfcAction, stepId: string): ValidationDiagnostic[] {
  const issues: ValidationDiagnostic[] = [];
  if (!action.name.trim()) {
    issues.push(diag('Action name must not be empty', 'error', stepId));
  }
  if (TIME_REQUIRED_QUALIFIERS.includes(action.qualifier) && !action.time?.trim()) {
    issues.push(
      diag(
        `Action qualifier "${action.qualifier}" requires a time interval (e.g. T#10s)`,
        'error',
        stepId,
      ),
    );
  }
  return issues;
}

function validateSequence(
  nodes: SfcNode[],
  path: string,
  diagnostics: ValidationDiagnostic[],
  stepNames: Map<string, string>,
  initialStepIds: string[],
): void {
  let expect: 'step' | 'transition' | 'either' = 'either';

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    const nodePath = `${path}[${i}]`;

    if (isStep(node)) {
      if (expect === 'transition') {
        diagnostics.push(
          diag(`Expected transition before step at ${nodePath}`, 'error', node.id),
        );
      }
      expect = 'transition';

      if (!node.name.trim()) {
        diagnostics.push(diag('Step name must not be empty', 'error', node.id));
      } else if (stepNames.has(node.name)) {
        diagnostics.push(
          diag(
            `Duplicate step name "${node.name}" (also used by ${stepNames.get(node.name)})`,
            'error',
            node.id,
          ),
        );
      } else {
        stepNames.set(node.name, node.id);
      }

      if (node.isInitial) {
        initialStepIds.push(node.id);
      }

      for (const action of node.actions) {
        diagnostics.push(...validateAction(action, node.id));
      }
    } else if (isTransition(node)) {
      if (expect === 'step') {
        diagnostics.push(
          diag(`Expected step before transition at ${nodePath}`, 'error', node.id),
        );
      }
      expect = 'step';

      if (!node.condition.trim()) {
        diagnostics.push(diag('Transition condition must not be empty', 'warning', node.id));
      }
    } else if (isBranch(node)) {
      validateBranch(node, nodePath, diagnostics, stepNames, initialStepIds);
      expect = 'either';
    }
  }
}

function validateBranch(
  branch: SfcBranch,
  path: string,
  diagnostics: ValidationDiagnostic[],
  stepNames: Map<string, string>,
  initialStepIds: string[],
): void {
  if (branch.lanes.length < 2) {
    diagnostics.push(
      diag(`Branch at ${path} must have at least two lanes`, 'error', branch.id),
    );
  }

  for (let laneIndex = 0; laneIndex < branch.lanes.length; laneIndex += 1) {
    const lane = branch.lanes[laneIndex];
    const lanePath = `${path}.lane${laneIndex}`;

    if (branch.branchType === 'alternative') {
      if (branch.role === 'divergence') {
        if (!lane[0] || !isTransition(lane[0])) {
          diagnostics.push(
            diag(
              `Alternative divergence lane must start with a transition (${lanePath})`,
              'error',
              branch.id,
            ),
          );
        }
      } else if (branch.role === 'convergence') {
        const last = lane[lane.length - 1];
        if (!last || !isTransition(last)) {
          diagnostics.push(
            diag(
              `Alternative convergence lane must end with a transition (${lanePath})`,
              'error',
              branch.id,
            ),
          );
        }
      }
    } else if (branch.branchType === 'simultaneous') {
      if (branch.role === 'divergence') {
        if (!lane[0] || !isStep(lane[0])) {
          diagnostics.push(
            diag(
              `Simultaneous divergence lane must start with a step (${lanePath})`,
              'error',
              branch.id,
            ),
          );
        }
      } else if (branch.role === 'convergence') {
        const last = lane[lane.length - 1];
        if (!last || !isStep(last)) {
          diagnostics.push(
            diag(
              `Simultaneous convergence lane must end with a step (${lanePath})`,
              'error',
              branch.id,
            ),
          );
        }
      }
    }

    validateSequence(lane, lanePath, diagnostics, stepNames, initialStepIds);
  }
}

function collectReachable(diagram: SfcDiagram): Set<string> {
  const reachable = new Set<string>();

  function walk(nodes: SfcNode[]): void {
    for (const node of nodes) {
      reachable.add(node.id);
      if (isBranch(node)) {
        for (const lane of node.lanes) {
          walk(lane);
        }
      }
    }
  }

  walk(diagram.root);
  return reachable;
}

function collectAllIds(diagram: SfcDiagram): string[] {
  const ids: string[] = [];

  function walk(nodes: SfcNode[]): void {
    for (const node of nodes) {
      ids.push(node.id);
      if (isStep(node)) {
        for (const action of node.actions) {
          ids.push(action.id);
        }
      }
      if (isBranch(node)) {
        for (const lane of node.lanes) {
          walk(lane);
        }
      }
    }
  }

  walk(diagram.root);
  return ids;
}

export function validateDiagram(diagram: SfcDiagram): ValidationResult {
  const diagnostics: ValidationDiagnostic[] = [];
  const stepNames = new Map<string, string>();
  const initialStepIds: string[] = [];

  if (!diagram.title.trim()) {
    diagnostics.push(diag('Diagram title must not be empty', 'warning'));
  }

  if (diagram.root.length === 0) {
    diagnostics.push(diag('Diagram must contain at least one element', 'error'));
  }

  validateSequence(diagram.root, 'root', diagnostics, stepNames, initialStepIds);

  if (initialStepIds.length === 0) {
    diagnostics.push(diag('Diagram must have exactly one initial step', 'error'));
  } else if (initialStepIds.length > 1) {
    diagnostics.push(
      diag(
        `Diagram has ${initialStepIds.length} initial steps; exactly one is allowed`,
        'error',
        initialStepIds[1],
      ),
    );
  }

  if (diagram.root[0] && !isStep(diagram.root[0])) {
    diagnostics.push(
      diag('SFC must start with a step (typically the initial step)', 'error', diagram.root[0].id),
    );
  }

  const reachable = collectReachable(diagram);
  const allIds = collectAllIds(diagram);
  for (const id of allIds) {
    if (!reachable.has(id)) {
      diagnostics.push(diag(`Unreachable element "${id}"`, 'warning', id));
    }
  }

  // If any vendor-specific qualifiers are used, add an informational diagnostic
  // to make users aware that semantics may vary across implementations.
  const vendorQualifiers = new Set(['SD', 'DS', 'SL', 'P1', 'P0']);
  const usedVendor = new Set<string>();
  function checkForVendor(nodes: SfcNode[]): void {
    for (const node of nodes) {
      if (isStep(node)) {
        for (const action of node.actions) {
          if (vendorQualifiers.has(action.qualifier)) usedVendor.add(action.qualifier);
        }
      }
      if (isBranch(node)) {
        for (const lane of node.lanes) {
          checkForVendor(lane);
        }
      }
    }
  }
  checkForVendor(diagram.root);
  if (usedVendor.size > 0) {
    diagnostics.push(
      diag(
        `Vendor-specific qualifiers used: ${Array.from(usedVendor).join(', ')}. Behavior may vary by implementation.`,
        'info',
      ),
    );
  }

  const errors = diagnostics.filter((d) => d.severity === 'error');
  return {
    valid: errors.length === 0,
    diagnostics,
  };
}

export function getElementLabel(diagram: SfcDiagram, elementId: string): string | undefined {
  let label: string | undefined;

  function walk(nodes: SfcNode[]): boolean {
    for (const node of nodes) {
      if (node.id === elementId) {
        if (isStep(node)) label = node.name;
        else if (isTransition(node)) label = node.condition;
        else if (isBranch(node)) label = `${node.branchType} ${node.role}`;
        return true;
      }
      if (isStep(node)) {
        for (const action of node.actions) {
          if (action.id === elementId) {
            label = action.name;
            return true;
          }
        }
      }
      if (isBranch(node)) {
        for (const lane of node.lanes) {
          if (walk(lane)) return true;
        }
      }
    }
    return false;
  }

  walk(diagram.root);
  return label;
}
