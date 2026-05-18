'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Music } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const toast = useUIStore((s) => s.toast)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({ email: data.email, password: data.password })
      toast('success', '登录成功')
      router.push('/create')
    } catch (err: unknown) {
      const error = err as { error?: string }
      toast('error', error?.error || '登录失败，请重试')
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-neon/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-neon/10 rounded-full blur-[128px]" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl gradient-cyan-purple flex items-center justify-center glow-cyan"
          >
            <Music className="h-10 w-10 text-white" />
          </motion.div>

          <h1 className="font-orbitron text-5xl font-bold glow-text-cyan">
            AI Music
          </h1>

          <div className="flex items-end gap-1 h-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-cyan-neon rounded-full"
                animate={{ height: [12, 24, 8, 28, 16][i] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>

          <p className="text-text-secondary text-lg mt-4">用AI创造你的声音</p>
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
            <span className="font-orbitron text-2xl font-bold glow-text-cyan">AI Music</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">欢迎回来</h2>
            <p className="text-text-secondary mb-8">登录你的账号继续创作</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="邮箱"
                type="email"
                placeholder="请输入邮箱地址"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                登录
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-muted text-sm">
                还没有账号？{' '}
                <Link href="/register" className="text-cyan-neon hover:underline font-medium">
                  立即注册
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}