'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Music } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerSchema, type RegisterFormData } from '@/lib/validators'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import apiClient from '@/lib/axios'

export default function RegisterPage() {
  const router = useRouter()
  const registerUser = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)
  const toast = useUIStore((s) => s.toast)

  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const sendVerifyCode = useCallback(async () => {
    const email = getValues('email')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('error', '请先输入有效的邮箱地址')
      return
    }

    setSendingCode(true)
    try {
      await apiClient.post('/auth/send-verify-code', { email })
      toast('success', '验证码已发送，请查收邮件')

      setCountdown(60)
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string }
      toast('error', error?.error || error?.message || '发送失败，请重试')
    } finally {
      setSendingCode(false)
    }
  }, [getValues, toast])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        verifyCode: data.verifyCode,
      })
      toast('success', '注册成功！')
      router.push('/create')
    } catch (err: unknown) {
      const error = err as { error?: string }
      toast('error', error?.error || '注册失败，请重试')
    }
  }

  return (
    <div className="flex min-h-dvh">
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex w-1/2 bg-space-800 relative overflow-hidden flex-col items-center justify-center"
      >
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-neon/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-neon/10 rounded-full blur-[128px]" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl gradient-cyan-purple flex items-center justify-center glow-purple"
          >
            <Music className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="font-orbitron text-5xl font-bold glow-text-purple">
            AI Music
          </h1>

          <div className="flex items-end gap-1 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-purple-neon rounded-full"
                animate={{ height: [16, 8, 24, 12, 20][i] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>

          <p className="text-text-secondary text-lg mt-4">加入我们，开启AI音乐之旅</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex w-full lg:w-1/2 items-center justify-center px-5 md:px-8 py-8 md:py-12"
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl gradient-cyan-purple flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="font-orbitron text-2xl font-bold glow-text-purple">AI Music</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">创建账号</h2>
            <p className="text-text-secondary mb-8">注册账户，开始你的AI音乐创作之旅</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="用户名"
                type="text"
                placeholder="请输入用户名"
                error={errors.username?.message}
                {...register('username')}
              />

              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-secondary">
                  验证码
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className={`w-full px-4 py-2.5 rounded-lg bg-space-700 border ${
                        errors.verifyCode ? 'border-red-500' : 'border-space-600'
                      } text-white placeholder-text-muted focus:outline-none focus:border-cyan-neon transition-colors`}
                      {...register('verifyCode')}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={countdown > 0 || sendingCode}
                    onClick={sendVerifyCode}
                    className="whitespace-nowrap shrink-0"
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Button>
                </div>
                {errors.verifyCode && (
                  <p className="text-xs text-red-400 mt-1">{errors.verifyCode.message}</p>
                )}
              </div>

              <Input
                label="密码"
                type="password"
                placeholder="请输入密码（至少6位）"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                注册
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-muted text-sm">
                已有账号？{' '}
                <Link href="/login" className="text-purple-neon hover:underline font-medium">
                  立即登录
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}