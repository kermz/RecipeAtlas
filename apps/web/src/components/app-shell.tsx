import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookMarked, Flame, Sparkles } from 'lucide-react';
import { cn } from '../lib/cn';
import { Card } from './ui/card';

export function AppShell() {
  const location = useLocation();
  const showHero = location.pathname === '/recipes';

  return (
    <div className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {showHero ? (
          <header className="overflow-hidden rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-glow backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-slate-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recipe Atlas
                </div>
                <h1 className="app-heading text-4xl font-semibold leading-tight sm:text-5xl">
                  Build, time, and finish recipes without losing your place.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  A focused workspace for managing recipes, ordered steps, local countdown timers, and completed-at timestamps.
                </p>
              </div>
              <nav className="flex items-center gap-3">
                <NavLink
                  to="/recipes"
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                      isActive ? 'border-sky-300/40 bg-sky-300/15 text-sky-50' : 'border-white/10 bg-white/6 text-slate-200 hover:bg-white/10'
                    )
                  }
                >
                  <BookMarked className="h-4 w-4" />
                  Recipes
                </NavLink>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-50">
                  <Flame className="h-4 w-4" />
                  Timer-ready
                </div>
              </nav>
            </div>
          </header>
        ) : null}

        <Card className="bg-[#070b16]/85 p-4 sm:p-6">
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
