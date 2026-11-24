import { redirect } from "next/navigation";

export default async function LegacyTechnicalEvalRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}/procurement?track=jasa&section=eval`);
}
