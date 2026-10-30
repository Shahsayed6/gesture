import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distance3D,
  distance2D,
  detectPinch,
  computeHandRotation,
  classifyHandGesture,
  smoothCoordinate,
  calculateDualHandMetrics,
} from './gestureMath';
import { Landmark3D } from '../types';

test('distance3D computes accurate spatial distance', () => {
  const p1: Landmark3D = { x: 0, y: 0, z: 0 };
  const p2: Landmark3D = { x: 3, y: 4, z: 0 };
  assert.equal(distance3D(p1, p2), 5);

  const p3: Landmark3D = { x: 1, y: 2, z: 2 };
  const p4: Landmark3D = { x: 1, y: 2, z: 5 };
  assert.equal(distance3D(p3, p4), 3);
});

test('distance2D computes accurate planar distance', () => {
  const d = distance2D({ x: 10, y: 20 }, { x: 13, y: 24 });
  assert.equal(d, 5);
});

test('detectPinch detects close thumb and index tip', () => {
  const thumb: Landmark3D = { x: 0.5, y: 0.5, z: 0 };
  const indexClose: Landmark3D = { x: 0.52, y: 0.53, z: 0 };
  const indexFar: Landmark3D = { x: 0.7, y: 0.8, z: 0 };

  const closeResult = detectPinch(thumb, indexClose, 0.07);
  assert.equal(closeResult.isPinching, true);

  const farResult = detectPinch(thumb, indexFar, 0.07);
  assert.equal(farResult.isPinching, false);
});

test('computeHandRotation returns 0 for upright hand', () => {
  const wrist: Landmark3D = { x: 0.5, y: 0.8, z: 0 };
  const middleMcp: Landmark3D = { x: 0.5, y: 0.4, z: 0 };
  const angle = computeHandRotation(wrist, middleMcp);
  assert.ok(Math.abs(angle) < 1e-4, `Expected near 0, got ${angle}`);
});

test('classifyHandGesture handles empty or incomplete landmarks safely', () => {
  const result = classifyHandGesture([]);
  assert.equal(result.gesture, 'IDLE');
  assert.equal(result.isPinching, false);
});

test('smoothCoordinate dampens micro-jitter within deadband', () => {
  const prev = { x: 100, y: 200 };
  const nextTinyMovement = { x: 100.5, y: 200.5 };
  const smoothed = smoothCoordinate(nextTinyMovement, prev, 0.5, 2.0);
  assert.deepEqual(smoothed, prev);
});

test('calculateDualHandMetrics calculates zoom factor and midpoint correctly', () => {
  const left = { x: 200, y: 300 };
  const right = { x: 400, y: 300 };
  const initialDist = 100;

  const metrics = calculateDualHandMetrics(left, right, initialDist);
  assert.equal(metrics.currentDistance, 200);
  assert.equal(metrics.deltaDistance, 100);
  assert.equal(metrics.zoomFactor, 2.0);
  assert.deepEqual(metrics.midpoint, { x: 300, y: 300 });
});
