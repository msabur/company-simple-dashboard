A company dashboard.

## Setup

Rename `.env.sample` to `.env` and add data.

## To run:

With docker-compose: `docker compose up`

Manually:
1. `docker compose up db` to start the database
2. In a new terminal: `cd frontend; npm install && npm run dev`
3. In a new terminal: `cd backend; pip install -r requirements.txt && fastapi run dev`

Optional: use a virtual environment for step 3.
