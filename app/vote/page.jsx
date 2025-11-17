import { getVotes } from "../../lib/admin/action.voting"; 
import VotePage from "./vote-client";

export default async function VoteClient() {

  const result = await getVotes();
  const initialVotes = result.success? result.data : [];

  return <VotePage initialVotes={initialVotes}/>
  
}