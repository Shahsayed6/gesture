import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import { Sliders, X, Check, Target, Hand, Sparkles } from 'lucide-react';

export const GestureTrainingModal: React.FC = () => {
  const {
    showGestureTraining,
    setShowGestureTraining,
    settings,
    updateSettings,
    activeHands,
  } = useStudio();

  const [activeProfile, setActiveProfile] = useState<'beginner' | 'standard' | 'advanced'>('standard');
  const [testedGestures, setTestedGestures] = useState<Record<string, boolean>>({});

  if (!showGestureTraining) return null;

  const primaryHand = activeHands[0];
  const currentGesture = primaryHand?.gesture || 'IDLE';

  // Mark gesture as verified when detected
  if (primaryHand && !testedGestures[currentGesture] && currentGesture !== 'IDLE') {
    setTestedGestures((prev) => ({ ...prev, [currentGesture]: true }));
    soundEffects.playShapeRecognized();
  }

  const applyProfile = (profile: 'beginner' | 'standard' | 'advanced') => {
    setActiveProfile(profile);
    soundEffects.playHover();
    if (profile === 'beginner') {
      updateSettings({
        sensitivity: 1.0,
        smoothing: 0.75,
        smartShapeThreshold: 0.65,
        cursorSpeed: 1.0,
      });
    } else if (profile === 'standard') {
      updateSettings({
        sensitivity: 1.2,
        smoothing: 0.65,
        smartShapeThreshold: 0.75,
        cursorSpeed: 1.3,
      });
    } else if (profile === 'advanced') {
      updateSettings({
        sensitivity: 1.5,
        smoothing: 0.45,
        smartShapeThreshold: 0.85,
        cursorSpeed: 1.6,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel-glow border border-cyan-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-cyan-400" />
            <h3 className="font-cyber font-bold text-sm tracking-wide text-cyan-200">
              GESTURE CALIBRATION & TRAINING
            </h3>
          </div>
          <button
            onClick={() => setShowGestureTraining(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Built-in Profiles */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-cyber">
            Pre-Calibrated Gesture Profiles
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'beginner', title: 'Beginner', desc: 'Heavy smoothing, forgiving pinch' },
              { id: 'standard', title: 'Standard', desc: 'Balanced response, studio default' },
              { id: 'advanced', title: 'Advanced', desc: 'Low latency, fast air-drawing' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyProfile(p.id as any)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  activeProfile === p.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs">{p.title}</span>
                <span className="text-[9px] text-slate-500 leading-tight">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Gesture Practice Arena */}
        <div className="mb-5 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-300 font-cyber flex items-center gap-1.5">
              <Target size={14} className="text-cyan-400" />
              LIVE GESTURE DETECTOR
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              CURRENT: {currentGesture}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'POINTING', label: 'Index Point (Draw)' },
              { id: 'PINCH', label: 'Index+Thumb Pinch (Click)' },
              { id: 'OPEN_PALM', label: 'Open Palm (Pause)' },
              { id: 'CLOSED_FIST', label: 'Closed Fist (Stop)' },
              { id: 'ZOOM_IN', label: 'Two Fingers (Zoom)' },
            ].map((g) => {
              const isMatch = currentGesture === g.id;
              const hasPassed = testedGestures[g.id];
              return (
                <div
                  key={g.id}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-colors ${
                    isMatch
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                      : hasPassed
                      ? 'bg-slate-900/80 border-cyan-500/30 text-slate-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{g.label}</span>
                  {hasPassed ? (
                    <Check size={14} className="text-cyan-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fine-Tuning Calibration Sliders */}
        <div className="flex flex-col gap-4 mb-5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-cyber">
            Sensitivity & Filter Controls
          </label>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Tracking Sensitivity</span>
              <span>{settings.sensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) => updateSettings({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Jitter Smoothing (Exponential Filter)</span>
              <span>{Math.round(settings.smoothing * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.smoothing}
              onChange={(e) => updateSettings({ smoothing: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
              <span>Smart Shape Auto-Correction Threshold</span>
              <span>{Math.round(settings.smartShapeThreshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.smartShapeThreshold}
              onChange={(e) => updateSettings({ smartShapeThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1"
            />
          </div>
        </div>

        <button
          onClick={() => setShowGestureTraining(false)}
          className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors cursor-pointer"
        >
          Save & Return to Studio
        </button>
      </div>
    </div>
  );
};
