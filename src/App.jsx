import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AudioEngine } from './audio/AudioEngine'
import { ChordProgressionBuilder } from './components/ChordProgressionBuilder'
import { KeyboardFretboard } from './components/KeyboardFretboard'
import { Metronome } from './components/Metronome'
import { ScaleSelector } from './components/ScaleSelector'
import { ProgressionProvider, useProgression } from './context/progressionContext'
import {
  NOTE_NAMES,
  buildPlayableScale,
  buildScalePitchClasses,
  getScaleById,
  toPitchClass,
} from './data/scales'

function App() {
  return (
    <ProgressionProvider>
      <PracticeStudio />
    </ProgressionProvider>
  )
}

function PracticeStudio() {
  const [root, setRoot] = useState(0)
  const [scaleId, setScaleId] = useState('major')
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [instrument, setInstrument] = useState('keyboard')
  const [practiceMode, setPracticeMode] = useState('scale')
  const [bpm, setBpm] = useState(96)
  const [isPlaying, setIsPlaying] = useState(false)
  const [beat, setBeat] = useState(0)
  const [activePitchClass, setActivePitchClass] = useState(null)
  const [activeChordPitchClasses, setActiveChordPitchClasses] = useState([])

  const audioEngineRef = useRef(null)

  const {
    progression,
    progressionMidiNotes,
    progressionLabel,
    beatsPerChord,
    isLooping,
    transpose,
  } = useProgression()

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
      onChord: (midiNotes) => setActiveChordPitchClasses(midiNotes.map((note) => toPitchClass(note))),
      onStop: () => setIsPlaying(false),
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
      mode: practiceMode,
      scaleMidiNotes: playableScale,
      progressionMidiNotes,
      beatsPerChord,
      loopProgression: isLooping,
    })
  }, [bpm, timeSignature, playableScale, progressionMidiNotes, beatsPerChord, isLooping, practiceMode])

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
      setActiveChordPitchClasses([])
      return
    }

    if (practiceMode === 'progression' && progressionMidiNotes.length === 0) {
      return
    }

    await engine.start({
      bpm,
      timeSignature,
      mode: practiceMode,
      scaleMidiNotes: playableScale,
      progressionMidiNotes,
      beatsPerChord,
      loopProgression: isLooping,
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

      <section className="panel mode-panel">
        <h2>Practice Mode</h2>
        <label>
          Playback Focus
          <select
            value={practiceMode}
            onChange={(event) => {
              setPracticeMode(event.target.value)
              setBeat(0)
              setActivePitchClass(null)
              setActiveChordPitchClasses([])
              if (isPlaying) {
                audioEngineRef.current?.stop()
                setIsPlaying(false)
              }
            }}
          >
            <option value="scale">Scale Navigator</option>
            <option value="progression">Chord Progression</option>
          </select>
        </label>
      </section>

      <ChordProgressionBuilder isPlaying={isPlaying && practiceMode === 'progression'} onPlayToggle={togglePlayback} />

      <KeyboardFretboard
        instrument={instrument}
        root={root}
        scalePitchClasses={
          practiceMode === 'progression' && activeChordPitchClasses.length > 0
            ? activeChordPitchClasses
            : scalePitchClasses
        }
        activePitchClass={practiceMode === 'scale' ? activePitchClass : null}
        activePitchClasses={practiceMode === 'progression' ? activeChordPitchClasses : []}
        label={
          practiceMode === 'scale'
            ? `${NOTE_NAMES[root]} ${selectedScale.name}`
            : `${progressionLabel || 'Build a progression'} (${transpose >= 0 ? `+${transpose}` : transpose})`
        }
      />

      <footer className="status-bar">
        <p>
          Current: <strong>{NOTE_NAMES[root]}</strong> {selectedScale.name}
        </p>
        <p>
          Progression: <strong>{progression.length}</strong> chords | <strong>{beatsPerChord}</strong>{' '}
          beats/chord
        </p>
        <p>
          Transport: <strong>{isPlaying ? 'Playing' : 'Stopped'}</strong>
        </p>
      </footer>
    </main>
  )
}

export default App
