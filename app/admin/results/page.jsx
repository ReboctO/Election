import ResultsPage from "./result-client";
import { getElectionResults } from "../../../lib/admin/action.results";

export default async function ResultClient() {
    const result = await getElectionResults();
    const initialResult = result.success? result.data: []
    return <ResultsPage initialResult={initialResult}/>
}