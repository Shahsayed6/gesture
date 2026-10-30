import { Landmark3D, RecognizedGesture } from '../types';

/**
 * Calculates Euclidean 3D distance between two points.
 */
export function distance3D(p1: Landmark3D, p2: Landmark3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z ?? 0) - (p2.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates Euclidean 2D distance between two points.
 */
export function distance2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determines whether a finger is extended based on tip vs PIP/MCP landmark distances to wrist (index 0).
 */
export function isFingerExtended(
  tip: Landmark3D,
  pip: Landmark3D,
  mcp: Landmark3D,
  wrist: Landmark3D
): boolean {
  const dTipWrist = distance3D(tip, wrist);
  const dPipWrist = distance3D(pip, wrist);
  const dMcpWrist = distance3D(mcp, wrist);
  return dTipWrist > dPipWrist && dPipWrist > dMcpWrist * 0.95;
}

/**
 * Detects pinch state between thumb tip (index 4) and index finger tip (index 8).
 * Distance is normalized. Threshold is typically ~0.065.
 */
export function detectPinch(thumbTip: Landmark3D, indexTip: Landmark3D, threshold = 0.07): {
  isPinching: boolean;
  distance: number;
} {
  const dist = distance3D(thumbTip, indexTip);
  return {
    isPinching: dist < threshold,
    distance: dist,
  };
}

/**
 * Computes hand in-plane rotation angle in degrees from wrist to middle finger knuckle (MCP 9).
 */
export function computeHandRotation(wrist: Landmark3D, middleMcp: Landmark3D): number {
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  // In canvas/screen space, Y goes downward
  const rad = Math.atan2(dy, dx);
  // Normalize so pointing straight up (dx=0, dy=-1) is 0 degrees
  let deg = (rad * 180) / Math.PI + 90;
  if (deg < -180) deg += 360;
  if (deg > 180) deg -= 360;
  return deg;
}

/**
 * Classifies gesture from the 21 MediaPipe hand landmarks.
 */
export function classifyHandGesture(
  landmarks: Landmark3D[],
  previousGesture: RecognizedGesture = 'IDLE',
  thresholds = { pinch: 0.075 }
): {
  gesture: RecognizedGesture;
  isPinching: boolean;
  isOpenPalm: boolean;
  isFist: boolean;
  isPointing: boolean;
  pinchDistance: number;
  rotationAngle: number;
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'IDLE',
      isPinching: false,
      isOpenPalm: false,
      isFist: false,
      isPointing: false,
      pinchDistance: 1,
      rotationAngle: 0,
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  const indexExt = isFingerExtended(indexTip, indexPip, indexMcp, wrist);
  const middleExt = isFingerExtended(middleTip, middlePip, middleMcp, wrist);
  const ringExt = isFingerExtended(ringTip, ringPip, ringMcp, wrist);
  const pinkyExt = isFingerExtended(pinkyTip, pinkyPip, pinkyMcp, wrist);

  const { isPinching, distance: pinchDist } = detectPinch(thumbTip, indexTip, thresholds.pinch);
  const rotation = computeHandRotation(wrist, middleMcp);

  const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;
  const isOpenPalm = extendedCount >= 4 && !isPinching;
  const isFist = extendedCount === 0 && pinchDist > 0.04;
  const isPointing = indexExt && !middleExt && !ringExt && !pinkyExt;

  let gesture: RecognizedGesture = 'IDLE';

  if (isPinching) {
    gesture = previousGesture === 'PINCH' || previousGesture === 'PINCH_HOLD' ? 'PINCH_HOLD' : 'PINCH';
  } else if (isOpenPalm) {
    gesture = 'OPEN_PALM';
  } else if (isFist) {
    gesture = 'CLOSED_FIST';
  } else if (isPointing) {
    gesture = 'POINTING';
  } else if (indexExt && middleExt && !ringExt && !pinkyExt) {
    // Two fingers extended (peace sign) -> Zoom gesture
    const twoFingerDist = distance3D(indexTip, middleTip);
    gesture = twoFingerDist > 0.08 ? 'ZOOM_IN' : 'ZOOM_OUT';
  }

  return {
    gesture,
    isPinching,
    isOpenPalm,
    isFist,
    isPointing,
    pinchDistance: pinchDist,
    rotationAngle: rotation,
  };
}

/**
 * Exponential moving average with deadband threshold to prevent jitter when holding still.
 */
export function smoothCoordinate(
  current: { x: number; y: number },
  previous: { x: number; y: number } | null,
  smoothingFactor = 0.65,
  deadband = 1.5
): { x: number; y: number } {
  if (!previous) return { ...current };

  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < deadband) {
    return { ...previous };
  }

  return {
    x: previous.x + dx * (1 - smoothingFactor),
    y: previous.y + dy * (1 - smoothingFactor),
  };
}

/**
 * Dual-hand zoom and scale calculation.
 */
export function calculateDualHandMetrics(
  leftCursor: { x: number; y: number },
  rightCursor: { x: number; y: number },
  prevDistance: number | null
): {
  currentDistance: number;
  deltaDistance: number;
  zoomFactor: number;
  midpoint: { x: number; y: number };
} {
  const currentDistance = distance2D(leftCursor, rightCursor);
  const deltaDistance = prevDistance !== null ? currentDistance - prevDistance : 0;
  const zoomFactor = prevDistance !== null && prevDistance > 0 ? currentDistance / prevDistance : 1.0;
  const midpoint = {
    x: (leftCursor.x + rightCursor.x) / 2,
    y: (leftCursor.y + rightCursor.y) / 2,
  };

  return {
    currentDistance,
    deltaDistance,
    zoomFactor,
    midpoint,
  };
}
