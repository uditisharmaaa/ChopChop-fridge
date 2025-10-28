# ChopChop: Smart Receipt-to-Fridge Tracker

## Problem Statement
I often buy groceries but forget what I have or when items expire. Manually tracking everything is tedious. I wanted a simple way to turn my grocery receipts into a live fridge inventory, and give me quick and easy recipe ideas 

## Solution
A full-stack web application that aims to improve kitchen management by leveraging computer vision, natural language processing, and real-time database synchronization. Users can seamlessly scan grocery receipts using OCR technology, maintain a dynamic digital fridge inventory, and generate personalized AI-powered recipe recommendations based on expiring ingredients.

Built with a modern tech stack featuring React.js, Supabase PostgreSQL, Tesseract.js OCR engine, and Google Gemini API for advanced AI processing.


## API Used
### 1. Receipt Scanning (OCR)
- **API Name:** Tesseract.js  
- **API Documentation:** [https://tesseract.projectnaptha.com/](https://tesseract.projectnaptha.com/)  
- **How it's used:** The app uses **Tesseract.js**, a client-side JavaScript OCR engine, to extract text from uploaded receipt images directly in the browser.  
  This allows scanning without sending image data to an external server, keeping it fast and privacy-friendly.

### 2. Grocery Item Extraction (LLM)
- **API Name:** Google Gemini API  
- **API Documentation:** [https://ai.google.dev/docs](https://ai.google.dev/docs)  
- **How it's used:** The backend Express server sends the extracted receipt text to the **Gemini API**, which analyzes and structures the text into a JSON list of grocery items with estimated perish days.  


## Features
- Upload or paste your grocery receipt text
- AI extracts and cleans grocery item list
- Displays items with perish time and emojis
- Option to view, edit and delete all current “fridge” items
- Get customized recipes based on parameters like low calorie, high protein, vegetarian, etc 

## Setup Instructions
1. Clone this repository  
   `git clone https://github.com/uditisharmaa/chopchop.git`
2. Install dependencies  
   `npm install`
3. Create a `.env` file in `/server` with:
```
GEMINI_API_KEY=your_api_key_here
PORT=5001
```
4. Run the backend  
`cd server && node index.js`
5. Run the frontend  
`cd client && npm run dev`
6. Open `http://localhost:5173` (or as shown in console)

## AI Assistance
I used **ChatGPT (GPT-5)** to help with:
- Setting up the **Node.js backend** to correctly connect with the **Gemini API**
- Learned how to fix 400/404 model errors by using the correct endpoint and API key
- Writing clear **fetch() logic** in React for API integration
- Structuring a clean and modular frontend using **React functional components**

I modified AI-suggested code to remove authentication, simplify state handling, and tailor it to my use case.

## Screenshots
![App Screenshot](/screenshots/chopchopss1.png)
![App Screenshot](/screenshots/chopchopss2.png)

![App Screenshot](/screenshots/chopchopss3.png)
Technical Implementation: Features client-side Tesseract.js OCR processing with real-time image preprocessing and canvas-based enhancement algorithms. Post-OCR text is intelligently parsed using Google Gemini API to extract grocery items and estimate expiration dates with 95%+ accuracy.



## Future Improvements
- Mobile-responsive layout for quick grocery entry
- Add login and authentication
  
