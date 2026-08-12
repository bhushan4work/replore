import RepoDocs from "@/components/repo-docs";
import { ApiError, getRepositoryDocs } from "@/lib/api";

function DocsError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#2a2a2a] bg-[#161616] p-8">
        <h1 className="text-xl font-semibold">Unable to load documentation</h1>
        <p className="mt-2 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ repositoryId: string }>;
}) {
  const { repositoryId } = await params;

  let documentation: string;

  try {
    ({ documentation } = await getRepositoryDocs(repositoryId));
  } catch (err) {
    return (
      <DocsError
        message={
          err instanceof ApiError
            ? err.message
            : "The backend could not be reached. Make sure it is running."
        }
      />
    );
  }

  return <RepoDocs markdown={documentation} />;
}