import React, { useState } from 'react';
import { useToast } from '../App';

const API = '/api';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register' && !form.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const body = mode === 'login'
        ? { email: form.email.trim(), password: form.password }
        : { name: form.name.trim(), email: form.email.trim(), password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      toast(`Welcome${mode === 'register' ? ', ' + data.name : ' back'}! 👋`, 'success');
      onLogin(data);
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setForm({ name: '', email: '', password: '' });
    setError('');
  }

  return (
    <div className="auth-wrapper">
      {/* Left panel */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <BrandIcon />
          </div>
          <span className="auth-brand-name">Taskly</span>
        </div>

        <div className="auth-hero-text">
          <h1>
            Your tasks,<br />
            <em>beautifully</em><br />
            organised.
          </h1>
          <p>
            A calm, focused space for your personal to-do list. No clutter, no noise — just your tasks and you.
          </p>
        </div>

        <div className="auth-tagline">Personal task management · Built for clarity</div>
      </div>

      {/* Right panel */}
      <div className="auth-panel-right">
        <div className="auth-form-container">
          <h2 className="auth-form-title">
            {mode === 'login' ? 'Welcome back.' : 'Get started.'}
          </h2>
          <p className="auth-form-subtitle">
            {mode === 'login'
              ? 'Sign in to your account to continue.'
              : 'Create your free account in seconds.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full name</label>
                <input
                  className={`form-input${error && !form.name ? ' error' : ''}`}
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  autoFocus
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                className="form-input"
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={handleChange}
                autoFocus={mode === 'login'}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-input"
                id="password"
                name="password"
                type="password"
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')}>Create one</button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')}>Sign in</button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
