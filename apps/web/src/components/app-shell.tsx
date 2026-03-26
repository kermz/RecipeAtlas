import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookMarked, Sparkles } from 'lucide-react';
import { cn } from '../lib/cn';

export function AppShell() {
  const location = useLocation();
  const showHero = location.pathname === '/recipes';
  const shellLabel = location.pathname.startsWith('/recipes/') ? 'Recipe workspace' : 'Collection workspace';

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col px-2 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-3 lg:px-10">
        <header className="page-fade sticky top-0 z-30 mb-3 sm:mb-6">
          <div className="rounded-[22px] border border-white/10 bg-[rgba(10,13,11,0.92)] px-2 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:rounded-[28px] sm:px-5 sm:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-[color:var(--accent-strong)] sm:h-11 sm:w-11 sm:rounded-2xl">
                  <BookMarked className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="app-kicker">Recipe Atlas</p>
                  <p className="truncate text-[11px] text-[color:var(--text-secondary)] sm:text-xs">{shellLabel}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-center">
                <NavLink
                  to="/recipes"
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition duration-200 active:scale-[0.98] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm',
                      isActive
                        ? 'border-[rgba(191,209,171,0.34)] bg-[rgba(127,155,113,0.18)] text-[color:var(--accent-strong)]'
                        : 'border-white/10 bg-white/5 text-[color:var(--text-primary)] hover:border-white/18 hover:bg-white/8'
                    )
                  }
                >
                  <BookMarked className="h-4 w-4" />
                  Recipes
                </NavLink>
              </div>
            </div>
          </div>
        </header>

        {showHero ? (
          <section className="page-fade overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(191,209,171,0.08),rgba(123,142,113,0.06)_44%,rgba(255,255,255,0.03))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:rounded-[34px] sm:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)] xl:items-end">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-100 sm:text-xs sm:tracking-[0.3em]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Kitchen Console
                </div>
                <h1 className="app-heading max-w-4xl text-[2.2rem] font-semibold leading-[1.02] sm:text-5xl lg:text-6xl">
                  Keep recipes, timers, and cooking flow in one sharp workspace.
                </h1>
                <p className="mt-4 max-w-2xl text-[13px] leading-6 text-[color:var(--text-secondary)] sm:mt-5 sm:text-base sm:leading-7">
                  Recipe Atlas is tuned for real use at the counter: ordered ingredients, timed steps, fast edits, and a layout that works just as well on a phone as it does on a laptop.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Drag to reorder ingredients and steps</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Local step countdowns stay lightweight</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Built for dense editing without clutter</span>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 sm:p-5">
                  <p className="app-kicker">Collection</p>
                  <p className="mt-3 text-base leading-7 text-white">See recent recipes first, jump into any detail view, and keep edits close to the content.</p>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 sm:p-5">
                  <p className="app-kicker">Cooking flow</p>
                  <p className="mt-3 text-base leading-7 text-white">Track progress step by step with timers, reset actions, and completion state that stays easy to scan.</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <main
          className={cn(
            'page-fade relative flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(12,17,14,0.84)] p-2 shadow-[0_24px_100px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[34px] sm:p-6 lg:p-8',
            showHero ? 'mt-6' : 'mt-0'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
