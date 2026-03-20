# SMART Sprint Studio

A drag-and-drop SMART objective web app for students, tutors, and teachers.

## What it does

- Builds SMART objectives from four editable fields
- Uses drag-and-drop support cards for Specific, Measurable, Achievable, Relevant, and Time-bound thinking
- Shows a live objective preview and SMART completeness score
- Saves multiple objectives in browser local storage
- Runs as a simple Node app that is easy to deploy on Render

## Run locally

```sh
cd /Users/tomlandy/Documents/Playground
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Render

1. Push this project to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the repo.
4. Use these settings:

```text
Environment: Node
Build Command: npm install
Start Command: npm start
```

5. Deploy.

You can also use the included `render.yaml` for a Blueprint deploy.

## Main files

- `index.html`: app structure
- `styles.css`: UI styling and responsive layout
- `app.js`: drag-and-drop logic, SMART scoring, and local persistence
- `server.js`: tiny static file server for local use and Render
- `render.yaml`: Render Blueprint config
