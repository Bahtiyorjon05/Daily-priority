import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const alt = 'Daily Priority - Islamic Productivity App'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          position: 'relative',
        }}
      >
        {/* Islamic Geometric Pattern Background */}
        <div style={{ 
          position: 'absolute', 
          width: '100%', 
          height: '100%',
          display: 'flex',
          opacity: 0.1
        }}>
          <svg width="1200" height="630" viewBox="0 0 1200 630">
            {/* Repeating star pattern */}
            {[...Array(8)].map((_, i) => (
              <g key={i} transform={`translate(${i * 150}, 0)`}>
                {[...Array(5)].map((_, j) => (
                  <path
                    key={j}
                    d={`M${75 + i * 150} ${80 + j * 120} L${85 + i * 150} ${110 + j * 120} L${115 + i * 150} ${105 + j * 120} L${95 + i * 150} ${125 + j * 120} L${115 + i * 150} ${145 + j * 120} L${85 + i * 150} ${140 + j * 120} L${75 + i * 150} ${170 + j * 120} L${65 + i * 150} ${140 + j * 120} L${35 + i * 150} ${145 + j * 120} L${55 + i * 150} ${125 + j * 120} L${35 + i * 150} ${105 + j * 120} L${65 + i * 150} ${110 + j * 120} Z`}
                    fill="white"
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
        }}>
          {/* Icon */}
          <div style={{
            display: 'flex',
            marginBottom: '40px',
          }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="90" fill="white" opacity="0.15"/>
              {/* Crescent and Star */}
              <circle cx="90" cy="80" r="40" fill="white"/>
              <circle cx="100" cy="76" r="35" fill="#059669"/>
              <path d="M90 35 L95 55 L115 58 L98 72 L102 92 L90 82 L78 92 L82 72 L65 58 L85 55 Z" fill="white"/>
              {/* Checkmark */}
              <path d="M55 90 L75 110 L125 60" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>

          {/* Title */}
          <div style={{
            fontSize: '72px',
            fontWeight: '900',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px',
            letterSpacing: '-2px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            Daily Priority
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '38px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            marginBottom: '30px',
            maxWidth: '900px',
          }}>
            Islamic Productivity App
          </div>

          {/* Description */}
          <div style={{
            fontSize: '28px',
            fontWeight: '400',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: '1000px',
            lineHeight: '1.5',
          }}>
            Organize your daily tasks around prayer times • AI-powered suggestions • Built for the Muslim Ummah
          </div>

          {/* Features */}
          <div style={{
            display: 'flex',
            gap: '40px',
            marginTop: '50px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>✓</div>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: '500' }}>Prayer Times</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>✓</div>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: '500' }}>Focus Timer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>✓</div>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: '500' }}>Goals & Habits</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>✓</div>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: '500' }}>Adhkar</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
