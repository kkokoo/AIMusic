'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  X,
  ChevronUp,
} from 'lucide-react'
import { useAudioStore } from '@/stores/audioStore'
import { cn } from '@/utils/cn'

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer() {
  const {
    currentUrl,
    currentName,
    isPlaying,
    currentTime,
    duration,
    playlist,
    currentIndex,
    pause,
    resume,
    stop,
    seek,
    playNext,
    playPrev,
  } = useAudioStore()

  const progressRef = useRef<HTMLDivElement>(null)
  const isSeeking = useRef(false)
  const [showFull, setShowFull] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      isSeeking.current = true
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const ratio = (clientX - rect.left) / rect.width
      seek(Math.max(0, Math.min(duration, ratio * duration)))

      const handleMove = (ev: MouseEvent | TouchEvent) => {
        if (!isSeeking.current) return
        const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
        const r = (cx - rect.left) / rect.width
        seek(Math.max(0, Math.min(duration, r * duration)))
      }

      const handleUp = () => {
        isSeeking.current = false
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleUp)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
      document.addEventListener('touchmove', handleMove)
      document.addEventListener('touchend', handleUp)
    },
    [duration, seek],
  )

  useEffect(() => {
    if (!isSeeking.current && progress >= 99.9 && duration > 0) {
      const { playlist, currentIndex } = useAudioStore.getState()
      if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
        playNext()
      }
    }
  }, [progress, duration, playNext])

  const canPrev = playlist.length > 0 && currentIndex > 0
  const canNext = playlist.length > 0 && currentIndex < playlist.length - 1
  const togglePlay = () => (isPlaying ? pause() : resume())

  if (!currentUrl) return null

  const handleCollapse = () => {
    stop()
    setShowFull(false)
    setIsCollapsed(true)
  }

  return (
    <AnimatePresence>
      {isCollapsed ? (
        <motion.button
          key="collapsed"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCollapsed(false)}
          onMouseEnter={() => setIsCollapsed(false)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full gradient-btn glow-cyan flex items-center justify-center shadow-lg shadow-cyan-neon/20 cursor-pointer"
          title={currentName || 'AI 生成音乐'}
        >
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { repeat: Infinity, duration: 4, ease: 'linear' } : {}}
            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
            style={{
              background: 'conic-gradient(from 0deg, #06b6d4, #a855f7, #06b6d4)',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-space-900" />
          </motion.div>
        </motion.button>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onMouseLeave={() => !showFull && setIsCollapsed(true)}
          className="fixed bottom-6 right-6 z-[100] w-80 bg-space-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={isPlaying ? { repeat: Infinity, duration: 4, ease: 'linear' } : { duration: 0.3 }}
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
                style={{
                  background: 'conic-gradient(from 0deg, #06b6d4, #a855f7, #06b6d4)',
                }}
              >
                <div className="w-3 h-3 rounded-full bg-space-900" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{currentName || 'AI 生成音乐'}</p>
                <p className="text-xs text-text-muted">
                  {formatTime(currentTime)} / {formatTime(duration)}
                  {playlist.length > 1 && ` \u00b7 ${currentIndex + 1}/${playlist.length}`}
                </p>
              </div>

              <button
                onClick={handleCollapse}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={progressRef}
              onMouseDown={handleProgressDown}
              onTouchStart={handleProgressDown}
              className="w-full h-1.5 bg-space-600 rounded-full cursor-pointer relative mb-3 overflow-hidden group/progress"
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-neon to-purple-neon rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_6px_var(--color-cyan-glow)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
                animate={{ left: `calc(${progress}% - 6px)` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowFull(!showFull)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5"
              >
                <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', showFull && 'rotate-180')} />
              </button>

              <button
                onClick={() => canPrev && playPrev()}
                disabled={!canPrev}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  canPrev ? 'text-text-muted hover:text-white' : 'text-text-muted/30 cursor-not-allowed',
                )}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="w-9 h-9 rounded-full gradient-btn glow-cyan flex items-center justify-center shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </motion.button>

              <button
                onClick={() => canNext && playNext()}
                disabled={!canNext}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  canNext ? 'text-text-muted hover:text-white' : 'text-text-muted/30 cursor-not-allowed',
                )}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <a
                href={currentUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-text-muted hover:text-cyan-neon hover:bg-cyan-neon/10"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>

            {showFull && playlist.length > 1 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-white/5 space-y-1 max-h-32 overflow-y-auto"
              >
                {playlist.map((song, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      useAudioStore.getState().play(song.url, song.name)
                      useAudioStore.setState({ currentIndex: idx })
                    }}
                    className={cn(
                      'w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors',
                      idx === currentIndex
                        ? 'bg-cyan-neon/10 text-cyan-neon'
                        : 'text-text-muted hover:text-white hover:bg-white/5',
                    )}
                  >
                    <span className="truncate block">{song.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}