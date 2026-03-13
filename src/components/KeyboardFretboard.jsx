import { NOTE_NAMES, toPitchClass } from '../data/scales'

const KEYBOARD_LAYOUT = [
  { name: 'C', isBlack: false },
  { name: 'C#', isBlack: true },
  { name: 'D', isBlack: false },
  { name: 'D#', isBlack: true },
  { name: 'E', isBlack: false },
  { name: 'F', isBlack: false },
  { name: 'F#', isBlack: true },
  { name: 'G', isBlack: false },
  { name: 'G#', isBlack: true },
  { name: 'A', isBlack: false },
  { name: 'A#', isBlack: true },
  { name: 'B', isBlack: false },
]

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]

export function KeyboardFretboard({
  instrument,
  scalePitchClasses,
  root,
  activePitchClass,
  activePitchClasses = [],
  activeChordMidiNotes = [],
  showChordViews = false,
  label,
}) {
  const activeShape =
    activePitchClasses.length > 0 ? buildChordShapeForFretboard(activePitchClasses) : null

  return (
    <section className="panel instrument-panel">
      <div className="instrument-header">
        <h2>{instrument === 'keyboard' ? 'Virtual Keyboard' : 'Virtual Fretboard'}</h2>
        <p>{label}</p>
      </div>

      {instrument === 'keyboard' ? (
        <KeyboardView
          root={root}
          scalePitchClasses={scalePitchClasses}
          activePitchClass={activePitchClass}
          activePitchClasses={activePitchClasses}
        />
      ) : (
        <FretboardView
          root={root}
          scalePitchClasses={scalePitchClasses}
          activePitchClass={activePitchClass}
          activePitchClasses={activePitchClasses}
          activeShape={activeShape}
        />
      )}

      {showChordViews && activeChordMidiNotes.length > 0 ? (
        <div className="chord-views-grid">
          <PianoRollView midiNotes={activeChordMidiNotes} />
          <TabView shape={activeShape} />
        </div>
      ) : null}
    </section>
  )
}

function KeyboardView({ root, scalePitchClasses, activePitchClass, activePitchClasses }) {
  const keys = Array.from({ length: 24 }, (_, index) => {
    const pitchClass = index % 12
    const keyDef = KEYBOARD_LAYOUT[pitchClass]
    return {
      id: `${index}-${keyDef.name}`,
      pitchClass,
      noteName: keyDef.name,
      isBlack: keyDef.isBlack,
    }
  })

  return (
    <div className="keyboard">
      {keys.map((key) => {
        const inScale = scalePitchClasses.includes(key.pitchClass)
        const isRoot = key.pitchClass === root
        const isActive = key.pitchClass === activePitchClass || activePitchClasses.includes(key.pitchClass)

        return (
          <div
            key={key.id}
            className={`key ${key.isBlack ? 'key-black' : 'key-white'} ${inScale ? 'in-scale' : ''} ${
              isRoot ? 'is-root' : ''
            } ${isActive ? 'is-active' : ''}`}
          >
            <span>{key.noteName}</span>
          </div>
        )
      })}
    </div>
  )
}

function FretboardView({ root, scalePitchClasses, activePitchClass, activePitchClasses, activeShape }) {
  const frets = Array.from({ length: 13 }, (_, fret) => fret)

  return (
    <div className="fretboard">
      <div className="fret-number-row">
        <div className="string-label" />
        {frets.map((fret) => (
          <span key={`fret-label-${fret}`}>{fret}</span>
        ))}
      </div>

      {OPEN_STRING_MIDI.map((openMidi, stringIndex) => (
        <div className="string-row" key={`string-${stringIndex}`}>
          <span className="string-label">{6 - stringIndex}</span>
          {frets.map((fret) => {
            const pitchClass = toPitchClass(openMidi + fret)
            const inScale = scalePitchClasses.includes(pitchClass)
            const isRoot = pitchClass === root
            const isActive =
              pitchClass === activePitchClass || activePitchClasses.includes(pitchClass)
            const finger = activeShape?.fingerByString?.[stringIndex]
            const isFingerPosition = finger && finger.fret === fret

            return (
              <span
                className={`fret ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''} ${
                  isActive ? 'is-active' : ''
                } ${isFingerPosition ? 'has-finger' : ''}`}
                key={`fret-${stringIndex}-${fret}`}
                title={NOTE_NAMES[pitchClass]}
              >
                {isFingerPosition ? (
                  <span className="finger-badge">{finger.finger}</span>
                ) : inScale ? (
                  NOTE_NAMES[pitchClass]
                ) : (
                  ''
                )}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function PianoRollView({ midiNotes }) {
  const min = Math.min(...midiNotes) - 2
  const max = Math.max(...midiNotes) + 2
  const span = Math.max(max - min, 1)

  return (
    <div className="chord-view-card" aria-label="Piano roll view">
      <h3>Piano Roll</h3>
      <div className="piano-roll-lanes">
        {midiNotes.map((midi, index) => {
          const left = ((midi - min) / span) * 100
          return (
            <div className="piano-roll-note" key={`roll-${midi}-${index}`} style={{ left: `${left}%` }}>
              {NOTE_NAMES[toPitchClass(midi)]}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TabView({ shape }) {
  return (
    <div className="chord-view-card" aria-label="Guitar tab view">
      <h3>Guitar Tab</h3>
      <div className="tab-grid">
        {Array.from({ length: 6 }, (_, idx) => {
          const stringIndex = idx
          const value = shape?.fingerByString?.[stringIndex]?.fret
          return (
            <div key={`tab-${stringIndex}`} className="tab-row">
              <span>{6 - stringIndex}</span>
              <code>{typeof value === 'number' ? value : 'x'}</code>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildChordShapeForFretboard(activePitchClasses) {
  const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]
  const fingerByString = {}

  OPEN_STRING_MIDI.forEach((openMidi, stringIndex) => {
    let selectedFret = null
    for (let fret = 0; fret <= 12; fret += 1) {
      const pitchClass = toPitchClass(openMidi + fret)
      if (activePitchClasses.includes(pitchClass)) {
        selectedFret = fret
        break
      }
    }

    if (typeof selectedFret === 'number') {
      fingerByString[stringIndex] = { fret: selectedFret, finger: 0 }
    }
  })

  const usedFrets = Object.values(fingerByString)
    .map((item) => item.fret)
    .filter((fret) => fret > 0)
  const sortedUniqueFrets = [...new Set(usedFrets)].sort((a, b) => a - b)
  const fingerMap = new Map(sortedUniqueFrets.map((fret, idx) => [fret, Math.min(4, idx + 1)]))

  Object.keys(fingerByString).forEach((key) => {
    const item = fingerByString[key]
    item.finger = item.fret === 0 ? 'O' : fingerMap.get(item.fret) ?? 1
  })

  return { fingerByString }
}
