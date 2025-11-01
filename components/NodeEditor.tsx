"use client";

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  MarkerType,
  Panel,
  NodeToolbar,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import clsx from 'classnames';
import { blendImages, createSolidImage, generateGradientImage, generatePerlinNoise } from '@/lib/image';

// Types for node data
export type ImageDataRef = ImageData | null;

type BaseNodeData = {
  title: string;
  preview?: ImageDataRef;
  onChange?: () => void;
};

type CreateImageData = BaseNodeData & {
  color: string;
  size: number;
};

type GradientNodeData = BaseNodeData & {
  colorA: string;
  colorB: string;
  direction: 'horizontal' | 'vertical';
  size: number;
};

type NoiseNodeData = BaseNodeData & {
  scale: number;
  seed: number;
  size: number;
};

type CombineNodeData = BaseNodeData & {
  mode: 'add' | 'multiply' | 'overlay' | 'screen' | 'difference';
  opacity: number;
};

type DisplayNodeData = BaseNodeData & {};

// Custom Node Components
function NodeContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel rounded-lg min-w-[240px] shadow-soft">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">{title}</div>
      </div>
      <div className="p-3 space-y-3">{children}</div>
    </div>
  );
}

function Preview({ img }: { img: ImageDataRef }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!canvasRef.current || !img) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = img.width;
    canvasRef.current.height = img.height;
    ctx.putImageData(img, 0, 0);
  }, [img]);
  return (
    <div className="rounded-md overflow-hidden border border-white/10 bg-black/20">
      <canvas ref={canvasRef} className="w-full h-full max-h-48" />
    </div>
  );
}

// Create Image Node
function CreateImageNode({ data }: { data: CreateImageData }) {
  return (
    <div>
      <NodeContainer title="Create Image">
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="label">Color</div>
          <input className="input" type="color" value={data.color} onChange={(e) => { data.color = e.target.value; data.onChange?.(); }} />
          <div className="label">Size</div>
          <input className="input" type="number" min={64} max={1024} step={32} value={data.size} onChange={(e) => { data.size = Number(e.target.value); data.onChange?.(); }} />
        </div>
        <Preview img={data.preview ?? null} />
        <Handle type="source" position={Position.Right} id="out" />
      </NodeContainer>
    </div>
  );
}

// Gradient Node
function GradientNode({ data }: { data: GradientNodeData }) {
  return (
    <div>
      <NodeContainer title="Add Gradient">
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="label">Color A</div>
          <input className="input" type="color" value={data.colorA} onChange={(e) => { data.colorA = e.target.value; data.onChange?.(); }} />
          <div className="label">Color B</div>
          <input className="input" type="color" value={data.colorB} onChange={(e) => { data.colorB = e.target.value; data.onChange?.(); }} />
          <div className="label">Direction</div>
          <select className="input" value={data.direction} onChange={(e) => { data.direction = e.target.value as any; data.onChange?.(); }}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
          <div className="label">Size</div>
          <input className="input" type="number" min={64} max={1024} step={32} value={data.size} onChange={(e) => { data.size = Number(e.target.value); data.onChange?.(); }} />
        </div>
        <Preview img={data.preview ?? null} />
        <Handle type="source" position={Position.Right} id="out" />
      </NodeContainer>
    </div>
  );
}

// Perlin Noise Node
function NoiseNode({ data }: { data: NoiseNodeData }) {
  return (
    <div>
      <NodeContainer title="Perlin Noise">
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="label">Scale</div>
          <input className="input" type="number" min={2} max={128} step={1} value={data.scale} onChange={(e) => { data.scale = Number(e.target.value); data.onChange?.(); }} />
          <div className="label">Seed</div>
          <input className="input" type="number" min={0} max={9999} step={1} value={data.seed} onChange={(e) => { data.seed = Number(e.target.value); data.onChange?.(); }} />
          <div className="label">Size</div>
          <input className="input" type="number" min={64} max={1024} step={32} value={data.size} onChange={(e) => { data.size = Number(e.target.value); data.onChange?.(); }} />
        </div>
        <Preview img={data.preview ?? null} />
        <Handle type="source" position={Position.Right} id="out" />
      </NodeContainer>
    </div>
  );
}

// Combine Images Node
function CombineNode({ data }: { data: CombineNodeData }) {
  return (
    <div>
      <NodeContainer title="Combine Images">
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="label">Mode</div>
          <select className="input" value={data.mode} onChange={(e) => { data.mode = e.target.value as any; data.onChange?.(); }}>
            <option value="add">Add</option>
            <option value="multiply">Multiply</option>
            <option value="overlay">Overlay</option>
            <option value="screen">Screen</option>
            <option value="difference">Difference</option>
          </select>
          <div className="label">Opacity</div>
          <input className="input" type="range" min={0} max={1} step={0.05} value={data.opacity} onChange={(e) => { data.opacity = Number(e.target.value); data.onChange?.(); }} />
        </div>
        <Preview img={data.preview ?? null} />
        <Handle type="target" position={Position.Left} id="a" />
        <Handle type="target" position={Position.Left} id="b" style={{ top: 60 }} />
        <Handle type="source" position={Position.Right} id="out" />
      </NodeContainer>
    </div>
  );
}

// Display Node
function DisplayNode({ data }: { data: DisplayNodeData }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!canvasRef.current || !data.preview) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = data.preview.width;
    canvasRef.current.height = data.preview.height;
    ctx.putImageData(data.preview, 0, 0);
  }, [data.preview]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'image.png';
    a.click();
  };

  return (
    <div>
      <NodeContainer title="Display Image">
        <div className="flex items-center justify-between">
          <button className="btn btn-primary text-xs" onClick={download}>Download</button>
        </div>
        <div className="rounded-md overflow-hidden border border-white/10 bg-black/20">
          <canvas ref={canvasRef} className="w-full h-full max-h-64" />
        </div>
        <Handle type="target" position={Position.Left} id="in" />
      </NodeContainer>
    </div>
  );
}

const nodeTypes = {
  createImage: CreateImageNode,
  gradient: GradientNode,
  perlin: NoiseNode,
  combine: CombineNode,
  display: DisplayNode,
};

type NodeKind = keyof typeof nodeTypes;

// Graph evaluation
function colorHexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function evaluateGraph(nodes: Node[], edges: Edge[]): Record<string, ImageData | null> {
  const byId: Record<string, Node> = Object.fromEntries(nodes.map(n => [n.id, n]));
  const incoming: Record<string, Edge[]> = {};
  edges.forEach(e => { (incoming[e.target] ||= []).push(e); });

  const outputs: Record<string, ImageData | null> = {};
  const visited = new Set<string>();
  let progress = true;

  const getOutput = (nodeId: string): ImageData | null => outputs[nodeId] ?? null;

  while (progress) {
    progress = false;
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      const inc = incoming[node.id] || [];
      const ready = inc.every(e => outputs[e.source] !== undefined);
      if (!ready) continue;

      let out: ImageData | null = null;
      try {
        switch (node.type as NodeKind) {
          case 'createImage': {
            const d = node.data as CreateImageData;
            const { r, g, b } = colorHexToRgb(d.color);
            out = createSolidImage(d.size, d.size, r, g, b, 255);
            break;
          }
          case 'gradient': {
            const d = node.data as GradientNodeData;
            const a = colorHexToRgb(d.colorA);
            const b = colorHexToRgb(d.colorB);
            out = generateGradientImage(d.size, d.size, a, b, d.direction);
            break;
          }
          case 'perlin': {
            const d = node.data as NoiseNodeData;
            out = generatePerlinNoise(d.size, d.size, d.scale, d.seed);
            break;
          }
          case 'combine': {
            const d = node.data as CombineNodeData;
            const incA = inc.find(e => e.targetHandle === 'a');
            const incB = inc.find(e => e.targetHandle === 'b');
            const imgA = incA ? getOutput(incA.source) : null;
            const imgB = incB ? getOutput(incB.source) : null;
            out = blendImages(imgA, imgB, d.mode, d.opacity);
            break;
          }
          case 'display': {
            const incIn = inc.find(e => e.targetHandle === 'in');
            out = incIn ? getOutput(incIn.source) : null;
            break;
          }
          default:
            out = null;
        }
      } catch (e) {
        out = null;
      }

      outputs[node.id] = out;
      visited.add(node.id);
      progress = true;
    }
  }

  return outputs;
}

// Context Menu
type CtxTarget = { kind: 'pane' } | { kind: 'node'; nodeId: string } | { kind: 'edge'; edgeId: string };

export function NodeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  const idRef = useRef(1);

  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const [ctxTarget, setCtxTarget] = useState<CtxTarget>({ kind: 'pane' });

  const outputs = useMemo(() => evaluateGraph(nodes, edges), [nodes, edges]);

  // inject previews back to node data
  useEffect(() => {
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, preview: outputs[n.id] || null } })));
  }, [outputs, setNodes]);

  const onConnect = useCallback((connection: Connection) => setEdges(eds => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const addNode = (type: NodeKind, position?: { x: number; y: number }) => {
    const id = String(idRef.current++);
    const base = { onChange: () => setNodes(n => [...n]) };
    const dataByType: Record<NodeKind, any> = {
      createImage: { title: 'Create Image', color: '#4f46e5', size: 256, ...base },
      gradient: { title: 'Add Gradient', colorA: '#7aa2f7', colorB: '#a78bfa', direction: 'horizontal', size: 256, ...base },
      perlin: { title: 'Perlin Noise', scale: 16, seed: Math.floor(Math.random()*9999), size: 256, ...base },
      combine: { title: 'Combine Images', mode: 'add', opacity: 1, ...base },
      display: { title: 'Display Image', ...base },
    };
    const pos = position ?? rf?.project({ x: 200, y: 200 }) ?? { x: 200, y: 200 };
    const node: Node = {
      id,
      type,
      position: pos,
      data: dataByType[type],
    } as Node;
    setNodes(nds => nds.concat(node));
    return id;
  };

  // Keyboard delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setNodes, setEdges]);

  // Context menu handlers
  const openPaneMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxTarget({ kind: 'pane' });
    setCtxOpen(true);
  };
  const openNodeMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxTarget({ kind: 'node', nodeId });
    setCtxOpen(true);
  };
  const openEdgeMenu = (e: React.MouseEvent, edgeId: string) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxTarget({ kind: 'edge', edgeId });
    setCtxOpen(true);
  };

  const closeMenu = () => setCtxOpen(false);

  const handleCtxAction = (action: string) => {
    if (action.startsWith('add:')) {
      const type = action.split(':')[1] as NodeKind;
      const panePos = rf?.screenToFlowPosition(ctxPos) ?? { x: 0, y: 0 };
      addNode(type, panePos);
    }
    if (action === 'delete-node' && ctxTarget.kind === 'node') {
      setNodes(nds => nds.filter(n => n.id !== ctxTarget.nodeId));
      setEdges(eds => eds.filter(e => e.source !== ctxTarget.nodeId && e.target !== ctxTarget.nodeId));
    }
    if (action === 'delete-edge' && ctxTarget.kind === 'edge') {
      setEdges(eds => eds.filter(e => e.id !== ctxTarget.edgeId));
    }
    if (action === 'fit-view') {
      rf?.fitView({ padding: 0.2 });
    }
    setCtxOpen(false);
  };

  // Initial demo graph
  useEffect(() => {
    if (nodes.length > 0) return;
    const a = addNode('gradient', { x: 0, y: 0 });
    const b = addNode('perlin', { x: 0, y: 220 });
    const c = addNode('combine', { x: 320, y: 100 });
    const d = addNode('display', { x: 640, y: 80 });
    setEdges([ { id: 'e1', source: a, target: c, targetHandle: 'a', markerEnd: { type: MarkerType.ArrowClosed } }, { id: 'e2', source: b, target: c, targetHandle: 'b', markerEnd: { type: MarkerType.ArrowClosed } }, { id: 'e3', source: c, target: d, targetHandle: 'in', markerEnd: { type: MarkerType.ArrowClosed } } ] as Edge[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onInit={setRf}
        panOnScroll
        panOnDrag
        zoomOnScroll
        fitView
        onPaneContextMenu={openPaneMenu}
        onNodeContextMenu={(e, n) => openNodeMenu(e, n.id)}
        onEdgeContextMenu={(e, ed) => openEdgeMenu(e, ed.id)}
      >
        <Background color="#30405f" gap={18} size={1} />
        <MiniMap zoomable pannable nodeStrokeColor={n => '#7aa2f7'} nodeColor="#1f2a44" maskColor="rgba(5,8,16,0.6)" />
        <Controls position="bottom-right" />

        <Panel position="top-left">
          <div className="panel rounded-lg p-2 flex items-center gap-2">
            <button className="btn" onClick={() => addNode('createImage')}>Create Image</button>
            <button className="btn" onClick={() => addNode('gradient')}>Add Gradient</button>
            <button className="btn" onClick={() => addNode('perlin')}>Perlin Noise</button>
            <button className="btn" onClick={() => addNode('combine')}>Combine</button>
            <button className="btn" onClick={() => addNode('display')}>Display</button>
            <div className="mx-2 h-6 w-px bg-white/10" />
            <button className="btn" onClick={() => rf?.zoomIn?.()}>Zoom In</button>
            <button className="btn" onClick={() => rf?.zoomOut?.()}>Zoom Out</button>
            <button className="btn" onClick={() => rf?.fitView({ padding: 0.2 })}>Fit</button>
            <button className="btn btn-danger" onClick={() => { setNodes([]); setEdges([]); }}>Clear</button>
          </div>
        </Panel>

        {ctxOpen && (
          <div className="context-menu panel rounded-md" style={{ left: ctxPos.x, top: ctxPos.y }} onMouseLeave={closeMenu}>
            <div className="px-3 py-2 text-xs uppercase text-white/60">{ctxTarget.kind === 'pane' ? 'Add Node' : 'Actions'}</div>
            {ctxTarget.kind === 'pane' && (
              <>
                <div className="context-item" onClick={() => handleCtxAction('add:createImage')}>Create Image</div>
                <div className="context-item" onClick={() => handleCtxAction('add:gradient')}>Add Gradient</div>
                <div className="context-item" onClick={() => handleCtxAction('add:perlin')}>Perlin Noise</div>
                <div className="context-item" onClick={() => handleCtxAction('add:combine')}>Combine</div>
                <div className="context-item" onClick={() => handleCtxAction('add:display')}>Display</div>
                <hr className="sep my-1" />
                <div className="context-item" onClick={() => handleCtxAction('fit-view')}>Fit View</div>
              </>
            )}
            {ctxTarget.kind === 'node' && (
              <>
                <div className="context-item text-red-300" onClick={() => handleCtxAction('delete-node')}>Delete Node</div>
              </>
            )}
            {ctxTarget.kind === 'edge' && (
              <>
                <div className="context-item text-red-300" onClick={() => handleCtxAction('delete-edge')}>Delete Connection</div>
              </>
            )}
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
