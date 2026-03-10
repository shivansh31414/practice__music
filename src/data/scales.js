export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const SCALE_LIBRARY = [
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor', name: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'blues', name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'chromatic', name: 'Chromatic', intervals: Array.from({ length: 12 }, (_, i) => i) },
]

export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8']

export const getScaleById = (scaleId) =>
  SCALE_LIBRARY.find((scale) => scale.id === scaleId) ?? SCALE_LIBRARY[0]

export const toPitchClass = (noteIndex) => ((noteIndex % 12) + 12) % 12

export const buildScalePitchClasses = (rootIndex, intervals) =>
  intervals.map((interval) => toPitchClass(rootIndex + interval))

export const buildPlayableScale = (rootIndex, intervals) => {
  const baseMidi = 60 + rootIndex
  const notes = intervals.map((interval) => baseMidi + interval)

  // Add the octave root so the sequence resolves musically.
  notes.push(baseMidi + 12)
  return notes
}
