import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const authRequestExample = `curl -s 'https://doubtabase.sbs/api/auth/token' \\
  -X POST \\
  -H 'content-type: application/json' \\
  --data '{
    "email": "you@example.com",
    "password": "your-password"
  }'`;

const authResponseExample = `{
  "access_token": "<jwt>",
  "refresh_token": "<refresh-token>",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1739557565,
  "user": {
    "id": "<user-id>",
    "email": "you@example.com"
  }
}`;

const ingestRequestExample = `TOKEN="<paste-access-token>"
MESSAGE_B64=$(printf '%s' 'Need help with this topic' | base64 | tr -d '\\n')

curl 'https://doubtabase.sbs/api/doubts/ingest' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H "authorization: Bearer $TOKEN" \\
  --data-raw '{
    "message_base64": "'"$MESSAGE_B64"'",
    "title": "Auto doubt from OpenClaw",
    "subject": "Math",
    "subtopics": ["Algebra"],
    "difficulty": "medium",
    "error_tags": ["Concept gap"],
    "is_cleared": false,
    "endpoints": ["https://api.openclaw.ai/v1/messages"]
  }'`;

const ingestResponseExample = `{
  "item": {
    "id": "<doubt-id>",
    "room_id": "<personal-room-id>",
    "created_by_user_id": "<user-id>",
    "title": "Auto doubt from OpenClaw",
    "body_markdown": "Need help with this topic\\n\\n### Source Endpoints\\n- https://api.openclaw.ai/v1/messages",
    "subject": "Math",
    "subtopics": ["Algebra"],
    "difficulty": "medium",
    "error_tags": ["Concept gap"],
    "is_cleared": false,
    "created_at": "2026-02-14T00:00:00.000Z",
    "updated_at": "2026-02-14T00:00:00.000Z"
  }
}`;

export const metadata: Metadata = {
  title: "OpenClaw API Docs",
  description:
    "API reference for OpenClaw integration with Doughtabase personal vault ingest.",
};

export default function OpenClawDocsPage() {
  return (
    <main className="min-h-screen bg-base-200">
      <section className="relative isolate overflow-hidden border-b border-base-300 bg-gradient-to-br from-base-100 via-base-200 to-info/10">
        <div className="hero-grid-pan pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />
        <div className="hero-float pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-info/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-warning/25 blur-3xl" />

        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
          <header className="hero-fade-up flex items-center justify-between rounded-2xl border border-base-300 bg-base-100/75 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-2">
              <span className="badge badge-outline badge-info">OpenClaw</span>
              <span className="text-sm text-base-content/70">API Reference</span>
            </div>
            <Link href="/" className="btn btn-ghost btn-sm">
              Back to home
            </Link>
          </header>

          <div className="hero-fade-up hero-fade-up-delay-1 mt-8 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/60">
              Integration docs
            </p>
            <h1 className={`${displayFont.className} text-4xl font-bold sm:text-5xl`}>
              Push OpenClaw messages into your personal Doubtabase vault
            </h1>
            <p className="max-w-3xl text-base text-base-content/80 sm:text-lg">
              This integration uses token login and a dedicated ingest endpoint. Every
              write lands in the authenticated user&apos;s personal room only.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="hero-fade-up hero-fade-up-delay-1 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <h2 className={`${displayFont.className} text-3xl font-bold`}>Base URL</h2>
          <p className="mt-3 text-sm text-base-content/80">
            Production: <code className="rounded bg-base-200 px-1 py-0.5">https://doubtabase.sbs</code>
          </p>
          <p className="mt-2 text-sm text-base-content/80">
            Local: <code className="rounded bg-base-200 px-1 py-0.5">http://localhost:3000</code>
          </p>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-1 mt-6 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className={`${displayFont.className} text-3xl font-bold`}>
              1. Create access token
            </h2>
            <span className="badge badge-outline">POST /api/auth/token</span>
          </div>

          <p className="mt-4 text-sm text-base-content/80">
            Send email/password once and use the returned <code>access_token</code> as
            Bearer token for ingest calls.
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Request
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200/70 p-4 text-xs sm:text-sm">
            <code>{authRequestExample}</code>
          </pre>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Response
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200/70 p-4 text-xs sm:text-sm">
            <code>{authResponseExample}</code>
          </pre>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-2 mt-6 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className={`${displayFont.className} text-3xl font-bold`}>
              2. Ingest doubt
            </h2>
            <span className="badge badge-outline">POST /api/doubts/ingest</span>
          </div>

          <p className="mt-4 text-sm text-base-content/80">
            Send <code>message_base64</code> plus metadata fields. The decoded message
            becomes <code>body_markdown</code> (notes), and endpoints are appended to the
            notes body.
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Request
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200/70 p-4 text-xs sm:text-sm">
            <code>{ingestRequestExample}</code>
          </pre>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Response
          </h3>
          <pre className="mt-2 overflow-x-auto rounded-2xl border border-base-300 bg-base-200/70 p-4 text-xs sm:text-sm">
            <code>{ingestResponseExample}</code>
          </pre>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-2 mt-6 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <h2 className={`${displayFont.className} text-3xl font-bold`}>Field Reference</h2>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-base-300">
            <table className="table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>message_base64</code>
                  </td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>Base64 payload. Decoded into notes/body_markdown.</td>
                </tr>
                <tr>
                  <td>
                    <code>title</code>
                  </td>
                  <td>string</td>
                  <td>No</td>
                  <td>Doubt title (name). Auto-derived if omitted.</td>
                </tr>
                <tr>
                  <td>
                    <code>subject</code>
                  </td>
                  <td>string</td>
                  <td>No</td>
                  <td>Subject label. Defaults to OpenClaw.</td>
                </tr>
                <tr>
                  <td>
                    <code>subtopics</code>
                  </td>
                  <td>string[]</td>
                  <td>No</td>
                  <td>Up to 20 entries.</td>
                </tr>
                <tr>
                  <td>
                    <code>difficulty</code>
                  </td>
                  <td>easy | medium | hard</td>
                  <td>No</td>
                  <td>Defaults to medium.</td>
                </tr>
                <tr>
                  <td>
                    <code>error_tags</code>
                  </td>
                  <td>string[]</td>
                  <td>No</td>
                  <td>Up to 20 entries.</td>
                </tr>
                <tr>
                  <td>
                    <code>is_cleared</code>
                  </td>
                  <td>boolean</td>
                  <td>No</td>
                  <td>Defaults to false.</td>
                </tr>
                <tr>
                  <td>
                    <code>endpoints</code>
                  </td>
                  <td>string[]</td>
                  <td>No</td>
                  <td>Appended to notes under Source Endpoints.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-3 mt-6 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <h2 className={`${displayFont.className} text-3xl font-bold`}>Error Codes</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-base-300">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>400</td>
                  <td>Validation failure or invalid base64 payload.</td>
                </tr>
                <tr>
                  <td>401</td>
                  <td>Missing/invalid token credentials.</td>
                </tr>
                <tr>
                  <td>404</td>
                  <td>Personal room not available for the authenticated user.</td>
                </tr>
                <tr>
                  <td>500</td>
                  <td>Unexpected server error.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
