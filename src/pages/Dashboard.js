import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../App';

const API = '/api';

// ─── Icons ─────────────────────────────────────────────────────────────────

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Task Card Component ────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete }) {
  const checkboxId = `task-${task.id}`;

  return (
    <div className={`task-card${task.complete ? ' complete' : ''}`}>
      <div className="task-checkbox-wrapper">
        <input
          type="checkbox"
          className="task-checkbox"
          id={checkboxId}
          checked={!!task.complete}
          onChange={() => onToggle(task.id)}
        />
        <label htmlFor={checkboxId} className="task-checkbox-custom" title={task.complete ? 'Mark incomplete' : 'Mark complete'}>
          <CheckIcon />
        </label>
      </div>

      <div className="task-content">
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
        <div className="task-meta">
          <span className="task-date">{formatDate(task.created_at)}</span>
          {task.complete && <span className="task-done-badge">Done</span>}
        </div>
      </div>

      <div className="task-actions">
        <button
          className="btn-delete"
          onClick={() => onDelete(task.id)}
          title="Delete task"
          aria-label="Delete task"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Add Task Form ──────────────────────────────────────────────────────────

function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const descRef = useRef(null);
  const toast = useToast();

  function autoResize() {
    const el = descRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onAdd(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      if (descRef.current) {
        descRef.current.style.height = 'auto';
      }
      toast('Task added', 'success');
    } catch (err) {
      toast(err.message || 'Failed to add task', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  }

  return (
    <div className="add-task-card">
      <div className="add-task-card-label">New task</div>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <input
          className="add-task-title-input"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={500}
          disabled={loading}
          autoComplete="off"
        />
        <textarea
          ref={descRef}
          className="add-task-desc-input"
          placeholder="Add a description (optional)"
          value={description}
          onChange={e => { setDescription(e.target.value); autoResize(); }}
          rows={1}
          disabled={loading}
        />
        <hr className="add-task-divider" />
        <div className="add-task-actions">
          <span className="add-task-hint">⌘ + Enter to add</span>
          <button
            className="btn-add-task"
            type="submit"
            disabled={!title.trim() || loading}
          >
            <PlusIcon />
            {loading ? 'Adding…' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks?user_id=${user.id}`);
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      toast('Could not load tasks. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleAdd(title, description) {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, title, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add task');
    setTasks(prev => [data, ...prev]);
  }

  async function handleToggle(id) {
    const prev = tasks;
    // Optimistic update
    setTasks(tasks => tasks.map(t => t.id === id ? { ...t, complete: t.complete ? 0 : 1 } : t));

    try {
      const res = await fetch(`${API}/tasks/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(tasks => tasks.map(t => t.id === id ? data : t));
    } catch {
      setTasks(prev);
      toast('Failed to update task', 'error');
    }
  }

  async function handleDelete(id) {
    const prev = tasks;
    // Optimistic update
    setTasks(tasks => tasks.filter(t => t.id !== id));

    try {
      const res = await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast('Task deleted');
    } catch {
      setTasks(prev);
      toast('Failed to delete task', 'error');
    }
  }

  const pending = tasks.filter(t => !t.complete);
  const completed = tasks.filter(t => t.complete);

  const firstName = user.name ? user.name.split(' ')[0] : 'there';

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-brand-icon">
            <BrandIcon />
          </div>
          <span className="header-brand-name">Taskly</span>
        </div>
        <div className="header-right">
          <span className="header-greeting">
            Hello, <strong>{firstName}</strong>
          </span>
          <button className="btn-logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        <h1 className="dashboard-page-title">My Tasks</h1>
        <p className="dashboard-page-subtitle">
          {loading
            ? 'Loading your tasks…'
            : tasks.length === 0
            ? 'Nothing here yet. Add your first task below.'
            : `${pending.length} remaining · ${completed.length} completed`}
        </p>

        <AddTaskForm onAdd={handleAdd} />

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span className="loading-text">Fetching tasks…</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardIcon />
            </div>
            <h3>All clear</h3>
            <p>Your task list is empty. Add something above to get started.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="task-section">
                <div className="task-list-header">
                  <span className="task-section-title">To do</span>
                  <span className="task-count-badge">{pending.length}</span>
                </div>
                <div className="task-list">
                  {pending.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div className="task-section">
                <div className="task-list-header">
                  <span className="task-section-title">Completed</span>
                  <span className="task-count-badge">{completed.length}</span>
                </div>
                <div className="task-list">
                  {completed.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
