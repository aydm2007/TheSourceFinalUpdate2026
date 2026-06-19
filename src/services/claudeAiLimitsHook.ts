import { useEffect, useState } from 'react'
import {
  type ZenithAILimits,
  currentLimits,
  statusListeners,
} from './zenithAiLimits.js'

export function useZenithAiLimits(): ZenithAILimits {
  const [limits, setLimits] = useState<ZenithAILimits>({ ...currentLimits })

  useEffect(() => {
    const listener = (newLimits: ZenithAILimits) => {
      setLimits({ ...newLimits })
    }
    statusListeners.add(listener)

    return () => {
      statusListeners.delete(listener)
    }
  }, [])

  return limits
}
