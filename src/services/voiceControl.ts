import { VoiceCommandRecord } from '../types';
import { soundEffects } from './soundEffects';

export type VoiceCommandHandler = (action: string, payload?: unknown) => void;

interface IWindowWithSpeech extends Window {
  webkitSpeechRecognition?: unknown;
  SpeechRecognition?: unknown;
}

export class VoiceControlService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isListening = false;
  private commandHistory: VoiceCommandRecord[] = [];
  private onCommandListeners: VoiceCommandHandler[] = [];
  private onStateChangeListeners: ((isListening: boolean) => void)[] = [];
  private onTranscriptListeners: ((transcript: string) => void)[] = [];

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindowWithSpeech;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (win.SpeechRecognition || win.webkitSpeechRecognition) as any;

    if (!SpeechRec) {
      console.warn('Web Speech API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        this.notifyTranscript(text);

        if (final) {
          this.interpretCommand(final.trim());
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Keep listening continuously unless explicitly toggled off
          try {
            this.recognition.start();
          } catch {}
        }
      };
    } catch (e) {
      console.warn('Could not initialize Speech Recognition:', e);
    }
  }

  public async start(): Promise<boolean> {
    if (!this.recognition) return false;
    try {
      this.recognition.start();
      this.isListening = true;
      this.notifyState(true);
      return true;
    } catch {
      return false;
    }
  }

  public stop() {
    if (!this.recognition) return;
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch {}
    this.notifyState(false);
  }

  public toggle(): boolean {
    if (this.isListening) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getHistory(): VoiceCommandRecord[] {
    return [...this.commandHistory];
  }

  public onCommand(cb: VoiceCommandHandler) {
    this.onCommandListeners.push(cb);
    return () => {
      this.onCommandListeners = this.onCommandListeners.filter((l) => l !== cb);
    };
  }

  public onTranscript(cb: (t: string) => void) {
    this.onTranscriptListeners.push(cb);
    return () => {
      this.onTranscriptListeners = this.onTranscriptListeners.filter((l) => l !== cb);
    };
  }

  public onStateChange(cb: (listening: boolean) => void) {
    this.onStateChangeListeners.push(cb);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== cb);
    };
  }

  private notifyTranscript(t: string) {
    this.onTranscriptListeners.forEach((l) => l(t));
  }

  private notifyState(listening: boolean) {
    this.onStateChangeListeners.forEach((l) => l(listening));
  }

  // Interpret spoken speech phrases into workspace actions
  public interpretCommand(rawPhrase: string) {
    const phrase = rawPhrase.toLowerCase();
    let action = '';
    let payload: unknown = undefined;

    if (phrase.includes('circle')) {
      action = 'CREATE_CIRCLE';
    } else if (phrase.includes('square') || phrase.includes('box')) {
      action = 'CREATE_SQUARE';
    } else if (phrase.includes('rectangle')) {
      action = 'CREATE_RECTANGLE';
    } else if (phrase.includes('triangle')) {
      action = 'CREATE_TRIANGLE';
    } else if (phrase.includes('star')) {
      action = 'CREATE_STAR';
    } else if (phrase.includes('drawing mode') || phrase.includes('pen') || phrase.includes('draw')) {
      action = 'SET_TOOL';
      payload = 'pen';
    } else if (phrase.includes('brush')) {
      action = 'SET_TOOL';
      payload = 'brush';
    } else if (phrase.includes('eraser')) {
      action = 'SET_TOOL';
      payload = 'eraser';
    } else if (phrase.includes('select')) {
      action = 'SET_TOOL';
      payload = 'select';
    } else if (phrase.includes('background') && (phrase.includes('black') || phrase.includes('dark'))) {
      action = 'SET_BG';
      payload = 'black';
    } else if (phrase.includes('background') && (phrase.includes('white') || phrase.includes('light'))) {
      action = 'SET_BG';
      payload = 'white';
    } else if (phrase.includes('background') && phrase.includes('grid')) {
      action = 'SET_BG';
      payload = 'dark-grid';
    } else if (phrase.includes('bigger') || phrase.includes('enlarge') || phrase.includes('scale up')) {
      action = 'SCALE_UP';
    } else if (phrase.includes('smaller') || phrase.includes('shrink') || phrase.includes('scale down')) {
      action = 'SCALE_DOWN';
    } else if (phrase.includes('delete') || phrase.includes('remove') || phrase.includes('trash')) {
      action = 'DELETE_SELECTED';
    } else if (phrase.includes('undo')) {
      action = 'UNDO';
    } else if (phrase.includes('redo')) {
      action = 'REDO';
    } else if (phrase.includes('zoom in')) {
      action = 'ZOOM_IN';
    } else if (phrase.includes('zoom out')) {
      action = 'ZOOM_OUT';
    } else if (phrase.includes('reset zoom') || phrase.includes('fit to screen')) {
      action = 'RESET_ZOOM';
    } else if (phrase.includes('clear canvas') || phrase.includes('clear all')) {
      action = 'CLEAR_CANVAS';
    } else if (phrase.includes('export') && phrase.includes('svg')) {
      action = 'EXPORT_SVG';
    } else if (phrase.includes('export') && phrase.includes('png')) {
      action = 'EXPORT_PNG';
    } else if (phrase.includes('logo') || phrase.includes('create a modern') || phrase.includes('design') || phrase.includes('generate')) {
      action = 'AI_GENERATE';
      payload = rawPhrase;
    } else if (phrase.includes('color') || phrase.includes('blue') || phrase.includes('cyan') || phrase.includes('red') || phrase.includes('green') || phrase.includes('purple')) {
      action = 'CHANGE_COLOR';
      if (phrase.includes('blue') || phrase.includes('cyan')) payload = '#00f0ff';
      else if (phrase.includes('red')) payload = '#ef4444';
      else if (phrase.includes('green')) payload = '#10b981';
      else if (phrase.includes('purple') || phrase.includes('violet')) payload = '#a855f7';
      else if (phrase.includes('yellow') || phrase.includes('amber')) payload = '#f59e0b';
      else payload = '#00f0ff';
    }

    if (action) {
      soundEffects.playVoiceAck();
      const record: VoiceCommandRecord = {
        id: Math.random().toString(36).substring(2, 9),
        command: rawPhrase,
        timestamp: new Date().toLocaleTimeString(),
        confidence: 0.95,
        actionTaken: action,
      };
      this.commandHistory.unshift(record);
      if (this.commandHistory.length > 20) this.commandHistory.pop();

      this.onCommandListeners.forEach((listener) => listener(action, payload));
    }
  }
}

export const voiceControl = new VoiceControlService();
