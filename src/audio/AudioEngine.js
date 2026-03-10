export class AudioEngine {
  constructor({ onTick, onScaleNote } = {}) {
    this.onTick = onTick
    this.onScaleNote = onScaleNote

    this.audioContext = null
    this.masterGain = null

    this.isRunning = false
    this.bpm = 100
    this.timeSignature = '4/4'
    this.scaleMidiNotes = []

    this.lookaheadMs = 25
    this.scheduleAheadTime = 0.12
    this.nextBeatTime = 0

    this.currentBeatInBar = 0
    this.currentScaleStep = 0

    this.schedulerId = null
    this.pendingTimeouts = new Set()
  }

  async start({ bpm, timeSignature, scaleMidiNotes }) {
    this.ensureAudioContext()

    this.bpm = bpm
    this.timeSignature = timeSignature
    this.scaleMidiNotes = scaleMidiNotes

    this.currentBeatInBar = 0
    this.currentScaleStep = 0

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    this.nextBeatTime = this.audioContext.currentTime + 0.06
    this.isRunning = true

    this.schedulerId = window.setInterval(() => this.scheduler(), this.lookaheadMs)
  }

  stop() {
    if (this.schedulerId) {
      window.clearInterval(this.schedulerId)
      this.schedulerId = null
    }

    this.pendingTimeouts.forEach((id) => window.clearTimeout(id))
    this.pendingTimeouts.clear()

    this.isRunning = false
  }

  updateConfig({ bpm, timeSignature, scaleMidiNotes }) {
    this.bpm = bpm
    this.timeSignature = timeSignature
    this.scaleMidiNotes = scaleMidiNotes
  }

  dispose() {
    this.stop()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
  }

  ensureAudioContext() {
    if (this.audioContext) {
      return
    }

    this.audioContext = new window.AudioContext()
    this.masterGain = this.audioContext.createGain()
    this.masterGain.gain.value = 0.2
    this.masterGain.connect(this.audioContext.destination)
  }

  scheduler() {
    if (!this.audioContext || !this.isRunning) {
      return
    }

    while (this.nextBeatTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleBeat(this.nextBeatTime, this.currentBeatInBar, this.currentScaleStep)

      const secondsPerBeat = 60 / this.bpm
      this.nextBeatTime += secondsPerBeat

      this.currentBeatInBar = (this.currentBeatInBar + 1) % this.getBeatsPerBar()
      this.currentScaleStep = (this.currentScaleStep + 1) % Math.max(this.scaleMidiNotes.length, 1)
    }
  }

  scheduleBeat(time, beatInBar, scaleStep) {
    const isAccent = beatInBar === 0
    this.playClick(time, isAccent)

    const midiNote = this.scaleMidiNotes[scaleStep]
    if (typeof midiNote === 'number') {
      this.playScaleTone(time, midiNote)
      this.queueUiUpdate(time, () => this.onScaleNote?.(midiNote))
    }

    this.queueUiUpdate(time, () => this.onTick?.(beatInBar))
  }

  playClick(time, isAccent) {
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(isAccent ? 1800 : 1200, time)

    gain.gain.setValueAtTime(isAccent ? 0.2 : 0.12, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    oscillator.connect(gain)
    gain.connect(this.masterGain)

    oscillator.start(time)
    oscillator.stop(time + 0.06)
  }

  playScaleTone(time, midiNote) {
    const frequency = this.midiToFrequency(midiNote)
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, time)

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.18, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32)

    oscillator.connect(gain)
    gain.connect(this.masterGain)

    oscillator.start(time)
    oscillator.stop(time + 0.34)
  }

  queueUiUpdate(targetTime, callback) {
    const delay = Math.max((targetTime - this.audioContext.currentTime) * 1000, 0)
    const timeoutId = window.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId)
      callback()
    }, delay)

    this.pendingTimeouts.add(timeoutId)
  }

  getBeatsPerBar() {
    const [numerator] = this.timeSignature.split('/')
    return Number(numerator) || 4
  }

  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }
}
