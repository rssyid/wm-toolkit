import { redirect } from "next/navigation";

export default async function LegacySurveyBoqRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/workspace/${projectId}/execution?tab=boq`);
}
