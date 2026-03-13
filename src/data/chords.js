import { NOTE_NAMES, toPitchClass } from './scales'

export const INTERVAL_LABELS = {
  0: 'Root',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: '#5',
  9: '6',
  10: 'b7',
  11: '7',
}

export const CHORD_LIBRARY = [
  { id: 'maj', name: 'Major', suffix: '', intervals: [0, 4, 7], description: 'Root + major 3rd + perfect 5th' },
  { id: 'min', name: 'Minor', suffix: 'm', intervals: [0, 3, 7], description: 'Root + minor 3rd + perfect 5th' },
  { id: '7', name: 'Dominant 7th', suffix: '7', intervals: [0, 4, 7, 10], description: 'Major triad + minor 7th tension' },
  { id: 'maj7', name: 'Major 7th', suffix: 'maj7', intervals: [0, 4, 7, 11], description: 'Major triad + major 7th color' },
  { id: 'min7', name: 'Minor 7th', suffix: 'm7', intervals: [0, 3, 7, 10], description: 'Minor triad + minor 7th' },
  { id: 'dim', name: 'Diminished', suffix: 'dim', intervals: [0, 3, 6], description: 'Stacked minor 3rds for tension' },
  { id: 'aug', name: 'Augmented', suffix: 'aug', intervals: [0, 4, 8], description: 'Raised fifth for bright tension' },
  { id: 'sus2', name: 'Suspended 2nd', suffix: 'sus2', intervals: [0, 2, 7], description: 'Major 3rd replaced with 2nd' },
  { id: 'sus4', name: 'Suspended 4th', suffix: 'sus4', intervals: [0, 5, 7], description: 'Major 3rd replaced with 4th' },
]

export const PROGRESSION_PRESETS = [
  {
    id: 'pop-i-vi-iv-v',
    name: 'Pop I-VI-IV-V (C)',
    progression: [
      { root: 0, typeId: 'maj' },
      { root: 9, typeId: 'min' },
      { root: 5, typeId: 'maj' },
      { root: 7, typeId: 'maj' },
    ],
  },
  {
    id: 'blues-12-bar',
    name: '12-Bar Blues (A7)',
    progression: [
      { root: 9, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 2, typeId: '7' },
      { root: 2, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 4, typeId: '7' },
      { root: 2, typeId: '7' },
      { root: 9, typeId: '7' },
      { root: 4, typeId: '7' },
    ],
  },
  {
    id: 'jazz-ii-v-i',
    name: 'Jazz ii-V-I (C)',
    progression: [
      { root: 2, typeId: 'min7' },
      { root: 7, typeId: '7' },
      { root: 0, typeId: 'maj7' },
      { root: 0, typeId: 'maj7' },
    ],
  },
]

export const getChordById = (id) => CHORD_LIBRARY.find((chord) => chord.id === id) ?? CHORD_LIBRARY[0]

export const toChordLabel = (root, typeId) => {
  const chord = getChordById(typeId)
  return `${NOTE_NAMES[toPitchClass(root)]}${chord.suffix}`
}

export const getChordFormula = (root, typeId) => {
  const chord = getChordById(typeId)
  const rootPitchClass = toPitchClass(root)
  const notes = chord.intervals.map((interval) => NOTE_NAMES[toPitchClass(rootPitchClass + interval)])
  const labels = chord.intervals.map((interval) => INTERVAL_LABELS[interval] ?? `${interval}`)
  return {
    notes,
    labels,
    text: `${toChordLabel(rootPitchClass, typeId)} = ${notes.join(' + ')}`,
  }
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
