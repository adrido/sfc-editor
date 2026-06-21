import { Toolbar } from './editor/Toolbar';
import { Toolbox } from './editor/Toolbox';
import { EditorCanvas } from './editor/EditorCanvas';
import { PropertiesPanel } from './editor/PropertiesPanel';
import { DiagnosticsPanel } from './editor/DiagnosticsPanel';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="workspace">
        <Toolbox />
        <div className="centerColumn">
          <EditorCanvas />
          <DiagnosticsPanel />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
