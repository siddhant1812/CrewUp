import Icon from './Icon'

// A round, light-blue icon tile — the badge used everywhere in place of
// plain text labels: card headers, stat tiles, hero avatars, empty states.
export default function IconBadge({ icon, size = 38, iconSize, tone = 'blue', className = '' }) {
  return (
    <span
      className={`icon-badge icon-badge--${tone} ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={iconSize || Math.round(size * 0.46)} />
    </span>
  )
}
