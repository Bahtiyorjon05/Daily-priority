import { NextResponse } from 'next/server'

/**
 * Digital Asset Links, for the Play Store wrap.
 *
 * Android checks this file to confirm that this domain and the installed app are
 * the same publisher. If it verifies, the app runs full screen; if it does not,
 * the app shows a browser URL bar — which looks broken and is the single most
 * common wrap complaint.
 *
 * Served from a route rather than `public/` because the fingerprint belongs in an
 * environment variable, not in the repository: it changes if the signing key is
 * rotated, and differs between Play App Signing and a locally-signed build.
 *
 * When `ANDROID_CERT_SHA256` is unset this returns 404 rather than a file with a
 * placeholder in it. A wrong fingerprint verifies as *false*, which produces
 * exactly the URL-bar symptom above with nothing pointing at the cause; a 404 is
 * unambiguous — the file simply isn't configured yet.
 *
 * To populate it: Play Console → Release → Setup → App signing → copy the
 * SHA-256 certificate fingerprint, then set
 *   ANDROID_CERT_SHA256=AA:BB:CC:…
 *   ANDROID_PACKAGE_NAME=uz.dailypriority.app   (optional; defaults below)
 * Verify afterwards at
 *   https://developers.google.com/digital-asset-links/tools/generator
 */

const DEFAULT_PACKAGE = 'uz.dailypriority.app'

export async function GET() {
  const fingerprint = process.env.ANDROID_CERT_SHA256?.trim()

  if (!fingerprint) {
    return NextResponse.json(
      {
        error: 'Digital Asset Links not configured',
        hint: 'Set ANDROID_CERT_SHA256 to the SHA-256 signing fingerprint from the Play Console.',
      },
      { status: 404 }
    )
  }

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: process.env.ANDROID_PACKAGE_NAME?.trim() || DEFAULT_PACKAGE,
        // Android accepts a list, which is what makes key rotation possible —
        // both the old and new fingerprints can be trusted during a changeover.
        sha256_cert_fingerprints: fingerprint
          .split(',')
          .map(f => f.trim())
          .filter(Boolean),
      },
    },
  ]

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      // Android caches this; a short TTL keeps a fingerprint change from taking
      // a day to propagate.
      'Cache-Control': 'public, max-age=300',
    },
  })
}
