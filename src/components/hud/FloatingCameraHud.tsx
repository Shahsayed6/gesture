import React, { useRef, useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { cameraVision } from '../../services/cameraVision';
import { Camera, CameraOff, Eye, EyeOff, FlipHorizontal, Minimize2, Maximize2, Zap } from 'lucide-react';

// Hand landmark bone connections for 21 MediaPipe points
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [0, 17],
];

export const FloatingCameraHud: React.FC = () => {
  const { isCameraActive, toggleCamera, activeHands, telemetryStats, settings, updateSettings } = useStudio();
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bind video element when camera active
  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      cameraVision.startCamera(videoRef.current);
    }
  }, [isCameraActive]);

  // Render skeletal landmarks on the canvas HUD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!settings.showSkeletonOverlay || activeHands.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;

    activeHands.forEach((hand) => {
      const isLeft = hand.handedness === 'Left';
      const boneColor = isLeft ? '#818cf8' : '#00f0ff';
      const jointColor = hand.isPinching ? '#f59e0b' : '#ffffff';

      // Draw bones
      ctx.lineWidth = 2;
      ctx.strokeStyle = boneColor;
      ctx.shadowColor = boneColor;
      ctx.shadowBlur = 4;

      HAND_CONNECTIONS.forEach(([i, j]) => {
        const p1 = hand.landmarks[i];
        const p2 = hand.landmarks[j];
        if (!p1 || !p2) return;

        const x1 = settings.mirrorCamera ? (1 - p1.x) * w : p1.x * w;
        const y1 = p1.y * h;
        const x2 = settings.mirrorCamera ? (1 - p2.x) * w : p2.x * w;
        const y2 = p2.y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Draw joint dots
      hand.landmarks.forEach((pt, index) => {
        const x = settings.mirrorCamera ? (1 - pt.x) * w : pt.x * w;
        const y = pt.y * h;

        ctx.beginPath();
        ctx.arc(x, y, index === 8 || index === 4 ? 4 : 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = jointColor;
        ctx.fill();
      });
    });
  }, [activeHands, settings.showSkeletonOverlay, settings.mirrorCamera]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(10, Math.min(window.innerWidth - 260, e.clientX - dragOffset.x)),
          y: Math.max(60, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      className="fixed z-40 select-none shadow-2xl transition-shadow"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '200px' : '260px',
      }}
    >
      <div className="glass-panel-glow rounded-xl overflow-hidden border border-cyan-500/30">
        {/* Drag handle header */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-500/20 cursor-move"
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-xs font-semibold tracking-wide text-slate-200">
              {isCameraActive ? 'VISION ENGINE' : 'CAMERA OFF'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
              title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            >
              {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`p-1 rounded transition-colors ${
                isCameraActive
                  ? 'text-cyan-400 hover:bg-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isCameraActive ? 'Disable Camera' : 'Enable Camera'}
            >
              {isCameraActive ? <Camera size={13} /> : <CameraOff size={13} />}
            </button>
          </div>
        </div>

        {/* Video & Skeleton Viewport */}
        {!isMinimized && (
          <div className="relative w-full h-[160px] bg-black/90 overflow-hidden">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover opacity-60 ${
                    settings.mirrorCamera ? 'scale-x-[-1]' : ''
                  }`}
                />
                <canvas
                  ref={canvasRef}
                  width={260}
                  height={160}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <CameraOff size={28} className="text-slate-500 mb-2" />
                <p className="text-xs text-slate-300 mb-2">Webcam is paused</p>
                <div className="flex gap-2">
                  <button
                    onClick={toggleCamera}
                    className="px-2.5 py-1 rounded bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-colors"
                  >
                    Activate Camera
                  </button>
                  <button
                    onClick={() => cameraVision.enableSimulationMode()}
                    className="px-2 py-1 rounded bg-slate-800 text-cyan-300 text-xs hover:bg-slate-700 transition-colors"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            )}

            {/* HUD Telemetry Overlay */}
            {isCameraActive && (
              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur border border-cyan-500/20">
                <span className="flex items-center gap-1">
                  <Zap size={10} className="text-cyan-400" />
                  {telemetryStats.fps} FPS
                </span>
                <span>{telemetryStats.latencyMs}ms</span>
                <span>{activeHands.length} Hand{activeHands.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}

        {/* HUD Quick Toggles Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 text-xs text-slate-400 border-t border-cyan-500/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateSettings({ mirrorCamera: !settings.mirrorCamera })}
              className={`p-1 rounded hover:text-cyan-300 transition-colors ${
                settings.mirrorCamera ? 'text-cyan-400' : 'text-slate-500'
              }`}
              title="Toggle Mirror View"
            >
              <FlipHorizontal size={13} />
            </button>
            <button
              onClick={() => updateSettings({ showSkeletonOverlay: !settings.showSkeletonOverlay })}
              className={`p-1 rounded hover:text-cyan-300 transition-colors ${
                settings.showSkeletonOverlay ? 'text-cyan-400' : 'text-slate-500'
              }`}
              title="Toggle Skeleton Landmarks"
            >
              {settings.showSkeletonOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {activeHands[0]?.gesture || 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
};
