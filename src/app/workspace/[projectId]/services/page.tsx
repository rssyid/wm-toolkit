import { redirect } from "next/navigation";

export default async function LegacyServicesRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}/procurement?track=jasa`);
}
