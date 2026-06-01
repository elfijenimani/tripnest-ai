import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { getCurrentSession, signInUser } from "@/lib/auth-service";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingSession() {
      const session = await getCurrentSession();

      if (session?.user) {
        window.location.href = "/dashboard";
        return;
      }

      setCheckingSession(false);
    }

    checkExistingSession();
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const result = await signInUser({
      email,
      password,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex relative overflow-hidden p-10 bg-foreground text-background">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,#e99b6d,transparent_35%),radial-gradient(circle_at_bottom_right,#b9d8df,transparent_40%)]" />

        <div className="relative z-10 flex flex-col justify-between max-w-xl">
          <Link to="/" className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-sunset" />
            <span className="font-display text-2xl font-bold">
              TripNest AI
            </span>
          </Link>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/50 mb-5">
              Welcome back
            </p>

            <h1 className="font-display text-6xl leading-tight">
              Continue building your personal map of memories.
            </h1>

            <p className="mt-6 text-background/60 leading-relaxed">
              Login to organize your trips, preserve memories, and continue
              creating your intelligent travel archive.
            </p>
          </div>

          <p className="text-xs text-background/40 font-mono uppercase tracking-[0.2em]">
            Secure authentication powered by Supabase.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-black/5">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="size-3 rounded-full bg-sunset" />
            <span className="font-display text-xl font-bold">TripNest AI</span>
          </Link>

          <h1 className="font-display text-4xl font-bold tracking-tight">
            Login
          </h1>

          <p className="mt-3 text-sm text-foreground/60">
            Enter your account details to continue.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium">Email address</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-black/10 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-sunset/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Your password"
                className="mt-2 w-full rounded-2xl border border-black/10 bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-sunset/40"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-foreground px-6 py-4 font-medium text-background transition hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-foreground">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}