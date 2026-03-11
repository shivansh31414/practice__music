import { useMemo, useState } from 'react'
import { NOTE_NAMES, toPitchClass } from '../data/scales'
import { CHORD_LIBRARY, toChordLabel } from '../data/chords'
import { useProgression } from '../context/progressionContext'

type BuilderProps = {
  isPlaying: boolean
  onPlayToggle: () => void
}

export function ChordProgressionBuilder({ isPlaying, onPlayToggle }: BuilderProps) {
  const [selectedRoot, setSelectedRoot] = useState(0)
  const [selectedTypeId, setSelectedTypeId] = useState('maj')
  const [presetName, setPresetName] = useState('')

  const {
    progression,
    progressionLabel,
    transpose,
    isLooping,
    beatsPerChord,
    savedProgressions,
    addChord,
    removeChord,
    moveChord,
    clearProgression,
    savePreset,
    loadPreset,
    setTranspose,
    setIsLooping,
    setBeatsPerChord,
    generateRandom,
  } = useProgression()

  const canPlay = progression.length > 0

  const displayChords = useMemo(
    () => progression.map((item) => ({ ...item, label: toChordLabel(item.root + transpose, item.typeId) })),
    [progression, transpose],
  )

  return (
    <section className="panel progression-panel">
      <h2>Chord Progression Builder</h2>

      <div className="progression-controls-grid">
        <label>
          Chord Root
          <select
            value={selectedRoot}
            onChange={(event) => setSelectedRoot(Number(event.target.value))}
            aria-label="Chord root"
          >
            {NOTE_NAMES.map((name, idx) => (
              <option value={idx} key={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Chord Type
          <select
            value={selectedTypeId}
            onChange={(event) => setSelectedTypeId(event.target.value)}
            aria-label="Chord type"
          >
            {CHORD_LIBRARY.map((chord) => (
              <option key={chord.id} value={chord.id}>
                {chord.name}
              </option>
            ))}
          </select>
        </label>

        <button className="btn-secondary" onClick={() => addChord({ root: selectedRoot, typeId: selectedTypeId })}>
          Add Chord
        </button>

        <button className="btn-ghost" onClick={() => generateRandom(4)}>
          Random 4-Chord
        </button>
      </div>

      <div className="timeline">
        {displayChords.length === 0 ? (
          <p className="timeline-empty">Add chords to build your progression timeline.</p>
        ) : (
          displayChords.map((item, index) => (
            <div className="timeline-item" key={item.id}>
              <span className="timeline-index">{index + 1}</span>
              <button
                className="timeline-chord"
                onClick={() => {
                  setSelectedRoot(toPitchClass(item.root))
                  setSelectedTypeId(item.typeId)
                }}
                title="Select this chord"
              >
                {item.label}
              </button>
              <div className="timeline-actions">
                <button onClick={() => moveChord(index, -1)} aria-label="Move left">
                  ◀
                </button>
                <button onClick={() => moveChord(index, 1)} aria-label="Move right">
                  ▶
                </button>
                <button onClick={() => removeChord(item.id)} aria-label="Remove chord">
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="progression-inline-label">{progressionLabel || 'No progression selected'}</p>

      <div className="progression-options">
        <label>
          Transpose ({transpose > 0 ? `+${transpose}` : transpose})
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={transpose}
            onChange={(event) => setTranspose(Number(event.target.value))}
          />
        </label>

        <label>
          Beats / Chord
          <select
            value={beatsPerChord}
            onChange={(event) => setBeatsPerChord(Number(event.target.value))}
            aria-label="Beats per chord"
          >
            <option value={1}>1 beat</option>
            <option value={2}>2 beats</option>
            <option value={4}>4 beats</option>
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isLooping}
            onChange={(event) => setIsLooping(event.target.checked)}
          />
          Loop progression
        </label>
      </div>

      <div className="transport-row progression-transport">
        <button className="btn-primary" onClick={onPlayToggle} disabled={!canPlay}>
          {isPlaying ? 'Stop Progression' : 'Play Progression'}
        </button>
        <button className="btn-ghost" onClick={clearProgression}>
          Clear
        </button>
      </div>

      <div className="preset-row">
        <input
          type="text"
          placeholder="Preset name"
          value={presetName}
          onChange={(event) => setPresetName(event.target.value)}
        />
        <button
          className="btn-secondary"
          onClick={() => {
            savePreset(presetName)
            setPresetName('')
          }}
        >
          Save
        </button>

        <select defaultValue="" onChange={(event) => loadPreset(event.target.value)}>
          <option value="" disabled>
            Load preset
          </option>
          {savedProgressions.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}
