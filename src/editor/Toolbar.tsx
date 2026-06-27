import { useRef, useState } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { exportPng } from '../export/exportPng';
import { exportSvg } from '../export/exportSvg';
import { loadDiagramJsonFromFile, saveDiagramJson } from '../export/exportFiles';
import { AboutModal } from './AboutModal';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagram = useDiagramStore((state) => state.diagram);
  const setTitle = useDiagramStore((state) => state.setTitle);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const undo = useDiagramStore((state) => state.undo);
  const redo = useDiagramStore((state) => state.redo);
  const runValidation = useDiagramStore((state) => state.runValidation);
  const actionsCollapsed = useDiagramStore((state) => state.actionsCollapsed);
  const toggleActionsCollapsed = useDiagramStore((state) => state.toggleActionsCollapsed);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <header className={styles.toolbar}>
      <div className={styles.toolbarIcons}>
        <img src="favicon.svg" alt="SFC Editor" width="32" height="32" className={styles.toolbarIcon} />
      </div>
      <div className={styles.toolbarTitle}>SFC Editor</div>

      <div className={styles.toolbarGroup}>
        <input
          value={diagram.title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Diagram title"
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 13,
            minWidth: 180,
          }}
        />
      </div>

      <div className={styles.toolbarGroup}>
        <button type="button" onClick={() => newDiagram()}>New</button>
        <button type="button" onClick={() => saveDiagramJson(diagram)}>Save</button>
        <label className={styles.fileButton}>
          Open
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.sfc.json,application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const loaded = await loadDiagramJsonFromFile(file);
              loadDiagram(loaded);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      <div className={styles.toolbarGroup}>
        <button type="button" onClick={undo}>Undo</button>
        <button type="button" onClick={redo}>Redo</button>
      </div>

      <div className={styles.toolbarGroup}>
        <button type="button" className={styles.primary} onClick={() => runValidation()}>
          Validate
        </button>
        <button
          type="button"
          className={styles.fixedWidth}
          onClick={() => toggleActionsCollapsed()}
          aria-pressed={actionsCollapsed}
        >
          {actionsCollapsed ? 'Expand actions' : 'Collapse actions'}
        </button>
        <button type="button" onClick={() => exportSvg(diagram)}>Export SVG</button>
        <button
          type="button"
          onClick={() => {
            void exportPng(diagram);
          }}
        >
          Export PNG
        </button>
        <button type="button" onClick={() => setAboutOpen(true)}>
          About
        </button>
      </div>
    </header>

      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
