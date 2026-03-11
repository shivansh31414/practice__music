export class AudioEngine {
  constructor({ onTick, onScaleNote, onChord, onStop } = {}) {
    this.onTick = onTick
    this.onScaleNote = onScaleNote
    this.onChord = onChord
    this.onStop = onStop

    this.audioContext = null
    this.masterGain = null

    this.isRunning = false
    this.bpm = 100
    this.timeSignature = '4/4'
    this.mode = 'scale'
    this.scaleMidiNotes = []
    this.progressionMidiNotes = []
    this.beatsPerChord = 2
    this.loopProgression = true

    this.lookaheadMs = 25
    this.scheduleAheadTime = 0.12
    this.nextBeatTime = 0

    this.currentBeatInBar = 0
    this.currentScaleStep = 0
    this.currentChordIndex = 0
    this.currentChordBeat = 0

    this.schedulerId = null
    this.pendingTimeouts = new Set()
  }

  async start({
    bpm,
    timeSignature,
    mode = 'scale',
    scaleMidiNotes = [],
    progressionMidiNotes = [],
    beatsPerChord = 2,
    loopProgression = true,
  }) {
    this.ensureAudioContext()

    this.bpm = bpm
    this.timeSignature = timeSignature
    this.mode = mode
    this.scaleMidiNotes = scaleMidiNotes
    this.progressionMidiNotes = progressionMidiNotes
    this.beatsPerChord = Math.max(1, beatsPerChord)
    this.loopProgression = loopProgression

    this.currentBeatInBar = 0
    this.currentScaleStep = 0
    this.currentChordIndex = 0
    this.currentChordBeat = 0

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

  updateConfig({
    bpm,
    timeSignature,
    mode = this.mode,
    scaleMidiNotes = this.scaleMidiNotes,
    progressionMidiNotes = this.progressionMidiNotes,
    beatsPerChord = this.beatsPerChord,
    loopProgression = this.loopProgression,
  }) {
    this.bpm = bpm
    this.timeSignature = timeSignature
    this.mode = mode
    this.scaleMidiNotes = scaleMidiNotes
    this.progressionMidiNotes = progressionMidiNotes
    this.beatsPerChord = Math.max(1, beatsPerChord)
    this.loopProgression = loopProgression
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
      const shouldContinue = this.scheduleBeat(
        this.nextBeatTime,
        this.currentBeatInBar,
        this.currentScaleStep,
      )
      if (!shouldContinue) {
        return
      }

      const secondsPerBeat = 60 / this.bpm
      this.nextBeatTime += secondsPerBeat

      this.currentBeatInBar = (this.currentBeatInBar + 1) % this.getBeatsPerBar()
      this.currentScaleStep = (this.currentScaleStep + 1) % Math.max(this.scaleMidiNotes.length, 1)
    }
  }

  scheduleBeat(time, beatInBar, scaleStep) {
    const isAccent = beatInBar === 0
    this.playClick(time, isAccent)

    if (this.mode === 'progression') {
      const keepRunning = this.scheduleProgressionStep(time)
      this.queueUiUpdate(time, () => this.onTick?.(beatInBar))
      return keepRunning
    }

    const midiNote = this.scaleMidiNotes[scaleStep]
    if (typeof midiNote === 'number') {
      this.playScaleTone(time, midiNote)
      this.queueUiUpdate(time, () => this.onScaleNote?.(midiNote))
    }

    this.queueUiUpdate(time, () => this.onTick?.(beatInBar))
    return true
  }

  scheduleProgressionStep(time) {
    const chord = this.progressionMidiNotes[this.currentChordIndex]
    if (Array.isArray(chord) && this.currentChordBeat === 0) {
      this.playChordTone(time, chord)
      this.queueUiUpdate(time, () => this.onChord?.(chord))
    }

    this.currentChordBeat += 1
    if (this.currentChordBeat < this.beatsPerChord) {
      return true
    }

    this.currentChordBeat = 0

    const atLastChord = this.currentChordIndex >= this.progressionMidiNotes.length - 1
    if (!atLastChord) {
      this.currentChordIndex += 1
      return true
    }

    if (this.loopProgression) {
      this.currentChordIndex = 0
      return true
    }

    this.stop()
    this.queueUiUpdate(time, () => this.onStop?.())
    return false
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

  playChordTone(time, midiNotes) {
    midiNotes.forEach((midiNote, index) => {
      const frequency = this.midiToFrequency(midiNote)
      const oscillator = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const strumOffset = index * 0.008

      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(frequency, time + strumOffset)

      gain.gain.setValueAtTime(0.0001, time + strumOffset)
      gain.gain.linearRampToValueAtTime(0.09, time + 0.02 + strumOffset)
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.42 + strumOffset)

      oscillator.connect(gain)
      gain.connect(this.masterGain)

      oscillator.start(time + strumOffset)
      oscillator.stop(time + 0.48 + strumOffset)
    })
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
