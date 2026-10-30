export type RecognizedGesture =
  | 'IDLE'
  | 'POINTING'
  | 'DRAWING'
  | 'PINCH'
  | 'PINCH_HOLD'
  | 'OPEN_PALM'
  | 'CLOSED_FIST'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'SMART_SHAPE_CIRCLE'
  | 'SMART_SHAPE_RECT'
  | 'ROTATE'
  | 'NAVIGATE';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export interface HandTelemetry {
  handedness: 'Left' | 'Right';
  landmarks: Landmark3D[];
  score: number;
  gesture: RecognizedGesture;
  cursor: { x: number; y: number };
  rawCursor: { x: number; y: number };
  pinchDistance: number;
  isPinching: boolean;
  isOpenPalm: boolean;
  isFist: boolean;
  isPointing: boolean;
  rotationAngle: number; // in degrees
}

export type ElementType =
  | 'path'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'arrow'
  | 'heart'
  | 'line'
  | 'spiral'
  | 'text'
  | '3d_embed';

export interface Point2D {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  points?: Point2D[];
  d?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
  opacity: number;
  layerId: string;
  locked?: boolean;
  visible?: boolean;
  glow?: boolean;
  threeModelData?: {
    shape: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'knot' | 'dodecahedron';
    material: 'hologram' | 'wireframe' | 'chrome' | 'neon';
    color: string;
  };
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export type ToolType =
  | 'select'
  | 'pen'
  | 'brush'
  | 'glow-brush'
  | 'eraser'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'line'
  | 'text'
  | 'smart-shape'
  | 'pan';

export interface StudioSettings {
  sensitivity: number; // 0.5 to 2.0
  smoothing: number; // 0.1 to 0.95
  smartShapeAutoCorrect: boolean;
  smartShapeThreshold: number; // 0.5 to 0.95
  mirrorCamera: boolean;
  showSkeletonOverlay: boolean;
  voiceControlEnabled: boolean;
  audioFeedbackEnabled: boolean;
  dualHandMode: boolean;
  leftHandAction: 'navigate' | 'zoom' | 'draw' | 'select';
  rightHandAction: 'draw' | 'select' | 'navigate' | 'zoom';
  cursorSpeed: number;
  dwellTypingTime: number; // ms
}

export interface ProjectState {
  id: string;
  name: string;
  lastModified: number;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundType: 'dark-grid' | 'black' | 'white' | 'transparent' | 'neon-grid';
  elements: CanvasElement[];
  layers: Layer[];
  activeLayerId: string;
}

export interface VoiceCommandRecord {
  id: string;
  command: string;
  timestamp: string;
  confidence: number;
  actionTaken: string;
}
