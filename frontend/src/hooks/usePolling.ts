import { useCallback, useRef } from 'react'
import { useTaskStore } from '@/stores/taskStore'

export function usePolling() {
  const pollingRef = useRef(false)
  const pollTask = useTaskStore((s) => s.pollTask)

  const startPolling = useCallback((taskId: number) => {
    if (pollingRef.current) return
    pollingRef.current = true
    pollTask(taskId).finally(() => {
      pollingRef.current = false
    })
  }, [pollTask])

  return { startPolling }
}