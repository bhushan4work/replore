import RepoOverview from "@/frontend/components/repo-overview";

export default function Page() {
  return (
    <RepoOverview
      repoName="CodebaseX"
      stars={1452}
      languages={["TypeScript", "Python", "CSS"]}
      lastUpdated="2 hours ago"
      stats={{
        totalFiles: 421,
        linesOfCode: 58231,
        primaryLanguagePercent: "78%",
        contributors: 12,
      }}
      fileTree={[
        {
          id: "1",
          name: "src",
          type: "folder",
          children: [
            {
              id: "2",
              name: "app",
              type: "folder",
              children: [
                {
                  id: "3",
                  name: "page.tsx",
                  type: "file",
                },
              ],
            },
          ],
        },
      ]}
    />
  );
}