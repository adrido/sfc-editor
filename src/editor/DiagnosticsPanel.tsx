import { getNodeById } from '../render/nodeLookup';
import { isBranch, isStep, isTransition } from '../model/types';
import { useDiagramStore } from '../store/diagramStore';
import styles from './DiagnosticsPanel.module.css';

export function DiagnosticsPanel() {
  const validation = useDiagramStore((state) => state.validation);
  const diagram = useDiagramStore((state) => state.diagram);
  const select = useDiagramStore((state) => state.select);

  if (!validation) {
    return null;
  }

  if (validation.valid) {
    return (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>Validation</div>
        <div className={styles.ok}>Diagram passes IEC 61131-3 validation checks.</div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        Validation — {validation.diagnostics.filter((d) => d.severity === 'error').length} error(s)
      </div>
      <ul className={styles.list}>
        {validation.diagnostics.map((diagnostic) => (
          <li
            key={diagnostic.id}
            className={diagnostic.severity === 'error' ? styles.itemError : styles.item}
            onClick={() => {
              if (!diagnostic.elementId) return;
              const node = getNodeById(diagram.root, diagnostic.elementId);
              if (!node) return;
              if (isStep(node)) select({ type: 'step', id: node.id });
              else if (isTransition(node)) select({ type: 'transition', id: node.id });
              else if (isBranch(node)) select({ type: 'branch', id: node.id });
            }}
          >
            [{diagnostic.severity}] {diagnostic.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
