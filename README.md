# Taskly — Personal Task Manager

## Requirements
- Node.js 18+ (https://nodejs.org)
- npm 9+

## Run it

```bash
cd todo-app
npm install
npm start
```

Then open **http://localhost:3000**

That's it. No Docker, no database setup, no config.

## What happens when you `npm start`

- **React** dev server starts on port 3000 and opens in your browser
- **Express API** starts on port 5000
- **SQLite** database file is auto-created at `server/taskly.db` on first run
- Both run together via `concurrently`

## Features
- Register an account with name, email, and password
- Log in and see your personal task list
- Add tasks with a title and optional description
- Check tasks as done (strikethrough)
- Delete tasks
- All data persists in a local SQLite file — nothing disappears on refresh
- Each user only sees their own tasks
