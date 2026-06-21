import type { LayoutAction, LayoutEdge, LayoutNode } from '../model/types';
import type { SfcDiagram } from '../model/types';
import { layoutDiagram } from '../layout/layoutEngine';
import { getNodeById } from './nodeLookup';
import { getQualifierById, isStep } from '../model/types';

interface SvgRendererProps {
  diagram: SfcDiagram;
  selectedId?: string;
  errorIds?: Set<string>;
  interactive?: boolean;
  actionsCollapsed?: boolean;
  onSelect?: (id: string, kind: 'step' | 'transition' | 'branch' | 'action', stepId?: string) => void;
  onEditStepName?: (id: string) => void;
}

function getStepInitial(diagram: SfcDiagram, id: string): boolean {
  const node = getNodeById(diagram.root, id);
  return node?.kind === 'step' && !!node.isInitial;
}

function getTransitionCondition(diagram: SfcDiagram, id: string): string {
  const node = getNodeById(diagram.root, id);
  return node?.kind === 'transition' ? node.condition : '';
}

function getStepName(diagram: SfcDiagram, id: string): string {
  const node = getNodeById(diagram.root, id);
  return node?.kind === 'step' ? node.name : '';
}

function strokeFor(id: string, selectedId?: string, errorIds?: Set<string>): string {
  if (errorIds?.has(id)) return '#dc2626';
  if (id === selectedId) return '#2563eb';
  return '#1f2937';
}

function EdgePath({ edge }: { edge: LayoutEdge }) {
  if (edge.points.length < 2) return null;
  const d = edge.points
    .map((point: { x: number; y: number }, index: number) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  return (
    <path
      d={d}
      fill="none"
      stroke="#374151"
      strokeWidth={1.5}
    />
  );
}

function StepShape({
  node,
  diagram,
  selectedId,
  errorIds,
  interactive,
  onSelect,
  onEditStepName,
  actionsCollapsed,
}: {
  node: LayoutNode;
  diagram: SfcDiagram;
  selectedId?: string;
  errorIds?: Set<string>;
  interactive?: boolean;
  onSelect?: SvgRendererProps['onSelect'];
  onEditStepName?: SvgRendererProps['onEditStepName'];
  actionsCollapsed?: boolean;
}) {
  const isInitial = getStepInitial(diagram, node.id);
  const name = getStepName(diagram, node.id);
  const stroke = strokeFor(node.id, selectedId, errorIds);

  const actionCount = actionsCollapsed
    ? (() => {
        const model = getNodeById(diagram.root, node.id);
        return model && (model as any).actions ? (model as any).actions.length : 0;
      })()
    : 0;

  return (
    <g
      className="sfc-step"
      data-id={node.id}
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(node.id, 'step');
            }
          : undefined
      }
      onDoubleClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(node.id, 'step');
              onEditStepName?.(node.id);
            }
          : undefined
      }
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      <rect
        x={node.rect.x}
        y={node.rect.y}
        width={node.rect.width}
        height={node.rect.height}
        fill="#ffffff"
        stroke={stroke}
        strokeWidth={isInitial ? 3 : 1.5}
        rx={2}
      />
      {isInitial && (
        <rect
          x={node.rect.x + 4}
          y={node.rect.y + 4}
          width={node.rect.width - 8}
          height={node.rect.height - 8}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          rx={1}
        />
      )}
      <text
        x={node.rect.x + node.rect.width / 2}
        y={node.rect.y + node.rect.height / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fill="#111827"
        fontFamily="ui-monospace, monospace"
      >
        {name}
      </text>
      {actionsCollapsed && actionCount > 0 && (
        <g>
          <rect
            x={node.rect.x + node.rect.width - 36}
            y={node.rect.y + 8}
            width={30}
            height={18}
            rx={9}
            fill="#111827"
          />
          <text
            x={node.rect.x + node.rect.width - 21}
            y={node.rect.y + 8 + 12}
            textAnchor="middle"
            fontSize={11}
            fill="#ffffff"
            fontFamily="ui-monospace, monospace"
          >
            {actionCount}
          </text>
        </g>
      )}
    </g>
  );
}

function TransitionShape({
  node,
  diagram,
  selectedId,
  errorIds,
  interactive,
  onSelect,
}: {
  node: LayoutNode;
  diagram: SfcDiagram;
  selectedId?: string;
  errorIds?: Set<string>;
  interactive?: boolean;
  onSelect?: SvgRendererProps['onSelect'];
}) {
  const condition = getTransitionCondition(diagram, node.id);
  const stroke = strokeFor(node.id, selectedId, errorIds);

  return (
    <g
      className="sfc-transition"
      data-id={node.id}
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(node.id, 'transition');
            }
          : undefined
      }
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      <rect
        x={node.rect.x}
        y={node.rect.y}
        width={node.rect.width}
        height={node.rect.height}
        fill="#374151"
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={node.rect.x + node.rect.width / 2}
        y={node.rect.y - 6}
        textAnchor="middle"
        fontSize={11}
        fill="#374151"
        fontFamily="ui-monospace, monospace"
      >
        {condition}
      </text>
    </g>
  );
}

function BranchShape({
  node,
  selectedId,
  errorIds,
  interactive,
  onSelect,
}: {
  node: LayoutNode;
  selectedId?: string;
  errorIds?: Set<string>;
  interactive?: boolean;
  onSelect?: SvgRendererProps['onSelect'];
}) {
  const stroke = strokeFor(node.id, selectedId, errorIds);
  const isDouble = node.branchType === 'simultaneous';
  const y1 = node.rect.y + (isDouble ? 2 : node.rect.height / 2);
  const y2 = isDouble ? node.rect.y + node.rect.height - 2 : y1;

  return (
    <g
      className="sfc-branch"
      data-id={node.id}
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(node.id, 'branch');
            }
          : undefined
      }
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      <line
        x1={node.rect.x}
        y1={y1}
        x2={node.rect.x + node.rect.width}
        y2={y1}
        stroke="transparent"
        strokeWidth={44}
        pointerEvents="stroke"
      />
      {isDouble && (
        <line
          x1={node.rect.x}
          y1={y2}
          x2={node.rect.x + node.rect.width}
          y2={y2}
          stroke="transparent"
          strokeWidth={44}
          pointerEvents="stroke"
        />
      )}
      <line
        x1={node.rect.x}
        y1={y1}
        x2={node.rect.x + node.rect.width}
        y2={y1}
        stroke={stroke}
        strokeWidth={2}
      />
      {isDouble && (
        <line
          x1={node.rect.x}
          y1={y2}
          x2={node.rect.x + node.rect.width}
          y2={y2}
          stroke={stroke}
          strokeWidth={2}
        />
      )}
      {node.label && (
        <text
          x={node.rect.x + node.rect.width + 8}
          y={node.rect.y + node.rect.height / 2 + 4}
          fontSize={11}
          fill="#6b7280"
          fontFamily="ui-monospace, monospace"
        >
          {node.label}
        </text>
      )}
    </g>
  );
}

function ActionShape({
  action,
  diagram,
  selectedId,
  errorIds,
  interactive,
  onSelect,
}: {
  action: LayoutAction;
  diagram: SfcDiagram;
  selectedId?: string;
  errorIds?: Set<string>;
  interactive?: boolean;
  onSelect?: SvgRendererProps['onSelect'];
}) {
  const stroke = strokeFor(action.id, selectedId, errorIds);

  // Find the model action to lookup qualifier description
  const node = getNodeById(diagram.root, action.stepId);
  let qualifierDesc = '';
  if (node && isStep(node)) {
    const mAction = node.actions.find((a) => a.id === action.id);
    if (mAction) {
      qualifierDesc = getQualifierById(mAction.qualifier)?.description ?? '';
    }
  }

  return (
    <g
      className="sfc-action"
      data-id={action.id}
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              onSelect?.(action.id, 'action', action.stepId);
            }
          : undefined
      }
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      {qualifierDesc && <title>{qualifierDesc}</title>}
      <rect
        x={action.rect.x}
        y={action.rect.y}
        width={action.rect.width}
        height={action.rect.height}
        fill="#f3f4f6"
        stroke={stroke}
        strokeWidth={1.5}
        rx={2}
      />
      <text
        x={action.rect.x + 8}
        y={action.rect.y + action.rect.height / 2 + 4}
        fontSize={11}
        fill="#111827"
        fontFamily="ui-monospace, monospace"
      >
        {action.text}
      </text>
    </g>
  );
}

export function SvgRenderer({
  diagram,
  selectedId,
  errorIds,
  interactive = false,
  actionsCollapsed = false,
  onSelect,
  onEditStepName,
}: SvgRendererProps) {
  const layout = layoutDiagram(diagram);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="sfc-svg"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#374151" />
        </marker>
      </defs>

      <rect x={0} y={0} width={layout.width} height={layout.height} fill="#ffffff" />

      {layout.edges.map((edge) => (
        <EdgePath key={edge.id} edge={edge} />
      ))}

      {layout.nodes.map((node) => {
        if (node.kind === 'step') {
          return (
            <StepShape
              key={node.id}
              node={node}
              diagram={diagram}
              selectedId={selectedId}
              errorIds={errorIds}
              interactive={interactive}
              actionsCollapsed={actionsCollapsed}
              onSelect={onSelect}
              onEditStepName={onEditStepName}
            />
          );
        }
        if (node.kind === 'transition') {
          return (
            <TransitionShape
              key={node.id}
              node={node}
              diagram={diagram}
              selectedId={selectedId}
              errorIds={errorIds}
              interactive={interactive}
              onSelect={onSelect}
            />
          );
        }
        return (
          <BranchShape
            key={node.id}
            node={node}
            selectedId={selectedId}
            errorIds={errorIds}
            interactive={interactive}
            onSelect={onSelect}
          />
        );
      })}

      {!actionsCollapsed && layout.actions.map((action) => (
        <ActionShape
          key={action.id}
          action={action}
          diagram={diagram}
          selectedId={selectedId}
          errorIds={errorIds}
          interactive={interactive}
          onSelect={onSelect}
        />
      ))}
    </svg>
  );
}

export function renderDiagramToSvgString(
  diagram: SfcDiagram,
  options?: { background?: string; actionsCollapsed?: boolean },
): string {
  const layout = layoutDiagram(diagram);
  const bg = options?.background ?? '#ffffff';
  const actionsCollapsed = options?.actionsCollapsed ?? false;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">`,
  );
  parts.push(`<rect x="0" y="0" width="${layout.width}" height="${layout.height}" fill="${bg}"/>`);

  for (const edge of layout.edges) {
    if (edge.points.length < 2) continue;
    const d = edge.points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
    parts.push(
      `<path d="${d}" fill="none" stroke="#374151" stroke-width="1.5" marker-end="url(#arrowhead)"/>`,
    );
  }

  for (const node of layout.nodes) {
    if (node.kind === 'step') {
      const isInitial = getStepInitial(diagram, node.id);
      const name = escapeXml(getStepName(diagram, node.id));
      parts.push(
        `<rect x="${node.rect.x}" y="${node.rect.y}" width="${node.rect.width}" height="${node.rect.height}" fill="#ffffff" stroke="#1f2937" stroke-width="${isInitial ? 3 : 1.5}" rx="2"/>`,
      );
      if (isInitial) {
        parts.push(
          `<rect x="${node.rect.x + 4}" y="${node.rect.y + 4}" width="${node.rect.width - 8}" height="${node.rect.height - 8}" fill="none" stroke="#1f2937" stroke-width="1.5" rx="1"/>`,
        );
      }
      parts.push(
        `<text x="${node.rect.x + node.rect.width / 2}" y="${node.rect.y + node.rect.height / 2 + 4}" text-anchor="middle" font-size="12" fill="#111827" font-family="ui-monospace, monospace">${name}</text>`,
      );
    } else if (node.kind === 'transition') {
      const condition = escapeXml(getTransitionCondition(diagram, node.id));
      parts.push(
        `<rect x="${node.rect.x}" y="${node.rect.y}" width="${node.rect.width}" height="${node.rect.height}" fill="#374151" stroke="#1f2937" stroke-width="1.5"/>`,
      );
      parts.push(
        `<text x="${node.rect.x + node.rect.width / 2}" y="${node.rect.y - 6}" text-anchor="middle" font-size="11" fill="#374151" font-family="ui-monospace, monospace">${condition}</text>`,
      );
    } else {
      const isDouble = node.branchType === 'simultaneous';
      const y1 = node.rect.y + (isDouble ? 2 : node.rect.height / 2);
      parts.push(
        `<line x1="${node.rect.x}" y1="${y1}" x2="${node.rect.x + node.rect.width}" y2="${y1}" stroke="#1f2937" stroke-width="2"/>`,
      );
      if (isDouble) {
        const y2 = node.rect.y + node.rect.height - 2;
        parts.push(
          `<line x1="${node.rect.x}" y1="${y2}" x2="${node.rect.x + node.rect.width}" y2="${y2}" stroke="#1f2937" stroke-width="2"/>`,
        );
      }
      if (node.label) {
        parts.push(
          `<text x="${node.rect.x + node.rect.width + 8}" y="${node.rect.y + node.rect.height / 2 + 4}" font-size="11" fill="#6b7280" font-family="ui-monospace, monospace">${escapeXml(node.label)}</text>`,
        );
      }
    }
  }

  if (!actionsCollapsed) {
    for (const action of layout.actions) {
      // find qualifier description from model
      let qualDesc = '';
      const stepNode = getNodeById(diagram.root, action.stepId);
      if (stepNode && (stepNode as any).actions) {
        const sAction = (stepNode as any).actions.find((a: any) => a.id === action.id);
        if (sAction) {
          const q = getQualifierById(sAction.qualifier);
          qualDesc = q?.description ?? '';
        }
      }

      parts.push(
        `<g>${qualDesc ? `<title>${escapeXml(qualDesc)}</title>` : ''}` +
          `<rect x="${action.rect.x}" y="${action.rect.y}" width="${action.rect.width}" height="${action.rect.height}" fill="#f3f4f6" stroke="#1f2937" stroke-width="1.5" rx="2"/>` +
          `<text x="${action.rect.x + 8}" y="${action.rect.y + action.rect.height / 2 + 4}" font-size="11" fill="#111827" font-family="ui-monospace, monospace">${escapeXml(action.text)}</text>` +
          `</g>`,
      );
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { layoutDiagram };
