import { useEffect } from 'react';
import packageJson from '../../package.json';
import styles from './AboutModal.module.css';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
      <div className={styles.dialog}>
        <header className={styles.header}>
          <h2 id="about-dialog-title">About SFC Editor</h2>
          <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Close About dialog">
            ×
          </button>
        </header>

        <div className={styles.content}>
          <p>This editor helps you build and validate Sequential Function Chart (SFC) diagrams in-browser.</p>

          <section>
            <h3>Project</h3>
            <ul>
              <li>Name: <strong>SFC Editor</strong></li>
              <li>Version: <strong>{packageJson.version}</strong></li>
              <li>Build: <strong>React + Vite + TypeScript</strong></li>
            </ul>
          </section>

          <section>
            <h3>What it does</h3>
            <ul>
              <li>Create, open, save, and validate SFC diagrams</li>
              <li>Export diagrams as SVG or PNG</li>
              <li>Support for IEC 61131-3 Sequential Function Chart workflows</li>
            </ul>
          </section>

          <section>
            <h3>Supported formats</h3>
            <p><code>.json</code>, <code>.sfc.json</code></p>
          </section>

          <section>
            <h3>Tech stack</h3>
            <ul>
              <li>React 19</li>
              <li>Vite</li>
              <li>TypeScript</li>
              <li>Zustand for state management</li>
              <li>Immer for immutable updates</li>
            </ul>
          </section>

          <div className={styles.buttonRow}>
            <button type="button" className={styles.closeFooterButton} onClick={onClose}>
              Close
            </button>
            <a
              className={styles.githubButton}
              href="https://github.com/adrido/sfc-editor"
              target="_blank"
              rel="noopener noreferrer"
            >
              Fork me on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
