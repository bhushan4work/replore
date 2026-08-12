import RepoArchitecture from "@/components/repo-architecture";
import { ApiError, getRepositoryArchitecture } from "@/lib/api";

function ArchitectureError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8">
        <h1 className="text-xl font-semibold">Unable to load architecture</h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  let architecture: string;

  try {
    ({ architecture } = await getRepositoryArchitecture(repositoryId));
  } catch (err) {
    return (
      <ArchitectureError
        message={
          err instanceof ApiError
            ? err.message
            : "The backend could not be reached. Make sure it is running."
        }
      />
    );
  }

  return <RepoArchitecture markdown={architecture} />;
}
