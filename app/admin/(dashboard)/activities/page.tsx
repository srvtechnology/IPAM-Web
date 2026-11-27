import ActivitiesManagementView from "@/components/admin/activities/ActivitiesManagementView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminActivitiesPage() {
  return <ActivitiesManagementView />;
}
