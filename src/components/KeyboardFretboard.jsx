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
  label,
}) {
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
        />
      )}
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

function FretboardView({ root, scalePitchClasses, activePitchClass, activePitchClasses }) {
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

            return (
              <span
                className={`fret ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''} ${
                  isActive ? 'is-active' : ''
                }`}
                key={`fret-${stringIndex}-${fret}`}
                title={NOTE_NAMES[pitchClass]}
              >
                {inScale ? NOTE_NAMES[pitchClass] : ''}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
