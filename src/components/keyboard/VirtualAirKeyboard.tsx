import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { soundEffects } from '../../services/soundEffects';
import { X, Delete, CornerDownLeft, Space } from 'lucide-react';

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '.', '!'],
];

export const VirtualAirKeyboard: React.FC = () => {
  const {
    showKeyboard,
    setShowKeyboard,
    selectedElementId,
    elements,
    updateElement,
    addElement,
    activeHands,
  } = useStudio();

  const [textBuffer, setTextBuffer] = useState('');
  const [position, setPosition] = useState({ x: 340, y: 460 });
  const [dwellKey, setDwellKey] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  // Sync with selected element if it is text
  useEffect(() => {
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el && el.type === 'text') {
        setTextBuffer(el.text || '');
      }
    }
  }, [selectedElementId, elements]);

  // Touchless pinch / air press detection on keyboard keys
  useEffect(() => {
    if (!showKeyboard || activeHands.length === 0) return;
    const primary = activeHands[0];
    if (primary.isPinching) {
      // Find key under cursor
      const el = document.elementFromPoint(primary.cursor.x, primary.cursor.y);
      const keyVal = el?.getAttribute('data-key');
      if (keyVal) {
        handleKeyPress(keyVal);
      }
    }
  }, [activeHands, showKeyboard]);

  if (!showKeyboard) return null;

  const handleKeyPress = (key: string) => {
    soundEffects.playPinch();
    let newText = textBuffer;

    if (key === 'BACKSPACE') {
      newText = textBuffer.slice(0, -1);
    } else if (key === 'SPACE') {
      newText = textBuffer + ' ';
    } else if (key === 'ENTER') {
      commitText();
      return;
    } else {
      newText = textBuffer + key;
    }

    setTextBuffer(newText);
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el && el.type === 'text') {
        updateElement(selectedElementId, { text: newText });
      }
    }
  };

  const commitText = () => {
    soundEffects.playShapeRecognized();
    if (selectedElementId) {
      updateElement(selectedElementId, { text: textBuffer });
    } else if (textBuffer.trim()) {
      addElement({
        type: 'text',
        x: 400,
        y: 300,
        width: 250,
        height: 40,
        text: textBuffer,
        fontSize: 24,
        fontFamily: 'Space Grotesk',
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        rotation: 0,
        opacity: 1,
      });
    }
    setShowKeyboard(false);
  };

  return (
    <div
      className="fixed z-50 glass-panel-glow rounded-2xl p-4 shadow-2xl border border-cyan-500/30 w-[580px] select-none text-slate-100"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      {/* Header & Display text input */}
      <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-semibold tracking-wider text-cyan-300 font-cyber">
            HOLOGRAPHIC AIR KEYBOARD
          </h3>
        </div>
        <button
          onClick={() => setShowKeyboard(false)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Text Buffer Preview */}
      <div className="w-full bg-black/60 border border-cyan-500/30 rounded-lg p-2.5 mb-3 font-mono text-cyan-200 text-sm flex items-center justify-between min-h-[42px]">
        <span>{textBuffer || <span className="text-slate-500">Pinch or hover over keys to type in the air...</span>}</span>
        <span className="w-1.5 h-4 bg-cyan-400 animate-pulse ml-1" />
      </div>

      {/* Keys Grid */}
      <div className="flex flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="flex justify-center gap-1.5">
            {row.map((k) => (
              <button
                key={k}
                data-key={k}
                onClick={() => handleKeyPress(k)}
                onMouseEnter={() => soundEffects.playHover()}
                className="w-11 h-10 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 active:bg-cyan-500 border border-cyan-500/20 hover:border-cyan-400 text-slate-200 hover:text-cyan-200 active:text-black font-semibold text-sm transition-all duration-100 shadow-sm flex items-center justify-center cursor-pointer"
              >
                {k}
              </button>
            ))}
          </div>
        ))}

        {/* Bottom Action Row */}
        <div className="flex justify-center gap-2 mt-1">
          <button
            data-key="SPACE"
            onClick={() => handleKeyPress('SPACE')}
            className="flex-1 h-10 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-400 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Space size={14} /> SPACE
          </button>
          <button
            data-key="BACKSPACE"
            onClick={() => handleKeyPress('BACKSPACE')}
            className="w-24 h-10 rounded-lg bg-slate-800/80 hover:bg-red-500/20 border border-cyan-500/20 hover:border-red-400 text-slate-200 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Delete size={14} /> BACK
          </button>
          <button
            data-key="ENTER"
            onClick={commitText}
            className="w-28 h-10 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <CornerDownLeft size={14} /> INSERT
          </button>
        </div>
      </div>
    </div>
  );
};
