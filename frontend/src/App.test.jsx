import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
