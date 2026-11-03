import { Box } from '@mui/material'
import { SubscriptionPanel } from './settings/panels'

export default function Billing() {
  return (
    <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      <SubscriptionPanel standalone />
    </Box>
  )
}
