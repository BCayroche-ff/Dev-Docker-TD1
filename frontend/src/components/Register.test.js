import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from './Register';

/**
 * Register Component Tests
 * Tests for user registration and form validation
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

describe('Register Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should render registration form', () => {
    renderWithProviders(<Register />);

    expect(screen.getByText('Tic-Tac-Toe')).toBeInTheDocument();
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    renderWithProviders(<Register />);

    const loginLink = screen.getByText(/login here/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should update input values when typing', () => {
    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('newuser');
    expect(emailInput.value).toBe('new@test.com');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });

  it('should show error when passwords do not match', async () => {
    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show error when password is too short', async () => {
    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'fake-token',
        user: { id: 1, username: 'newuser', email: 'new@test.com' }
      })
    });

    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'newuser',
            email: 'new@test.com',
            password: 'password123'
          })
        })
      );
    });
  });

  it('should display error message on registration failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Username already exists' })
    });

    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'existinguser' } });
    fireEvent.change(emailInput, { target: { value: 'existing@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('should disable form during submission', async () => {
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<Register />);

    const usernameInput = screen.getByLabelText(/^username$/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toHaveTextContent(/creating account/i);
    expect(submitButton).toBeDisabled();
    expect(usernameInput).toBeDisabled();
  });
});
