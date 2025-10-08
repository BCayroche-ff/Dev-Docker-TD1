import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from './Login';

/**
 * Login Component Tests
 * Tests for user authentication and form validation
 */

// Mock fetch for API calls
global.fetch = jest.fn();

// Helper function to render component with required providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render login form', () => {
    renderWithProviders(<Login />);

    expect(screen.getByText('Tic-Tac-Toe')).toBeInTheDocument();
    expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should have link to register page', () => {
    renderWithProviders(<Login />);

    const registerLink = screen.getByText(/register here/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should update input values when typing', () => {
    renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('should submit form with valid credentials', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'fake-token',
        user: { id: 1, username: 'testuser', email: 'test@test.com' }
      })
    });

    renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' })
        })
      );
    });
  });

  it('should display error message on login failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    });

    renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<Login />);

    const usernameInput = screen.getByLabelText(/username or email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveTextContent(/logging in/i);
    expect(submitButton).toBeDisabled();
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});
