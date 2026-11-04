/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Web Audio API Engine for the Iranian-Danubian Acoustic Continuum.
 * Produces microtonally accurate sound synthesis with instrument timbre shaping
 * (Santur, Țambal, Setar, Bouzouki, Ney, Caval) and real-time frequency analysis.
 */

import { centsToFrequency, calculateHarmonicSeries } from './acousticMath';

class ContinuumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeVoices: Set<{ stop: () => void }> = new Set();
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  public setVolume(val: number) {
    this.initContext();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.isMuted ? 0 : 0.7);
    return this.isMuted;
  }

  public stopAll() {
    for (const voice of this.activeVoices) {
      try {
        voice.stop();
      } catch {
        // Voice might already be ended
      }
    }
    this.activeVoices.clear();
  }

  /**
   * Plays a single microtonal tone with timbre tailored to the instrument family.
   */
  public playMicrotone(
    semitonesFromC4: number,
    centOffset = 0,
    instrumentType: 'santur' | 'tambal' | 'setar' | 'bouzouki' | 'ney' | 'caval' = 'santur',
    duration = 2.2
  ): { stop: () => void } {
    this.initContext();
    if (!this.ctx || !this.masterGain) {
      return { stop: () => {} };
    }

    const now = this.ctx.currentTime;
    const fundamentalHz = centsToFrequency(semitonesFromC4, centOffset);

    // Instrument-specific harmonic parameters
    let decayProfile: 'struck_metallic' | 'struck_wood' | 'plucked_gut' | 'plucked_steel' | 'reed_flute' | 'bone_flute' = 'struck_metallic';
    let attackTime = 0.005;
    let releaseTime = 1.8;
    let filterFreq = 4000;
    let filterQ = 1.2;

    switch (instrumentType) {
      case 'santur':
        decayProfile = 'struck_metallic';
        attackTime = 0.003;
        releaseTime = 3.2; // long ringing shimmer of 72 strings
        filterFreq = 5500;
        filterQ = 2.0;
        break;
      case 'tambal':
        decayProfile = 'struck_metallic';
        attackTime = 0.002;
        releaseTime = 1.4; // more percussive, leather mallet strike
        filterFreq = 4800;
        filterQ = 1.5;
        break;
      case 'setar':
        decayProfile = 'plucked_gut';
        attackTime = 0.01;
        releaseTime = 1.8; // intimate, sympathetic buzzing gut frets
        filterFreq = 3200;
        filterQ = 2.5;
        break;
      case 'bouzouki':
        decayProfile = 'plucked_steel';
        attackTime = 0.004;
        releaseTime = 2.0; // bright double steel strings
        filterFreq = 6000;
        filterQ = 1.8;
        break;
      case 'ney':
        decayProfile = 'reed_flute';
        attackTime = 0.08; // gradual breath build-up
        releaseTime = 2.0;
        filterFreq = 2800;
        filterQ = 3.0;
        break;
      case 'caval':
        decayProfile = 'bone_flute';
        attackTime = 0.05;
        releaseTime = 1.6;
        filterFreq = 3400;
        filterQ = 2.2;
        break;
    }

    const harmonics = calculateHarmonicSeries(fundamentalHz, 6, decayProfile);

    // Voice sub-gain
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.4, now + attackTime);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    // Resonant Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = instrumentType === 'ney' || instrumentType === 'caval' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(filterQ, now);

    const oscs: OscillatorNode[] = [];

    // Synthesize partials
    harmonics.forEach((h, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const partialGain = this.ctx.createGain();

      // Instrument waveform characteristics
      if (instrumentType === 'ney' || instrumentType === 'caval') {
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      } else if (instrumentType === 'setar') {
        osc.type = 'triangle';
      } else {
        osc.type = index === 0 ? 'sine' : 'sawtooth';
      }

      osc.frequency.setValueAtTime(h.frequency, now);

      // Add gentle chorus/detuning for Santur/Țambal (courses of strings have slight micro-chorus)
      if (instrumentType === 'santur' || instrumentType === 'tambal') {
        const microDetune = (index % 2 === 0 ? 1 : -1) * 3; // 3 cents natural acoustic chorus
        osc.detune.setValueAtTime(microDetune, now);
      }

      // Add subtle vibrato for Ney and Caval
      if (instrumentType === 'ney' || instrumentType === 'caval') {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(5.2, now); // 5.2 Hz breath vibrato
        lfoGain.gain.setValueAtTime(7, now); // ~7 cents oscillation
        lfo.connect(osc.detune);
        lfo.start(now);
        lfo.stop(now + releaseTime);
      }

      partialGain.gain.setValueAtTime(h.amplitude * (1 / (index + 1)), now);

      osc.connect(partialGain);
      partialGain.connect(filter);

      osc.start(now);
      osc.stop(now + releaseTime);
      oscs.push(osc);
    });

    filter.connect(voiceGain);
    voiceGain.connect(this.masterGain);

    const voiceHandle = {
      stop: () => {
        try {
          voiceGain.gain.cancelScheduledValues(this.ctx?.currentTime || 0);
          voiceGain.gain.setTargetAtTime(0.0001, this.ctx?.currentTime || 0, 0.05);
          setTimeout(() => {
            oscs.forEach(o => {
              try { o.stop(); } catch { /* ignore */ }
            });
            voiceGain.disconnect();
          }, 60);
        } catch {
          // ignore
        }
      },
    };

    this.activeVoices.add(voiceHandle);
    setTimeout(() => {
      this.activeVoices.delete(voiceHandle);
    }, releaseTime * 1000 + 100);

    return voiceHandle;
  }

  /**
   * Plays a sequenced historic melody demonstration across the continuum.
   */
  public playScaleDemonstration(
    systemId: string,
    onNoteChange?: (noteName: string, index: number) => void,
    onComplete?: () => void
  ): () => void {
    this.stopAll();
    this.initContext();

    let sequence: Array<{ semitones: number; centOffset: number; name: string; dur: number; inst: 'santur' | 'tambal' | 'setar' | 'bouzouki' | 'ney' | 'caval' }> = [];

    if (systemId === 'dastgah-shur') {
      // Dastgah Shur: Persian Santur playing Daramad with E-koron (-50c)
      sequence = [
        { semitones: 2, centOffset: 0, name: 'D4 (Tonic)', dur: 0.6, inst: 'santur' },
        { semitones: 4, centOffset: -50, name: 'E4 Koron (-50¢)', dur: 0.8, inst: 'santur' },
        { semitones: 5, centOffset: 0, name: 'F4', dur: 0.5, inst: 'santur' },
        { semitones: 7, centOffset: 0, name: 'G4', dur: 0.7, inst: 'santur' },
        { semitones: 5, centOffset: 0, name: 'F4 (Ouj)', dur: 0.5, inst: 'santur' },
        { semitones: 4, centOffset: -50, name: 'E4 Koron (Descent)', dur: 0.9, inst: 'santur' },
        { semitones: 2, centOffset: 0, name: 'D4 (Cadence)', dur: 1.2, inst: 'santur' },
      ];
    } else if (systemId === 'makam-rast') {
      // Makam Rast: Ottoman Tanbur / Ney with Segah microtone (-23c)
      sequence = [
        { semitones: 0, centOffset: 0, name: 'C4 (Rast)', dur: 0.6, inst: 'ney' },
        { semitones: 2, centOffset: 0, name: 'D4 (Dügâh)', dur: 0.5, inst: 'ney' },
        { semitones: 4, centOffset: -22.6, name: 'E4 Segâh (-23¢)', dur: 0.9, inst: 'ney' },
        { semitones: 5, centOffset: 0, name: 'F4 (Çargâh)', dur: 0.6, inst: 'ney' },
        { semitones: 7, centOffset: 0, name: 'G4 (Neva)', dur: 0.8, inst: 'ney' },
        { semitones: 9, centOffset: 0, name: 'A4 (Hüseyni)', dur: 0.5, inst: 'ney' },
        { semitones: 11, centOffset: -22.6, name: 'B4 Evç (-23¢)', dur: 0.8, inst: 'ney' },
        { semitones: 12, centOffset: 0, name: 'C5 (Gerdaniye)', dur: 1.2, inst: 'ney' },
      ];
    } else if (systemId === 'romanian-doina-carpathian') {
      // Carpathian Doina: Romanian Țambal and Caval with acoustic 4th (G#) and microtone
      sequence = [
        { semitones: 2, centOffset: 0, name: 'D4 (Finalis)', dur: 0.7, inst: 'caval' },
        { semitones: 4, centOffset: 0, name: 'E4', dur: 0.5, inst: 'caval' },
        { semitones: 5, centOffset: 35, name: 'F4+ Microtone (+35¢)', dur: 0.9, inst: 'caval' },
        { semitones: 8, centOffset: 0, name: 'G#4 (Acoustic 4th)', dur: 0.8, inst: 'tambal' },
        { semitones: 9, centOffset: 0, name: 'A4 (Dominantă)', dur: 0.7, inst: 'tambal' },
        { semitones: 11, centOffset: -30, name: 'B4- Microtone (-30¢)', dur: 0.8, inst: 'tambal' },
        { semitones: 9, centOffset: 0, name: 'A4', dur: 0.5, inst: 'tambal' },
        { semitones: 8, centOffset: 0, name: 'G#4 (Ornament)', dur: 0.4, inst: 'caval' },
        { semitones: 5, centOffset: 35, name: 'F4+ (Doina Sigh)', dur: 0.8, inst: 'caval' },
        { semitones: 2, centOffset: 0, name: 'D4 (Resolution)', dur: 1.4, inst: 'tambal' },
      ];
    } else {
      // Byzantine Echos Devteros
      sequence = [
        { semitones: 2, centOffset: 0, name: 'D4 (Di base)', dur: 0.8, inst: 'setar' },
        { semitones: 3, centOffset: 33, name: 'Eb4+ Soft Chromatic (+33¢)', dur: 0.8, inst: 'bouzouki' },
        { semitones: 6, centOffset: -20, name: 'F#4- Koma (-20¢)', dur: 0.9, inst: 'bouzouki' },
        { semitones: 7, centOffset: 0, name: 'G4 (Dominant Ni)', dur: 1.0, inst: 'bouzouki' },
        { semitones: 6, centOffset: -20, name: 'F#4- (Ison descent)', dur: 0.7, inst: 'setar' },
        { semitones: 3, centOffset: 33, name: 'Eb4+ (Vocal glide)', dur: 0.8, inst: 'setar' },
        { semitones: 2, centOffset: 0, name: 'D4 (Rest)', dur: 1.3, inst: 'setar' },
      ];
    }

    let isCancelled = false;
    let accumulatedTime = 0;
    const timeouts: number[] = [];

    sequence.forEach((note, index) => {
      const t = window.setTimeout(() => {
        if (isCancelled) return;
        if (onNoteChange) onNoteChange(note.name, index);
        this.playMicrotone(note.semitones, note.centOffset, note.inst, note.dur + 0.6);
      }, accumulatedTime * 1000);
      timeouts.push(t);
      accumulatedTime += note.dur;
    });

    const completionTimeout = window.setTimeout(() => {
      if (!isCancelled && onComplete) onComplete();
    }, (accumulatedTime + 0.5) * 1000);
    timeouts.push(completionTimeout);

    return () => {
      isCancelled = true;
      timeouts.forEach(t => clearTimeout(t));
      this.stopAll();
    };
  }
}

export const audioEngine = new ContinuumAudioEngine();
