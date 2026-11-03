import { useState } from 'react'
import { Box } from '@mui/material'
import Header from '../components/Header'
import HowItWorks from '../components/HowItWorks'
import StatsBar from '../components/StatsBar'
import FindWork from '../components/FindWork'
import FindContractors from '../components/FindContractors'
import Pricing from '../components/Pricing'
import TrustBar from '../components/TrustBar'
import FooterCta from '../components/FooterCta'

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Box>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Box component="main">
        <HowItWorks />
        <StatsBar />
        <FindWork />
        <FindContractors />
        <Pricing />
        <TrustBar />
        <FooterCta />
      </Box>
    </Box>
  )
}
