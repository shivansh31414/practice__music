import { NOTE_NAMES, toPitchClass } from './scales'

export const CHORD_LIBRARY = [
  { id: 'maj', name: 'Major', suffix: '', intervals: [0, 4, 7] },
  { id: 'min', name: 'Minor', suffix: 'm', intervals: [0, 3, 7] },
  { id: '7', name: 'Dominant 7th', suffix: '7', intervals: [0, 4, 7, 10] },
  { id: 'maj7', name: 'Major 7th', suffix: 'maj7', intervals: [0, 4, 7, 11] },
  { id: 'min7', name: 'Minor 7th', suffix: 'm7', intervals: [0, 3, 7, 10] },
  { id: 'dim', name: 'Diminished', suffix: 'dim', intervals: [0, 3, 6] },
  { id: 'aug', name: 'Augmented', suffix: 'aug', intervals: [0, 4, 8] },
  { id: 'sus2', name: 'Suspended 2nd', suffix: 'sus2', intervals: [0, 2, 7] },
  { id: 'sus4', name: 'Suspended 4th', suffix: 'sus4', intervals: [0, 5, 7] },
]

export const getChordById = (id) => CHORD_LIBRARY.find((chord) => chord.id === id) ?? CHORD_LIBRARY[0]

export const toChordLabel = (root, typeId) => {
  const chord = getChordById(typeId)
  return `${NOTE_NAMES[toPitchClass(root)]}${chord.suffix}`
}

export const buildChordPitchClasses = (root, intervals) =>
  intervals.map((interval) => toPitchClass(root + interval))

export const buildChordMidiNotes = ({ root, typeId, transpose = 0, baseMidi = 60 }) => {
  const chord = getChordById(typeId)
  const rootMidi = baseMidi + root + transpose
  return chord.intervals.map((interval) => rootMidi + interval)
}

export const DEFAULT_PROGRESSION = [
  { id: 'p-1', root: 0, typeId: 'maj' },
  { id: 'p-2', root: 9, typeId: 'min' },
  { id: 'p-3', root: 5, typeId: 'maj' },
  { id: 'p-4', root: 7, typeId: '7' },
]

export const randomProgression = (length = 4) => {
  return Array.from({ length }, (_, index) => {
    const root = Math.floor(Math.random() * 12)
    const type = CHORD_LIBRARY[Math.floor(Math.random() * CHORD_LIBRARY.length)]
    return {
      id: `rand-${Date.now()}-${index}`,
      root,
      typeId: type.id,
    }
  })
}
