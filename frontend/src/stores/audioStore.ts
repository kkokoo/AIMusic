import { create } from 'zustand'

interface PlaylistItem {
  url: string
  name: string
}

interface AudioState {
  currentUrl: string | null
  currentName: string
  isPlaying: boolean
  currentTime: number
  duration: number
  audioRef: HTMLAudioElement | null
  playlist: PlaylistItem[]
  currentIndex: number

  play: (url: string, name?: string) => void
  playPlaylist: (songs: PlaylistItem[], startIndex?: number) => void
  playNext: () => void
  playPrev: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (time: number) => void
  setAudioRef: (ref: HTMLAudioElement | null) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
}

function createAudioElement(url: string, onEnded: () => void) {
  const audio = new Audio(url)
  audio.preload = 'metadata'
  audio.addEventListener('ended', onEnded)
  return audio
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentUrl: null,
  currentName: '',
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioRef: null,
  playlist: [],
  currentIndex: -1,

  play: (url: string, name?: string) => {
    const { audioRef, currentUrl } = get()
    if (currentUrl === url && audioRef) {
      audioRef.play()
      set({ isPlaying: true })
      return
    }

    if (audioRef) {
      audioRef.pause()
      audioRef.src = ''
    }

    const handleEnded = () => {
      const { playlist, currentIndex } = get()
      if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
        get().playNext()
      } else {
        set({ isPlaying: false, currentUrl: null, duration: 0, currentTime: 0 })
      }
    }

    const audio = createAudioElement(url, handleEnded)
    audio.addEventListener('timeupdate', () => set({ currentTime: audio.currentTime }))
    audio.addEventListener('loadedmetadata', () => set({ duration: audio.duration }))
    audio.addEventListener('play', () => set({ isPlaying: true }))
    audio.addEventListener('pause', () => set({ isPlaying: false }))

    audio.play().catch(() => set({ isPlaying: false }))

    set({
      audioRef: audio,
      currentUrl: url,
      currentName: name || '',
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })
  },

  playPlaylist: (songs, startIndex = 0) => {
    if (!songs.length) return
    const idx = Math.max(0, Math.min(startIndex, songs.length - 1))
    const song = songs[idx]
    set({ playlist: songs, currentIndex: idx })
    get().play(song.url, song.name)
  },

  playNext: () => {
    const { playlist, currentIndex } = get()
    if (currentIndex < 0 || currentIndex >= playlist.length - 1) return
    const next = playlist[currentIndex + 1]
    set({ currentIndex: currentIndex + 1 })
    get().play(next.url, next.name)
  },

  playPrev: () => {
    const { playlist, currentIndex } = get()
    if (currentIndex <= 0) return
    const prev = playlist[currentIndex - 1]
    set({ currentIndex: currentIndex - 1 })
    get().play(prev.url, prev.name)
  },

  pause: () => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.pause()
      set({ isPlaying: false })
    }
  },

  resume: () => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.play().catch(() => {})
      set({ isPlaying: true })
    }
  },

  stop: () => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.pause()
      audioRef.src = ''
    }
    set({
      audioRef: null,
      currentUrl: null,
      currentName: '',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playlist: [],
      currentIndex: -1,
    })
  },

  seek: (time: number) => {
    const { audioRef } = get()
    if (audioRef) {
      audioRef.currentTime = time
      set({ currentTime: time })
    }
  },

  setAudioRef: (ref) => set({ audioRef: ref }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))