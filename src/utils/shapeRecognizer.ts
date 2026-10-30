import { Point2D } from '../types';
import { distance2D } from './gestureMath';

export type DetectedShapeType =
  | 'circle'
  | 'rect'
  | 'square'
  | 'triangle'
  | 'line'
  | 'star'
  | 'heart'
  | 'spiral'
  | 'freehand';

export interface ShapeRecognitionResult {
  shape: DetectedShapeType;
  confidence: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  details?: {
    aspectRatio?: number;
    circularity?: number;
    closedness?: number;
    cornerCount?: number;
  };
}

/**
 * Calculates polygon perimeter (sum of segment lengths).
 */
export function calculatePathPerimeter(points: Point2D[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distance2D(points[i - 1], points[i]);
  }
  return len;
}

/**
 * Calculates bounding box of a point set.
 */
export function getBoundingBox(points: Point2D[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return { minX, minY, maxX, maxY, width, height, centerX, centerY };
}

/**
 * Polygon Area using Shoelace Formula.
 */
export function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Ramer-Douglas-Peucker algorithm for polyline simplification and corner detection.
 */
export function simplifyPolyline(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    // Distance from point p to line start-end
    const numerator = Math.abs(
      (end.y - start.y) * p.x - (end.x - start.x) * p.y + end.x * start.y - end.y * start.x
    );
    const denominator = Math.sqrt((end.y - start.y) ** 2 + (end.x - start.x) ** 2) || 1e-6;
    const dist = numerator / denominator;
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPolyline(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPolyline(points.slice(maxIndex), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [start, end];
}

/**
 * Main Smart Shape Recognizer.
 * Analyzes movement trajectory points from air-drawing and classifies into clean vector primitives.
 */
export function recognizeDrawnShape(points: Point2D[], minPoints = 8): ShapeRecognitionResult {
  const bounds = getBoundingBox(points);

  if (!points || points.length < minPoints) {
    return { shape: 'freehand', confidence: 0.1, bounds };
  }

  const perimeter = calculatePathPerimeter(points);
  if (perimeter < 20) {
    return { shape: 'freehand', confidence: 0.2, bounds };
  }

  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const startEndDist = distance2D(startPoint, endPoint);

  // Closedness: ratio of start-to-end distance to bounding box diagonal
  const diagonal = Math.hypot(bounds.width, bounds.height);
  const isClosed = startEndDist < diagonal * 0.35 || startEndDist < 45;

  // Check for straight line:
  // If the path length is very close to the direct distance from start to end
  const directDist = distance2D(startPoint, endPoint);
  const straightnessRatio = directDist / perimeter;
  if (!isClosed && straightnessRatio > 0.88) {
    return {
      shape: 'line',
      confidence: Math.min(0.98, straightnessRatio),
      bounds,
      details: { aspectRatio: bounds.width / bounds.height },
    };
  }

  const area = calculatePolygonArea(points);
  // Circularity: 4 * PI * Area / Perimeter^2 (1.0 for a perfect circle, PI/4 ≈ 0.785 for a square)
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  const aspectRatio = bounds.width / bounds.height;

  // If closed shape:
  if (isClosed) {
    // Check radius variance from center to distinguish true circle from square
    // In a circle, all points are at roughly constant radius r
    // In a square, corner distance is ~1.414x edge center distance
    const radii = points.map((p) => distance2D(p, { x: bounds.centerX, y: bounds.centerY }));
    const meanRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    const radiusVariance =
      radii.reduce((acc, r) => acc + (r - meanRadius) ** 2, 0) / radii.length;
    const coefficientOfVariation = Math.sqrt(radiusVariance) / (meanRadius || 1);

    const epsilon = diagonal * 0.08;
    const simplified = simplifyPolyline(points, epsilon);
    const cornerCount = simplified.length - 1;

    // Check for 3 corners (Triangle)
    if (cornerCount === 3) {
      return {
        shape: 'triangle',
        confidence: 0.92,
        bounds,
        details: { cornerCount, circularity, aspectRatio },
      };
    }

    // Check for 4 corners (Square or Rect)
    if (cornerCount === 4) {
      const isSquare = aspectRatio >= 0.8 && aspectRatio <= 1.25;
      return {
        shape: isSquare ? 'square' : 'rect',
        confidence: 0.94,
        bounds,
        details: { cornerCount, aspectRatio },
      };
    }

    // 1. Circle check: Low radial coefficient of variation (< 0.12) and circularity > 0.85
    if (
      circularity > 0.85 &&
      coefficientOfVariation < 0.13 &&
      aspectRatio > 0.75 &&
      aspectRatio < 1.35
    ) {
      return {
        shape: 'circle',
        confidence: Math.min(0.98, circularity),
        bounds,
        details: { circularity, aspectRatio },
      };
    }

    // Secondary triangle check
    if (cornerCount <= 4 && circularity < 0.65 && aspectRatio > 0.4) {
      return {
        shape: 'triangle',
        confidence: 0.85,
        bounds,
        details: { cornerCount, circularity, aspectRatio },
      };
    }

    // Secondary Rect / Square check
    if (cornerCount <= 6 && circularity <= 0.82) {
      const isSquare = aspectRatio >= 0.8 && aspectRatio <= 1.25;
      return {
        shape: isSquare ? 'square' : 'rect',
        confidence: 0.88,
        bounds,
        details: { cornerCount, aspectRatio },
      };
    }

    if (cornerCount >= 8 && cornerCount <= 14) {
      return {
        shape: 'star',
        confidence: 0.82,
        bounds,
        details: { cornerCount },
      };
    }
  } else {
    // Check for Spiral: radial distance from center monotonically increases while rotating
    let angleAccum = 0;
    let radiusIncreasing = 0;
    let radiusDecreasing = 0;
    let prevRadius = distance2D(points[0], { x: bounds.centerX, y: bounds.centerY });

    for (let i = 1; i < points.length; i++) {
      const curRadius = distance2D(points[i], { x: bounds.centerX, y: bounds.centerY });
      if (curRadius > prevRadius) radiusIncreasing++;
      else radiusDecreasing++;

      const p1 = points[i - 1];
      const p2 = points[i];
      const a1 = Math.atan2(p1.y - bounds.centerY, p1.x - bounds.centerX);
      const a2 = Math.atan2(p2.y - bounds.centerY, p2.x - bounds.centerX);
      let diff = a2 - a1;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;
      angleAccum += Math.abs(diff);
      prevRadius = curRadius;
    }

    // If turned more than 360 degrees (2*PI) and radial distance grew steadily -> Spiral
    if (angleAccum > 2.5 * Math.PI && radiusIncreasing > radiusDecreasing * 1.5) {
      return {
        shape: 'spiral',
        confidence: 0.85,
        bounds,
      };
    }
  }

  return {
    shape: 'freehand',
    confidence: 0.5,
    bounds,
    details: { circularity, aspectRatio, closedness: startEndDist / diagonal },
  };
}
