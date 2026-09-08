import { Link } from 'react-router-dom';

export default function ResourceCard({ resource }) {
  return (
    <Link
      to={`/marketplace/${resource.id}`}
      className="group block bg-surface border border-border rounded-lg overflow-hidden hover:border-accent hover:shadow-glow transition-all"
    >
      <div className="aspect-[4/3] bg-surface2 flex items-center justify-center text-muted text-sm relative">
        {resource.cover_image_path ? (
          <img src={resource.cover_image_path} alt={resource.title} className="w-full h-full object-cover" />
        ) : (
          'No cover image'
        )}
        {resource.categories?.name && (
          <span className="absolute top-2 left-2 bg-bg/80 backdrop-blur-sm text-ink text-xs px-2 py-0.5 rounded-full border border-border">
            {resource.categories.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium leading-snug group-hover:text-accent transition-colors">{resource.title}</h3>
        <p className="text-sm text-muted mt-1">{resource.teacher?.full_name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm text-muted">{resource.subjects?.name}</span>
          {resource.rating && <RatingStars value={resource.rating.avg} count={resource.rating.count} />}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">KES {Number(resource.price_kes).toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}

export function RatingStars({ value, count, size = 'sm' }) {
  const rounded = Math.round(value);
  return (
    <span className={`flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-muted`}>
      <span className="text-accent" aria-hidden="true">
        {'★'.repeat(rounded)}
        {'☆'.repeat(5 - rounded)}
      </span>
      {typeof count === 'number' && <span>({count})</span>}
    </span>
  );
}
