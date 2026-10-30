import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import { ShieldCheck, X, Camera, Mic, HardDrive, Trash2, CheckCircle, Volume2, Lock } from 'lucide-react';

export const PrivacySettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    isCameraActive,
    toggleCamera,
    isVoiceActive,
    toggleVoice,
    settings,
    updateSettings,
    clearCanvas,
  } = useStudio();

  if (!showSettingsModal) return null;

  const toggleSound = () => {
    const newVal = !settings.audioFeedbackEnabled;
    updateSettings({ audioFeedbackEnabled: newVal });
    soundEffects.setEnabled(newVal);
    if (newVal) soundEffects.playHover();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel-glow border border-cyan-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-400" />
            <div>
              <h3 className="font-cyber font-bold text-sm tracking-wide text-cyan-200">
                PRIVACY DASHBOARD & SECURITY
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">100% Local-First Computer Vision</span>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Security Assurance Badges */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-xs">
              <Lock size={13} className="text-cyan-400" />
              On-Device Vision
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Camera frames are processed entirely on your machine using MediaPipe WebAssembly. No raw video ever leaves your browser.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
              <ShieldCheck size={13} className="text-indigo-400" />
              Zero Video Storage
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              No webcam recordings or audio tracks are saved or persisted to remote servers. All design telemetry is ephemeral.
            </p>
          </div>
        </div>

        {/* Permissions & Hardware Controls */}
        <div className="flex flex-col gap-3 mb-5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-cyber">
            Hardware Permission Controls
          </label>

          {/* Camera Permission Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isCameraActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                <Camera size={16} />
              </div>
              <div>
                <span className="font-semibold text-xs block text-slate-200">Webcam Tracking</span>
                <span className="text-[10px] text-slate-400">
                  {isCameraActive ? 'Active • Processing frames locally' : 'Disabled • Camera powered off'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleCamera}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isCameraActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-cyan-500 text-black font-bold hover:bg-cyan-400'
              }`}
            >
              {isCameraActive ? 'Shutdown' : 'Enable'}
            </button>
          </div>

          {/* Microphone Permission Row */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isVoiceActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                <Mic size={16} />
              </div>
              <div>
                <span className="font-semibold text-xs block text-slate-200">Microphone Control</span>
                <span className="text-[10px] text-slate-400">
                  {isVoiceActive ? 'Listening for touchless commands' : 'Muted • Speech recognition idle'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleVoice}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isVoiceActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-indigo-600 text-white font-bold hover:bg-indigo-500'
              }`}
            >
              {isVoiceActive ? 'Mute' : 'Enable'}
            </button>
          </div>

          {/* Synthetic Audio Feedback Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-cyan-300">
                <Volume2 size={16} />
              </div>
              <div>
                <span className="font-semibold text-xs block text-slate-200">Synthetic Cyber Audio Feedback</span>
                <span className="text-[10px] text-slate-400">Pinch clicks and shape recognition harmonic chords</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.audioFeedbackEnabled}
              onChange={toggleSound}
              className="accent-cyan-400 cursor-pointer w-4 h-4 rounded"
            />
          </div>
        </div>

        {/* Data Purge */}
        <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Trash2 size={16} className="text-red-400" />
            <div>
              <span className="text-xs font-semibold text-red-200 block">Purge Project & Elements</span>
              <span className="text-[10px] text-slate-400">Clears current vector objects from browser state</span>
            </div>
          </div>
          <button
            onClick={() => {
              clearCanvas();
              setShowSettingsModal(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>

        <button
          onClick={() => setShowSettingsModal(false)}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer"
        >
          Close Dashboard
        </button>
      </div>
    </div>
  );
};
