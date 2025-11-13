import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
 
export default function Icon() {
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
          borderRadius: '6px',
        }}
      >
        {/* Checkmark in circle - productivity symbol */}
        <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="45" fill="white" opacity="0.95"/>
          <path 
            d="M30 50 L42 62 L70 34" 
            stroke="#10b981" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
