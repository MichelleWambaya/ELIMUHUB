import { Link } from 'react-router-dom';

export default function ResourceCard({ resource }) {
  return (
    <Link
      to={`/marketplace/${resource.id}`}
      className="group block bg-surface border border-border rounded-lg overflow-hidden hover:border-accent hover:shadow-glow transition-all"
    >
      <div className="aspect-[4/3] bg-surface2 flex items-center justify-center text-muted text-sm">
        {resource.cover_image_path ? (
          <img src={resource.cover_image_path} alt={resource.title} className="w-full h-full object-cover" />
        ) : (
          'No cover image'
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug group-hover:text-accent transition-colors">{resource.title}</h3>
        <p className="text-sm text-muted mt-1">{resource.teacher?.full_name}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-muted">{resource.subjects?.name}</span>
          <span className="font-semibold">KES {Number(resource.price_kes).toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
