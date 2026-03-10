import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AudioEngine } from './audio/AudioEngine'
import { KeyboardFretboard } from './components/KeyboardFretboard'
import { Metronome } from './components/Metronome'
import { ScaleSelector } from './components/ScaleSelector'
import {
  NOTE_NAMES,
  buildPlayableScale,
  buildScalePitchClasses,
  getScaleById,
  toPitchClass,
} from './data/scales'

function App() {
  const [root, setRoot] = useState(0)
  const [scaleId, setScaleId] = useState('major')
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [instrument, setInstrument] = useState('keyboard')
  const [bpm, setBpm] = useState(96)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [activePitchClass, setActivePitchClass] = useState(null)

  const audioEngineRef = useRef(null)

  const selectedScale = useMemo(() => getScaleById(scaleId), [scaleId])

  const scalePitchClasses = useMemo(
    () => buildScalePitchClasses(root, selectedScale.intervals),
    [root, selectedScale.intervals],
  )

  const playableScale = useMemo(
    () => buildPlayableScale(root, selectedScale.intervals),
    [root, selectedScale.intervals],
  )

  useEffect(() => {
    const engine = new AudioEngine({
      onTick: (beatInBar) => setBeat(beatInBar),
      onScaleNote: (midiNote) => setActivePitchClass(toPitchClass(midiNote)),
    })
    audioEngineRef.current = engine

    return () => {
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    const engine = audioEngineRef.current
    if (!engine) {
      return
    }

    engine.updateConfig({
      bpm,
      timeSignature,
      scaleMidiNotes: playableScale,
    })
  }, [bpm, timeSignature, playableScale])

  const togglePlayback = async () => {
    const engine = audioEngineRef.current
    if (!engine) {
      return
    }

    if (isPlaying) {
      engine.stop()
      setIsPlaying(false)
      setBeat(0)
      setActivePitchClass(null)
      return
    }

    await engine.start({
      bpm,
      timeSignature,
      scaleMidiNotes: playableScale,
    })
    setIsPlaying(true)
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Interactive Practice Studio</p>
        <h1>Scale Navigator + Precision Metronome</h1>
        <p className="hero-copy">
          Explore scales on a keyboard or fretboard while a Web Audio engine schedules every beat
          and note with sample-accurate timing.
        </p>
      </header>

      <div className="panels">
        <ScaleSelector
          root={root}
          scaleId={scaleId}
          timeSignature={timeSignature}
          instrument={instrument}
          onRootChange={setRoot}
          onScaleChange={setScaleId}
          onTimeSignatureChange={setTimeSignature}
          onInstrumentChange={setInstrument}
        />

        <Metronome
          bpm={bpm}
          beat={beat}
          isPlaying={isPlaying}
          onTempoChange={setBpm}
          onPlayToggle={togglePlayback}
        />
      </div>

      <KeyboardFretboard
        instrument={instrument}
        root={root}
        scalePitchClasses={scalePitchClasses}
        activePitchClass={activePitchClass}
        label={`${NOTE_NAMES[root]} ${selectedScale.name}`}
      />

      <footer className="status-bar">
        <p>
          Current: <strong>{NOTE_NAMES[root]}</strong> {selectedScale.name}
        </p>
        <p>
          Transport: <strong>{isPlaying ? 'Playing' : 'Stopped'}</strong>
        </p>
      </footer>
    </main>
  )
}

export default App
