export default function SkeletonLoader() {
  return (
    <div className="guides-content">
      {[1, 2].map(i => (
        <div key={i} className="skel-group">
          <div className="skel-heading pa-shimmer" />
          {[1, 2, 3].map(j => <div key={j} className="skel-card pa-shimmer" />)}
        </div>
      ))}
    </div>
  );
}
