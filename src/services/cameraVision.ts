import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { HandTelemetry, Landmark3D, StudioSettings } from '../types';
import { classifyHandGesture, smoothCoordinate } from '../utils/gestureMath';

export type VisionCallback = (hands: HandTelemetry[], stats: { fps: number; latencyMs: number }) => void;

export class CameraVisionService {
  private videoElement: HTMLVideoElement | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isRunning = false;
  private animationFrameId: number | null = null;
  private listeners: VisionCallback[] = [];
  private lastTime = 0;
  private frameCount = 0;
  private fps = 0;
  private latency = 0;
  private cameraStream: MediaStream | null = null;
  private isSimulatedMode = false;
  private prevLeftCursor: { x: number; y: number } | null = null;
  private prevRightCursor: { x: number; y: number } | null = null;
  private settings: StudioSettings = {
    sensitivity: 1.2,
    smoothing: 0.65,
    smartShapeAutoCorrect: true,
    smartShapeThreshold: 0.75,
    mirrorCamera: true,
    showSkeletonOverlay: true,
    voiceControlEnabled: true,
    audioFeedbackEnabled: true,
    dualHandMode: true,
    leftHandAction: 'navigate',
    rightHandAction: 'draw',
    cursorSpeed: 1.3,
    dwellTypingTime: 800,
  };

  public updateSettings(newSettings: Partial<StudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): StudioSettings {
    return this.settings;
  }

  public async initMediaPipe(): Promise<boolean> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      return true;
    } catch (e) {
      console.warn('MediaPipe initialization fallback to simulation/hybrid:', e);
      return false;
    }
  }

  public async startCamera(videoEl: HTMLVideoElement): Promise<{ success: boolean; error?: string }> {
    this.videoElement = videoEl;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.cameraStream = stream;
      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      if (!this.handLandmarker) {
        await this.initMediaPipe();
      }

      this.isRunning = true;
      this.isSimulatedMode = false;
      this.loop();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission denied or camera not found';
      // Enable simulated mode so user can test without real webcam
      this.enableSimulationMode();
      return { success: false, error: msg };
    }
  }

  public enableSimulationMode() {
    this.isSimulatedMode = true;
    this.isRunning = true;
    if (!this.animationFrameId) {
      this.simulationLoop();
    }
  }

  public stopCamera() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public isSimulating(): boolean {
    return this.isSimulatedMode;
  }

  public onFrame(cb: VisionCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private loop = () => {
    if (!this.isRunning) return;

    const startMs = performance.now();
    if (this.videoElement && this.videoElement.readyState >= 2 && this.handLandmarker) {
      try {
        const results = this.handLandmarker.detectForVideo(this.videoElement, startMs);
        this.processLandmarkResults(results, startMs);
      } catch {
        // Continue loop even on transient frame drop
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processLandmarkResults(results: any, startTimeMs: number) {
    const rawHands = results.landmarks || [];
    const handednesses = results.handednesses || [];

    const handsTelemetry: HandTelemetry[] = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    rawHands.forEach((handMarks: Landmark3D[], index: number) => {
      const handednessStr = handednesses[index]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right';
      const score = handednesses[index]?.[0]?.score || 0.9;

      const classification = classifyHandGesture(handMarks);

      // Coordinate mapping from normalized (0..1) to screen viewport
      // If mirrored, flip X coordinate
      const indexTip = handMarks[8] || { x: 0.5, y: 0.5, z: 0 };
      const rawX = this.settings.mirrorCamera ? (1 - indexTip.x) * viewportWidth : indexTip.x * viewportWidth;
      const rawY = indexTip.y * viewportHeight;

      const prevCursor = handednessStr === 'Left' ? this.prevLeftCursor : this.prevRightCursor;
      const smoothed = smoothCoordinate({ x: rawX, y: rawY }, prevCursor, this.settings.smoothing, 2.0);

      if (handednessStr === 'Left') {
        this.prevLeftCursor = smoothed;
      } else {
        this.prevRightCursor = smoothed;
      }

      handsTelemetry.push({
        handedness: handednessStr,
        landmarks: handMarks,
        score,
        gesture: classification.gesture,
        cursor: smoothed,
        rawCursor: { x: rawX, y: rawY },
        pinchDistance: classification.pinchDistance,
        isPinching: classification.isPinching,
        isOpenPalm: classification.isOpenPalm,
        isFist: classification.isFist,
        isPointing: classification.isPointing,
        rotationAngle: classification.rotationAngle,
      });
    });

    // Update FPS & Latency
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
    this.latency = Math.round(now - startTimeMs);

    this.notify(handsTelemetry, { fps: this.fps, latencyMs: this.latency });
  }

  // Simulation loop for testing without a live camera or in headless automated tests
  private simulatedCursor = { x: 600, y: 350 };
  private simulatedGesture = 'POINTING';
  private simulatedPinch = false;

  public triggerSimulatedAction(cursor: { x: number; y: number }, isPinching = false, isDrawing = false) {
    this.simulatedCursor = cursor;
    this.simulatedPinch = isPinching;
    this.simulatedGesture = isDrawing ? 'DRAWING' : isPinching ? 'PINCH' : 'POINTING';
  }

  private simulationLoop = () => {
    if (!this.isRunning || !this.isSimulatedMode) return;

    const startMs = performance.now();
    const fakeLandmarks: Landmark3D[] = [];

    // Synthesize 21 realistic hand points relative to simulated cursor
    const cx = this.simulatedCursor.x / window.innerWidth;
    const cy = this.simulatedCursor.y / window.innerHeight;

    for (let i = 0; i < 21; i++) {
      fakeLandmarks.push({
        x: cx + (i - 10) * 0.005,
        y: cy + (i % 5) * 0.008,
        z: 0,
      });
    }

    const hand: HandTelemetry = {
      handedness: 'Right',
      landmarks: fakeLandmarks,
      score: 0.98,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gesture: this.simulatedGesture as any,
      cursor: { ...this.simulatedCursor },
      rawCursor: { ...this.simulatedCursor },
      pinchDistance: this.simulatedPinch ? 0.02 : 0.15,
      isPinching: this.simulatedPinch,
      isOpenPalm: this.simulatedGesture === 'OPEN_PALM',
      isFist: this.simulatedGesture === 'CLOSED_FIST',
      isPointing: this.simulatedGesture === 'POINTING' || this.simulatedGesture === 'DRAWING',
      rotationAngle: 0,
    };

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = 60;
      this.frameCount = 0;
      this.lastTime = now;
    }
    this.latency = Math.round(now - startMs) + 4;

    this.notify([hand], { fps: this.fps || 60, latencyMs: this.latency });
    this.animationFrameId = requestAnimationFrame(this.simulationLoop);
  };

  private notify(hands: HandTelemetry[], stats: { fps: number; latencyMs: number }) {
    this.listeners.forEach((listener) => listener(hands, stats));
  }
}

export const cameraVision = new CameraVisionService();
