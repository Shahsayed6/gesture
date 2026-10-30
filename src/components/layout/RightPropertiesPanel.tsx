import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import {
  SlidersHorizontal,
  Layers,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Grid,
} from 'lucide-react';

export const RightPropertiesPanel: React.FC = () => {
  const {
    selectedElementId,
    elements,
    updateElement,
    deleteSelectedElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    layers,
    backgroundType,
    setBackgroundType,
    backgroundColor,
    setBackgroundColor,
  } = useStudio();

  const selected = elements.find((el) => el.id === selectedElementId);

  return (
    <aside className="w-72 border-l border-cyan-500/20 bg-[#070b16]/95 backdrop-blur-md flex flex-col z-30 select-none text-slate-100 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/20 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-cyan-400" />
          <h3 className="text-xs font-bold tracking-wider text-cyan-300 font-cyber">
            {selected ? 'ELEMENT PROPERTIES' : 'CANVAS SETTINGS'}
          </h3>
        </div>
        {selected && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {selected.type.toUpperCase()}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4 text-xs">
        {selected ? (
          <>
            {/* Dimensions & Position */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
                Transform & Bounds
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">X POS</label>
                  <input
                    type="number"
                    value={Math.round(selected.x)}
                    onChange={(e) => updateElement(selected.id, { x: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-cyan-500/20 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">Y POS</label>
                  <input
                    type="number"
                    value={Math.round(selected.y)}
                    onChange={(e) => updateElement(selected.id, { y: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-cyan-500/20 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">WIDTH</label>
                  <input
                    type="number"
                    value={Math.round(selected.width || 0)}
                    onChange={(e) => updateElement(selected.id, { width: parseFloat(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-cyan-500/20 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5 font-mono">HEIGHT</label>
                  <input
                    type="number"
                    value={Math.round(selected.height || 0)}
                    onChange={(e) => updateElement(selected.id, { height: parseFloat(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-cyan-500/20 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Rotation slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                <span>ROTATION</span>
                <span>{Math.round(selected.rotation || 0)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={Math.round(selected.rotation || 0)}
                onChange={(e) => updateElement(selected.id, { rotation: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer h-1"
              />
            </div>

            {/* Fill & Stroke */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
                Styling & Colors
              </span>
              <div className="flex flex-col gap-2.5">
                {/* Stroke Color */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stroke</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selected.stroke && selected.stroke !== 'none' ? selected.stroke : '#00f0ff'}
                      onChange={(e) => updateElement(selected.id, { stroke: e.target.value })}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-slate-300">{selected.stroke}</span>
                  </div>
                </div>

                {/* Fill Color */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fill</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateElement(selected.id, { fill: 'transparent' })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                        selected.fill === 'transparent'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      None
                    </button>
                    <input
                      type="color"
                      value={selected.fill && selected.fill !== 'transparent' ? selected.fill : '#0f172a'}
                      onChange={(e) => updateElement(selected.id, { fill: e.target.value })}
                      className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                {/* Stroke Width */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                    <span>STROKE THICKNESS</span>
                    <span>{selected.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={selected.strokeWidth || 1}
                    onChange={(e) => updateElement(selected.id, { strokeWidth: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                    <span>OPACITY</span>
                    <span>{Math.round((selected.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((selected.opacity ?? 1) * 100)}
                    onChange={(e) => updateElement(selected.id, { opacity: parseInt(e.target.value, 10) / 100 })}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>

                {/* Cyber Glow Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-cyan-400" />
                    Neon Hologram Glow
                  </span>
                  <input
                    type="checkbox"
                    checked={!!selected.glow}
                    onChange={(e) => updateElement(selected.id, { glow: e.target.checked })}
                    className="accent-cyan-400 cursor-pointer w-4 h-4 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Ordering & Actions */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
                Actions & Ordering
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => bringToFront(selected.id)}
                  className="py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowUp size={12} /> Front
                </button>
                <button
                  onClick={() => sendToBack(selected.id)}
                  className="py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowDown size={12} /> Back
                </button>
                <button
                  onClick={() => duplicateElement(selected.id)}
                  className="py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={deleteSelectedElement}
                  className="py-1.5 px-2 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Canvas & Background Settings */
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
                Canvas Backdrop
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'dark-grid', label: 'Dark Grid' },
                  { id: 'neon-grid', label: 'Neon Dense' },
                  { id: 'black', label: 'Pure Black' },
                  { id: 'white', label: 'Studio White' },
                  { id: 'transparent', label: 'Transparent' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      soundEffects.playHover();
                      setBackgroundType(bg.id as any);
                    }}
                    className={`py-1.5 px-2 rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                      backgroundType === bg.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Grid size={12} />
                    <span>{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
                Studio Color Base
              </span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400">Custom Hex</span>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vector Layers Shelf */}
        <div className="mt-auto border-t border-cyan-500/20 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-cyber flex items-center gap-1.5">
              <Layers size={13} className="text-cyan-400" />
              Vector Layers ({elements.length} Elements)
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800 hover:border-cyan-500/20 text-slate-300"
              >
                <span className="font-mono text-xs">{layer.name}</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <button className="hover:text-cyan-300 p-0.5">
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button className="hover:text-cyan-300 p-0.5">
                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
