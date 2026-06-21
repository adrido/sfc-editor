import type { SfcNode } from '../model/types';
import { isBranch } from '../model/types';
import type { SfcBranch } from '../model/types';

export function getNodeById(nodes: SfcNode[], id: string): SfcNode | null {
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

export function getBranchAncestorByNodeId(nodes: SfcNode[], id: string): SfcBranch | null {
  for (const node of nodes) {
    if (isBranch(node)) {
      if (node.id === id) return node;

      for (const lane of node.lanes) {
        if (getNodeById(lane, id)) {
          const inner = getBranchAncestorByNodeId(lane, id);
          return inner ?? node;
        }
      }
    }
  }
  return null;
}
