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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          position: 'relative',
        }}
      >
        {/* Pattern */}
        <div style={{ position: 'absolute', opacity: 0.1, width: '100%', height: '100%' }}>
          <svg width="1200" height="630" viewBox="0 0 1200 630">
            {[...Array(12)].map((_, i) => (
              <circle key={i} cx={100 + i * 100} cy="315" r="60" fill="white" />
            ))}
          </svg>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          padding: '80px',
          position: 'relative',
        }}>
          {/* Icon */}
          <div style={{ display: 'flex' }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="100" fill="white" opacity="0.2"/>
              <circle cx="100" cy="90" r="45" fill="white"/>
              <circle cx="112" cy="86" r="38" fill="#059669"/>
              <path d="M100 40 L106 65 L131 70 L110 88 L115 113 L100 100 L85 113 L90 88 L69 70 L94 65 Z" fill="white"/>
              <path d="M60 100 L85 125 L140 70" stroke="white" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '700px' }}>
            <div style={{
              fontSize: '68px',
              fontWeight: '900',
              color: 'white',
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}>
              Daily Priority
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '500',
              color: 'rgba(255,255,255,0.95)',
              lineHeight: '1.4',
            }}>
              Islamic productivity app with prayer times, focus timer, goals & habits
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
