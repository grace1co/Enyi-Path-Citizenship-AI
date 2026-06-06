# Enyi Path Case Study

## Background

I'm a first-generation college student, and both my mother and sister went through the process of becoming American citizens. While they were preparing for their citizenship interviews, I spent many nights helping them study civics questions, reviewing answers, and quizzing them before their appointments.

As I helped them prepare, I noticed how repetitive the process could be. Most of the studying came down to flashcards, practice questions, and having someone available to ask follow-up questions. I started wondering if I could build something that would make studying easier and more accessible.

That idea eventually became Enyi Path. The name **Enyi** comes from Igbo and means *friend* or *companion*. I wanted the app to feel like a study partner, not just another quiz tool.

## The Problem

Preparing for the USCIS civics test and naturalization interview requires a lot of repetition. Applicants need to study civics questions, practice speaking answers out loud, prepare for interview-style questions, and build confidence with reading and writing in English.

While there are study guides available, they often do not provide realistic interview practice, speech practice, or immediate feedback.

My goal was to create one application where users could:

* Study civics questions
* Review flashcards
* Practice reading and writing sentences
* Practice mock interview responses
* Track their progress over time
* Receive feedback without needing another person present

## The Solution

I built Enyi Path as a full-stack citizenship study application.

The app combines flashcards, practice quizzes, reading and writing practice, mock interviews, and AI-powered feedback. Users can study civics questions, hear questions read aloud, speak their answers, type dictation sentences, and review their progress after each session.

To make the interview practice more realistic, I added a mock interview mode that uses speech-to-text and text-to-speech. Users can listen to a question, respond out loud, review the transcript, and receive feedback after the session.

I also integrated Qdrant to experiment with retrieval-based responses and to better understand how modern AI applications search and retrieve relevant information. If AI services or vector search are unavailable, the app can still fall back to local study content.

## Accessibility and UX

I also approached this project from a user experience perspective. I earned a Google UX Design certificate, and accessibility was something I considered throughout development.

Because many citizenship applicants are older adults, non-native English speakers, or people who may feel nervous about the interview, I wanted the app to feel clear and supportive. I added features like text-to-speech, speech-to-text, adjustable speech speed, transcript review, simple feedback messages, and large interactive buttons.

My goal was to reduce friction while studying and make the app feel less overwhelming.

## Challenges

One of the biggest challenges was figuring out how to combine traditional study tools with AI-powered features in a way that still felt useful.

I had to learn how to manage interview state, prevent the microphone from picking up the AI voice, let users review transcripts before submitting, and generate feedback after a full or partial interview.

I also spent time learning how to:

* Work with browser speech recognition and speech synthesis
* Manage interview state and conversation flow
* Handle authentication and user accounts
* Store study progress across sessions
* Use PostgreSQL for saved user data
* Use local storage for temporary progress and offline resilience
* Integrate Gemini into a full-stack application
* Use Qdrant for retrieval-based study responses

Many features required multiple rounds of testing and refactoring before they behaved the way I wanted.

## Research

While building Enyi Path, I spent a lot of time reading documentation, GitHub repositories, and examples from other projects.

I also looked at apps like Quizlet because I wanted to understand what makes flashcards and study tools feel easy to use. That helped me think through things like flashcard organization, mastery tracking, streaks, and how users move through a study session.

Two resources that helped me understand retrieval systems and AI-assisted learning apps were:

* EduGPT
* Microsoft AutoGen Qdrant retrieval examples

I used these as learning resources while I was figuring out vector search, retrieval workflows, and AI tutoring.

## What I Learned

This project taught me much more than just React or backend development.

I learned how to research unfamiliar technologies, break down larger problems into smaller pieces, and work through implementation challenges that did not have obvious solutions.

I also gained experience with:

* React
* TypeScript
* Express
* PostgreSQL
* JWT authentication
* bcrypt password hashing
* Qdrant vector search
* Retrieval-augmented generation
* Gemini API integration
* Browser speech APIs
* Accessibility-focused interface design

More importantly, I learned how to take a problem that affected people close to me and build something that attempts to solve it.

That was the most rewarding part of the project.
