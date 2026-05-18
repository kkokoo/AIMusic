'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Coins,
  TrendingUp,
  Zap,
  Save,
  LogOut,
  Shield,
  Mail,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { formatCredits } from '@/utils/format'
import { profileSchema, passwordSchema } from '@/lib/validators'
import type { ProfileFormData, PasswordFormData } from '@/lib/validators'

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.FC<{ className?: string }>
  label: string
  value: string
  colorClass: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="p-2.5 md:p-4 rounded-xl bg-space-800 border border-space-600/50 flex items-center gap-2 md:gap-3"
    >
      <div className={cn('p-2 rounded-lg', `${colorClass}/10`)}>
        <Icon className={cn('w-5 h-5', colorClass)} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs text-text-muted">{label}</p>
        <p
          className="text-sm md:text-lg font-bold text-white"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateProfile, changePassword, logout } = useAuthStore()
  const { toast } = useUIStore()

  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (user) {
      resetProfile({ username: user.username })
    }
  }, [user, resetProfile])

  const onProfileSave = async (data: ProfileFormData) => {
    setProfileSaving(true)
    try {
      await updateProfile({ username: data.username })
      toast('success', '个人信息已更新')
    } catch {
      toast('error', '更新失败，请重试')
    } finally {
      setProfileSaving(false)
    }
  }

  const onPasswordSave = async (data: PasswordFormData) => {
    setPasswordSaving(true)
    try {
      await changePassword(data.oldPassword, data.newPassword)
      resetPassword()
      toast('success', '密码已修改')
    } catch {
      toast('error', '密码修改失败，请确认原密码正确')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-0">
      <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2 rounded-xl bg-cyan-neon/10 border border-cyan-neon/20">
            <User className="w-6 h-6 text-cyan-neon" />
          </div>
          <h1
            className="text-xl md:text-2xl font-bold text-cyan-neon glow-text-cyan"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            个人中心
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-6 md:mb-10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full gradient-cyan-purple flex items-center justify-center mb-3 md:mb-4 shadow-[0_0_30px_var(--color-purple-glow)]"
          >
            <span
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </span>
          </motion.div>

          <h2
            className="text-lg md:text-xl font-bold text-white mb-1"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {user.username}
          </h2>

          <div className="flex items-center gap-1.5 text-text-secondary text-sm">
            <Mail className="w-4 h-4" />
            {user.email}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-10"
        >
          <StatCard
            icon={Coins}
            label="剩余积分"
            value={formatCredits(user.credits)}
            colorClass="text-cyan-neon"
          />
          <StatCard
            icon={TrendingUp}
            label="累计充值"
            value={formatCredits(user.totalCreditsEarned)}
            colorClass="text-purple-neon"
          />
          <StatCard
            icon={Zap}
            label="累计消耗"
            value={formatCredits(user.totalCreditsSpent)}
            colorClass="text-magenta-neon"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card padding="lg">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-neon" />
              个人信息
            </h3>
            <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
              <Input
                label="用户名"
                id="username"
                {...registerProfile('username')}
                error={profileErrors.username?.message}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={profileSaving}
                >
                  <Save className="w-4 h-4" />
                  保存
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="lg">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-neon" />
              修改密码
            </h3>
            <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
              <Input
                label="原密码"
                id="oldPassword"
                type="password"
                {...registerPassword('oldPassword')}
                error={passwordErrors.oldPassword?.message}
              />
              <Input
                label="新密码"
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                error={passwordErrors.newPassword?.message}
              />
              <Input
                label="确认新密码"
                id="confirmPassword"
                type="password"
                {...registerPassword('confirmPassword')}
                error={passwordErrors.confirmPassword?.message}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  loading={passwordSaving}
                >
                  <Save className="w-4 h-4" />
                  修改密码
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="lg">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-neon" />
              账号安全
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">邮箱绑定</p>
                  <p className="text-xs text-text-muted">{user.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-neon/10 text-green-neon border border-green-neon/20">
                  已验证
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-space-600/50">
                <div>
                  <p className="text-sm text-white">注册时间</p>
                  <p className="text-xs text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-center pt-4 pb-8">
            <Button
              variant="danger"
              size="lg"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              退出登录
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}