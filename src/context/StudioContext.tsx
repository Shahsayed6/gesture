import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  CanvasElement,
  HandTelemetry,
  Layer,
  Point2D,
  StudioSettings,
  ToolType,
  VoiceCommandRecord,
} from '../types';
import { cameraVision } from '../services/cameraVision';
import { voiceControl } from '../services/voiceControl';
import { soundEffects } from '../services/soundEffects';
import { recognizeDrawnShape } from '../utils/shapeRecognizer';

interface StudioContextType {
  elements: CanvasElement[];
  selectedElementId: string | null;
  activeTool: ToolType;
  layers: Layer[];
  activeLayerId: string;
  backgroundColor: string;
  backgroundType: 'dark-grid' | 'black' | 'white' | 'transparent' | 'neon-grid';
  zoom: number;
  pan: { x: number; y: number };
  activeHands: HandTelemetry[];
  telemetryStats: { fps: number; latencyMs: number };
  activeColor: string;
  activeStrokeWidth: number;
  activeFill: string;
  isDrawing: boolean;
  currentStrokePoints: Point2D[];
  settings: StudioSettings;
  isCameraActive: boolean;
  isVoiceActive: boolean;
  activeMode: '2d' | '3d';
  showAiDrawer: boolean;
  showKeyboard: boolean;
  showExportModal: boolean;
  showGestureTraining: boolean;
  showSettingsModal: boolean;
  showTutorial: boolean;
  voiceTranscript: string;
  recentVoiceCommands: VoiceCommandRecord[];
  canUndo: boolean;
  canRedo: boolean;
  projectName: string;
  lastGestureName: string;

  // Actions
  setProjectName: (name: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveColor: (color: string) => void;
  setActiveFill: (fill: string) => void;
  setActiveStrokeWidth: (w: number) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundType: (type: 'dark-grid' | 'black' | 'white' | 'transparent' | 'neon-grid') => void;
  setActiveMode: (mode: '2d' | '3d') => void;
  setShowAiDrawer: (show: boolean) => void;
  setShowKeyboard: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setShowGestureTraining: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  setSelectedElementId: (id: string | null) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  updateSettings: (newSettings: Partial<StudioSettings>) => void;
  toggleCamera: () => Promise<void>;
  toggleVoice: () => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  fitToScreen: () => void;
  addElement: (el: Omit<CanvasElement, 'id' | 'layerId'>) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteSelectedElement: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  duplicateElement: (id: string) => void;
  loadDesignElements: (elements: CanvasElement[], reset?: boolean) => void;
  handleStrokePoint: (point: Point2D, isEnding?: boolean) => void;
  handleCanvasClickAt: (screenPos: { x: number; y: number }) => void;
}

const StudioContext = createContext<StudioContextType | null>(null);

const INITIAL_LAYERS: Layer[] = [
  { id: 'layer-1', name: 'Vector Layer 1', visible: true, locked: false },
  { id: 'layer-2', name: 'Vector Layer 2', visible: true, locked: false },
];

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectName, setProjectName] = useState('Untitled Gesture Project');
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    // Seed initial vector objects so users immediately see a creative design
    return [
      {
        id: 'seed-logo-ring',
        type: 'circle',
        x: 400,
        y: 280,
        width: 180,
        height: 180,
        radius: 90,
        fill: 'transparent',
        stroke: '#00f0ff',
        strokeWidth: 4,
        rotation: 0,
        opacity: 0.9,
        layerId: 'layer-1',
        glow: true,
      },
      {
        id: 'seed-inner-hex',
        type: 'triangle',
        x: 400,
        y: 280,
        width: 100,
        height: 90,
        fill: 'rgba(56, 189, 248, 0.25)',
        stroke: '#818cf8',
        strokeWidth: 3,
        rotation: 0,
        opacity: 0.85,
        layerId: 'layer-1',
      },
      {
        id: 'seed-title',
        type: 'text',
        x: 400,
        y: 410,
        width: 320,
        height: 40,
        text: 'NVX GESTURE STUDIO',
        fontSize: 22,
        fontFamily: 'Space Grotesk',
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        rotation: 0,
        opacity: 1,
        layerId: 'layer-1',
      },
      {
        id: 'seed-subtitle',
        type: 'text',
        x: 400,
        y: 445,
        width: 380,
        height: 30,
        text: 'Point to draw • Pinch to select • Voice to command',
        fontSize: 13,
        fontFamily: 'Plus Jakarta Sans',
        fill: '#38bdf8',
        stroke: 'none',
        strokeWidth: 0,
        rotation: 0,
        opacity: 0.8,
        layerId: 'layer-1',
      },
    ];
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [layers] = useState<Layer[]>(INITIAL_LAYERS);
  const [activeLayerId] = useState<string>('layer-1');
  const [backgroundColor, setBackgroundColor] = useState('#080d1a');
  const [backgroundType, setBackgroundType] = useState<'dark-grid' | 'black' | 'white' | 'transparent' | 'neon-grid'>('dark-grid');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeHands, setActiveHands] = useState<HandTelemetry[]>([]);
  const [telemetryStats, setTelemetryStats] = useState({ fps: 60, latencyMs: 6 });
  const [activeColor, setActiveColor] = useState('#00f0ff');
  const [activeFill, setActiveFill] = useState('transparent');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Point2D[]>([]);
  const [lastGestureName, setLastGestureName] = useState<string>('Ready');

  // Modal / UI states
  const [activeMode, setActiveMode] = useState<'2d' | '3d'>('2d');
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGestureTraining, setShowGestureTraining] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [recentVoiceCommands, setRecentVoiceCommands] = useState<VoiceCommandRecord[]>([]);

  // Settings
  const [settings, setSettings] = useState<StudioSettings>(cameraVision.getSettings());

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  // Ref to hold elements for closure in gesture callbacks
  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const pushHistory = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-25), elementsRef.current]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, elementsRef.current]);
    setUndoStack((u) => u.slice(0, -1));
    setElements(prev);
    soundEffects.playHover();
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, elementsRef.current]);
    setRedoStack((r) => r.slice(0, -1));
    setElements(next);
    soundEffects.playHover();
  }, [redoStack]);

  const updateSettings = useCallback((newSettings: Partial<StudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      cameraVision.updateSettings(updated);
      return updated;
    });
  }, []);

  // Screen to Canvas coordinate conversion
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const curZoom = zoomRef.current;
    const curPan = panRef.current;
    return {
      x: (screenX - curPan.x) / curZoom,
      y: (screenY - curPan.y) / curZoom,
    };
  }, []);

  // Stroke point processing for air drawing & smart shapes
  const handleStrokePoint = useCallback((screenPt: Point2D, isEnding = false) => {
    const canvasPt = screenToCanvas(screenPt.x, screenPt.y);

    if (isEnding) {
      if (currentStrokePoints.length > 3) {
        pushHistory();
        const strokePts = [...currentStrokePoints, canvasPt];

        // Check if Smart Shape Auto-Correction is enabled
        if (settings.smartShapeAutoCorrect) {
          const detected = recognizeDrawnShape(strokePts);
          if (detected.shape !== 'freehand' && detected.confidence >= settings.smartShapeThreshold) {
            soundEffects.playShapeRecognized();
            setLastGestureName(`Recognized Shape: ${detected.shape.toUpperCase()}`);

            const newEl: CanvasElement = {
              id: `shape-${Date.now()}`,
              type: detected.shape === 'square' ? 'rect' : detected.shape,
              x: detected.bounds.centerX,
              y: detected.bounds.centerY,
              width: detected.bounds.width,
              height: detected.shape === 'square' ? Math.max(detected.bounds.width, detected.bounds.height) : detected.bounds.height,
              radius: detected.bounds.width / 2,
              fill: activeFill,
              stroke: activeColor,
              strokeWidth: activeStrokeWidth,
              rotation: 0,
              opacity: 1,
              layerId: activeLayerId,
            };
            setElements((prev) => [...prev, newEl]);
            setCurrentStrokePoints([]);
            setIsDrawing(false);
            return;
          }
        }

        // Keep as clean freehand SVG path
        const pathData = strokePts
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(' ');

        const newPathEl: CanvasElement = {
          id: `path-${Date.now()}`,
          type: 'path',
          x: strokePts[0].x,
          y: strokePts[0].y,
          width: 0,
          height: 0,
          points: strokePts,
          d: pathData,
          fill: 'transparent',
          stroke: activeColor,
          strokeWidth: activeStrokeWidth,
          rotation: 0,
          opacity: 1,
          layerId: activeLayerId,
          glow: activeTool === 'glow-brush',
        };

        setElements((prev) => [...prev, newPathEl]);
      }
      setCurrentStrokePoints([]);
      setIsDrawing(false);
    } else {
      setIsDrawing(true);
      setCurrentStrokePoints((prev) => [...prev, canvasPt]);
    }
  }, [currentStrokePoints, pushHistory, settings.smartShapeAutoCorrect, settings.smartShapeThreshold, screenToCanvas, activeFill, activeColor, activeStrokeWidth, activeLayerId, activeTool]);

  // Click / Selection handler at screen position
  const handleCanvasClickAt = useCallback((screenPos: { x: number; y: number }) => {
    const canvasPt = screenToCanvas(screenPos.x, screenPos.y);
    soundEffects.playPinch();

    // Find top-most element containing or near this canvas point (reverse search)
    const reversed = [...elementsRef.current].reverse();
    const hit = reversed.find((el) => {
      if (el.locked || el.visible === false) return false;
      const hw = (el.width || 50) / 2;
      const hh = (el.height || 50) / 2;
      return (
        canvasPt.x >= el.x - hw &&
        canvasPt.x <= el.x + hw &&
        canvasPt.y >= el.y - hh &&
        canvasPt.y <= el.y + hh
      );
    });

    if (hit) {
      setSelectedElementId(hit.id);
      setLastGestureName(`Selected: ${hit.type.toUpperCase()}`);
    } else {
      setSelectedElementId(null);
    }
  }, [screenToCanvas]);

  // Element modifiers
  const addElement = useCallback((el: Omit<CanvasElement, 'id' | 'layerId'>) => {
    pushHistory();
    const newId = `el-${Date.now()}`;
    const fullEl: CanvasElement = {
      ...el,
      id: newId,
      layerId: activeLayerId,
    };
    setElements((prev) => [...prev, fullEl]);
    setSelectedElementId(newId);
    soundEffects.playHover();
    return newId;
  }, [pushHistory, activeLayerId]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElementId) return;
    pushHistory();
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
    soundEffects.playHover();
  }, [selectedElementId, pushHistory]);

  const bringToFront = useCallback((id: string) => {
    pushHistory();
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      return [...prev.slice(0, idx), ...prev.slice(idx + 1), item];
    });
  }, [pushHistory]);

  const sendToBack = useCallback((id: string) => {
    pushHistory();
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const item = prev[idx];
      return [item, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
  }, [pushHistory]);

  const duplicateElement = useCallback((id: string) => {
    pushHistory();
    setElements((prev) => {
      const item = prev.find((e) => e.id === id);
      if (!item) return prev;
      const dup: CanvasElement = {
        ...item,
        id: `el-dup-${Date.now()}`,
        x: item.x + 25,
        y: item.y + 25,
      };
      return [...prev, dup];
    });
  }, [pushHistory]);

  const clearCanvas = useCallback(() => {
    pushHistory();
    setElements([]);
    setSelectedElementId(null);
  }, [pushHistory]);

  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const loadDesignElements = useCallback((newElements: CanvasElement[], reset = false) => {
    pushHistory();
    if (reset) {
      setElements(newElements);
    } else {
      setElements((prev) => [...prev, ...newElements]);
    }
    soundEffects.playShapeRecognized();
  }, [pushHistory]);

  // Voice Command Event handler
  useEffect(() => {
    const unsubCmd = voiceControl.onCommand((action, payload) => {
      switch (action) {
        case 'CREATE_CIRCLE':
          addElement({
            type: 'circle',
            x: 400 - panRef.current.x,
            y: 300 - panRef.current.y,
            width: 120,
            height: 120,
            radius: 60,
            fill: activeFill,
            stroke: activeColor,
            strokeWidth: activeStrokeWidth,
            rotation: 0,
            opacity: 1,
          });
          break;
        case 'CREATE_SQUARE':
        case 'CREATE_RECTANGLE':
          addElement({
            type: 'rect',
            x: 400 - panRef.current.x,
            y: 300 - panRef.current.y,
            width: action === 'CREATE_SQUARE' ? 120 : 160,
            height: 120,
            fill: activeFill,
            stroke: activeColor,
            strokeWidth: activeStrokeWidth,
            rotation: 0,
            opacity: 1,
          });
          break;
        case 'CREATE_TRIANGLE':
          addElement({
            type: 'triangle',
            x: 400 - panRef.current.x,
            y: 300 - panRef.current.y,
            width: 120,
            height: 120,
            fill: activeFill,
            stroke: activeColor,
            strokeWidth: activeStrokeWidth,
            rotation: 0,
            opacity: 1,
          });
          break;
        case 'CREATE_STAR':
          addElement({
            type: 'star',
            x: 400 - panRef.current.x,
            y: 300 - panRef.current.y,
            width: 120,
            height: 120,
            fill: activeFill,
            stroke: activeColor,
            strokeWidth: activeStrokeWidth,
            rotation: 0,
            opacity: 1,
          });
          break;
        case 'SET_TOOL':
          if (payload) setActiveTool(payload as ToolType);
          break;
        case 'SET_BG':
          if (payload === 'black') {
            setBackgroundColor('#000000');
            setBackgroundType('black');
          } else if (payload === 'white') {
            setBackgroundColor('#ffffff');
            setBackgroundType('white');
          } else if (payload === 'dark-grid') {
            setBackgroundColor('#080d1a');
            setBackgroundType('dark-grid');
          }
          break;
        case 'SCALE_UP':
          if (selectedElementId) {
            updateElement(selectedElementId, {
              width: (elementsRef.current.find((e) => e.id === selectedElementId)?.width || 100) * 1.25,
              height: (elementsRef.current.find((e) => e.id === selectedElementId)?.height || 100) * 1.25,
            });
          }
          break;
        case 'SCALE_DOWN':
          if (selectedElementId) {
            updateElement(selectedElementId, {
              width: (elementsRef.current.find((e) => e.id === selectedElementId)?.width || 100) * 0.8,
              height: (elementsRef.current.find((e) => e.id === selectedElementId)?.height || 100) * 0.8,
            });
          }
          break;
        case 'DELETE_SELECTED':
          deleteSelectedElement();
          break;
        case 'UNDO':
          undo();
          break;
        case 'REDO':
          redo();
          break;
        case 'ZOOM_IN':
          setZoom((z) => Math.min(4, z + 0.25));
          break;
        case 'ZOOM_OUT':
          setZoom((z) => Math.max(0.25, z - 0.25));
          break;
        case 'RESET_ZOOM':
          fitToScreen();
          break;
        case 'CLEAR_CANVAS':
          clearCanvas();
          break;
        case 'EXPORT_SVG':
        case 'EXPORT_PNG':
          setShowExportModal(true);
          break;
        case 'CHANGE_COLOR':
          if (typeof payload === 'string') {
            setActiveColor(payload);
            if (selectedElementId) {
              updateElement(selectedElementId, { stroke: payload });
            }
          }
          break;
        case 'AI_GENERATE':
          setShowAiDrawer(true);
          break;
      }
    });

    const unsubTranscript = voiceControl.onTranscript((t) => setVoiceTranscript(t));
    const unsubState = voiceControl.onStateChange((listening) => setIsVoiceActive(listening));

    return () => {
      unsubCmd();
      unsubTranscript();
      unsubState();
    };
  }, [addElement, activeFill, activeColor, activeStrokeWidth, selectedElementId, updateElement, deleteSelectedElement, undo, redo, fitToScreen, clearCanvas]);

  // Camera Vision frame listener
  useEffect(() => {
    const unsubVision = cameraVision.onFrame((hands, stats) => {
      setActiveHands(hands);
      setTelemetryStats(stats);

      // Handle gestures in real-time
      if (hands.length > 0) {
        const primary = hands.find((h) => h.handedness === 'Right') || hands[0];
        setLastGestureName(`${primary.handedness}: ${primary.gesture}`);

        // Drawing tool interaction
        if (activeTool === 'pen' || activeTool === 'brush' || activeTool === 'glow-brush') {
          if (primary.isPointing || primary.gesture === 'DRAWING') {
            handleStrokePoint(primary.cursor, false);
          } else if (isDrawing && (primary.isOpenPalm || primary.isFist || primary.gesture === 'IDLE')) {
            handleStrokePoint(primary.cursor, true);
          }
        }

        // Object rotation with hand rotation
        if (selectedElementId && (primary.gesture === 'ROTATE' || Math.abs(primary.rotationAngle) > 20)) {
          updateElement(selectedElementId, { rotation: primary.rotationAngle });
        }
      }
    });

    return () => unsubVision();
  }, [activeTool, handleStrokePoint, isDrawing, selectedElementId, updateElement]);

  const toggleCamera = async () => {
    if (cameraVision.isActive()) {
      cameraVision.stopCamera();
      setIsCameraActive(false);
    } else {
      // Find or create hidden video tag
      let videoEl = document.getElementById('camera-stream-video') as HTMLVideoElement;
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.id = 'camera-stream-video';
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.muted = true;
        videoEl.style.display = 'none';
        document.body.appendChild(videoEl);
      }
      await cameraVision.startCamera(videoEl);
      setIsCameraActive(true);
    }
  };

  const toggleVoice = () => {
    voiceControl.toggle();
  };

  return (
    <StudioContext.Provider
      value={{
        elements,
        selectedElementId,
        activeTool,
        layers,
        activeLayerId,
        backgroundColor,
        backgroundType,
        zoom,
        pan,
        activeHands,
        telemetryStats,
        activeColor,
        activeStrokeWidth,
        activeFill,
        isDrawing,
        currentStrokePoints,
        settings,
        isCameraActive,
        isVoiceActive,
        activeMode,
        showAiDrawer,
        showKeyboard,
        showExportModal,
        showGestureTraining,
        showSettingsModal,
        showTutorial,
        voiceTranscript,
        recentVoiceCommands,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        projectName,
        lastGestureName,

        setProjectName,
        setActiveTool,
        setActiveColor,
        setActiveFill,
        setActiveStrokeWidth,
        setBackgroundColor,
        setBackgroundType,
        setActiveMode,
        setShowAiDrawer,
        setShowKeyboard,
        setShowExportModal,
        setShowGestureTraining,
        setShowSettingsModal,
        setShowTutorial,
        setSelectedElementId,
        setZoom,
        setPan,
        updateSettings,
        toggleCamera,
        toggleVoice,
        undo,
        redo,
        clearCanvas,
        fitToScreen,
        addElement,
        updateElement,
        deleteSelectedElement,
        bringToFront,
        sendToBack,
        duplicateElement,
        loadDesignElements,
        handleStrokePoint,
        handleCanvasClickAt,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
};
