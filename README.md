# Enyi Path

Enyi Path is a citizenship study app that helps immigrants prepare for the USCIS civics test, reading and writing test, and naturalization interview. It includes flashcards, quizzes, mock interviews, speech tools, and AI-assisted study support. I wanted it to feel more like a study partner than a test-prep website.

The name **Enyi** comes from Igbo and means *friend* or *companion*.

## Why I Built This

I'm a first-generation college student, and both my mom and sister went through the process of becoming American citizens. I spent a lot of nights helping them study, quizzing them on civics questions, reviewing answers, and helping them prepare for their interviews.

After seeing how stressful and repetitive the process could be, I wanted to build something that could provide the same kind of support without always needing another person there to help. That's where the idea for Enyi Path came from.

## Features

* USCIS civics flashcards with mastery tracking
* Practice quizzes with scoring, feedback, and category breakdowns
* Reading aloud practice with pronunciation matching
* Writing and dictation practice
* Mock citizenship interviews with simulated officer questions and feedback
* Speech-to-text interview responses
* Text-to-speech question and answer playback with adjustable speed
* AI-generated civics explanations with simplified and multilingual options
* Study progress tracking and interview history
* Support for both the 2008 (100 questions) and 2025 (128 questions) USCIS civics test versions
* Guest mode with progress migration when creating an account
* Works offline using local question banks and fallback study content

## Accessibility

Accessibility was something I thought about throughout the project.

While earning Google's UX Design Certificate, I learned a lot about how different people interact with software. Since many citizenship applicants are still building English fluency, I wanted the app to be flexible and approachable.

* Adjustable speech speeds for learners who need slower dictation
* Text-to-speech support so questions and answers can be read aloud
* Speech-to-text support for practicing spoken responses
* Simplified explanations that use easier vocabulary when needed
* Multilingual explanation support through Gemini
* Multiple study modes so users can learn in the format that works best for them

## Tech Stack

### Frontend

* React + Vite
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide React

### Backend

* Express
* JWT authentication
* bcrypt password hashing

### Database

* PostgreSQL (Neon) stores user accounts, password hashes, study sessions, flashcard mastery, and study statistics
* Browser localStorage stores study plans, interview history, user preferences, and temporary session data

### AI and Retrieval

* Google Gemini for explanations, tutoring, and interview evaluation
* Qdrant for retrieval-augmented search
* Fallback chain: Qdrant → local study content → built-in question bank

The app continues working even if AI services are unavailable.

### Speech

* Browser Web Speech API
* Text-to-speech for question and answer playback
* Speech-to-text for interview responses

## Prerequisites

* Node.js v20 or later
* PostgreSQL v14 or later

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=        # Google Gemini API key: https://aistudio.google.com
DATABASE_URL=          # PostgreSQL connection string from Neon or local Postgres
JWT_SECRET=            # Long random string used to sign JWT tokens
QDRANT_URL=            # Qdrant instance URL, optional
QDRANT_API_KEY=        # Qdrant API key, optional
```

### Database

Create a PostgreSQL database, then run the schema file:

```bash
psql -d enyi_path_db -f schema.sql
```

See `schema.sql` in the root directory for the full table setup.

### Qdrant Optional

If you'd like to use vector search, run a local Qdrant instance:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Then set:

```env
QDRANT_URL=http://localhost:6333
```

If Qdrant isn't configured, the app automatically falls back to local study content.

Start the development server:

```bash
npm run dev
```

## Guest Mode

Users can study without creating an account.

Guest progress is saved in the browser. When a guest creates an account, study sessions, flashcard mastery, settings, interview history, and study statistics are migrated and synced to PostgreSQL so progress can continue across devices.

## Notes

The application can run without AI services configured. Local question banks and study content provide fallback support for core study features.

Some civics answers depend on current elected officials and state-specific information. Current officeholders are stored in `/public/data/officials.json` and can be updated independently of the question bank. Users should always verify dynamic answers against the latest USCIS study materials before their interview.

## Screenshots

*Coming soon*

## Live Demo

*Coming soon*
