import { useState } from 'react'
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
    <div className="app">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <HowItWorks />
        <StatsBar />
        <FindWork />
        <FindContractors />
        <Pricing />
        <TrustBar />
        <FooterCta />
      </main>
    </div>
  )
}
