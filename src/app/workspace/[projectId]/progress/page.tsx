import { redirect } from "next/navigation";

export default async function LegacyProgressRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}/execution?tab=progress`);
}
