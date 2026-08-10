import AnalysisProgress from "@/components/analysis-progress";

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  const { job_id } = await searchParams;

  return <AnalysisProgress jobId={job_id ?? ""} />;
}
