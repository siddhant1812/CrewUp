import { Chip, Stack, Typography } from '@mui/material'
import IconBadge from './IconBadge'

// Shared card header used across dashboard cards: an icon badge, a title,
// and an optional trailing meta pill (a count, a status, etc.).
export default function CardHead({ icon, title, meta, children }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
      {icon ? <IconBadge icon={icon} size={32} /> : null}
      <Typography variant="h3" sx={{ fontSize: '1.05rem', flex: 1 }}>
        {title}
      </Typography>
      {meta != null ? (
        <Chip
          label={meta}
          size="small"
          sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600 }}
        />
      ) : null}
      {children}
    </Stack>
  )
}
