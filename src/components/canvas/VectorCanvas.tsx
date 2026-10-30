import React, { useRef, useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { CanvasElement, Point2D } from '../../types';

export const VectorCanvas: React.FC = () => {
  const {
    elements,
    selectedElementId,
    activeTool,
    backgroundColor,
    backgroundType,
    zoom,
    pan,
    isDrawing,
    currentStrokePoints,
    activeColor,
    activeStrokeWidth,
    setSelectedElementId,
    setPan,
    updateElement,
    handleStrokePoint,
    handleCanvasClickAt,
  } = useStudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseDraggingCanvas, setIsMouseDraggingCanvas] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point2D>({ x: 0, y: 0 });
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [elementDragOffset, setElementDragOffset] = useState<Point2D>({ x: 0, y: 0 });

  // Handle wheel for zoom and pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).setStudioZoom?.((z: number) => Math.min(4, Math.max(0.2, z + zoomDelta)));
      } else {
        // Pan
        setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setPan]);

  // Pointer down handler on canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || activeTool === 'pan') {
      // Middle click or Pan tool
      setIsMouseDraggingCanvas(true);
      setDragStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (activeTool === 'pen' || activeTool === 'brush' || activeTool === 'glow-brush' || activeTool === 'smart-shape') {
      handleStrokePoint({ x: e.clientX, y: e.clientY }, false);
    } else if (activeTool === 'select') {
      handleCanvasClickAt({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isMouseDraggingCanvas) {
      setPan({ x: e.clientX - dragStartPos.x, y: e.clientY - dragStartPos.y });
      return;
    }

    if (isDrawing) {
      handleStrokePoint({ x: e.clientX, y: e.clientY }, false);
      return;
    }

    if (draggingElementId) {
      // Dragging selected element on canvas
      const canvasX = (e.clientX - pan.x) / zoom;
      const canvasY = (e.clientY - pan.y) / zoom;
      updateElement(draggingElementId, {
        x: Math.round(canvasX - elementDragOffset.x),
        y: Math.round(canvasY - elementDragOffset.y),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isMouseDraggingCanvas) {
      setIsMouseDraggingCanvas(false);
    }
    if (isDrawing) {
      handleStrokePoint({ x: e.clientX, y: e.clientY }, true);
    }
    if (draggingElementId) {
      setDraggingElementId(null);
    }
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Background CSS pattern
  const getBackgroundClass = () => {
    switch (backgroundType) {
      case 'dark-grid':
        return 'bg-cyber-grid bg-[#070b16]';
      case 'neon-grid':
        return 'bg-cyber-grid-dense bg-[#050811]';
      case 'black':
        return 'bg-black';
      case 'white':
        return 'bg-white text-slate-900';
      case 'transparent':
        return 'bg-[#090e1c]';
      default:
        return 'bg-[#070b16]';
    }
  };

  // Render individual vector SVG element
  const renderElement = (el: CanvasElement) => {
    if (el.visible === false) return null;
    const isSelected = el.id === selectedElementId;

    const commonProps = {
      fill: el.fill,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity ?? 1,
      transform: `rotate(${el.rotation || 0} ${el.x} ${el.y})`,
      style: {
        filter: el.glow || isSelected ? 'drop-shadow(0 0 8px #00f0ff88)' : undefined,
        cursor: activeTool === 'select' ? 'move' : 'crosshair',
      },
      onPointerDown: (e: React.PointerEvent) => {
        if (activeTool === 'select') {
          e.stopPropagation();
          setSelectedElementId(el.id);
          setDraggingElementId(el.id);
          const canvasX = (e.clientX - pan.x) / zoom;
          const canvasY = (e.clientY - pan.y) / zoom;
          setElementDragOffset({ x: canvasX - el.x, y: canvasY - el.y });
        }
      },
    };

    switch (el.type) {
      case 'circle': {
        const r = el.radius || (el.width ? el.width / 2 : 40);
        return <circle key={el.id} cx={el.x} cy={el.y} r={r} {...commonProps} />;
      }
      case 'rect': {
        const w = el.width || 80;
        const h = el.height || 60;
        return (
          <rect
            key={el.id}
            x={el.x - w / 2}
            y={el.y - h / 2}
            width={w}
            height={h}
            rx={8}
            {...commonProps}
          />
        );
      }
      case 'triangle': {
        const w = el.width || 80;
        const h = el.height || 80;
        const pts = `${el.x},${el.y - h / 2} ${el.x + w / 2},${el.y + h / 2} ${el.x - w / 2},${el.y + h / 2}`;
        return <polygon key={el.id} points={pts} {...commonProps} />;
      }
      case 'star': {
        const points = 5;
        const outerR = (el.width || 80) / 2;
        const innerR = outerR * 0.45;
        let pathStr = '';
        for (let i = 0; i < points * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / points - Math.PI / 2;
          const px = el.x + r * Math.cos(angle);
          const py = el.y + r * Math.sin(angle);
          pathStr += `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)} `;
        }
        pathStr += 'Z';
        return <path key={el.id} d={pathStr} {...commonProps} />;
      }
      case 'line': {
        const w = el.width || 120;
        return (
          <line
            key={el.id}
            x1={el.x - w / 2}
            y1={el.y}
            x2={el.x + w / 2}
            y2={el.y}
            {...commonProps}
          />
        );
      }
      case 'text': {
        return (
          <text
            key={el.id}
            x={el.x}
            y={el.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={el.fontSize || 20}
            fontFamily={el.fontFamily || 'Space Grotesk'}
            fontWeight={el.fontWeight || '600'}
            fill={el.fill === 'transparent' ? '#ffffff' : el.fill}
            stroke={el.stroke === 'none' ? undefined : el.stroke}
            strokeWidth={el.strokeWidth || 0}
            opacity={el.opacity ?? 1}
            transform={`rotate(${el.rotation || 0} ${el.x} ${el.y})`}
            style={{
              userSelect: 'none',
              filter: isSelected ? 'drop-shadow(0 0 6px #00f0ff)' : undefined,
              cursor: activeTool === 'select' ? 'move' : 'text',
            }}
            onPointerDown={(e) => {
              if (activeTool === 'select') {
                e.stopPropagation();
                setSelectedElementId(el.id);
                setDraggingElementId(el.id);
                const canvasX = (e.clientX - pan.x) / zoom;
                const canvasY = (e.clientY - pan.y) / zoom;
                setElementDragOffset({ x: canvasX - el.x, y: canvasY - el.y });
              }
            }}
          >
            {el.text || 'Text Object'}
          </text>
        );
      }
      case 'path': {
        let d = el.d;
        if (!d && el.points && el.points.length > 0) {
          d = el.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        }
        return <path key={el.id} d={d} {...commonProps} fill="transparent" />;
      }
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="vector-canvas-viewport"
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair ${getBackgroundClass()}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ backgroundColor: backgroundType === 'dark-grid' ? backgroundColor : undefined }}
    >
      {/* SVG Canvas Root with Pan and Zoom Transform */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="cyber-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Render all stored vector elements */}
        {elements.map((el) => renderElement(el))}

        {/* Active Real-Time Air Drawing Stroke Preview */}
        {isDrawing && currentStrokePoints.length > 1 && (
          <path
            d={currentStrokePoints
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ')}
            fill="none"
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 8px #00f0ff)',
            }}
          />
        )}

        {/* Selected Element Transform Bounding Box */}
        {selectedElement && activeTool === 'select' && (
          <g>
            <rect
              x={selectedElement.x - (selectedElement.width || 80) / 2 - 8}
              y={selectedElement.y - (selectedElement.height || 60) / 2 - 8}
              width={(selectedElement.width || 80) + 16}
              height={(selectedElement.height || 60) + 16}
              fill="none"
              stroke="#00f0ff"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            {/* Corner transform dots */}
            {[-1, 1].map((dx) =>
              [-1, 1].map((dy) => (
                <rect
                  key={`${dx}-${dy}`}
                  x={selectedElement.x + (dx * (selectedElement.width || 80)) / 2 - 4}
                  y={selectedElement.y + (dy * (selectedElement.height || 60)) / 2 - 4}
                  width={8}
                  height={8}
                  fill="#00f0ff"
                  stroke="#080d1a"
                  strokeWidth={1.5}
                />
              ))
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
