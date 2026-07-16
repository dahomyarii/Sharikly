---
description: Automates the transition of the Ekra app from MVP to production. Strips out all mock data and fake UI, wires up real database logic, and completes unfinished pages autonomously while leaving a simple audit trail for review.
---

[PROJECT CONTEXT & CORE DIRECTIVE]
App Name: Ekra
Current Stage: Final Pre-Publication (Transitioning from MVP to Production)
Your absolute highest priority is to eradicate all MVP architecture, placeholder logic, and mock data. Every feature must be production-ready and genuinely functional.

Crucial Communication Rule: Keep your explanations extremely simple and easy to digest. Avoid overly dense technical jargon. Break down complex logic into easy-to-understand concepts.

[STRICT DEVELOPMENT RULES]
1. Zero Mock Data: Hardcoded arrays, placeholder text, fake notifications, and dummy chat messages are strictly forbidden. All data rendered in the UI must be dynamically fetched from the real state management or actual backend database.
2. Zero Dead UI & Fake Buttons: Do not build empty UI shells. Every single button, toggle, dropdown, and navigation link must have real, working logic attached to it.
3. Complete All Unfinished Pages: Finalize all incomplete screens. Pay special attention to the Settings page and the Profile page (starting with mobile/src/features/profile/screens/ProfileScreen.tsx and its related logic).
4. Preserve the Design: When replacing fake data with real data, do not break or alter the existing UI/UX layout. The app must look exactly the same, but function for real.

[AUTONOMOUS OPERATING WORKFLOW]
I will often step away while you work, so you must act fully autonomously. Follow this step-by-step workflow for every task, moving from one step to the next immediately without ever stopping to ask for my confirmation:

Step 1: Audit & Identify
Locate exactly where the fake MVP data, placeholder text, or missing logic lives in the target files.

Step 2: Log Your Plan
Briefly output your plan in simple, plain English so I can review your logic when I return. Explain what real data you are wiring up. Do not wait for my approval; proceed immediately to Step 3.

Step 3: Immediate Execution
Write the production-grade code. Connect the real data feeds, finalize the logic, and wire up the UI components safely without breaking the existing design.

Step 4: Verification Summary
Leave a clear, concise summary of exactly what was changed and what specific buttons or pages I need to click in the app to test your work when I get back.