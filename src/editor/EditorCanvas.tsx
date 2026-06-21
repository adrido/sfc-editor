import { useMemo } from 'react';
import { SvgRenderer } from '../render/svgRenderer';
import { useDiagramStore } from '../store/diagramStore';
import styles from './EditorCanvas.module.css';

export function EditorCanvas() {
  const diagram = useDiagramStore((state) => state.diagram);
  const selection = useDiagramStore((state) => state.selection);
  const validation = useDiagramStore((state) => state.validation);
  const select = useDiagramStore((state) => state.select);
  const setEditStepName = useDiagramStore((state) => state.setEditStepName);
  const actionsCollapsed = useDiagramStore((state) => state.actionsCollapsed);

  const selectedId =
    selection.type === 'diagram'
      ? undefined
      : selection.type === 'action'
        ? selection.actionId
        : selection.id;

  const errorIds = useMemo(() => {
    if (!validation) return new Set<string>();
    return new Set(
      validation.diagnostics
        .filter((diagnostic) => diagnostic.severity === 'error' && diagnostic.elementId)
        .map((diagnostic) => diagnostic.elementId as string),
    );
  }, [validation]);

  return (
    <main
      className={styles.canvasWrap}
      onClick={() => select({ type: 'diagram' })}
    >
      <div className={styles.canvasInner}>
        <SvgRenderer
          diagram={diagram}
          selectedId={selectedId}
          errorIds={errorIds}
          interactive
          actionsCollapsed={actionsCollapsed}
          onSelect={(id, kind, stepId) => {
            if (kind === 'action' && stepId) {
              select({ type: 'action', stepId, actionId: id });
              return;
            }
            if (kind === 'step') select({ type: 'step', id });
            if (kind === 'transition') select({ type: 'transition', id });
            if (kind === 'branch') select({ type: 'branch', id });
          }}
          onEditStepName={(id) => {
            select({ type: 'step', id });
            setEditStepName(id);
          }}
        />
      </div>
    </main>
  );
}
