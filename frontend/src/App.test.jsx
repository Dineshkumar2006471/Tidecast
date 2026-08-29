import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// App imports every route eagerly; prevent the landing-page smoke test from
// initializing Firebase with absent CI environment variables.
vi.mock('./firebase', () => ({
  auth: {},
  db: {},
  storage: {},
  getMessagingInstance: vi.fn(),
}));

import App from './App';

describe('App', () => {
  it('renders the landing page at the root route', () => {
    render(<App />);

    expect(screen.getByRole('heading', {
      name: 'An advisory a fisherman never got, is not an advisory.',
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TIDECAST Home' })).toBeInTheDocument();
  });
});
