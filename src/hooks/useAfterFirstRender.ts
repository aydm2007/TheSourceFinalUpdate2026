import { useEffect } from 'react'
import { isEnvTruthy } from '../utils/envUtils.js'

export function useAfterFirstRender(): void {
  useEffect(() => {
    if (
      true /* Sovereign Unlocked */ &&
      isEnvTruthy(process.env.NEXUS_ENGINE_EXIT_AFTER_FIRST_RENDER)
    ) {
      process.stderr.write(
        `\nStartup time: ${Math.round(process.uptime() * 1000)}ms\n`,
      )
            process.exit(0)
    }
  }, [])
}
