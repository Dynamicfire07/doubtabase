import Image from "next/image";
import Link from "next/link";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";

import { buttonVariants } from "@/components/ui/button";
import { publicAssetUrl } from "@/lib/cdn";
import { cn } from "@/lib/utils";

const uiFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
});

const studioSignals = [
  {
    label: "Capture",
    value: "12s",
    note: "Average time to log a blocker properly.",
  },
  {
    label: "Search",
    value: "1 view",
    note: "Open the room and find the doubt without tab drift.",
  },
  {
    label: "Rooms",
    value: "Private + shared",
    note: "Work alone first, then pull collaborators in when needed.",
  },
] as const;

const supportPoints = [
  {
    title: "Capture at revision speed",
    body: "Use one compact row for title, subject, tags, notes, and images. No modal maze.",
  },
  {
    title: "Keep shared rooms readable",
    body: "Realtime updates stay scoped to the room, so collaboration does not collapse into chat debris.",
  },
  {
    title: "Search like you mean it",
    body: "Filter by subject, state, subtopic, and error pattern until the queue becomes actionable.",
  },
] as const;

const workflowSteps = [
  {
    title: "Log the doubt once",
    body: "Write the actual confusion while it is fresh. Add metadata only when it helps retrieval later.",
  },
  {
    title: "Work the queue visibly",
    body: "Open blockers stay on the board until they are solved, not buried inside a conversation thread.",
  },
  {
    title: "Resolve with context intact",
    body: "Comments, attachments, and room history sit beside the doubt so the solution is still legible later.",
  },
] as const;

const faqItems = [
  {
    question: "Can I keep private doubts and shared doubts separately?",
    answer:
      "Yes. Every user gets a personal room by default, and shared rooms stay separate so collaboration does not pollute personal revision.",
  },
  {
    question: "How do I invite someone to a room?",
    answer:
      "Room owners rotate or copy a join code from the dashboard. Members use that code to enter the same workspace immediately.",
  },
  {
    question: "Is image upload supported?",
    answer:
      "Yes. JPEG, PNG, and WEBP attachments are supported, with private storage and signed access URLs.",
  },
  {
    question: "Can shared-room members delete doubts?",
    answer:
      "No. Delete access stays owner-only in shared rooms. Members can still add, edit, comment, and clear items.",
  },
  {
    question: "Will updates sync live for everyone in the room?",
    answer:
      "Yes. Realtime updates are room-scoped, so collaborators looking at the same room see changes quickly.",
  },
] as const;

const mockQueue = [
  {
    title: "Thermo derivation sign flip",
    status: "open",
    subject: "Physics",
    accent: "amber",
  },
  {
    title: "NMR splitting pattern confusion",
    status: "active",
    subject: "Chem",
    accent: "sky",
  },
  {
    title: "Integration by parts edge case",
    status: "cleared",
    subject: "Math",
    accent: "emerald",
  },
] as const;

const activityFeed = [
  { actor: "Riya", action: "added a sketch", time: "2m ago" },
  { actor: "Aman", action: "marked one solved", time: "5m ago" },
  { actor: "You", action: "tagged 3 doubts", time: "8m ago" },
] as const;

export default function Home() {
  return (
    <main
      id="main-content"
      className={`${uiFont.className} landing-root relative min-h-screen overflow-x-clip`}
    >
      <a
        href="#how-it-works"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-slate-950 focus:shadow-lg"
      >
        Skip to how it works
      </a>

      <section className="landing-hero relative isolate overflow-hidden">
        <div className="landing-noise pointer-events-none absolute inset-0" />
        <div className="hero-grid-pan pointer-events-none absolute inset-0 opacity-25" />
        <div className="hero-float pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute right-0 top-8 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="hero-float pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/12 blur-3xl" />

        <div className="landing-shell relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-14 pt-5 sm:px-6 lg:px-8">
          <header className="landing-nav hero-fade-up flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/35 bg-white/90 shadow-sm">
                <Image
                  src={publicAssetUrl("/brand-icon.svg")}
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div className="min-w-0">
                <p className={`${monoFont.className} landing-wordmark`}>Doubts App</p>
                <p className="text-sm text-slate-700/78">
                  Structured revision for serious students
                </p>
              </div>
            </div>

            <nav aria-label="Primary" className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "landing-btn landing-btn-secondary")}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={cn(buttonVariants({ size: "lg" }), "landing-btn landing-btn-primary")}
              >
                Sign up
              </Link>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-12 py-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:py-12">
            <div className="hero-fade-up hero-fade-up-delay-1 landing-copy max-w-xl space-y-7">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${monoFont.className} landing-pill`}>Revision system</span>
                  <span className="landing-dot-chip">Realtime rooms</span>
                  <span className="landing-dot-chip">Image context</span>
                </div>
                <h1
                  className={`${displayFont.className} text-pretty text-[3rem] leading-[0.9] font-semibold tracking-tight text-slate-950 sm:text-[4.5rem] lg:text-[5.6rem]`}
                >
                  Stop losing hard questions inside chats, tabs, and half-made notes.
                </h1>
                <p className="max-w-lg text-pretty text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                  Doubts App turns raw confusion into a visible queue: capture it fast,
                  keep it searchable, and clear it with the context still attached.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className={cn(buttonVariants({ size: "lg" }), "landing-btn landing-btn-primary landing-btn-lg")}
                >
                  Start your workspace
                </Link>
                <a
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "landing-btn landing-btn-secondary landing-btn-lg",
                  )}
                >
                  See the workflow
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {studioSignals.map((item) => (
                  <div key={item.label} className="landing-stat">
                    <p className={`${monoFont.className} landing-stat-label`}>{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hero-fade-up hero-fade-up-delay-2">
              <div className="landing-workbench">
                <div className="landing-workbench-header">
                  <span className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}>
                    CONTROL ROOM
                  </span>
                  <span className="landing-presence">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    3 active now
                  </span>
                </div>

                <div className="landing-stage-grid">
                  <div className="landing-stage-primary">
                    <div>
                      <p className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}>
                        LIVE ROOM
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                        IB Physics HL • Week 4
                      </h2>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                        One room for the whole chapter. Open blockers stay visible until they become solved notes.
                      </p>
                    </div>

                    <div className="landing-capture-block">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}
                          >
                            QUICK CAPTURE
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
                            Why does the electric field become zero inside a conductor in electrostatic equilibrium?
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          OPEN
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="landing-tag-chip">Physics</span>
                        <span className="landing-tag-chip">Electrostatics</span>
                        <span className="landing-tag-chip">Concept gap</span>
                        <span className="landing-tag-chip">Needs diagram</span>
                      </div>

                      <div className="landing-command-row">
                        <span className="text-xs text-slate-600">
                          Cmd + Enter saves and moves to the next row
                        </span>
                        <span className={`${monoFont.className} text-xs text-slate-500`}>
                          /capture
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="landing-stage-secondary">
                    <div className="landing-side-panel">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}>
                          QUEUE
                        </p>
                        <span className="text-xs font-medium text-slate-600">23 total</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {mockQueue.map((item) => (
                          <div key={item.title} className="landing-queue-row">
                            <div className="flex items-center justify-between gap-2">
                              <p className="line-clamp-1 text-sm font-medium text-slate-800">
                                {item.title}
                              </p>
                              <span className={`landing-status-pill landing-status-${item.accent}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="landing-side-panel">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}>
                          ACTIVITY
                        </p>
                        <span className="text-xs font-medium text-slate-600">synced live</span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {activityFeed.map((event) => (
                          <li
                            key={`${event.actor}-${event.action}`}
                            className="landing-activity-item"
                          >
                            <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                            <div>
                              <p className="text-sm text-slate-800">
                                <span className="font-semibold">{event.actor}</span> {event.action}
                              </p>
                              <p className="text-xs text-slate-500">{event.time}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="landing-activity-note">68 doubts cleared this month</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="landing-floating-note hero-fade-up hero-fade-up-delay-3 hidden sm:block">
                <p className={`${monoFont.className} text-[10px] tracking-[0.18em] text-slate-500`}>
                  TODAY
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">+17</p>
                <p className="text-xs text-slate-600">new doubts captured</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="landing-section-head">
            <div>
              <p className={`${monoFont.className} landing-section-kicker`}>Why it works</p>
              <h2
                className={`${displayFont.className} mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl`}
              >
                The product behaves like a study workflow, not a bloated admin panel.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Each surface has one job: capture, filter, discuss, or clear. That keeps the tool fast under actual revision pressure.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {supportPoints.map((feature, index) => (
              <article
                key={feature.title}
                className="landing-feature-strip hero-fade-up"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <p className={`${monoFont.className} landing-section-kicker`}>0{index + 1}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-section-alt">
        <div className="landing-shell mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-8">
          <div className="landing-story-block">
            <p className={`${monoFont.className} landing-section-kicker`}>Workflow</p>
            <h2
              className={`${displayFont.className} mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl`}
            >
              Three moves. No lost context.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
              Capture the blocker, work the queue, and close it with the supporting context still attached.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="landing-btn landing-btn-primary">
                Create account
              </Link>
              <Link href="/login" className="landing-btn landing-btn-secondary">
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="landing-workflow-row">
                <span className={`${monoFont.className} landing-workflow-index`}>
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                    {step.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8">
          <div className="landing-proof-block">
            <p className={`${monoFont.className} landing-section-kicker`}>Designed for real use</p>
            <blockquote className={`${displayFont.className} mt-4 text-3xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-4xl`}>
              “The point is not capturing more doubts. The point is finally clearing the ones that matter.”
            </blockquote>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              The interface is built to reduce drift: fewer context switches, clearer room ownership, and a queue you can actually operate.
            </p>
          </div>

          <div className="landing-faq-stack">
            <p className={`${monoFont.className} landing-section-kicker`}>FAQ</p>
            <div className="mt-4 space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="landing-faq">
                  <summary className="cursor-pointer list-none pr-10 text-base font-semibold text-slate-950">
                    {item.question}
                    <span className="landing-faq-icon" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-shell mx-auto w-full max-w-7xl px-5 pb-18 sm:px-6 lg:px-8">
        <div className="landing-final-cta">
          <div>
            <p className={`${monoFont.className} landing-section-kicker`}>Start clean</p>
            <h2
              className={`${displayFont.className} mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl`}
            >
              Give every hard question a place to live until it is solved.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="landing-btn landing-btn-light landing-btn-lg">
              Start free
            </Link>
            <Link href="/login" className="landing-btn landing-btn-quiet landing-btn-lg">
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
