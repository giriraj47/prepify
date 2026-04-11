# PrepAI: AI-Powered Technical Interview Assistant

PrepAI is a sophisticated, full-stack web application designed to help engineering candidates master technical interviews. It combines real-time AI interviewing, speech-to-text transcriptions, and personalized learning roadmaps to provide a comprehensive preparation experience.

## 🚀 Core Features

### 1. AI-Driven Technical Interviews
- **Dynamic Question Generation**: Realistic technical, system design, and behavioural questions tailored to your experience level and target role.
- **Voice-First Experience**: Integrated Speech-To-Text (STT) functionality allows you to dictate your answers, simulating a real-world interview conversation.
- **Visual Waveforms**: Interactive micro-animations for voice input monitoring.

### 2. Personalized Study Roadmaps
- **Adaptive Learning**: Generates a custom study path based on your interview performance.
- **Resource Curation**: Automatically finds relevant articles, videos, and documentation for your weak areas.
- **Progress Tracking**: Checkboxes for topics and resources with database persistence.

### 3. Deep Performance Analytics
- **AI Evaluation**: Immediate feedback on every answer, covering strong points, weak points, and specific improvements.
- **Scoring & Grading**: Overall interview scores and weighted grading (Technical and System Design carry more weight).
- **Session History**: Track your growth over time with saved interview sessions.

### 4. Real-time Synchronization
- **Autosave Engine**: Descriptive answers and roadmap progress are synced in real-time to Supabase.
- **Zustand State Management**: Smooth, responsive UI with reliable local caching.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **Frontend**: React 19, Tailwind CSS 4
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, RLS, Auth)
- **AI Engine**: [Groq](https://groq.com/) (Llama 3.3 70B Versatile)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Voice**: Web Speech API + Speech Recognition hooks

## 📋 Prerequisites

- Node.js 18+ 
- A Supabase Project
- A Groq API Key

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd interview-prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Database Configuration**
   Run the SQL migrations located in the `/migrations` folder within your Supabase SQL Editor. Ensure Row Level Security (RLS) is enabled for the following tables:
   - `users`
   - `roadmaps`
   - `roadmap_topics`
   - `interview_sessions`
   - `interview_responses`
   - `review_answers`

5. **Start the Development Server**
   ```bash
   npm run dev
   ```

## 🏗 Project Structure

- `app/`: Next.js App Router (pages and API routes)
- `components/`: Reusable UI components (Voice components, Navbar, etc.)
- `lib/`: Business logic, AI integration, types, and Zustand stores
- `migrations/`: SQL files for database setup
- `types/`: TypeScript definitions


