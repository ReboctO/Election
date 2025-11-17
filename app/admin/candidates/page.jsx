import CandidateClient from "./candidates-client";
import { getCandidates } from "../../../lib/admin/action.candidates";

export default async function CandidatesPage(params) {
    const result = await getCandidates();
    const initialCandidates = result.success? result.data : [];
    return <CandidateClient initialCandidates={initialCandidates}/>
    
}