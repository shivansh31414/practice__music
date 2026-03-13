/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react'
import {
  DEFAULT_PROGRESSION,
  PROGRESSION_PRESETS,
  buildChordMidiNotes,
  getChordById,
  randomProgression,
  toChordLabel,
} from '../data/chords'

const STORAGE_KEY = 'practice_music_progression_presets'

const ProgressionContext = createContext(null)

export function ProgressionProvider({ children }) {
  const [progression, setProgression] = useState(DEFAULT_PROGRESSION)
  const [transpose, setTranspose] = useState(0)
  const [isLooping, setIsLooping] = useState(true)
  const [beatsPerChord, setBeatsPerChord] = useState(2)
  const [savedProgressions, setSavedProgressions] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const progressionLabel = useMemo(
    () => progression.map((item) => toChordLabel(item.root + transpose, item.typeId)).join(' -> '),
    [progression, transpose],
  )

  const progressionMidiNotes = useMemo(
    () => progression.map((item) => buildChordMidiNotes({ ...item, transpose })),
    [progression, transpose],
  )

  const persistPresets = (presets) => {
    setSavedProgressions(presets)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  }

  const addChord = ({ root, typeId }) => {
    setProgression((prev) => [
      ...prev,
      {
        id: `ch-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        root,
        typeId,
      },
    ])
  }

  const removeChord = (id) => {
    setProgression((prev) => prev.filter((chord) => chord.id !== id))
  }

  const moveChord = (index, direction) => {
    setProgression((prev) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const clearProgression = () => setProgression([])

  const savePreset = (name) => {
    const trimmedName = name.trim()
    if (!trimmedName || progression.length === 0) {
      return
    }

    const payload = {
      id: `preset-${Date.now()}`,
      name: trimmedName,
      progression,
      transpose,
      beatsPerChord,
      isLooping,
    }

    persistPresets([payload, ...savedProgressions.filter((preset) => preset.name !== trimmedName)])
  }

  const loadPreset = (id) => {
    const preset = savedProgressions.find((item) => item.id === id)
    if (!preset) {
      return
    }

    setProgression(preset.progression)
    setTranspose(preset.transpose)
    setBeatsPerChord(preset.beatsPerChord)
    setIsLooping(preset.isLooping)
  }

  const generateRandom = (length = 4) => {
    setProgression(randomProgression(length))
  }

  const loadLibraryPreset = (presetId) => {
    const preset = PROGRESSION_PRESETS.find((item) => item.id === presetId)
    if (!preset) {
      return
    }

    setProgression(
      preset.progression.map((item, index) => ({
        ...item,
        id: `lib-${preset.id}-${index}-${Date.now()}`,
      })),
    )
  }

  const value = {
    progression,
    progressionMidiNotes,
    progressionLabel,
    transpose,
    isLooping,
    beatsPerChord,
    savedProgressions,
    libraryPresets: PROGRESSION_PRESETS,
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
    loadLibraryPreset,
    getChordById,
  }

  return <ProgressionContext.Provider value={value}>{children}</ProgressionContext.Provider>
}

export function useProgression() {
  const context = useContext(ProgressionContext)
  if (!context) {
    throw new Error('useProgression must be used inside ProgressionProvider')
  }

  return context
}
