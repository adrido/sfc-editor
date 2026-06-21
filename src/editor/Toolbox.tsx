import { useDiagramStore } from '../store/diagramStore';
import { getBranchAncestorByNodeId, getNodeById } from '../render/nodeLookup';
import { isBranch, isStep, isTransition } from '../model/types';
import styles from './Toolbox.module.css';

export function Toolbox() {
  const diagram = useDiagramStore((state) => state.diagram);
  const selection = useDiagramStore((state) => state.selection);
  const addTransitionAfterStep = useDiagramStore((state) => state.addTransitionAfterStep);
  const addStepAfterTransition = useDiagramStore((state) => state.addStepAfterTransition);
  const addAction = useDiagramStore((state) => state.addAction);
  const insertAlternativeBranchAfterStep = useDiagramStore(
    (state) => state.insertAlternativeBranchAfterStep,
  );
  const insertSimultaneousBranchAfterTransition = useDiagramStore(
    (state) => state.insertSimultaneousBranchAfterTransition,
  );
  const insertAlternativeBranchConvergenceAfterTransition = useDiagramStore(
    (state) => state.insertAlternativeBranchConvergenceAfterTransition,
  );
  const insertSimultaneousBranchConvergenceAfterStep = useDiagramStore(
    (state) => state.insertSimultaneousBranchConvergenceAfterStep,
  );
  const addBranchLane = useDiagramStore((state) => state.addBranchLane);
  const convertBranchType = useDiagramStore((state) => state.convertBranchType);
  const addBranchContinuation = useDiagramStore((state) => state.addBranchContinuation);
  const deleteSelected = useDiagramStore((state) => state.deleteSelected);

  const selectedId =
    selection.type === 'diagram' ? undefined : selection.type === 'action' ? selection.actionId : selection.id;

  const selectedNode = selectedId ? getNodeById(diagram.root, selectedId) : null;
  const selectedBranchAncestor = selectedId
    ? getBranchAncestorByNodeId(diagram.root, selectedId)
    : null;
  const selectedStep =
    selection.type === 'step'
      ? getNodeById(diagram.root, selection.id)
      : selection.type === 'action'
        ? getNodeById(diagram.root, selection.stepId)
        : null;

  return (
    <aside className={styles.toolbox}>
      <div className={styles.toolboxSection}>
        <h3>Structure</h3>
        <button
          type="button"
          disabled={selection.type !== 'step'}
          onClick={() => {
            if (selection.type === 'step') addTransitionAfterStep(selection.id);
          }}
        >
          Add transition below step
        </button>
        <button
          type="button"
          disabled={selection.type !== 'transition'}
          onClick={() => {
            if (selection.type === 'transition') addStepAfterTransition(selection.id);
          }}
        >
          Add step below transition
        </button>
        <button
          type="button"
          disabled={selection.type !== 'step' && selection.type !== 'action'}
          onClick={() => {
            const stepId =
              selection.type === 'step'
                ? selection.id
                : selection.type === 'action'
                  ? selection.stepId
                  : null;
            if (stepId) addAction(stepId);
          }}
        >
          Add action to step
        </button>
      </div>

      <div className={styles.toolboxSection}>
        <h3>Branching</h3>
        <button
          type="button"
          disabled={selection.type !== 'step'}
          onClick={() => {
            if (selection.type === 'step') insertAlternativeBranchAfterStep(selection.id);
          }}
        >
          Insert alternative branch
        </button>
        <button
          type="button"
          disabled={selection.type !== 'transition'}
          onClick={() => {
            if (selection.type === 'transition') insertAlternativeBranchConvergenceAfterTransition(selection.id);
          }}
        >
          Insert alternative convergence
        </button>
        <button
          type="button"
          disabled={selection.type !== 'transition'}
          onClick={() => {
            if (selection.type === 'transition') {
              insertSimultaneousBranchAfterTransition(selection.id);
            }
          }}
        >
          Insert simultaneous branch
        </button>
        <button
          type="button"
          disabled={selection.type !== 'step'}
          onClick={() => {
            if (selection.type === 'step') insertSimultaneousBranchConvergenceAfterStep(selection.id);
          }}
        >
          Insert simultaneous convergence
        </button>
        <button
          type="button"
          disabled={!selectedNode || !isBranch(selectedNode)}
          onClick={() => {
            if (selectedNode && isBranch(selectedNode)) addBranchLane(selectedNode.id);
          }}
        >
          Add branch lane
        </button>
        <button
          type="button"
          disabled={!selectedBranchAncestor}
          onClick={() => {
            if (selectedBranchAncestor) addBranchContinuation(selectedBranchAncestor.id);
          }}
        >
          Close branch and continue
        </button>
        <button
          type="button"
          disabled={!selectedNode || !isBranch(selectedNode)}
          onClick={() => {
            if (selectedNode && isBranch(selectedNode)) convertBranchType(selectedNode.id);
          }}
        >
          Convert alt / parallel
        </button>
      </div>

      <div className={styles.toolboxSection}>
        <h3>Edit</h3>
        <button
          type="button"
          disabled={selection.type === 'diagram'}
          onClick={deleteSelected}
        >
          Delete selected
        </button>
      </div>

      <div className={styles.toolboxSection}>
        <h3>Selection</h3>
        <p className={styles.hint}>
          {selection.type === 'diagram' && 'Click an element on the canvas to edit it.'}
          {selection.type === 'step' && `Step: ${selectedStep && isStep(selectedStep) ? selectedStep.name : ''}`}
          {selection.type === 'transition' &&
            `Transition: ${selectedNode && isTransition(selectedNode) ? selectedNode.condition : ''}`}
          {selection.type === 'branch' &&
            `Branch: ${selectedNode && isBranch(selectedNode) ? `${selectedNode.branchType} ${selectedNode.role}` : ''}`}
          {selection.type === 'action' && 'Action selected — edit in properties panel.'}
        </p>
      </div>
    </aside>
  );
}
