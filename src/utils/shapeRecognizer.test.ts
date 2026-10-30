import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recognizeDrawnShape,
  getBoundingBox,
  calculatePathPerimeter,
  calculatePolygonArea,
} from './shapeRecognizer';
import { Point2D } from '../types';

test('getBoundingBox returns accurate bounding box and center', () => {
  const points: Point2D[] = [
    { x: 10, y: 20 },
    { x: 50, y: 80 },
    { x: 30, y: 40 },
  ];
  const bounds = getBoundingBox(points);
  assert.equal(bounds.minX, 10);
  assert.equal(bounds.minY, 20);
  assert.equal(bounds.maxX, 50);
  assert.equal(bounds.maxY, 80);
  assert.equal(bounds.width, 40);
  assert.equal(bounds.height, 60);
  assert.equal(bounds.centerX, 30);
  assert.equal(bounds.centerY, 50);
});

test('calculatePathPerimeter calculates total travel distance', () => {
  const points: Point2D[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const perimeter = calculatePathPerimeter(points);
  assert.equal(perimeter, 30);
});

test('calculatePolygonArea computes square area', () => {
  const square: Point2D[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
    { x: 0, y: 20 },
  ];
  const area = calculatePolygonArea(square);
  assert.equal(area, 400);
});

test('recognizeDrawnShape detects synthetic circle trajectory', () => {
  const circlePoints: Point2D[] = [];
  const radius = 50;
  const center = { x: 200, y: 200 };
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    circlePoints.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }

  const result = recognizeDrawnShape(circlePoints);
  assert.equal(result.shape, 'circle');
  assert.ok(result.confidence > 0.7);
});

test('recognizeDrawnShape detects straight horizontal line', () => {
  const linePoints: Point2D[] = [];
  for (let i = 0; i < 20; i++) {
    linePoints.push({ x: 50 + i * 10, y: 100 });
  }

  const result = recognizeDrawnShape(linePoints);
  assert.equal(result.shape, 'line');
  assert.ok(result.confidence > 0.85);
});

test('recognizeDrawnShape detects square trajectory', () => {
  const squarePoints: Point2D[] = [];
  // top edge
  for (let x = 100; x <= 200; x += 10) squarePoints.push({ x, y: 100 });
  // right edge
  for (let y = 110; y <= 200; y += 10) squarePoints.push({ x: 200, y });
  // bottom edge
  for (let x = 190; x >= 100; x -= 10) squarePoints.push({ x, y: 200 });
  // left edge closing
  for (let y = 190; y >= 100; y -= 10) squarePoints.push({ x: 100, y });

  const result = recognizeDrawnShape(squarePoints);
  assert.ok(result.shape === 'square' || result.shape === 'rect', `Got ${result.shape}`);
  assert.ok(result.confidence > 0.7);
});
