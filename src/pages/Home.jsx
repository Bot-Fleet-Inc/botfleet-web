/**
 * Home — Bot Fleet Inc homepage
 *
 * WEB-10: The entire page IS the 2D Bot HQ landscape.
 * No traditional hero section — the user is already inside when the page loads.
 *
 * Renders <HQRoom /> which owns its own viewport, nav, and all brand elements.
 */

import { useFleet, STATIC_FLEET } from '../hooks/useFleet.js'
import { useStandup } from '../hooks/useStandup.js'
import { HQRoom } from './HQRoom.jsx'

export function Home() {
  const { bots, loading } = useFleet()
  const displayBots = loading ? STATIC_FLEET : bots
  const { phase, standupBots } = useStandup(displayBots)

  return (
    <HQRoom bots={standupBots} phase={phase} />
  )
}
