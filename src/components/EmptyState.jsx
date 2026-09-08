export default function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 px-6 text-center">
      <p className="text-muted">{message}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 text-sm font-medium bg-accent text-bg px-4 py-2 rounded-md hover:bg-accentDim transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
