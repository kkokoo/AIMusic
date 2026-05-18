'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Music,
  DollarSign,
  Users,
  Cpu,
  TrendingUp,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { mockApi } from '@/mock/data'
import { formatDate, taskStatusLabels } from '@/utils/format'
import type { DashboardStats, GenerationTask } from '@/types'

const PIE_COLORS = ['#00f0ff', '#8b5cf6', '#ff00e5', '#00ff88', '#facc15']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

function StatCard({
  title,
  value,
  icon: Icon,
  colorClass,
  suffix,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  colorClass: string
  suffix?: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card hover glow padding="lg" className="h-full">
        <div className="flex items-start justify-between mb-3">
          <span className="text-text-secondary text-sm">{title}</span>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${colorClass}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: colorClass }} />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-orbitron)', color: colorClass }}
          >
            {value}
          </span>
          {suffix && (
            <span className="text-text-muted text-sm">{suffix}</span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

const statusBadgeVariant: Record<string, 'cyan' | 'purple' | 'green' | 'red' | 'gray'> = {
  completed: 'green',
  processing: 'purple',
  pending: 'gray',
  failed: 'red',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<GenerationTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [dashboardData, allTasks] = await Promise.all([
        mockApi.getDashboard(),
        mockApi.getHistory(0, 1, 10).then((r) => r.items),
      ])
      setStats(dashboardData)
      setTasks(allTasks)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton width={120} height={28} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Skeleton variant="rectangular" height={320} />
          <Skeleton variant="rectangular" height={320} />
        </div>
      </div>
    )
  }

  const modelCount = stats?.modelUsage?.length ?? 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-cyan-neon/10 flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 text-cyan-neon" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white">仪表盘</h1>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="今日生成"
          value={stats?.todayGenerations ?? 0}
          icon={Music}
          colorClass="#00f0ff"
        />
        <StatCard
          title="今日营收"
          value={stats?.todayRevenue ?? 0}
          icon={DollarSign}
          colorClass="#00ff88"
          suffix="分"
        />
        <StatCard
          title="活跃用户"
          value={stats?.activeUsers ?? 0}
          icon={Users}
          colorClass="#8b5cf6"
        />
        <StatCard
          title="模型数量"
          value={modelCount}
          icon={Cpu}
          colorClass="#ff00e5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <motion.div variants={itemVariants}>
          <Card header={<h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-neon" />模型使用分布</h3>}>
            {stats?.modelUsage && stats.modelUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.modelUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                    stroke="transparent"
                  >
                    {stats.modelUsage.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        style={{
                          filter: `drop-shadow(0 0 6px ${PIE_COLORS[index % PIE_COLORS.length]}40)`,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#12121a',
                      border: '1px solid #252540',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-text-muted text-sm">
                暂无数据
              </div>
            )}
            {stats?.modelUsage && stats.modelUsage.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {stats.modelUsage.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="text-text-muted">({item.count})</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card header={<h3 className="font-semibold text-white flex items-center gap-2"><Music className="w-4 h-4 text-cyan-neon" />最近任务</h3>}>
            {tasks.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-muted border-b border-space-600/50">
                        <th className="text-left pb-2 font-medium">ID</th>
                        <th className="text-left pb-2 font-medium">用户</th>
                        <th className="text-left pb-2 font-medium">模型</th>
                        <th className="text-left pb-2 font-medium">模式</th>
                        <th className="text-left pb-2 font-medium">状态</th>
                        <th className="text-right pb-2 font-medium">积分</th>
                        <th className="text-right pb-2 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-space-600/20 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-2.5 text-text-muted font-mono text-xs">#{task.id}</td>
                          <td className="py-2.5 text-text-secondary">用户#{task.userId}</td>
                          <td className="py-2.5 text-white">{task.modelName}</td>
                          <td className="py-2.5">
                            <Badge variant={task.mode === 'song' ? 'purple' : 'cyan'}>
                              {task.mode === 'song' ? '歌曲' : '纯音乐'}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <Badge variant={statusBadgeVariant[task.status] || 'gray'} dot>
                              {taskStatusLabels[task.status] || task.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-right text-cyan-neon font-mono text-xs">
                            {task.costCredits}
                          </td>
                          <td className="py-2.5 text-right text-text-muted text-xs whitespace-nowrap">
                            {formatDate(task.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg bg-space-700/30 border border-space-600/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted font-mono text-xs">#{task.id}</span>
                        <Badge variant={statusBadgeVariant[task.status] || 'gray'} dot>
                          {taskStatusLabels[task.status] || task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{task.modelName}</span>
                        <Badge variant={task.mode === 'song' ? 'purple' : 'cyan'}>
                          {task.mode === 'song' ? '歌曲' : '纯音乐'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span>用户#{task.userId}</span>
                        <span className="text-cyan-neon font-mono">{task.costCredits} 积分</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-text-muted text-sm">
                暂无任务
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}