
import React, { useState, useEffect, useRef } from 'react';
import { MindmapData, MindmapNode } from '../types';
import { generateMindmap } from '../services/geminiService';
import { useTheme } from './ThemeContext';
import { TiltCard } from './TiltCard';
import { Wand2, Loader2, ZoomIn, ZoomOut, Move, Share2, Download, AlertCircle } from 'lucide-react';

export const MindMapTool: React.FC = () => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MindmapData | null>(null);
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Advanced Tree Layout Algorithm (Optimized to avoid overlap)
  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    const width = 1200; // Virtual canvas width
    const height = 900;
    const centerX = width / 2;
    const centerY = height / 2;

    const newNodes = [...data.nodes];
    const edges = data.edges;

    // Identify Root
    const root = newNodes.find(n => n.type === 'root') || newNodes[0];
    if (root) {
        root.x = centerX;
        root.y = centerY;
        // Default styling
        if(!root.backgroundColor) root.backgroundColor = '#ec4899'; // Pink-500
        if(!root.shape) root.shape = 'rect';
        if(!root.textColor) root.textColor = 'text-white';
    }

    // Identify Levels
    const branches = newNodes.filter(n => n.type === 'branch');
    const leaves = newNodes.filter(n => n.type === 'leaf');

    // Helper to get children of a node
    const getChildren = (parentId: string) => {
        return newNodes.filter(n => edges.some(e => e.source === parentId && e.target === n.id));
    };

    // --- Layout Strategy: Radial Tree ---
    // 1. Distribute Branches evenly in a circle around Root
    const branchCount = branches.length;
    const branchRadius = 250; // Distance from root
    
    branches.forEach((branch, i) => {
        // Calculate angle: distribute evenly 360 degrees
        // Start from -90deg (top) for better aesthetics
        const angle = (i / branchCount) * 2 * Math.PI - (Math.PI / 2);
        
        branch.x = centerX + Math.cos(angle) * branchRadius;
        branch.y = centerY + Math.sin(angle) * branchRadius;
        
        // Auto style
        if(!branch.backgroundColor) branch.backgroundColor = '#3b82f6'; // Blue-500
        if(!branch.shape) branch.shape = 'rounded';
        
        // 2. Layout Leaves for each Branch
        const myLeaves = getChildren(branch.id);
        if (myLeaves.length > 0) {
            // Fan out leaves in a semi-circle pointing away from root
            // The main direction is the same angle as the branch relative to root
            const leafDistance = 150;
            const spreadAngle = Math.PI / 2; // 90 degrees spread
            const startLeafAngle = angle - (spreadAngle / 2);
            const stepAngle = spreadAngle / (myLeaves.length > 1 ? myLeaves.length - 1 : 1);

            myLeaves.forEach((leaf, j) => {
                // If only 1 leaf, place it directly outward
                const currentLeafAngle = myLeaves.length === 1 
                    ? angle 
                    : startLeafAngle + (stepAngle * j);

                leaf.x = (branch.x || 0) + Math.cos(currentLeafAngle) * leafDistance;
                leaf.y = (branch.y || 0) + Math.sin(currentLeafAngle) * leafDistance;

                // Auto style
                if(!leaf.backgroundColor) leaf.backgroundColor = '#10b981'; // Emerald-500
                if(!leaf.shape) leaf.shape = 'circle';
                if(!leaf.textColor) leaf.textColor = 'text-slate-800'; // Darker text for lighter leaves usually
                if(leaf.type === 'leaf') leaf.textColor = 'text-white'; // Override back
            });
        }
    });

    // Handle any orphaned nodes (just in case)
    const processedIds = new Set([root.id, ...branches.map(n => n.id), ...leaves.map(n => n.id)]);
    const orphans = newNodes.filter(n => !processedIds.has(n.id));
    orphans.forEach((node, i) => {
        node.x = 50;
        node.y = 50 + (i * 60);
        node.backgroundColor = '#94a3b8';
    });

    setData({ ...data, nodes: newNodes });
    // Reset view to center but zoomed out slightly
    setPan({ x: -200, y: -150 }); // Adjust based on canvas size vs screen
    setScale(0.6); 

  }, [data?.nodes.length]); // Re-run only when node count changes

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const result = await generateMindmap(input);
    if (result) {
        setData(result);
    } else {
        alert("Không thể tạo sơ đồ. Vui lòng thử lại với nội dung rõ ràng hơn.");
    }
    setLoading(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 3);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const renderNodeShape = (node: MindmapNode) => {
      // Dynamic size based on text length roughly
      const labelLength = node.label.length;
      const baseWidth = Math.max(100, labelLength * 8); 
      const baseHeight = 50;
      
      const width = node.type === 'root' ? baseWidth * 1.2 : node.type === 'branch' ? baseWidth : baseWidth * 0.8;
      const height = node.type === 'root' ? baseHeight * 1.2 : node.type === 'branch' ? baseHeight : baseHeight * 0.8;
      
      const fontSize = node.type === 'root' ? '16px' : node.type === 'branch' ? '14px' : '12px';
      
      let shapeElement;
      if (node.shape === 'rect') {
          shapeElement = <rect x={-width/2} y={-height/2} width={width} height={height} rx={4} fill={node.backgroundColor} stroke={node.borderColor || 'white'} strokeWidth="2" />;
      } else if (node.shape === 'rounded') {
          shapeElement = <rect x={-width/2} y={-height/2} width={width} height={height} rx={height/2} fill={node.backgroundColor} stroke={node.borderColor || 'white'} strokeWidth="2" />;
      } else {
          // Circle/Oval - using ellipse to accommodate text
          shapeElement = <ellipse rx={width/2} ry={height/2} fill={node.backgroundColor} stroke={node.borderColor || 'white'} strokeWidth="2" />;
      }

      return (
          <g transform={`translate(${node.x},${node.y})`} className="cursor-pointer hover:opacity-90 transition-opacity hover:scale-105 duration-200">
              {shapeElement}
              <foreignObject x={-width/2} y={-height/2} width={width} height={height} style={{ pointerEvents: 'none' }}>
                  <div className={`w-full h-full flex items-center justify-center text-center leading-tight p-2 font-bold ${node.textColor || 'text-white'} select-none`} style={{ fontSize }}>
                      {node.label}
                  </div>
              </foreignObject>
          </g>
      );
  };

  return (
    <div className="animate-fade-in pb-20 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className={`text-3xl font-bold ${theme.text} flex items-center gap-2`}>
                🧠 Sơ Đồ Tư Duy AI
            </h2>
            <p className="text-slate-500">Biến ý tưởng thành sơ đồ trực quan với Gemini Pro.</p>
        </div>
      </div>

      <TiltCard className={`flex-1 flex flex-col border rounded-[2.5rem] overflow-hidden shadow-xl ${theme.isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/40'}`}>
         
         {/* Input Toolbar */}
         <div className="p-4 border-b border-white/20 flex flex-col md:flex-row gap-4 bg-white/20 backdrop-blur-md z-10">
            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="Nhập chủ đề (VD: Chiến lược ôn thi Toán 9+)..."
                className={`flex-1 p-3 rounded-xl border outline-none text-sm ${theme.isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
            />
            <button 
                onClick={handleGenerate}
                disabled={loading || !input.trim()}
                className={`btn-hover px-6 py-3 rounded-xl font-bold text-white shadow-md flex items-center gap-2 bg-gradient-to-r ${theme.primary} disabled:opacity-50`}
            >
                {loading ? <Loader2 className="animate-spin"/> : <Wand2 size={18}/>}
                Tạo Sơ Đồ
            </button>
         </div>

         {/* Canvas Area */}
         <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-grid-pattern cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
         >
            {!data && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-4 pointer-events-none select-none">
                    <Share2 size={64} className="opacity-20"/>
                    <p className="text-lg font-medium">Nhập nội dung để AI vẽ sơ đồ tư duy cho bạn</p>
                    <div className="flex gap-2 text-xs opacity-60">
                        <span className="bg-white/50 px-2 py-1 rounded">Hình khối</span>
                        <span className="bg-white/50 px-2 py-1 rounded">Màu sắc</span>
                        <span className="bg-white/50 px-2 py-1 rounded">Tự động dàn trang</span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-20">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 animate-pop-in">
                        <Loader2 size={48} className="text-pink-500 animate-spin"/>
                        <p className="font-bold text-slate-700">Đang phân tích & vẽ sơ đồ...</p>
                    </div>
                </div>
            )}

            {data && (
                <svg 
                    className="w-full h-full pointer-events-none" // Interaction handled by parent div
                    viewBox={`0 0 1200 900`} // Larger viewBox matching virtual width
                >
                    {/* Definitions for markers (arrows) */}
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill={theme.isDark ? '#94a3b8' : '#cbd5e1'} />
                        </marker>
                    </defs>

                    <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                        {/* Edges */}
                        {data.edges.map(edge => {
                            const source = data.nodes.find(n => n.id === edge.source);
                            const target = data.nodes.find(n => n.id === edge.target);
                            if (!source || !target || source.x === undefined || target.x === undefined) return null;
                            
                            return (
                                <g key={edge.id}>
                                    <line 
                                        x1={source.x} y1={source.y}
                                        x2={target.x} y2={target.y}
                                        stroke={theme.isDark ? '#475569' : '#cbd5e1'}
                                        strokeWidth="2"
                                        markerEnd="url(#arrow)"
                                    />
                                    {edge.label && (
                                        <foreignObject 
                                            x={(source.x + target.x) / 2 - 30} 
                                            y={(source.y + target.y) / 2 - 10} 
                                            width="60" 
                                            height="20"
                                        >
                                            <div className="bg-white/80 rounded px-1 text-[10px] text-center text-slate-500 border border-slate-200">
                                                {edge.label}
                                            </div>
                                        </foreignObject>
                                    )}
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {data.nodes.map(node => (
                            node.x !== undefined && renderNodeShape(node)
                        ))}
                    </g>
                </svg>
            )}

            {/* Controls Overlay */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button onClick={() => setScale(s => s + 0.1)} className="p-3 bg-white rounded-full shadow-lg text-slate-600 hover:text-blue-500 transition-colors tooltip" title="Phóng to"><ZoomIn size={20}/></button>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-3 bg-white rounded-full shadow-lg text-slate-600 hover:text-blue-500 transition-colors tooltip" title="Thu nhỏ"><ZoomOut size={20}/></button>
                <button onClick={() => { setPan({x: -200, y: -150}); setScale(0.6); }} className="p-3 bg-white rounded-full shadow-lg text-slate-600 hover:text-blue-500 transition-colors tooltip" title="Căn giữa"><Move size={20}/></button>
            </div>
         </div>
      </TiltCard>
    </div>
  );
};
