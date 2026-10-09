import EventsManagementView from "@/components/admin/events/EventsManagementView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminEventsPage() {
  return <EventsManagementView />;
}
