import { redirect } from "next/navigation";

export default async function LegacyUspkRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}/procurement?track=jasa`);
}
