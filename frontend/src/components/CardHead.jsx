import IconBadge from './IconBadge'

// Shared card header used across dashboard cards: an icon badge, a title,
// and an optional trailing meta pill (a count, a status, etc.).
export default function CardHead({ icon, title, meta, children }) {
  return (
    <div className="card-head">
      {icon ? <IconBadge icon={icon} size={32} /> : null}
      <h3 className="card-head__title">{title}</h3>
      {meta != null ? <span className="card-head__meta">{meta}</span> : null}
      {children}
    </div>
  )
}
