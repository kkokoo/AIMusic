import { useState, useEffect } from 'react'

/**
 * 防抖 hook：延迟更新值，适用于搜索输入
 * @param value 原始值
 * @param delay 延迟毫秒数，默认 400ms
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
