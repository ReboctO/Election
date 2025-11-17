import { getVoters } from '../../../lib/admin/action.voters'
import VotersClient from './voters-client'

export default async function VotersPage() {
  // Fetch data on the server
  const result = await getVoters()
  const initialVoters = result.success ? result.data : []

  // Pass to client component
  return <VotersClient initialVoters={initialVoters} />
}