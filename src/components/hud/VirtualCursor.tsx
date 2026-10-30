import React, { useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { cameraVision } from '../../services/cameraVision';

export const VirtualCursor: React.FC = () => {
  const { activeHands, isCameraActive } = useStudio();
  const [mouseSimPos, setMouseSimPos] = useState<{ x: number; y: number } | null>(null);

  // If camera is simulating or user moves mouse, track mouse coordinates
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseSimPos({ x: e.clientX, y: e.clientY });
      if (cameraVision.isSimulating()) {
        cameraVision.triggerSimulatedAction({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Determine what hands/cursors to render
  const handsToRender = activeHands.length > 0 ? activeHands : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {handsToRender ? (
        handsToRender.map((hand, idx) => {
          const isLeft = hand.handedness === 'Left';
          const colorClass = isLeft ? 'border-indigo-400 text-indigo-400' : 'border-cyan-400 text-cyan-400';
          const glowColor = isLeft ? 'rgba(129, 140, 248, 0.4)' : 'rgba(0, 240, 255, 0.5)';

          return (
            <div
              key={`hand-cursor-${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out will-change-transform"
              style={{
                left: `${hand.cursor.x}px`,
                top: `${hand.cursor.y}px`,
              }}
            >
              {/* Outer reticle ring */}
              <div
                className={`relative flex items-center justify-center rounded-full border-2 ${colorClass} transition-all duration-150`}
                style={{
                  width: hand.isPinching ? '28px' : '44px',
                  height: hand.isPinching ? '28px' : '44px',
                  boxShadow: `0 0 20px ${glowColor}`,
                  transform: `rotate(${hand.rotationAngle || 0}deg)`,
                }}
              >
                {/* Center dot / pinch indicator */}
                <div
                  className={`rounded-full transition-all duration-150 ${
                    hand.isPinching ? 'w-3 h-3 bg-cyan-300' : 'w-1.5 h-1.5 bg-white'
                  }`}
                />

                {/* Crosshairs */}
                <div className="absolute -top-1 w-0.5 h-2 bg-cyan-400" />
                <div className="absolute -bottom-1 w-0.5 h-2 bg-cyan-400" />
                <div className="absolute -left-1 h-0.5 w-2 bg-cyan-400" />
                <div className="absolute -right-1 h-0.5 w-2 bg-cyan-400" />
              </div>

              {/* Hand label and gesture badge */}
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-cyan-500/30 text-[10px] font-mono whitespace-nowrap text-cyan-200"
                style={{
                  boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                <span className="font-bold text-white">{hand.handedness[0]}:</span>
                <span>{hand.gesture}</span>
                {hand.isPinching && <span className="text-amber-400 font-bold">PINCH</span>}
              </div>
            </div>
          );
        })
      ) : (
        // When camera is inactive but user moves pointer, show a cyber indicator
        mouseSimPos && !isCameraActive && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 opacity-70 transition-opacity"
            style={{
              left: `${mouseSimPos.x}px`,
              top: `${mouseSimPos.y}px`,
            }}
          >
            <div className="w-6 h-6 rounded-full border border-cyan-400/40 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-cyan-400" />
            </div>
          </div>
        )
      )}
    </div>
  );
};
