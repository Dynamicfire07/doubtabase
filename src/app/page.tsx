import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
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

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-base-200">
      <a
        href="#how-it-works"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-base-100 focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to how it works
      </a>
      <section className="relative isolate overflow-hidden border-b border-base-300 bg-gradient-to-br from-base-100 via-base-200 to-warning/10">
        <div className="hero-grid-pan pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:34px_34px] opacity-20" />
        <div className="hero-float pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-info/20 blur-3xl" />
        <div className="hero-drift pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-warning/25 blur-3xl" />

        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 lg:py-12">
          <header className="hero-fade-up flex items-center justify-between rounded-2xl border border-base-300 bg-base-100/75 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-base-300 bg-base-100">
                <Image
                  src="/brand-icon.svg"
                  alt="Doubts App logo"
                  fill
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-outline badge-info">Doubts App</span>
                <span className="hidden text-sm text-base-content/70 sm:inline">
                  from chaos to solved
                </span>
              </div>
            </div>
            <nav aria-label="Primary" className="flex items-center gap-2">
              <a href="#how-it-works" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                How it works
              </a>

              <Link href="/login" className="btn btn-neutral btn-sm btn-force-white">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm btn-force-white">
                Sign up
              </Link>
            </nav>
          </header>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="hero-fade-up hero-fade-up-delay-1 space-y-6">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-base-content/60">
                  Built for serious revision
                </p>
                <h1
                  className={`${displayFont.className} text-4xl font-bold leading-tight text-base-content sm:text-5xl lg:text-6xl`}
                >
                  Stop losing doubts in chats, notes, and screenshots.
                </h1>
                <p className="max-w-2xl text-base text-base-content/80 sm:text-lg">
                  Capture every question fast, keep it structured, and solve it
                  in shared rooms with your friends, mentors, or team.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className="btn btn-primary btn-lg btn-force-white">
                  Create account
                </Link>
                <Link href="/login" className="btn btn-neutral btn-lg btn-force-white">
                  I already have one
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge badge-outline badge-info">Exam prep</span>
                <span className="badge badge-outline">Class doubts</span>
                <span className="badge badge-outline">Team learning</span>
                <span className="badge badge-outline badge-success">Realtime rooms</span>
              </div>
            </div>

            <div className="hero-fade-up hero-fade-up-delay-2">
              <div className="rounded-3xl border border-base-300 bg-base-100/85 p-4 shadow-xl backdrop-blur sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-error/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
                  </div>
                  <span className="badge badge-success badge-outline">Realtime</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <aside className="rounded-xl border border-base-300 bg-base-200/60 p-2">
                    <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-base-content/50">
                      Rooms
                    </p>
                    <button className="btn btn-primary btn-xs mb-1 w-full justify-between">
                      <span>Organic Chem</span>
                      <span className="badge badge-xs">3</span>
                    </button>
                    <button className="btn btn-ghost btn-xs mb-1 w-full justify-between">
                      <span>JEE Math</span>
                      <span className="badge badge-xs badge-outline">2</span>
                    </button>
                    <button className="btn btn-ghost btn-xs w-full justify-between">
                      <span>Personal</span>
                      <span className="badge badge-xs badge-outline">1</span>
                    </button>
                  </aside>

                  <div className="space-y-2">
                    <div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 font-semibold">
                          Why does this NMR peak split here?
                        </p>
                        <span className="badge badge-error badge-outline">hard</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="badge badge-info badge-outline">Chemistry</span>
                        <span className="badge badge-outline">HNMR</span>
                        <span className="badge badge-warning badge-outline">open</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-base-300 bg-base-200/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 font-semibold">
                          Sign mistake in integration by parts
                        </p>
                        <span className="badge badge-warning badge-outline">medium</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="badge badge-info badge-outline">Math</span>
                        <span className="badge badge-outline">Calculus</span>
                        <span className="badge badge-success badge-outline">cleared</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Rooms</p>
                    <p className="text-lg font-bold">4</p>
                  </div>
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Open</p>
                    <p className="text-lg font-bold">23</p>
                  </div>
                  <div className="rounded-xl border border-base-300 bg-base-200/70 p-3 text-center">
                    <p className="text-xs text-base-content/60">Cleared</p>
                    <p className="text-lg font-bold">68</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 sm:py-12">
        <div className="hero-fade-up hero-fade-up-delay-1 grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm"
            >
              <span className="badge badge-outline badge-info mb-3">{feature.badge}</span>
              <h2 className={`${displayFont.className} text-2xl font-semibold`}>
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-base-content/70">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-6 pb-14">
        <div className="hero-fade-up hero-fade-up-delay-2 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
                How it works
              </p>
              <h2 className={`${displayFont.className} mt-2 text-3xl font-bold`}>
                Three moves, no friction
              </h2>
            </div>
            <Link href="/signup" className="btn btn-primary btn-force-white">
              Start free
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-base-300 bg-base-200/70 p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-base-100 text-sm font-bold">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-base-content/75">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="hero-fade-up hero-fade-up-delay-2 rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
                FAQ
              </p>
              <h2 className={`${displayFont.className} mt-2 text-3xl font-bold`}>
                Common questions
              </h2>
            </div>
          </div>

          <div className="space-y-2">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-200/60"
              >
                <summary className="collapse-title pr-10 text-base font-semibold">
                  {item.question}
                </summary>
                <div className="collapse-content pt-0">
                  <p className="text-sm text-base-content/75">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
