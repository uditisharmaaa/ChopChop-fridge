// ==========================
// 🌟 IMPORTS
// ==========================

// Import core React library for defining components
import React from 'react';

// Import subcomponents (each handles a specific feature)
import Fridge from './Fridge';          // Displays fridge contents (ingredients)
import RecipeList from './RecipeList';  // Displays or generates recipes

// Note: No Supabase import here — this build has no authentication.

// ==========================
// 🧩 DASHBOARD COMPONENT
// ==========================
//
// The Dashboard component is the main "home" view of the ChopChop app.
// It shows the fridge on the left and AI recipe generation on the right.
// Navigation provides an "Add Receipt" action to move to the scanning flow.

export default function Dashboard({ onAddReceipt }) {
  // No logout handler — this build intentionally has no authentication.

  // --------------------------
  // 💻 COMPONENT RENDER
  // --------------------------
  return (
    // The main wrapper uses a full-height flex column layout
    // with a soft gradient background for visual depth
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-white">

      {/* ==========================
          🔝 NAVBAR SECTION
          ========================== */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white shadow sticky top-0 z-10">
        {/* App title / branding */}
        <h1 className="text-2xl font-bold text-blue-800">🍳 ChopChop Dashboard</h1>

        {/* Right-side buttons (Add Receipt) */}
        <div className="flex gap-3">
          {/* Button to add new receipt (navigates to the receipt upload page) */}
          <button
            onClick={onAddReceipt}
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg shadow hover:bg-emerald-800 transition"
          >
            + Add Receipt
          </button>
        </div>
      </nav>

      {/* ==========================
          🧾 MAIN CONTENT AREA
          ========================== */}
      {/* Split-screen layout:
          - Left side: Fridge (inventory)
          - Right side: Recipe Generator */}
      <div className="flex flex-1 overflow-hidden">

        {/* --------------------------
            🧊 LEFT PANEL: FRIDGE SECTION
            -------------------------- */}
        <div className="w-1/2 p-6 overflow-y-auto">
          {/* White card container for visual separation */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">🥬 Your Fridge</h2>
            {/* The Fridge component displays all saved grocery items */}
            <Fridge />
          </div>
        </div>

        {/* --------------------------
            🍳 RIGHT PANEL: RECIPE SECTION
            -------------------------- */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold text-blue-700 mb-4">🍴 Generate Recipes</h2>
            {/* The RecipeList component interacts with the AI (Gemini API)
                to display recipe ideas based on available ingredients */}
            <RecipeList />
          </div>
        </div>
      </div>
    </div>
  );
}
