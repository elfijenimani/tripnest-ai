# TripNest AI

TripNest AI is a modern travel memory web application that helps users organize their trips, memories, photos, moods, destinations, and travel ideas in one dashboard.

The project combines a clean travel dashboard with AI-powered features, live location tools, and real nearby place recommendations. The goal is to make travel memories easier to save, explore, and reuse for stories, captions, summaries, and future travel planning.

## Live Demo

```text
https://tripnest-ai-flame.vercel.app/
```

## Main Features

* User authentication with Supabase Auth
* Create, read, update, and delete trips
* Save trip details such as title, country, city, dates, mood, and description
* Dashboard with travel statistics
* Latest trip highlight
* Search and filter trips by title, country, city, mood, or description
* Memory map section
* Ask TripNest AI assistant
* AI-powered travel summaries, captions, stories, and trip suggestions
* Live location detection
* Real nearby places using Google Places API
* AI recommendations based on real nearby places
* Responsive and modern UI

## Project Purpose

The purpose of TripNest AI is to create a smart travel memory system where users can keep their trips organized and use AI to interact with their saved travel data.

Instead of keeping memories only in random photos or notes, the user can save trips in a structured way and later ask AI questions such as:

```text
Summarize my trips and tell me what type of traveler I am.
```

```text
Write an Instagram caption based on my saved trips.
```

```text
I want a quiet coffee place near me.
```

The AI assistant is connected to real trip data and location-based results, so the application is more useful and realistic.

## Technologies Used

### Frontend

* React
* TypeScript
* Vite
* TanStack Router
* Tailwind CSS

### Backend / Services

* Supabase
* Supabase Authentication
* Supabase Database
* Supabase Edge Functions
* OpenAI API
* Google Places API

### Deployment

* Vercel for frontend deployment
* Supabase for backend services and Edge Functions

## Project Structure

```text
tripnest-ai/
├── docs/
│   └── demo-plan.md
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── routes/
├── supabase/
│   ├── functions/
│   │   ├── ai-memory/
│   │   ├── dashboard-ai-chat/
│   │   ├── nearby-ai-recommend/
│   │   ├── real-nearby-places/
│   │   └── trip-ai-search/
│   └── config.toml
├── package.json
├── vite.config.js
└── README.md
```

## Important Components

### Dashboard

The dashboard is the main part of the application. It shows the user’s trips, statistics, latest memory, search filters, AI assistant, and travel companion section.

### Trip Management

Users can create, open, edit, and delete trips. Each trip contains important information such as:

* trip title
* country
* city
* start date
* end date
* mood
* description

### Ask TripNest AI

The Ask TripNest AI section allows the user to ask free questions about their saved trips and memories.

The frontend sends the question to a Supabase Edge Function, and the Edge Function securely communicates with the OpenAI API. This keeps the OpenAI API key hidden from the frontend.

### AI Travel Companion

The AI Travel Companion uses the browser’s geolocation API to detect the user’s current location. Then it loads real nearby places such as cafes, restaurants, attractions, and museums.

The nearby places are fetched through Google Places API using a Supabase Edge Function. OpenAI then ranks and explains the best options based on the user’s request.

## How to Run the Project Locally

First, clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
```

Open the project folder:

```bash
cd tripnest-ai
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and add the required Supabase frontend variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

The project will usually run on:

```text
http://localhost:5173/
```

## Supabase Edge Functions

The project uses Supabase Edge Functions for AI and location-based features.

Important functions include:

```text
dashboard-ai-chat
real-nearby-places
nearby-ai-recommend
trip-ai-search
ai-memory
```

To deploy a Supabase function, use:

```bash
npx supabase functions deploy function-name --no-verify-jwt
```

Example:

```bash
npx supabase functions deploy dashboard-ai-chat --no-verify-jwt
```

## Environment Variables and Secrets

API keys must not be exposed in the frontend.

Frontend variables are stored in `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Private API keys are stored as Supabase secrets:

```bash
npx supabase secrets set OPENAI_API_KEY="your_openai_api_key"
```

```bash
npx supabase secrets set GOOGLE_PLACES_API_KEY="your_google_places_api_key"
```

These keys are used only inside Supabase Edge Functions.

## Demo Plan

The final presentation demo plan is included in:

```text
docs/demo-plan.md
```

The demo plan explains:

* what the project is and who it serves
* the main demo flow
* the technical parts that will be explained
* what was checked before the demo
* the backup plan if the live demo fails

## Main Demo Flow

During the final presentation, the project will be demonstrated in this order:

1. Open the live application
2. Login or register
3. Show the dashboard overview
4. Create a new trip
5. Open trip details
6. Ask TripNest AI a free question
7. Use AI Travel Companion with live location
8. Search and filter saved trips

## What Was Tested

Before the final demo, the following parts were checked:

* The live application opens correctly
* Login and logout work
* Dashboard loads after authentication
* Trips can be created
* Trips can be opened, edited, and deleted
* Search and filters work
* Ask TripNest AI sends real AI requests
* Live location works when permission is allowed
* Nearby places load correctly
* AI recommendations use real nearby locations
* API keys are not exposed in the frontend
* The latest code is pushed to GitHub

## Future Improvements

Possible future improvements include:

* Adding more advanced photo analysis
* Generating automatic travel albums
* Creating AI-based trip itineraries
* Adding collaborative trip planning
* Improving the memory map with real coordinates for each trip
* Adding export options for stories and captions
* Supporting more languages

## Author

TripNest AI was developed as a final project for the Advanced Programming course.

## Conclusion

TripNest AI is a complete travel memory application that combines CRUD operations, authentication, AI features, real location-based recommendations, and deployment. It demonstrates both frontend and backend development skills while also showing how AI can be integrated into a real-world web application.