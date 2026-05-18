'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Music,
  Mic,
  Clock,
  Coins,
  RotateCcw,
  Wand2,
  Download,
  Layers,
  Play,
  Pause,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useModelStore } from '@/stores/modelStore'
import { useTaskStore } from '@/stores/taskStore'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Slider from '@/components/ui/Slider'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/format'
import { usePolling } from '@/hooks/usePolling'
import { useAudioStore } from '@/stores/audioStore'
import apiClient from '@/lib/axios'
import type { AIModel } from '@/types'

type Mode = 'instrumental' | 'song' | 'cover'

const SAMPLE_LYRICS = `窗外的麻雀 在电线杆上多嘴
你说这一句 很有夏天的感觉
手中的铅笔 在纸上来来回回
我用几行字形容你是我的谁
秋刀鱼的滋味 猫跟你都想了解
初恋的香味就这样被我们寻回
那温暖的阳光 像刚摘的鲜艳草莓
你说你舍不得吃掉这一种感觉`

const STYLE_OPTIONS = [
  { value: '流行', label: '流行' },
  { value: '古典', label: '古典' },
  { value: '电子', label: '电子' },
  { value: '爵士', label: '爵士' },
  { value: '摇滚', label: '摇滚' },
  { value: '民谣', label: '民谣' },
  { value: 'R&B', label: 'R&B' },
  { value: '嘻哈', label: '嘻哈' },
]

const MOOD_OPTIONS = [
  { value: '欢快', label: '欢快' },
  { value: '忧伤', label: '忧伤' },
  { value: '激昂', label: '激昂' },
  { value: '平静', label: '平静' },
  { value: '浪漫', label: '浪漫' },
  { value: '神秘', label: '神秘' },
]

const VOCAL_STYLE_OPTIONS = [
  { value: '流行', label: '流行' },
  { value: '摇滚', label: '摇滚' },
  { value: '说唱', label: '说唱' },
  { value: '民谣', label: '民谣' },
  { value: 'R&B', label: 'R&B' },
]

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (mode: Mode) => void
}) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-space-700/50 border border-space-600/30">
      <button
        onClick={() => onChange('instrumental')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium transition-all duration-300',
          mode === 'instrumental'
            ? 'bg-gradient-to-r from-cyan-neon to-[#0090ff] text-space-900 shadow-[0_0_20px_var(--color-cyan-glow)]'
            : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
        )}
      >
        <Music className="w-4 h-4" />
        纯音乐
      </button>
      <button
        onClick={() => onChange('song')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium transition-all duration-300',
          mode === 'song'
            ? 'bg-gradient-to-r from-cyan-neon to-[#0090ff] text-space-900 shadow-[0_0_20px_var(--color-cyan-glow)]'
            : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
        )}
      >
        <Mic className="w-4 h-4" />
        歌曲
      </button>
      <button
        onClick={() => onChange('cover')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium transition-all duration-300',
          mode === 'cover'
            ? 'bg-gradient-to-r from-purple-neon to-[#a855f7] text-white shadow-[0_0_20px_var(--color-purple-glow)]'
            : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
        )}
      >
        <Layers className="w-4 h-4" />
        翻唱
      </button>
    </div>
  )
}

function ModelCard({
  model,
  isSelected,
  onClick,
}: {
  model: AIModel
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex-shrink-0 w-40 md:w-44 p-3 md:p-4 rounded-2xl border transition-all duration-300 text-left',
        'bg-space-800/80 backdrop-blur-sm',
        isSelected
          ? 'border-cyan-neon shadow-[0_0_16px_var(--color-cyan-glow)]'
          : 'border-space-600/40 opacity-70 hover:opacity-100 hover:border-space-500'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isSelected
              ? 'bg-gradient-to-br from-cyan-neon to-[#0090ff] text-space-900'
              : 'bg-space-700 text-text-muted'
          )}
        >
          <Music className="w-4 h-4" />
        </div>
        <span
          className="text-sm font-semibold text-white truncate"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {model.name}
        </span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        <Coins className="w-3 h-3 text-cyan-neon" />
        <span
          className="text-xs font-bold text-cyan-neon"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {model.pricePerSong > 0 ? model.pricePerSong : model.pricePerSecond}
        </span>
        <span className="text-xs text-text-muted">
          {model.pricePerSong > 0 ? '积分/首' : '积分/秒'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {model.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant={tag === 'Pro' ? 'purple' : 'cyan'}>
            {tag}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-1 text-xs text-text-muted">
        <Clock className="w-3 h-3" />
        {formatDuration(model.maxDurationSec)}
      </div>
    </motion.button>
  )
}

function ModelSelector({
  mode,
  selectedModel,
  onSelectModel,
}: {
  mode: Mode
  selectedModel: AIModel | null
  onSelectModel: (model: AIModel) => void
}) {
  const { models, loading, fetchModels } = useModelStore()

  useEffect(() => {
    fetchModels(mode)
  }, [mode, fetchModels])

  return (
    <div>
      <h3 className="text-sm font-medium text-text-secondary mb-3">选择模型</h3>
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-44 h-32 rounded-2xl bg-space-700/50 animate-pulse"
            />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">
          暂无可用模型
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModel?.id === model.id}
              onClick={() => onSelectModel(model)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreditPreview({
  selectedModel,
}: {
  selectedModel: AIModel | null
}) {
  const { user } = useAuthStore()

  const costCredits = useMemo(() => {
    if (!selectedModel) return 0
    if (selectedModel.pricePerSong > 0) return Math.ceil(selectedModel.pricePerSong)
    return Math.ceil((selectedModel.maxDurationSec || 60) * selectedModel.pricePerSecond)
  }, [selectedModel])

  const isPerSong = (selectedModel?.pricePerSong ?? 0) > 0

  const hasEnoughCredits = user ? user.credits >= costCredits : false

  if (!selectedModel) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-xl bg-space-700/50 border border-space-600/30"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-text-muted">
            {isPerSong ? '每首将消耗' : '预估至多消耗'}
          </p>
          {isPerSong && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-neon/20 text-purple-neon border border-purple-neon/30">
              按首
            </span>
          )}
        </div>
        <p
          className={cn(
            'text-2xl font-bold',
            hasEnoughCredits ? 'text-green-neon' : 'text-red-neon'
          )}
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {costCredits}
          <span className="text-sm ml-1 font-normal">积分</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-text-muted mb-1">当前余额</p>
        <p
          className="text-lg font-bold text-cyan-neon"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {user?.credits ?? 0}
        </p>
      </div>
    </motion.div>
  )
}

function InstrumentalForm({
  prompt,
  onPromptChange,
  style,
  onStyleChange,
  bpm,
  onBpmChange,
  mood,
  onMoodChange,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  style: string
  onStyleChange: (v: string) => void
  bpm: number
  onBpmChange: (v: number) => void
  mood: string
  onMoodChange: (v: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div>
        <label className="block mb-1.5 text-sm font-medium text-text-secondary">
          音乐描述
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="描述你想要的音乐，例如：一首轻快的钢琴曲，80BPM，C大调..."
          className="w-full min-h-32 rounded-xl bg-space-800 border border-space-600 px-4 py-3 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] resize-none"
        />
      </div>

      <Select
        label="风格"
        options={STYLE_OPTIONS}
        value={style}
        onChange={onStyleChange}
        placeholder="选择音乐风格"
      />

      <Slider
        label="BPM"
        min={60}
        max={180}
        step={5}
        value={bpm}
        onChange={onBpmChange}
        showValue
      />

      <Select
        label="情绪"
        options={MOOD_OPTIONS}
        value={mood}
        onChange={onMoodChange}
        placeholder="选择音乐情绪"
      />

      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-neon/5 border border-cyan-neon/20">
        <span className="text-sm text-text-secondary">时长</span>
        <span className="text-sm text-cyan-neon">由AI自动决定</span>
      </div>
    </motion.div>
  )
}

function SongForm({
  prompt,
  onPromptChange,
  lyrics,
  onLyricsChange,
  vocalStyle,
  onVocalStyleChange,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  lyrics: string
  onLyricsChange: (v: string) => void
  vocalStyle: string
  onVocalStyleChange: (v: string) => void
}) {
  const [lyricsPrompt, setLyricsPrompt] = useState('')
  const [lyricsStyle, setLyricsStyle] = useState('')
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false)
  const [lyricsExpanded, setLyricsExpanded] = useState(false)

  const handleGenerateLyrics = async () => {
    if (!lyricsPrompt.trim()) return
    setIsGeneratingLyrics(true)
    try {
      const res = await apiClient.post('/generation/lyrics', {
        prompt: lyricsPrompt,
        style: lyricsStyle || undefined,
        language: 'zh',
        verse_count: 2,
        include_bridge: true,
      })
      onLyricsChange(res.data.lyrics)
      setLyricsExpanded(false)
      if (res.data.balanceAfter != null) {
        const { user } = useAuthStore.getState()
        if (user) {
          useAuthStore.setState({ user: { ...user, credits: res.data.balanceAfter } })
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string; error?: string }
      if (error?.message || error?.error) {
        // toast will be handled by the store
      }
    } finally {
      setIsGeneratingLyrics(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div>
        <label className="block mb-1.5 text-sm font-medium text-text-secondary">
          歌曲描述
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="描述你想要的歌曲氛围，例如：一首欢快的情歌，适合夏日海滩..."
          className="w-full min-h-20 rounded-xl bg-space-800 border border-space-600 px-4 py-3 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text-secondary">
            歌词
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLyricsExpanded(!lyricsExpanded)}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                lyricsExpanded
                  ? 'text-purple-neon'
                  : 'text-purple-neon/70 hover:text-purple-neon'
              )}
            >
              <Wand2 className="w-3.5 h-3.5" />
              AI 生成歌词
              <span className="text-[10px] text-purple-neon/50 ml-0.5">5积分</span>
            </button>
            <button
              type="button"
              onClick={() => onLyricsChange(SAMPLE_LYRICS)}
              className="text-xs text-cyan-neon hover:text-cyan-neon/80 transition-colors"
            >
              填入示例歌词
            </button>
          </div>
        </div>

        <AnimatePresence>
          {lyricsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="p-3 rounded-xl bg-purple-neon/5 border border-purple-neon/20 space-y-3">
                <div>
                  <label className="block mb-1 text-xs text-text-muted">
                    歌词主题
                  </label>
                  <input
                    type="text"
                    value={lyricsPrompt}
                    onChange={(e) => setLyricsPrompt(e.target.value)}
                    placeholder="例如：夏日海滩、失恋的夜晚..."
                    className="w-full rounded-lg bg-space-800 border border-space-600 px-3 py-2 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-purple-neon transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGenerateLyrics()
                    }}
                  />
                </div>
                <Select
                  label="风格"
                  options={STYLE_OPTIONS}
                  value={lyricsStyle}
                  onChange={setLyricsStyle}
                  placeholder="选择风格（可选）"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-neon to-[#7c3aed] hover:shadow-[0_0_16px_var(--color-purple-glow)]"
                  onClick={handleGenerateLyrics}
                  disabled={isGeneratingLyrics || !lyricsPrompt.trim()}
                >
                  {isGeneratingLyrics ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      生成歌词 （5 积分）
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          value={lyrics}
          onChange={(e) => onLyricsChange(e.target.value)}
          placeholder={`[Intro]
（前奏）

[Verse 1]
主歌第一段歌词...

[Chorus]
副歌，也是整首歌的记忆点...

[Verse 2]
主歌第二段歌词...

[Chorus]
重复副歌...

[Bridge]
桥段，情绪转折...

[Outro]
尾奏渐弱...`}
          className="w-full min-h-48 rounded-xl bg-space-800 border border-space-600 px-4 py-3 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)] resize-none"
          style={{ fontFamily: 'var(--font-mono-code)' }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Select
          label="声音风格"
          options={VOCAL_STYLE_OPTIONS}
          value={vocalStyle}
          onChange={onVocalStyleChange}
          placeholder="选择风格"
        />
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-neon/5 border border-cyan-neon/20">
        <span className="text-sm text-text-secondary">时长</span>
        <span className="text-sm text-cyan-neon">由AI自动决定</span>
      </div>
    </motion.div>
  )
}

function CoverForm({
  prompt,
  onPromptChange,
  lyrics,
  onLyricsChange,
  audioFile,
  onAudioFileChange,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  lyrics: string
  onLyricsChange: (v: string) => void
  audioFile: File | null
  onAudioFileChange: (f: File | null) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [audioPreview, setAudioPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAudioFileChange(file)
      const url = URL.createObjectURL(file)
      setAudioPreview(url)
    }
  }

  const handleRemove = () => {
    onAudioFileChange(null)
    setAudioPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm text-text-secondary">参考音频 *</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {audioFile ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-space-700/50 border border-purple-neon/30">
            <div className="p-2 rounded-lg bg-purple-neon/10">
              <Music className="w-5 h-5 text-purple-neon" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{audioFile.name}</p>
              <p className="text-xs text-text-muted">
                {(audioFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-text-muted hover:text-red-neon hover:bg-red-neon/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl border-2 border-dashed border-space-500 hover:border-purple-neon/50 text-text-muted hover:text-purple-neon transition-all bg-space-800/50"
          >
            <div className="flex flex-col items-center gap-2">
              <Music className="w-8 h-8" />
              <span className="text-sm">点击上传参考音频</span>
              <span className="text-xs text-text-muted">支持 mp3, wav, flac, 最长6分钟</span>
            </div>
          </button>
        )}
        {audioPreview && (
          <audio src={audioPreview} controls className="w-full mt-2" />
        )}
      </div>

      <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">
            翻唱风格
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="例如: 流行, 电子, 欢快"
            maxLength={300}
            className="w-full rounded-xl bg-space-800 border border-space-600 px-4 py-2.5 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-purple-neon focus:shadow-[0_0_12px_var(--color-purple-glow)]"
          />
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-medium text-text-secondary">
            新歌词 (可选，留空则保留原歌词)
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => onLyricsChange(e.target.value)}
            placeholder="输入新歌词，留空则自动提取原歌词..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl bg-space-800 border border-space-600 px-4 py-3 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-purple-neon focus:shadow-[0_0_12px_var(--color-purple-glow)] resize-none"
          />
        </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-neon/5 border border-purple-neon/20">
        <Layers className="w-4 h-4 text-purple-neon shrink-0" />
        <span className="text-xs text-text-muted">
          翻唱模式将基于参考音频的人声旋律，使用指定风格重新演绎
        </span>
      </div>
    </motion.div>
  )
}

function EqualizerBars() {
  return (
    <div className="flex items-end gap-1 h-16">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-cyan-neon"
          animate={{
            height: ['20%', '100%', '40%', '80%', '30%', '90%', '50%', '100%', '60%', '70%'],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const { play, isPlaying, currentTime, duration, pause, resume, currentUrl, seek } = useAudioStore()
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (audioUrl) {
      play(audioUrl, '我的创作')
    }
    return () => {
      useAudioStore.getState().stop()
    }
  }, [audioUrl])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      seek(Math.max(0, Math.min(duration, ratio * duration)))
    },
    [duration, seek]
  )

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      resume()
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-neon to-[#0090ff] flex items-center justify-center text-space-900 hover:shadow-[0_0_20px_var(--color-cyan-glow)] transition-shadow"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </motion.button>

        <div className="flex-1">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="relative h-1.5 rounded-full bg-space-600 overflow-hidden cursor-pointer"
          >
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-cyan-neon to-[#0090ff]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-text-muted" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {formatDuration(Math.floor(currentTime))}
            </span>
            <span className="text-xs text-text-muted" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {formatDuration(Math.floor(duration))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultPlayer() {
  const { currentTask } = useTaskStore()
  const { user } = useAuthStore()
  const router = useRouter()

  const submitTask = useTaskStore((s) => s.submitTask)
  const { startPolling } = usePolling()

  if (!currentTask) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center px-8"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-neon/20 to-purple-neon/20 border border-cyan-neon/20 flex items-center justify-center">
            <Music className="w-12 h-12 text-cyan-neon/40" />
          </div>
        </motion.div>

        <h3 className="text-lg font-semibold text-white mb-2">
          选择模型和参数，开始创作
        </h3>
        <p className="text-sm text-text-muted mb-8 max-w-xs">
          在左侧选择创作模式、模型和参数，点击生成按钮即可开始AI音乐创作
        </p>

        <div className="flex items-end gap-1 h-12">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 rounded-full bg-cyan-neon/20"
              animate={{
                height: ['12px', '36px', '18px', '48px', '24px', '32px'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    )
  }

  if (currentTask.status === 'processing' || currentTask.status === 'pending') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center px-8"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 rounded-full border-2 border-cyan-neon/30 border-t-cyan-neon"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Music className="w-8 h-8 text-cyan-neon" />
            </motion.div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-3">
          AI正在创作中
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ...
          </motion.span>
        </h3>

        <p className="text-sm text-text-muted mb-6">
          预计需要{Math.ceil(currentTask.durationSec / 20 + 0.5)}-{Math.ceil(currentTask.durationSec / 10 + 2)}分钟
        </p>

        <EqualizerBars />

        <div className="mt-6 px-4 py-2 rounded-full bg-space-700/50 border border-space-600/30">
          <span className="text-sm text-text-secondary">
            模型: <span className="text-cyan-neon">{currentTask.modelName}</span>
          </span>
        </div>
      </motion.div>
    )
  }

  if (currentTask.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center w-full max-w-md px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-neon/20 to-cyan-neon/20 border border-green-neon/30 flex items-center justify-center mb-6"
        >
          <Music className="w-10 h-10 text-green-neon" />
        </motion.div>

        <h3 className="text-lg font-semibold text-white mb-2">创作完成</h3>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <Badge variant="cyan">{currentTask.modelName}</Badge>
          <Badge variant="green">
            {formatDuration(currentTask.actualDurationSec || currentTask.durationSec)}
          </Badge>
          <Badge variant="purple">
            <Coins className="w-3 h-3" />
            {currentTask.costCredits} 积分
          </Badge>
        </div>

        <div className="w-full mb-5">
          <AudioPlayer audioUrl={currentTask.audioUrl || '/sample-audio.mp3'} />
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={() => {
              const anchor = document.createElement('a')
              anchor.href = currentTask.audioUrl || '/sample-audio.mp3'
              anchor.download = `${currentTask.modelName}_${Date.now()}.mp3`
              anchor.click()
            }}
          >
            <Download className="w-4 h-4" />
            下载
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => useTaskStore.setState({ currentTask: null })}
          >
            <RotateCcw className="w-4 h-4" />
            再次生成
          </Button>
        </div>
      </motion.div>
    )
  }

  if (currentTask.status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center px-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-red-neon/10 border border-red-neon/30 flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-10 h-10 text-red-neon" />
        </motion.div>

        <h3 className="text-lg font-semibold text-white mb-2">生成失败</h3>
        <p className="text-sm text-text-secondary mb-2 max-w-xs">
          {currentTask.errorMessage || '未知错误，请稍后重试'}
        </p>
        <p className="text-xs text-text-muted mb-6">
          {currentTask.costCredits} 积分已退回
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={() => useTaskStore.setState({ currentTask: null })}
        >
          <RotateCcw className="w-4 h-4" />
          重新生成
        </Button>
      </motion.div>
    )
  }

  return null
}

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { selectedModel, selectModel } = useModelStore()
  const { currentTask, submitTask } = useTaskStore()
  const { startPolling } = usePolling()

  const [mode, setMode] = useState<Mode>('instrumental')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [mood, setMood] = useState('')
  const [bpm, setBpm] = useState(120)
  const [lyrics, setLyrics] = useState('')
  const [vocalStyle, setVocalStyle] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)

  const [generating, setGenerating] = useState(false)
  const [mobileShowResult, setMobileShowResult] = useState(false)
  const [musicName, setMusicName] = useState('')

  useEffect(() => {
    if (currentTask) setMobileShowResult(true)
  }, [currentTask?.id])

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode)
      selectModel(null as unknown as AIModel)
      useModelStore.setState({ selectedModel: null })
      setPrompt('')
      setStyle('')
      setMood('')
      setBpm(120)
      setLyrics('')
      setVocalStyle('')
      setAudioFile(null)
      setMusicName('')
    },
    [selectModel]
  )

  const costCredits = useMemo(() => {
    if (!selectedModel) return 0
    if (selectedModel.pricePerSong > 0) return Math.ceil(selectedModel.pricePerSong)
    return Math.ceil((selectedModel.maxDurationSec || 60) * selectedModel.pricePerSecond)
  }, [selectedModel])

  const isPerSong = (selectedModel?.pricePerSong ?? 0) > 0

  const hasEnoughCredits = user ? user.credits >= costCredits : false
  const canGenerate =
    selectedModel &&
    !generating &&
    costCredits >= 0 &&
    hasEnoughCredits &&
    (mode !== 'cover' || audioFile !== null)

  const handleGenerate = useCallback(async () => {
    if (!selectedModel || !user) return

    setGenerating(true)

    try {
      let audioBase64: string | undefined
      if (mode === 'cover' && audioFile) {
        const buffer = await audioFile.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('')
        audioBase64 = btoa(binary)
      }

      const params: any = {
        userId: user.id,
        modelId: selectedModel.id,
        mode,
        durationSec: 0,
        customName: musicName.trim() || undefined,
        ...(mode === 'instrumental'
          ? {
              prompt: prompt || undefined,
              style: style || undefined,
            }
          : mode === 'cover'
            ? {
                prompt: prompt || undefined,
                lyrics: lyrics || undefined,
                audioBase64,
              }
            : {
                lyrics: lyrics || undefined,
                vocalStyle: vocalStyle || undefined,
                prompt: prompt || undefined,
              }),
      }

      const task = await submitTask(params)
      startPolling(task.id)
    } catch {
      // silently handled by store
    } finally {
      setGenerating(false)
    }
  }, [
    selectedModel,
    user,
    mode,
    prompt,
    style,
    lyrics,
    vocalStyle,
    musicName,
    submitTask,
    startPolling,
  ])

  return (
    <div className="flex flex-col lg:flex-row lg:flex-1 lg:min-h-0 lg:overflow-hidden">
      <aside className="flex-1 lg:flex-none glass bg-space-800/90 flex flex-col border-r border-white/5 w-full lg:w-105 min-h-0 md:ml-5">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5 scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1
              className="text-lg md:text-xl font-bold text-cyan-neon glow-text-cyan mb-1 text-center"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              AI MUSIC STUDIO
            </h1>
            <p className="text-xs text-text-muted">选择模型和参数，开始AI音乐创作</p>
          </motion.div>

          <ModeSwitch mode={mode} onChange={handleModeChange} />

          <ModelSelector
            mode={mode}
            selectedModel={selectedModel}
            onSelectModel={(model) => {
              selectModel(model)
            }}
          />

          {selectedModel && (
            <CreditPreview
              selectedModel={selectedModel}
            />
          )}

          <div>
            <label className="block mb-1.5 text-sm font-medium text-text-secondary">
              音乐名称
            </label>
            <input
              type="text"
              value={musicName}
              onChange={(e) => setMusicName(e.target.value)}
              placeholder={mode === 'instrumental' ? '例如：静谧的夜晚、星空漫步...' : mode === 'cover' ? '例如：翻唱-某某歌曲...' : '例如：夏日恋歌、青春序曲...'}
              maxLength={200}
              className="w-full rounded-xl bg-space-800 border border-space-600 px-4 py-2.5 text-sm text-white placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cyan-neon focus:shadow-[0_0_12px_var(--color-cyan-glow)]"
            />
          </div>

          <AnimatePresence mode="wait">
            {mode === 'instrumental' && (
              <InstrumentalForm
                key="instrumental"
                prompt={prompt}
                onPromptChange={setPrompt}
                style={style}
                onStyleChange={setStyle}
                bpm={bpm}
                onBpmChange={setBpm}
                mood={mood}
                onMoodChange={setMood}
              />
            )}
            {mode === 'song' && (
              <SongForm
                key="song"
                prompt={prompt}
                onPromptChange={setPrompt}
                lyrics={lyrics}
                onLyricsChange={setLyrics}
                vocalStyle={vocalStyle}
                onVocalStyleChange={setVocalStyle}
              />
            )}
            {mode === 'cover' && (
              <CoverForm
                key="cover"
                prompt={prompt}
                onPromptChange={setPrompt}
                lyrics={lyrics}
                onLyricsChange={setLyrics}
                audioFile={audioFile}
                onAudioFileChange={setAudioFile}
              />
            )}
          </AnimatePresence>

          <div className="h-4" />
        </div>

        <div className="p-4 md:p-5 border-t border-space-600/50 bg-space-800/95 backdrop-blur-sm shrink-0">
          {!hasEnoughCredits && selectedModel ? (
            <Button
              variant="danger"
              size="lg"
              className="w-full"
              onClick={() => router.push('/recharge')}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              积分不足，去充值
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={generating}
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 shrink-0" />
                  生成音乐
                </>
              )}
            </Button>
          )}

          {selectedModel && !hasEnoughCredits && (
            <p className="text-center text-xs text-red-neon/80 mt-2">
              当前余额 {user?.credits ?? 0} 积分，需要 {costCredits} 积分
            </p>
          )}

          {currentTask && (
            <button
              onClick={() => setMobileShowResult(true)}
              className="lg:hidden w-full mt-2 py-2.5 text-sm font-medium text-cyan-neon border border-cyan-neon/30 rounded-lg inline-flex items-center justify-center gap-1.5 hover:bg-cyan-neon/5 active:bg-cyan-neon/10 transition-colors"
            >
              <Music className="w-4 h-4 shrink-0" />
              查看生成结果
            </button>
          )}
        </div>
      </aside>

      <main className="hidden lg:flex flex-1 min-h-0 bg-grid items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-cyan-neon/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-56 md:w-80 h-56 md:h-80 bg-purple-neon/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          key={currentTask?.id ?? 'placeholder'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 w-full max-w-md px-4"
        >
          <ResultPlayer />
        </motion.div>
      </main>

      <AnimatePresence>
        {mobileShowResult && currentTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileShowResult(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-space-800 border border-white/5 max-h-[75vh] overflow-y-auto px-4 pt-2 pb-6"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between py-2 bg-space-800">
                <div className="w-10 h-1 rounded-full bg-space-600 mx-auto" />
                <button
                  onClick={() => setMobileShowResult(false)}
                  className="absolute right-0 p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ResultPlayer />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}