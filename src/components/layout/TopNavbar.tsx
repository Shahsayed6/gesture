import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Undo2,
  Redo2,
  Download,
  Sparkles,
  Keyboard,
  Settings,
  HelpCircle,
  Box,
  Layers,
  Hand,
  Sliders,
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const {
    projectName,
    setProjectName,
    isCameraActive,
    toggleCamera,
    isVoiceActive,
    toggleVoice,
    canUndo,
    canRedo,
    undo,
    redo,
    activeMode,
    setActiveMode,
    setShowAiDrawer,
    showAiDrawer,
    setShowKeyboard,
    showKeyboard,
    setShowExportModal,
    setShowGestureTraining,
    setShowSettingsModal,
    setShowTutorial,
  } = useStudio();

  return (
    <header className="h-14 border-b border-cyan-500/20 bg-[#070b16]/95 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Hand size={18} className="text-black font-black" />
          </div>
          <span className="font-cyber font-extrabold text-base tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300">
            NVX GESTURE STUDIO
          </span>
        </div>

        <div className="h-4 w-px bg-cyan-500/20 mx-1" />

        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent hover:bg-slate-900/60 focus:bg-slate-900 border border-transparent hover:border-cyan-500/20 focus:border-cyan-500/40 rounded px-2 py-1 text-xs text-slate-300 font-medium focus:outline-none transition-colors w-48"
        />
      </div>

      {/* Center 2D / 3D Canvas Switcher */}
      <div className="flex items-center bg-slate-900/80 border border-cyan-500/20 rounded-lg p-0.5">
        <button
          onClick={() => {
            soundEffects.playHover();
            setActiveMode('2d');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeMode === '2d'
              ? 'bg-cyan-500 text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={13} />
          2D Vector
        </button>
        <button
          onClick={() => {
            soundEffects.playHover();
            setActiveMode('3d');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            activeMode === '3d'
              ? 'bg-cyan-500 text-black font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box size={13} />
          3D Spatial
        </button>
      </div>

      {/* Action Controls & Sensor Indicators */}
      <div className="flex items-center gap-2">
        {/* Undo & Redo */}
        <div className="flex items-center bg-slate-900/60 border border-cyan-500/20 rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo2 size={15} />
          </button>
        </div>

        {/* Camera Sensor Switch */}
        <button
          onClick={toggleCamera}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isCameraActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
          title={isCameraActive ? 'Turn off Webcam tracking' : 'Turn on Webcam tracking'}
        >
          {isCameraActive ? <Camera size={14} className="text-cyan-400 animate-pulse" /> : <CameraOff size={14} />}
          <span>{isCameraActive ? 'Tracking' : 'Camera'}</span>
        </button>

        {/* Microphone Voice Control Switch */}
        <button
          onClick={toggleVoice}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isVoiceActive
              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-sm shadow-indigo-500/20'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
          title={isVoiceActive ? 'Voice Listening active' : 'Enable Voice Commands'}
        >
          {isVoiceActive ? <Mic size={14} className="text-indigo-400 animate-pulse" /> : <MicOff size={14} />}
          <span>Voice</span>
        </button>

        {/* Air Keyboard */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowKeyboard(!showKeyboard);
          }}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            showKeyboard
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-900/60 border-cyan-500/20 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
          }`}
          title="Toggle Holographic Air Keyboard"
        >
          <Keyboard size={15} />
        </button>

        {/* AI Creative Assistant */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowAiDrawer(!showAiDrawer);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
            showAiDrawer
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-black border-transparent shadow-md'
              : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400'
          }`}
        >
          <Sparkles size={14} />
          AI Studio
        </button>

        {/* Export Center */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowExportModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-colors shadow-md shadow-cyan-500/20 cursor-pointer"
        >
          <Download size={13} />
          Export
        </button>

        {/* Gesture Profiles & Calibration */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowGestureTraining(true);
          }}
          className="p-1.5 rounded-lg bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Gesture Mapping & Calibration"
        >
          <Sliders size={15} />
        </button>

        {/* Privacy & Settings */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowSettingsModal(true);
          }}
          className="p-1.5 rounded-lg bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Privacy & Studio Settings"
        >
          <Settings size={15} />
        </button>

        {/* Quick Tutorial Guide */}
        <button
          onClick={() => {
            soundEffects.playHover();
            setShowTutorial(true);
          }}
          className="p-1.5 rounded-lg bg-slate-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Gesture Controls Guide"
        >
          <HelpCircle size={15} />
        </button>
      </div>
    </header>
  );
};
