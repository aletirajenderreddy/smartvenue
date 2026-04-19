import Section from './Section';
import ScheduleTimeline from '../schedule/ScheduleTimeline';
import OrdersList from './OrdersList';
import NotificationsList from './NotificationsList';

export default function VendorPanel({ dashboard, handleStatus }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
      <Section title="Vendor Profile" subtitle="Your stall assignment and operation status">
        <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur transition hover:bg-white/[0.05]">
          <p className="font-heading text-xl font-bold text-white">{dashboard.vendor?.vendor_name}</p>
          <div className="flex gap-2 text-sm text-white/60 pt-2">
            <span className="font-semibold text-primary">Owner:</span> {dashboard.vendor?.owner_name}
          </div>
          <div className="flex gap-2 text-sm text-white/60">
            <span className="font-semibold text-accent">Stall:</span> {dashboard.vendor?.stall_name || 'Pending assignment'}
          </div>
          <div className="flex gap-2 text-sm text-white/60">
            <span className="font-semibold text-success">Service:</span> {dashboard.vendor?.service_type}
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6">
          <h3 className="font-heading text-lg font-bold mb-4">Event Announcements</h3>
          <NotificationsList notifications={dashboard.notifications} />
        </div>
        <div className="mt-8 border-t border-white/5 pt-6">
          <h3 className="font-heading text-lg font-bold mb-4">Today's Schedule</h3>
          <ScheduleTimeline schedule={dashboard.schedule} emptyMessage="No schedule published yet." />
        </div>
      </Section>

      <Section title="Order Queue" subtitle="Update statuses as you fulfill orders">
        <OrdersList orders={dashboard.orders} onStatusChange={handleStatus} role="vendor" />
      </Section>
    </div>
  );
}
