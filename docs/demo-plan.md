# Demo Plan — TripNest AI

## 1. Project Overview

TripNest AI is a modern travel memory web application that helps users organize their trips, memories, photos, moods, and travel ideas in one dashboard. The goal of the project is to make travel memories more structured, visual, and intelligent by combining trip management with AI-powered features.

The application allows users to create and manage trips, add destinations, write descriptions, view travel statistics, explore a memory map, use AI for travel-related questions, and get real nearby place recommendations based on live location.

TripNest AI is useful for people who want to save their travel experiences in a more organized and meaningful way instead of keeping memories only in random photos or notes.

---

## 2. Main Demo Flow

The demo will take around 5–7 minutes.

### Step 1: Open the application

I will start by opening the live deployed version of the application.

Live URL:

```text
https://tripnest-ai-flame.vercel.app/
```

Then I will briefly explain that the project is built as a full-stack travel memory system with authentication, trip management, AI features, and location-based recommendations.

### Step 2: Login / Register

I will demonstrate the authentication flow by logging in with an existing account.

In this part, I will explain that the application uses Supabase Authentication to manage users securely. Each user can access only their own saved trips and memories.

### Step 3: Dashboard Overview

After login, I will show the main dashboard.

In the dashboard, I will explain the main parts:

* Total trips
* Countries visited
* Cities saved
* Memory score
* Latest trip highlight
* Travel personality section
* Recent journeys
* AI assistant section
* Live location companion

This shows that the dashboard is not only a simple list of trips, but a complete travel memory workspace.

### Step 4: Create a New Trip

Next, I will click **Create Trip** and add a new trip.

Example data:

```text
Trip name: Italy Summer 2026
Country: Italy
City: Rome
Mood: Cultural
Description: A memorable trip with beautiful streets, historical places, and peaceful moments.
```

I will explain that this data is saved in the database and then displayed immediately in the dashboard.

This demonstrates the Create part of CRUD.

### Step 5: Open Trip Details

After creating or selecting a trip, I will open the trip details panel.

In this section, I will show that each trip can have more detailed information and can be edited or deleted.

This demonstrates the Read, Update, and Delete parts of CRUD.

### Step 6: Ask TripNest AI

Then I will show the AI assistant section called **Ask TripNest**.

I will ask a free question such as:

```text
Summarize my trips and tell me what type of traveler I am.
```

or:

```text
Write an Instagram caption based on my saved trips.
```

I will explain that this AI section is connected to the user’s real saved trip data through a Supabase Edge Function and OpenAI API. It does not work only with fixed local answers, but sends the request to the backend and generates a real AI response based on the saved data.

### Step 7: AI Travel Companion and Nearby Places

Next, I will show the **AI Travel Companion** section.

I will enable live location and show that the application detects the user’s current latitude and longitude. Then the app loads real nearby places such as cafes, restaurants, attractions, or museums.

After that, I will ask the AI something like:

```text
I want a quiet coffee place near me.
```

I will explain that the nearby places come from real map data through Google Places API, while OpenAI ranks and explains the best options. This means the AI is not inventing locations; it recommends from real places.

### Step 8: Search and Filter Trips

I will also demonstrate the search and filter section.

The user can search trips by:

* title
* country
* city
* mood
* description

The user can also filter trips by mood or country. This makes the dashboard easier to use when there are many saved trips.

---

## 3. Technical Parts I Will Explain Briefly

During the presentation, I will explain these technical parts shortly.

### Frontend

The frontend is built with React, TypeScript, Vite, TanStack Router, and Tailwind CSS. It is responsible for the user interface, dashboard, forms, trip cards, AI assistant UI, and live location section.

### Backend / Database

The project uses Supabase as the backend service. Supabase provides authentication, database storage, and Edge Functions.

The main data is stored in Supabase tables such as trips and trip media.

### Authentication

Supabase Auth is used for login and register. After login, the user can access their own dashboard and data.

### AI Integration

The AI features are implemented through Supabase Edge Functions. The frontend does not call OpenAI directly. Instead, it sends the request to Supabase, and Supabase securely uses the OpenAI API key.

This is important because API keys should not be exposed in the frontend.

### Location and Places

The live location feature uses the browser’s geolocation API to get the user’s current coordinates. Then Google Places API is used through Supabase Edge Functions to return real nearby places.

### Deployment

The frontend is deployed on Vercel, while the backend features are managed through Supabase.

---

## 4. What I Checked Before the Demo

Before the presentation, I checked the following:

* The application opens correctly from the live URL.
* Login and logout work correctly.
* The dashboard loads after authentication.
* New trips can be created.
* Existing trips can be opened, edited, and deleted.
* Search and filter work correctly.
* Ask TripNest AI sends real AI requests.
* Live location works when permission is allowed.
* Nearby places load correctly.
* AI recommendations use real nearby places.
* No API keys are exposed in the frontend.
* The latest code is pushed to GitHub.

---

## 5. Plan B if the Live Demo Fails

If the live demo does not work because of internet, Vercel, Supabase, or location permission issues, I will use the following backup plan:

1. I will show the GitHub repository and explain the project structure.
2. I will show screenshots or previously tested parts of the application.
3. I will explain the main code files:

   * Dashboard page
   * Trip components
   * Supabase configuration
   * AI Edge Functions
   * Live location companion
4. I will explain the expected user flow step by step.
5. If live location does not work, I will explain that browser permission and HTTPS are required.
6. If AI does not respond, I will explain that the AI feature depends on OpenAI API and Supabase Edge Functions.

This way, even if the live demo has technical issues, I can still clearly explain the project and its implementation.

---

## 6. Final Presentation Goal

The goal of the demo is to show that TripNest AI is a complete and functional project. It includes user authentication, CRUD operations, a modern dashboard, AI-powered travel assistance, real nearby place recommendations, and deployment.

The presentation will focus on explaining the value of the project, the main user flow, and the most important technical parts without going too deep into unnecessary details.
