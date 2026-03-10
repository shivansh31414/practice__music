import { NOTE_NAMES, SCALE_LIBRARY, TIME_SIGNATURES } from '../data/scales'

export function ScaleSelector({
  root,
  scaleId,
  timeSignature,
  instrument,
  onRootChange,
  onScaleChange,
  onTimeSignatureChange,
  onInstrumentChange,
}) {
  return (
    <section className="panel selector-panel">
      <h2>Scale Setup</h2>

      <div className="control-grid">
        <label>
          Root Note
          <select value={root} onChange={(event) => onRootChange(Number(event.target.value))}>
            {NOTE_NAMES.map((note, index) => (
              <option key={note} value={index}>
                {note}
              </option>
            ))}
          </select>
        </label>

        <label>
          Scale Type
          <select value={scaleId} onChange={(event) => onScaleChange(event.target.value)}>
            {SCALE_LIBRARY.map((scale) => (
              <option key={scale.id} value={scale.id}>
                {scale.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Time Signature
          <select value={timeSignature} onChange={(event) => onTimeSignatureChange(event.target.value)}>
            {TIME_SIGNATURES.map((signature) => (
              <option key={signature} value={signature}>
                {signature}
              </option>
            ))}
          </select>
        </label>

        <label>
          View
          <select value={instrument} onChange={(event) => onInstrumentChange(event.target.value)}>
            <option value="keyboard">Keyboard</option>
            <option value="fretboard">Fretboard</option>
          </select>
        </label>
      </div>
    </section>
  )
}
