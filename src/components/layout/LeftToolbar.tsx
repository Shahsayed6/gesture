import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import { ToolType } from '../../types';
import {
  MousePointer2,
  Hand,
  PenTool,
  Paintbrush,
  Sparkles,
  Eraser,
  Circle,
  Square,
  Triangle,
  Star,
  Minus,
  Type,
  Wand2,
} from 'lucide-react';

interface ToolItem {
  id: ToolType;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
}

const TOOLS: ToolItem[] = [
  { id: 'select', label: 'Select (Pinch to Grab)', icon: MousePointer2, shortcut: 'V' },
  { id: 'pan', label: 'Pan Canvas', icon: Hand, shortcut: 'H' },
  { id: 'pen', label: 'Pen (Air Draw)', icon: PenTool, shortcut: 'P' },
  { id: 'brush', label: 'Art Brush', icon: Paintbrush, shortcut: 'B' },
  { id: 'glow-brush', label: 'Neon Airbrush', icon: Sparkles, shortcut: 'G' },
  { id: 'smart-shape', label: 'Smart Shape (Auto-Detect)', icon: Wand2, shortcut: 'S' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'E' },
  { id: 'circle', label: 'Circle Tool', icon: Circle, shortcut: 'O' },
  { id: 'rect', label: 'Rectangle Tool', icon: Square, shortcut: 'R' },
  { id: 'triangle', label: 'Triangle Tool', icon: Triangle, shortcut: 'T' },
  { id: 'star', label: 'Star Tool', icon: Star, shortcut: 'A' },
  { id: 'line', label: 'Line Tool', icon: Minus, shortcut: 'L' },
  { id: 'text', label: 'Text / Air Typing', icon: Type, shortcut: 'X' },
];

const QUICK_COLORS = ['#00f0ff', '#38bdf8', '#818cf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ffffff'];

export const LeftToolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    activeStrokeWidth,
    setActiveStrokeWidth,
    addElement,
    setShowKeyboard,
  } = useStudio();

  const handleToolSelect = (tool: ToolType) => {
    soundEffects.playHover();
    setActiveTool(tool);

    if (tool === 'text') {
      setShowKeyboard(true);
    } else if (['circle', 'rect', 'triangle', 'star', 'line'].includes(tool)) {
      // Quick instantiate shape on click
      addElement({
        type: tool === 'circle' ? 'circle' : tool === 'rect' ? 'rect' : tool === 'triangle' ? 'triangle' : tool === 'star' ? 'star' : 'line',
        x: 400,
        y: 300,
        width: 120,
        height: 120,
        radius: 60,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: activeStrokeWidth,
        rotation: 0,
        opacity: 1,
      });
      setActiveTool('select');
    }
  };

  return (
    <aside className="w-16 border-r border-cyan-500/20 bg-[#070b16]/95 backdrop-blur-md flex flex-col items-center py-3 z-30 select-none">
      {/* Primary Tool Buttons */}
      <div className="flex flex-col gap-1.5 w-full px-2.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 scale-105 font-bold'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-cyan-500/20'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={18} />

              {/* Tooltip on hover */}
              <div className="absolute left-14 px-2.5 py-1 rounded-md bg-slate-900/95 text-slate-200 text-xs font-semibold whitespace-nowrap border border-cyan-500/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                <span>{tool.label}</span>
                {tool.shortcut && <span className="ml-1 text-cyan-400 font-mono">[{tool.shortcut}]</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-cyan-500/20 my-3" />

      {/* Quick Color Swatches */}
      <div className="flex flex-col gap-1.5 items-center w-full px-2">
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                soundEffects.playHover();
                setActiveColor(color);
              }}
              className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                activeColor === color ? 'scale-125 border-white shadow-sm' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width Indicator */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <span className="text-[9px] font-mono text-cyan-400">{activeStrokeWidth}px</span>
        <input
          type="range"
          min="1"
          max="16"
          value={activeStrokeWidth}
          onChange={(e) => setActiveStrokeWidth(parseInt(e.target.value, 10))}
          className="w-10 accent-cyan-400 cursor-pointer h-1"
          title={`Stroke Width: ${activeStrokeWidth}px`}
        />
      </div>
    </aside>
  );
};
