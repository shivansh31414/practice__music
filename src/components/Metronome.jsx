export function Metronome({ bpm, beat, isPlaying, onTempoChange, onPlayToggle }) {
  return (
    <section className="panel metronome-panel">
      <h2>Metronome</h2>

      <div className="tempo-row">
        <div className="tempo-display">
          <span className="tempo-value">{bpm}</span>
          <span className="tempo-unit">BPM</span>
        </div>

        <input
          type="range"
          min="40"
          max="220"
          value={bpm}
          onChange={(event) => onTempoChange(Number(event.target.value))}
          aria-label="Tempo"
        />
      </div>

      <div className="transport-row">
        <button className="btn-primary" onClick={onPlayToggle}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <div className="beat-indicator" aria-label="Current beat">
          Beat {beat + 1}
        </div>
      </div>
    </section>
  )
}
