import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * App Component Tests
 * Tests for main application routing and structure
 */

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Tic-Tac-Toe/i)).toBeInTheDocument();
  });

  it('should display login form by default for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    render(<App />);
    const registerLink = screen.getByText(/register here/i);
    expect(registerLink).toBeInTheDocument();
  });
});
