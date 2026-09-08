export default function AnnouncementCard({ announcement }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="font-medium">{announcement.title}</p>
      <p className="text-sm text-muted mt-1">{announcement.body}</p>
      <p className="text-xs text-muted mt-2">
        {new Date(announcement.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
