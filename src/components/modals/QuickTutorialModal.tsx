import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { HelpCircle, X, Hand, MousePointer2, ZoomIn, Mic, Wand2, Box, Sparkles } from 'lucide-react';

export const QuickTutorialModal: React.FC = () => {
  const { showTutorial, setShowTutorial } = useStudio();
  if (!showTutorial) return null;

  const GESTURE_GUIDES = [
    {
      title: 'Point Index Finger',
      action: 'Air Drawing & Laser Pointer',
      icon: MousePointer2,
      desc: 'Point your index finger forward to reveal the cyber pointer. Move your finger in the air to draw on the canvas.',
    },
    {
      title: 'Index + Thumb Pinch',
      action: 'Select, Click & Grab',
      icon: Hand,
      desc: 'Bring thumb and index finger tips together to click buttons or select elements on the canvas.',
    },
    {
      title: 'Hold Pinch & Move',
      action: 'Drag & Transform Object',
      icon: Hand,
      desc: 'Pinch and keep fingers pressed together while moving your hand to drag objects across the infinite canvas.',
    },
    {
      title: 'Open Palm',
      action: 'Pause Drawing / Neutral Hover',
      icon: Hand,
      desc: 'Extend all 5 fingers to pause drawing or hover over UI buttons and the holographic air keyboard.',
    },
    {
      title: 'Closed Fist',
      action: 'Halt / Lock Action',
      icon: Hand,
      desc: 'Close your hand into a fist to stop active strokes or halt canvas panning.',
    },
    {
      title: 'Two Fingers Spread / Pinch',
      action: 'Canvas Zoom In & Out',
      icon: ZoomIn,
      desc: 'Spread index and middle finger apart to zoom in; bring them together to zoom out.',
    },
    {
      title: 'Air Circles & Shapes',
      action: 'Smart Shape Auto-Correction',
      icon: Wand2,
      desc: 'Draw a rough circle, square, or triangle in the air—the geometric engine automatically snaps it to clean vector graphics!',
    },
    {
      title: 'Voice Commands',
      action: 'Touchless Voice Assistant',
      icon: Mic,
      desc: 'Speak: "Create a circle", "Switch to brush", "Change background to black", "Make bigger", "Undo", or "Generate a tech logo".',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel-glow border border-cyan-500/40 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            <div>
              <h3 className="font-cyber font-bold text-sm tracking-wide text-cyan-200">
                TOUCHLESS GESTURE GUIDE
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                "Create Anything. Control Everything. Without Touching Anything."
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowTutorial(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {GESTURE_GUIDES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 hover:border-cyan-400/50 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100">{item.title}</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{item.action}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 mb-5 flex items-center justify-between">
          <span>Tip: You can also use your mouse or trackpad at any time as a secondary input device!</span>
          <button
            onClick={() => setShowTutorial(false)}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Got it, Let's Create
          </button>
        </div>
      </div>
    </div>
  );
};
