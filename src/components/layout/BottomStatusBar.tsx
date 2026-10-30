import React from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Activity,
  Zap,
  Hand,
  Volume2,
  Sliders,
} from 'lucide-react';

export const BottomStatusBar: React.FC = () => {
  const {
    activeTool,
    zoom,
    setZoom,
    fitToScreen,
    activeHands,
    telemetryStats,
    lastGestureName,
    voiceTranscript,
    isVoiceActive,
  } = useStudio();

  const primaryHand = activeHands[0];
  const cursorCoords = primaryHand
    ? `${Math.round(primaryHand.cursor.x)}, ${Math.round(primaryHand.cursor.y)}`
    : '0, 0';

  return (
    <footer className="h-9 border-t border-cyan-500/20 bg-[#070b16]/95 backdrop-blur-md px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 z-30 select-none">
      {/* Left: Active Tool & Coordinates */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>TOOL: {activeTool}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-500">POS:</span>
          <span className="text-slate-300">{cursorCoords}</span>
        </div>
      </div>

      {/* Center: Live Gesture Status & Voice HUD */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-cyan-500/20">
          <Hand size={12} className={activeHands.length > 0 ? 'text-cyan-400' : 'text-slate-500'} />
          <span className="text-slate-200 font-bold">
            {lastGestureName || 'Awaiting Gesture'}
          </span>
        </div>

        {isVoiceActive && voiceTranscript && (
          <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded max-w-xs truncate">
            <Volume2 size={11} className="animate-pulse" />
            <span className="truncate">"{voiceTranscript}"</span>
          </div>
        )}
      </div>

      {/* Right: Telemetry & Zoom Navigator */}
      <div className="flex items-center gap-3">
        {/* Performance metrics */}
        <div className="flex items-center gap-2 text-slate-400">
          <span className="flex items-center gap-1">
            <Activity size={12} className="text-cyan-400" />
            {telemetryStats.fps} FPS
          </span>
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-cyan-400" />
            {telemetryStats.latencyMs}ms
          </span>
          <span>
            CONF: {primaryHand ? `${Math.round(primaryHand.score * 100)}%` : '98%'}
          </span>
        </div>

        <div className="h-3 w-px bg-cyan-500/20" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={fitToScreen}
            className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer font-bold"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.1))}
            className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={fitToScreen}
            className="p-1 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <Maximize size={12} />
          </button>
        </div>
      </div>
    </footer>
  );
};
