import { Box } from '@mui/material'
import Icon from './Icon'

const TONES = {
  blue: { bg: 'primary.light', color: 'primary.main' },
  muted: { bg: 'action.hover', color: 'text.secondary' },
}

// A round, light-blue icon tile — the badge used everywhere in place of
// plain text labels: card headers, stat tiles, hero avatars, empty states.
export default function IconBadge({ icon, size = 38, iconSize, tone = 'blue' }) {
  const palette = TONES[tone] || TONES.blue
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: palette.bg,
        color: palette.color,
      }}
    >
      <Icon name={icon} size={iconSize || Math.round(size * 0.46)} />
    </Box>
  )
}
