import { getPositions } from '../../../lib/admin/action.position'
import PositionsClient from './position-client'

export default async function PositionsPage() {
  // Fetch data on the server
  const result = await getPositions()
  const initialPositions = result.success ? result.data : []

  // Pass to client component
  return <PositionsClient initialPositions={initialPositions} />
}