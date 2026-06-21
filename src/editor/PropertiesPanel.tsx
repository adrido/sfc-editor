import { useEffect, useRef } from 'react';
import {
  ACTION_QUALIFIERS_META,
  TIME_REQUIRED_QUALIFIERS,
  isBranch,
  isStep,
  isTransition,
} from '../model/types';
import { getNodeById } from '../render/nodeLookup';
import { useDiagramStore } from '../store/diagramStore';
import styles from './PropertiesPanel.module.css';

export function PropertiesPanel() {
  const diagram = useDiagramStore((state) => state.diagram);
  const selection = useDiagramStore((state) => state.selection);
  const editStepNameId = useDiagramStore((state) => state.editStepNameId);
  const setEditStepName = useDiagramStore((state) => state.setEditStepName);
  const updateStep = useDiagramStore((state) => state.updateStep);
  const updateTransition = useDiagramStore((state) => state.updateTransition);
  const updateBranch = useDiagramStore((state) => state.updateBranch);
  const updateAction = useDiagramStore((state) => state.updateAction);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const node =
    selection.type !== 'diagram' && selection.type !== 'action'
      ? getNodeById(diagram.root, selection.id)
      : null;

  useEffect(() => {
    if (selection.type === 'step' && node && editStepNameId === node.id) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [selection.type, editStepNameId, node?.id]);

  if (selection.type === 'diagram') {
    return (
      <aside className={styles.panel}>
        <h3>Properties</h3>
        <p className={styles.empty}>Select a step, transition, branch, or action to edit its properties.</p>
      </aside>
    );
  }

  if (selection.type === 'action') {
    const step = getNodeById(diagram.root, selection.stepId);
    const action =
      step && isStep(step) ? step.actions.find((item) => item.id === selection.actionId) : undefined;

    if (!action) {
      return (
        <aside className={styles.panel}>
          <h3>Properties</h3>
          <p className={styles.empty}>Action not found.</p>
        </aside>
      );
    }

    return (
      <aside className={styles.panel}>
        <h3>Action</h3>
        <div className={styles.field}>
          <label htmlFor="action-name">Name</label>
          <input
            id="action-name"
            value={action.name}
            onChange={(event) =>
              updateAction(selection.stepId, selection.actionId, { name: event.target.value })
            }
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="action-qualifier">Qualifier</label>
          <select
            id="action-qualifier"
            value={action.qualifier}
            onChange={(event) =>
              updateAction(selection.stepId, selection.actionId, {
                qualifier: event.target.value as typeof action.qualifier,
              })
            }
          >
            {ACTION_QUALIFIERS_META.map((meta) => (
              <option key={meta.id} value={meta.id}>
                {meta.label} — {meta.description}
              </option>
            ))}
          </select>
        </div>
        {TIME_REQUIRED_QUALIFIERS.includes(action.qualifier) && (
          <div className={styles.field}>
            <label htmlFor="action-time">Time interval</label>
            <input
              id="action-time"
              placeholder="T#10s"
              value={action.time ?? ''}
              onChange={(event) =>
                updateAction(selection.stepId, selection.actionId, { time: event.target.value })
              }
            />
          </div>
        )}
      </aside>
    );
  }

  if (!node) {
    return (
      <aside className={styles.panel}>
        <h3>Properties</h3>
        <p className={styles.empty}>Element not found.</p>
      </aside>
    );
  }

  if (isStep(node)) {
    return (
      <aside className={styles.panel}>
        <h3>Step</h3>
        <div className={styles.field}>
          <label htmlFor="step-name">Name</label>
          <input
            id="step-name"
            ref={nameInputRef}
            value={node.name}
            onChange={(event) => updateStep(node.id, { name: event.target.value })}
            onBlur={() => {
              if (editStepNameId === node.id) {
                setEditStepName(null);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                setEditStepName(null);
                event.currentTarget.blur();
              }
            }}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="step-initial">
            <input
              id="step-initial"
              type="checkbox"
              checked={!!node.isInitial}
              onChange={(event) => updateStep(node.id, { isInitial: event.target.checked })}
            />{' '}
            Initial step
          </label>
        </div>
        <p className={styles.empty}>
          Step variables (IEC): IN, X, T, StartTime — implicit at runtime.
        </p>
      </aside>
    );
  }

  if (isTransition(node)) {
    return (
      <aside className={styles.panel}>
        <h3>Transition</h3>
        <div className={styles.field}>
          <label htmlFor="transition-condition">Condition</label>
          <textarea
            id="transition-condition"
            value={node.condition}
            onChange={(event) => updateTransition(node.id, event.target.value)}
          />
        </div>
      </aside>
    );
  }

  if (isBranch(node)) {
    return (
      <aside className={styles.panel}>
        <h3>Branch</h3>
        <div className={styles.field}>
          <label htmlFor="branch-type">Branch type</label>
          <select
            id="branch-type"
            value={node.branchType}
            onChange={(event) =>
              updateBranch(node.id, {
                branchType: event.target.value as typeof node.branchType,
              })
            }
          >
            <option value="alternative">Alternative</option>
            <option value="simultaneous">Simultaneous</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="branch-role">Role</label>
          <select
            id="branch-role"
            value={node.role}
            onChange={(event) =>
              updateBranch(node.id, { role: event.target.value as typeof node.role })
            }
          >
            <option value="divergence">Divergence</option>
            <option value="convergence">Convergence</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="branch-label">Jump label (optional)</label>
          <input
            id="branch-label"
            value={node.label ?? ''}
            onChange={(event) => updateBranch(node.id, { label: event.target.value })}
            placeholder="Branch mark for jumps"
          />
        </div>
      </aside>
    );
  }

  return null;
}
