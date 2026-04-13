import { render } from '@testing-library/react';
import { App } from '../App';

export function renderApp(route = '/recipes'): ReturnType<typeof render> {
  window.history.pushState({}, 'Test', route);

  return render(<App />);
}
