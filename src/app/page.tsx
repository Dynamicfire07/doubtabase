import Link from "next/link";
import Image from "next/image";
import { Fraunces, IBM_Plex_Mono, Sora } from "next/font/google";

import { publicAssetUrl } from "@/lib/cdn";

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

const featureCards = [
  {
    title: "Spreadsheet-speed capture",
    body: "Enter a doubt in one row, hit Cmd+Enter, and move to the next.",
    badge: "Input",
  },
  {
    title: "Room-first collaboration",
    body: "Use personal and shared rooms so context stays clean and focused.",
    badge: "Collab",
  },
  {
    title: "Search that actually works",
    body: "Slice by subject, status, subtopic, error tags, and keyword instantly.",
    badge: "Search",
  },
] as const;

const workflowSteps = [
  {
    title: "Capture",
    body: "Add title, subject, tags, notes, and optional images in one pass.",
  },
  {
    title: "Collaborate",
    body: "Share a room code and solve together with realtime updates.",
  },
  {
    title: "Clear",
    body: "Track resolved doubts and keep open blockers visible.",
  },
] as const;

const faqItems = [
  {
    question: "Can I keep private doubts and shared doubts separately?",
    answer:
      "Yes. Every user gets a personal room by default, and you can also join shared rooms for collaboration.",
  },
  {
    question: "How do I invite someone to a room?",
    answer:
      "Room owners generate a join code from workspace settings. Share that code with teammates and they can join immediately.",
  },
  {
    question: "Can members delete doubts in shared rooms?",
    answer:
      "No. Members can add, edit, and clear doubts, but delete actions are owner-only for safety.",
  },
  {
    question: "Is image upload supported?",
    answer:
      "Yes. You can attach images to doubts (JPEG, PNG, WEBP), with private storage and signed URLs.",
  },
  {
    question: "Will changes sync live for everyone in the same room?",
    answer:
      "Yes. Realtime updates are room-scoped, so members viewing the same room see updates quickly.",
  },
] as const;

const proofStats = [
  { label: "Avg capture time", value: "12s" },
  { label: "Views to find a doubt", value: "1" },
  { label: "Rooms per student", value: "4+" },
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
      className={`${uiFont.className} landing-root relative min-h-screen overflow-x-clip bg-base-200`}
    >
      <a
        href="#how-it-works"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:text-slate-950 focus:shadow-lg"
      >
        Skip to how it works
      </a>
      <section className="relative isolate overflow-hidden border-b border-black/10">
        <div className="landing-noise pointer-events-none absolute inset-0" />
        <div className="hero-grid-pan pointer-events-none absolute inset-0 opacity-35" />
        <div className="hero-float pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute -right-24 top-28 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="hero-float pointer-events-none absolute bottom-6 left-1/3 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8 lg:pb-20 lg:pt-10">
          <header className="hero-fade-up landing-panel flex items-center justify-between rounded-[22px] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/60 bg-white shadow-sm">
                <Image
                  src={publicAssetUrl("/brand-icon.svg")}
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`${monoFont.className} landing-pill hidden sm:inline-flex`}
                >
                  DOUBTS APP
                </span>
                <span className="text-sm font-medium text-slate-700/90">
                  Structured revision, not message chaos
                </span>
              </div>
            </div>
            <nav aria-label="Primary" className="flex items-center gap-2">
              <a
                href="#how-it-works"
                className="landing-btn landing-btn-secondary hidden sm:inline-flex"
              >
                How it works
              </a>
              <Link href="/login" className="landing-btn landing-btn-secondary">
                Log in
              </Link>
              <Link href="/signup" className="landing-btn landing-btn-primary">
                Sign up
              </Link>
            </nav>
          </header>

          <div className="mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-12">
            <div className="hero-fade-up hero-fade-up-delay-1 space-y-7">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${monoFont.className} landing-pill`}>SERIOUS REVISION</span>
                  <span className="landing-dot-chip">Realtime rooms</span>
                  <span className="landing-dot-chip">Image attachments</span>
                </div>
                <h1
                  className={`${displayFont.className} text-pretty text-[2.35rem] leading-[0.94] font-semibold tracking-tight text-slate-950 sm:text-[3.25rem] lg:text-[4.35rem]`}
                >
                  Turn random doubts into a{" "}
                  <span className="landing-title-accent italic">system</span> that
                  actually gets solved.
                </h1>
                <p className="max-w-xl text-pretty text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                  Capture questions fast, tag them once, and keep them visible
                  until they are cleared. Built for students who revise hard and
                  teams who learn together.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className="landing-btn landing-btn-primary landing-btn-lg">
                  Start your workspace
                </Link>
                <Link
                  href="/login"
                  className="landing-btn landing-btn-secondary landing-btn-lg"
                >
                  Open existing account
                </Link>
              </div>

              <div className="landing-panel rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p
                      className={`${monoFont.className} text-xs tracking-[0.2em] text-slate-500`}
                    >
                      WHY PEOPLE STICK WITH IT
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      One place for capture, collaboration, and resolution. No more
                      scrolling through chats to recover a question.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="landing-avatar bg-sky-200 text-sky-700">SJ</span>
                    <span className="landing-avatar bg-emerald-200 text-emerald-700">
                      RK
                    </span>
                    <span className="landing-avatar bg-amber-200 text-amber-700">AM</span>
                    <span className="landing-avatar bg-white text-slate-800 shadow-sm">
                      +12
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-3">
                  {proofStats.map((item) => (
                    <div key={item.label} className="landing-mini-stat">
                      <dt className={`${monoFont.className} text-[11px] tracking-[0.18em]`}>
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-950">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="relative hero-fade-up hero-fade-up-delay-2">
              <div className="hero-dashboard-shell landing-card relative overflow-hidden rounded-[28px] p-4 sm:p-5">
                <div className="landing-scanline pointer-events-none absolute inset-x-6 top-0 h-24 opacity-60" />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className={`${monoFont.className} text-[11px] tracking-[0.22em] text-slate-500`}>
                        LIVE ROOM
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950">
                        IB Physics HL • Week 4
                      </h2>
                    </div>
                    <span className="landing-presence">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      3 active
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.45)]">
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="landing-tag-chip">Physics</span>
                      <span className="landing-tag-chip">Electrostatics</span>
                      <span className="landing-tag-chip">Concept</span>
                      <span className="landing-tag-chip">Needs diagram</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-xs text-slate-600">
                        Cmd + Enter to save and move to next row
                      </span>
                      <span className={`${monoFont.className} text-xs text-slate-500`}>
                        /capture
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]">
                      <div className="mb-2 flex items-center justify-between">
                        <p
                          className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}
                        >
                          QUEUE
                        </p>
                        <span className="text-xs font-medium text-slate-600">
                          23 total
                        </span>
                      </div>
                      <div className="space-y-2">
                        {mockQueue.map((item) => (
                          <div
                            key={item.title}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="line-clamp-1 text-sm font-medium text-slate-800">
                                {item.title}
                              </p>
                              <span
                                className={`landing-status-pill landing-status-${item.accent}`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]">
                      <div className="mb-2 flex items-center justify-between">
                        <p
                          className={`${monoFont.className} text-[11px] tracking-[0.18em] text-slate-500`}
                        >
                          ACTIVITY
                        </p>
                        <span className="text-xs font-medium text-slate-600">
                          synced live
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {activityFeed.map((event) => (
                          <li
                            key={`${event.actor}-${event.action}`}
                            className="landing-activity-item"
                          >
                            <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                            <div>
                              <p className="text-sm text-slate-800">
                                <span className="font-semibold">{event.actor}</span>{" "}
                                {event.action}
                              </p>
                              <p className="text-xs text-slate-500">{event.time}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                        68 doubts cleared this month
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-fade-up hero-fade-up-delay-3 pointer-events-none absolute -right-4 -top-5 hidden rounded-2xl border border-white/80 bg-white/85 p-3 shadow-xl backdrop-blur sm:block">
                <p className={`${monoFont.className} text-[10px] tracking-[0.18em] text-slate-500`}>
                  TODAY
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">+17</p>
                <p className="text-xs text-slate-600">new doubts captured</p>
              </div>

              <div className="hero-float pointer-events-none absolute -bottom-6 left-6 hidden max-w-[240px] rounded-2xl border border-slate-900/10 bg-slate-900 px-4 py-3 text-white shadow-2xl sm:block">
                <p className={`${monoFont.className} text-[10px] tracking-[0.18em] text-white/60`}>
                  REVISION MODE
                </p>
                <p className="mt-1 text-sm font-medium leading-5">
                  Keep open blockers visible until they become solved notes.
                </p>
              </div>
            </div>
          </div>

          <div className="hero-fade-up hero-fade-up-delay-3 mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Capture in one row, not 5 screens",
              "Private + shared rooms",
              "Taggable and searchable",
              "Realtime sync for collaborators",
            ].map((item) => (
              <div
                key={item}
                className="landing-panel flex items-center gap-3 rounded-2xl px-4 py-3"
              >
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <p className="text-sm font-medium text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`${monoFont.className} text-xs tracking-[0.22em] text-slate-500`}>
              WHAT MAKES IT FAST
            </p>
            <h2
              className={`${displayFont.className} mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl`}
            >
              Built like a workflow, not a form.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            The front page explains the product, but the product itself is the point:
            less friction while capturing and solving questions.
          </p>
        </div>

        <div className="hero-fade-up hero-fade-up-delay-1 grid gap-4 md:grid-cols-3">
          {featureCards.map((feature, index) => (
            <article key={feature.title} className="feature-tile rounded-[22px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className={`${monoFont.className} landing-pill`}>
                  {feature.badge}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  0{index + 1}
                </span>
              </div>
              <h2
                className={`${displayFont.className} mt-5 text-2xl leading-tight font-semibold tracking-tight text-slate-950`}
              >
                {feature.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-6 lg:px-8">
        <div className="hero-fade-up hero-fade-up-delay-2 landing-card rounded-[28px] p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.45)]">
              <p className={`${monoFont.className} text-xs tracking-[0.22em] text-slate-500`}>
                HOW IT WORKS
              </p>
              <h2
                className={`${displayFont.className} mt-3 text-3xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-4xl`}
              >
                Three moves. No friction. No lost context.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
                Capture first, collaborate where needed, and keep the unresolved
                queue visible until it gets cleared. That’s the whole loop.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/signup" className="landing-btn landing-btn-primary">
                  Start free
                </Link>
                <Link href="/login" className="landing-btn landing-btn-secondary">
                  Log in
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {workflowSteps.map((step, index) => (
                <article key={step.title} className="step-tile rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <span
                      className={`${monoFont.className} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-900/10 bg-white text-sm font-semibold text-slate-900 shadow-sm`}
                    >
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-6 lg:px-8">
        <div className="hero-fade-up hero-fade-up-delay-2 landing-panel rounded-[28px] p-5 sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className={`${monoFont.className} text-xs tracking-[0.22em] text-slate-500`}>
                FAQ
              </p>
              <h2
                className={`${displayFont.className} mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl`}
              >
                Common questions
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="landing-faq rounded-2xl border border-white/70 bg-white/85 p-1 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.4)] backdrop-blur"
              >
                <summary className="cursor-pointer list-none rounded-[14px] px-4 py-3 pr-12 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50">
                  <span>{item.question}</span>
                  <span className="landing-faq-icon" aria-hidden="true">
                    +
                  </span>
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm leading-6 text-slate-600 sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
