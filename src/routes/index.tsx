import { createFileRoute, Link } from "@tanstack/react-router";

import heroMap from "@/assets/hero-map.jpg";
import floatLemons from "@/assets/float-lemons.jpg";
import { trips, moodTint } from "@/lib/trips-data";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    glyph: "◈",
    color: "text-sunset",
    title: "AI Memory Map",
    body: "Pin every trip, note and photo to a beautiful visual map of your journeys.",
  },
  {
    glyph: "▩",
    color: "text-sky",
    title: "Smart Folders",
    body: "Automatically organize memories by food, nature, city walks, art and emotions.",
  },
  {
    glyph: "✎",
    color: "text-sage",
    title: "Trip Stories",
    body: "Transform your photos and reflections into cinematic AI-generated journals.",
  },
  {
    glyph: "◎",
    color: "text-foreground",
    title: "Travel Notes",
    body: "Capture thoughts, feelings and moments with a clean, distraction-free note system.",
  },
];

const stats = [
  {
    value: "142+",
    label: "Photos summarized",
  },
  {
    value: "24",
    label: "Smart folders",
  },
  {
    value: "8K",
    label: "AI memory signals",
  },
];

const workflow = [
  {
    step: "01",
    title: "Save your trip",
    body: "Add the destination, mood, dates and your first personal notes.",
  },
  {
    step: "02",
    title: "Let AI organize it",
    body: "TripNest groups your memories into themes, places and emotional highlights.",
  },
  {
    step: "03",
    title: "Relive the story",
    body: "Open your trip as a polished memory page with map, photos and journal text.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background font-sans text-[#142033] selection:bg-[#e99b6d]/30">
      <nav className="sticky top-0 z-50 border-b border-[#142033]/5 bg-background/80 px-4 py-3 backdrop-blur-2xl md:px-8 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-hidden">
          <Link to="/" className="group flex items-center gap-3">
            <span className="relative flex size-4 items-center justify-center rounded-full bg-[#e99b6d]">
              <span className="absolute size-4 rounded-full bg-[#e99b6d]/50 transition group-hover:scale-[1.8] group-hover:opacity-0" />
            </span>

            <span className="font-display text-lg font-bold tracking-tight text-[#142033] sm:text-xl md:text-2xl">
              TripNest AI
            </span>
          </Link>

          <div className="hidden items-center gap-10 text-xs font-semibold uppercase tracking-[0.22em] text-[#142033]/55 md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-[#142033]"
            >
              Journals
            </a>

            <a href="#map" className="transition-colors hover:text-[#142033]">
              Memory Map
            </a>

            <a href="#ai" className="transition-colors hover:text-[#142033]">
              AI Assistant
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-full border border-[#142033]/10 bg-white/80 px-5 py-2.5 text-sm font-bold text-[#142033] shadow-sm transition hover:-translate-y-0.5 hover:bg-white md:inline-flex"
            >
              Login
            </Link>

            <Link
              to="/register"
              style={{
                backgroundColor: "#142033",
                color: "#ffffff",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "#e99b6d";
                event.currentTarget.style.color = "#142033";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "#142033";
                event.currentTarget.style.color = "#ffffff";
              }}
              className="inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] shadow-xl transition hover:-translate-y-0.5 sm:px-6 sm:text-xs md:px-8"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative w-full max-w-full overflow-hidden px-4 pb-14 pt-8 sm:px-6 sm:pb-20 md:px-8 md:pb-32 md:pt-20">
        <div className="pointer-events-none absolute -left-40 top-28 size-96 rounded-full bg-[#e99b6d]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-10 size-96 rounded-full bg-[#b9d8df]/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 size-96 -translate-x-1/2 rounded-full bg-[#c8d8c0]/20 blur-3xl" />

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="min-w-0 animate-reveal lg:col-span-6">
            <div className="mb-6 inline-flex max-w-full items-center gap-3 rounded-full border border-[#142033]/5 bg-[#c8d8c0]/40 px-3 py-2 shadow-sm sm:px-4">
              <span className="size-2 rounded-full bg-[#e99b6d]" />

              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#142033]/70 sm:text-[10px] sm:tracking-[0.25em]">
                Intelligence meets nostalgia
              </span>
            </div>

            <h1 className="max-w-full text-balance font-display text-[clamp(2.6rem,11vw,4rem)] leading-[0.94] tracking-tight text-[#142033] sm:text-[4.8rem] md:text-7xl lg:text-8xl">
              Turn your trips into{" "}
              <span className="italic text-[#e99b6d]">intelligent</span>{" "}
              memories.
            </h1>

            <p className="mt-7 max-w-full text-pretty text-base leading-8 text-[#142033]/65 sm:max-w-[48ch] md:text-lg">
              Save your travel photos, write deep reflections, and let AI weave
              your journeys into a living digital atlas that feels personal,
              elegant and unforgettable.
            </p>

            <div className="mt-8 flex w-full max-w-full flex-col gap-4 sm:mt-10 sm:flex-row sm:items-center">
              <Link
                to="/register"
                style={{
                  backgroundColor: "#142033",
                  color: "#ffffff",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.backgroundColor = "#e99b6d";
                  event.currentTarget.style.color = "#142033";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.backgroundColor = "#142033";
                  event.currentTarget.style.color = "#ffffff";
                }}
                className="group inline-flex min-h-[58px] w-full max-w-full items-center justify-center gap-3 rounded-full px-5 py-4 text-center text-[11px] font-black uppercase leading-tight tracking-[0.12em] shadow-2xl transition hover:-translate-y-1 sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.16em]"
              >
                <span className="block max-w-full truncate sm:whitespace-nowrap">
                  Create Your First Trip
                </span>

                <span
                  style={{
                    color: "#ffffff",
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-hover:translate-x-1 group-hover:bg-white/50"
                >
                  →
                </span>
              </Link>

              <Link
                to="/login"
                className="inline-flex min-h-[58px] w-full max-w-full items-center justify-center rounded-full border border-[#142033]/10 bg-white/80 px-5 py-4 text-center text-sm font-black leading-tight text-[#142033] shadow-sm transition hover:-translate-y-1 hover:bg-white sm:w-auto sm:px-8"
              >
                Login to Dashboard
              </Link>
            </div>

            <div className="mt-8 grid w-full max-w-full grid-cols-1 gap-3 sm:mt-12 sm:max-w-xl sm:grid-cols-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-black/5 bg-white/70 p-5 shadow-sm backdrop-blur-xl sm:p-4"
                >
                  <p className="font-display text-3xl font-bold text-[#142033] sm:text-3xl">
                    {item.value}
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-[#142033]/45 sm:text-[10px] sm:tracking-widest">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex min-w-0 justify-center lg:col-span-6 lg:mt-0 lg:justify-end">
            <div className="relative w-full max-w-[520px] animate-reveal">
              <div className="absolute -left-8 -top-8 hidden rounded-full bg-white/70 px-5 py-3 shadow-xl backdrop-blur-xl md:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#142033]/45">
                  AI mood detected
                </p>

                <p className="mt-1 font-display text-2xl italic text-[#e99b6d]">
                  peaceful escape
                </p>
              </div>

              <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#b9d8df]/30 shadow-2xl ring-1 ring-black/5 sm:rounded-[3rem]">
                <img
                  src={heroMap}
                  alt="Vintage aerial map"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/30" />

                <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-2 shadow-lg backdrop-blur-xl sm:left-8 sm:top-8 sm:px-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#142033]/55 sm:text-[10px] sm:tracking-[0.18em]">
                    Live memory atlas
                  </span>
                </div>
              </div>

              <div className="glass-card absolute left-4 top-20 w-32 animate-float-slow rounded-[1.5rem] p-2 shadow-2xl sm:-left-4 sm:-top-10 sm:w-44 sm:rounded-[2rem] md:-left-12 md:w-52">
                <img
                  src={floatLemons}
                  alt="Travel memory"
                  className="aspect-[3/4] w-full rounded-[1.1rem] object-cover sm:rounded-[1.5rem]"
                />
              </div>

              <div className="glass-card absolute bottom-4 right-4 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-[1.5rem] px-4 py-3 shadow-2xl sm:-bottom-8 sm:rounded-[2rem] sm:px-5 sm:py-4 md:right-8">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-400" />
                </span>

                <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-tight text-[#142033]/75 sm:text-[10px]">
                  AI summarizing: 142 photos...
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        id="features"
        className="border-y border-[#142033]/5 bg-white/45 px-4 py-16 sm:px-5 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em] text-[#142033]/40">
                Core Features
              </span>

              <h2 className="max-w-2xl font-display text-[clamp(2.5rem,10vw,3.5rem)] leading-tight tracking-tight text-[#142033] md:text-6xl">
                Everything your memories need.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-[#142033]/55">
              TripNest AI is designed to feel like a premium personal archive,
              not just another travel app.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-[2.5rem] bg-white p-7 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-2 hover:shadow-2xl"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div
                    className={`${feature.color} flex size-14 items-center justify-center rounded-2xl bg-background text-2xl shadow-sm transition group-hover:scale-110`}
                  >
                    {feature.glyph}
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#142033]/30">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="font-display text-2xl text-[#142033]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#142033]/55">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="map" className="px-4 py-16 sm:px-5 md:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-[#142033] p-6 text-[#faf7f1] shadow-2xl sm:rounded-[3rem] sm:p-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#faf7f1]/40">
              Memory Map
            </span>

            <h2 className="mt-4 font-display text-[clamp(2.5rem,10vw,3.6rem)] leading-tight text-[#faf7f1] md:text-6xl">
              See your world through memories.
            </h2>

            <p className="mt-6 text-sm leading-8 text-[#faf7f1]/60">
              Each trip becomes a point in your personal atlas. You can explore
              places, moods, stories and highlights from one visual space.
            </p>

            <div className="mt-8 space-y-4">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="rounded-full bg-[#e99b6d] px-3 py-1 font-mono text-[10px] font-black text-[#142033]">
                      {item.step}
                    </span>

                    <h3 className="font-display text-2xl text-[#faf7f1]">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-sm leading-7 text-[#faf7f1]/55">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-[#b9d8df]/20 shadow-2xl ring-1 ring-black/5 sm:min-h-[560px] sm:rounded-[3rem]">
            <img
              src={heroMap}
              alt="TripNest memory map"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-white/55" />

            <MapPin top="28%" left="35%" label="Italy" />
            <MapPin top="42%" left="58%" label="Greece" />
            <MapPin top="56%" left="45%" label="Malta" />
            <MapPin top="35%" left="70%" label="Turkey" />

            <div className="absolute left-4 right-4 top-4 rounded-[1.5rem] bg-white/85 p-4 shadow-xl backdrop-blur-xl sm:left-6 sm:right-6 sm:top-6 sm:rounded-[2rem] sm:p-5 md:left-auto md:w-80">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#142033]/40">
                AI Insight
              </p>

              <h3 className="mt-2 font-display text-2xl text-[#142033] sm:text-3xl">
                Most visited mood: peaceful
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#142033]/55">
                Your memories show a strong pattern of warm places, calm walks
                and golden-hour moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="ai"
        className="border-y border-[#142033]/5 bg-white/45 px-4 py-16 sm:px-5 md:px-8 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em] text-[#142033]/40">
              AI Assistant
            </span>

            <h2 className="max-w-3xl font-display text-[clamp(2.7rem,11vw,4.4rem)] leading-tight tracking-tight text-[#142033] md:text-7xl">
              Ask your memories anything.
            </h2>

            <p className="mt-6 max-w-2xl text-sm leading-8 text-[#142033]/60">
              TripNest AI can help you create captions, summarize trips,
              organize photos, detect moods and turn scattered memories into a
              meaningful story.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                "Create a journal from my last summer trip.",
                "Find my most peaceful travel memories.",
                "Group my food photos into a smart folder.",
                "Write a caption for my Greece photos.",
              ].map((prompt) => (
                <button
                  key={prompt}
                  className="rounded-[2rem] border border-black/5 bg-white p-5 text-left text-sm font-medium leading-7 text-[#142033] shadow-sm transition hover:-translate-y-1 hover:bg-[#142033] hover:text-[#faf7f1] hover:shadow-xl"
                >
                  “{prompt}”
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#142033] p-5 text-[#faf7f1] shadow-2xl sm:rounded-[3rem] md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#faf7f1]/40">
                  Assistant Preview
                </p>

                <h3 className="mt-2 font-display text-3xl italic text-[#faf7f1] sm:text-4xl">
                  TripNest Chat
                </h3>
              </div>

              <span className="flex size-14 items-center justify-center rounded-2xl bg-[#e99b6d] text-[#142033]">
                ✦
              </span>
            </div>

            <div className="space-y-4">
              <div className="max-w-[85%] rounded-[2rem] bg-white/10 p-5 text-sm leading-7 text-[#faf7f1]/70">
                Show me my most beautiful memories from Italy.
              </div>

              <div className="ml-auto max-w-[88%] rounded-[2rem] bg-[#e99b6d] p-5 text-sm font-medium leading-7 text-[#142033] shadow-xl">
                I found warm city walks, lemon garden photos, and three notes
                with a peaceful mood. I can turn them into a journal.
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Ask TripNest AI..."
                    className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-[#faf7f1] outline-none placeholder:text-[#faf7f1]/35"
                  />

                  <Link
                    to="/register"
                    style={{
                      backgroundColor: "#e99b6d",
                      color: "#142033",
                    }}
                    className="rounded-full px-5 py-3 text-sm font-black transition hover:bg-[#f2b38d]"
                  >
                    Ask
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trips" className="px-4 py-20 sm:px-5 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.25em] text-[#142033]/40">
                Archives
              </span>

              <h2 className="font-display text-[clamp(2.7rem,11vw,3.8rem)] leading-tight tracking-tight text-[#142033] md:text-6xl">
                Recent Journeys
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#142033]/55">
                A preview of how your trips can appear once organized inside
                TripNest AI.
              </p>
            </div>

            <Link
              to="/register"
              style={{
                backgroundColor: "#142033",
                color: "#ffffff",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = "#e99b6d";
                event.currentTarget.style.color = "#142033";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "#142033";
                event.currentTarget.style.color = "#ffffff";
              }}
              className="inline-flex w-full justify-center rounded-full px-7 py-4 text-center text-xs font-black uppercase tracking-[0.14em] shadow-xl transition hover:-translate-y-1 sm:w-auto sm:text-sm sm:tracking-[0.16em]"
            >
              Start Your Own
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {trips.slice(0, 3).map((trip, index) => (
              <Link
                key={trip.id}
                to="/register"
                className="group animate-reveal cursor-pointer"
                style={{ animationDelay: `${(index + 1) * 120}ms` }}
              >
                <div className="relative mb-6 aspect-[4/5] overflow-hidden rounded-[2.75rem] bg-stone-100 shadow-sm ring-1 ring-black/5">
                  <img
                    src={trip.cover}
                    alt={trip.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />

                  <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${moodTint[trip.mood]}`}
                    >
                      {trip.mood}
                    </span>

                    <span className="glass-card rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#142033]">
                      {trip.places} Places
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="inline-flex rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-[#142033] shadow-xl">
                      Open memory →
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-3xl text-[#142033]">
                  {trip.title}
                </h3>

                <p className="mt-2 font-mono text-sm text-[#142033]/45">
                  {trip.dateRange}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-5 md:px-8 md:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#142033] p-6 text-[#faf7f1] shadow-2xl sm:rounded-[3rem] sm:p-8 md:p-12">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#faf7f1]/40">
                Ready to start?
              </p>

              <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.7rem,11vw,4.2rem)] leading-tight text-[#faf7f1] md:text-7xl">
                Build your personal atlas of memories.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-8 text-[#faf7f1]/55">
                Create your account and start turning trips into organized,
                searchable and beautifully written memories.
              </p>
            </div>

            <Link
              to="/register"
              style={{
                backgroundColor: "#e99b6d",
                color: "#142033",
              }}
              className="inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-center text-xs font-black uppercase tracking-[0.14em] shadow-xl transition hover:-translate-y-1 hover:bg-[#f2b38d] sm:w-auto sm:px-8 sm:text-sm sm:tracking-[0.18em]"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#142033]/5 px-4 py-12 sm:px-5 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-[#e99b6d]" />

            <span className="font-display text-xl font-bold tracking-tight text-[#142033]">
              TripNest AI
            </span>
          </div>

          <p className="text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#142033]/40">
            © 2026 Your personal map of memories.
          </p>

          <div className="flex flex-wrap justify-center gap-5 text-[10px] font-semibold uppercase tracking-widest text-[#142033]/55 sm:gap-8">
            <a href="#" className="transition hover:text-[#142033]">
              Privacy
            </a>

            <a href="#" className="transition hover:text-[#142033]">
              Terms
            </a>

            <a href="#" className="transition hover:text-[#142033]">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

type MapPinProps = {
  top: string;
  left: string;
  label: string;
};

function MapPin({ top, left, label }: MapPinProps) {
  return (
    <div
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ top, left }}
    >
      <span className="mb-2 rounded-full bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#142033] opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100">
        {label}
      </span>

      <span className="relative flex size-5 items-center justify-center rounded-full bg-[#e99b6d] shadow-xl ring-4 ring-white/80">
        <span className="absolute size-5 animate-ping rounded-full bg-[#e99b6d]/60" />
        <span className="relative size-2 rounded-full bg-[#142033]" />
      </span>
    </div>
  );
}