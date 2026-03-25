import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">404</p>
      <h2 className="app-heading text-4xl font-semibold text-white">We could not find that page.</h2>
      <p className="mx-auto max-w-xl text-sm leading-6 text-slate-300">The route may have changed, or the recipe may not exist anymore.</p>
      <Button asChild>
        <Link to="/recipes">Go to recipes</Link>
      </Button>
    </div>
  );
}
