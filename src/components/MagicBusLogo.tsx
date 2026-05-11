export default function MagicBusLogo({ variant = 'light' }: { variant?: 'light' | 'dark' | 'onbrand' }) {
  const textColor = variant === 'light' ? '#1A1917' : '#FFFFFF'
  const busColor = variant === 'onbrand' ? 'rgba(255,255,255,0.75)' : '#F05510'
  const iconBg = variant === 'onbrand' ? 'rgba(255,255,255,0.2)' : '#F05510'

  return (
    <svg width="180" height="40" viewBox="0 0 220 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="13" fill={iconBg}/>
      <rect x="7" y="10" width="34" height="21" rx="5.5" fill="white"/>
      <rect x="7" y="31" width="8" height="7" rx="2" fill="white"/>
      <rect x="33" y="31" width="8" height="7" rx="2" fill="white"/>
      <rect x="9" y="13" width="13" height="9" rx="2.5" fill="#F05510"/>
      <rect x="26" y="13" width="13" height="9" rx="2.5" fill="#F05510"/>
      <text x="63" y="33" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="28" letterSpacing="-0.03em" fill={textColor}>Magic</text>
      <text x="145" y="33" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="28" letterSpacing="-0.03em" fill={busColor}>Bus</text>
    </svg>
  )
}
