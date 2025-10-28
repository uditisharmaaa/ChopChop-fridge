// ==========================
// 🌟 IMPORTS
// ==========================
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';         // Client-side OCR engine for extracting text from images
import { supabase } from '../supabaseClient'; // Supabase client (anon key; no auth session)

// ==========================
// 🧾 RECEIPT UPLOAD COMPONENT
// ==========================
// Allows the user to upload a receipt image, run OCR to extract text,
// send it to Gemini API for cleaning/structuring, and automatically
// insert parsed grocery items into Supabase.
//
// NOTE (no-auth build):
// - No calls to supabase.auth.*
// - Inserts go straight into public.fridge with columns: item_name, added_on, expires_on
// - Your DB must have RLS DISABLED on public.fridge (demo-only)

export default function ReceiptUpload({ onContinue }) {
  // --------------------------
  // 🔧 STATE VARIABLES
  // --------------------------
  const [image, setImage] = useState(null);             // Uploaded receipt file
  const [cleanedItems, setCleanedItems] = useState([]); // AI-cleaned grocery items (array of { item, perish_in_days })
  const [loading, setLoading] = useState(false);        // Spinner during OCR + API
  const [error, setError] = useState('');               // Error message for UI
  const [ocrProgress, setOcrProgress] = useState(null); // 0–100 progress for OCR (null when idle)

  // ==========================
  // 🖼️ IMAGE SELECTION HANDLER
  // ==========================
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setCleanedItems([]);
    setError('');
    setOcrProgress(null);
  };

  // ==========================
  // 🤖 GEMINI API CALL
  // ==========================
  const callGeminiAPI = async (ocrText) => {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text:
                `Extract a deduplicated list of generic grocery items from this receipt text.
                 For each item, estimate perish days. Add a relevant emoji before each item name
                 if appropriate; otherwise none. Return as JSON like
                 [{"item": "🍞 Bread", "perish_in_days": 5}].\n\nReceipt:\n${ocrText}`,
            },
          ],
        },
      ],
    };

    const response = await fetch('http://localhost:5001/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (data.text) return data.text;
    if (data.candidates?.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Gemini returned no usable text.');
  };

  // ==========================
  // 📸 SCAN RECEIPT HANDLER
  // ==========================
  // 1) OCR → 2) Gemini → 3) Parse → 4) Insert into Supabase (no auth)
  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setOcrProgress(0);

    try {
      // ---- Step 1: OCR extraction (with progress updates)
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          // m.status can be: 'loading tesseract core', 'initializing tesseract', 'recognizing text', etc.
          if (typeof m.progress === 'number') {
            // Convert fraction [0,1] to percentage [0,100]
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedText = result.data.text;
      if (!extractedText.trim()) throw new Error('No text extracted from the image.');

      // ---- Step 2: Call Gemini via backend
      const geminiText = await callGeminiAPI(extractedText);

      // ---- Step 3: Normalize JSON (strip ```json fences) and parse
      const cleanedText = geminiText
        .trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsedItems = JSON.parse(cleanedText); // [{ item: "🍅 Tomato", perish_in_days: 3 }, ...]
      setCleanedItems(parsedItems);

      // ---- Step 4: Insert into Supabase (no user_id; RLS disabled)
      const now = new Date();
      const itemsToInsert = parsedItems.map((it) => ({
        item_name: it.item,
        added_on: now.toISOString(),
        // Convert days → ms and add to "now"
        expires_on: new Date(now.getTime() + (it.perish_in_days || 0) * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { error: insertError } = await supabase.from('fridge').insert(itemsToInsert);
      if (insertError) throw insertError;
    } catch (err) {
      console.error('Scan failed:', err);
      setError(err.message || 'Something went wrong during scanning.');
    } finally {
      setLoading(false);
      // Leave the last progress value visible under the overlay session,
      // or reset it if you prefer:
      // setOcrProgress(null);
    }
  };

  // ==========================
  // 💻 COMPONENT RENDER
  // ==========================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* === LOADING OVERLAY === */}
      {loading && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 bg-white rounded-xl shadow-lg px-6 py-5">
            <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-gray-700 animate-spin" />
            <div className="text-sm font-medium text-gray-800">Scanning receipt…</div>

            {/* Progress bar (shows when we have a numeric progress) */}
            {typeof ocrProgress === 'number' && (
              <div className="w-56">
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-emerald-600 rounded transition-all"
                    style={{ width: `${Math.min(Math.max(ocrProgress, 0), 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">{ocrProgress}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-8 max-w-lg w-full bg-white rounded-xl shadow-lg relative z-10">
        <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">ChopChop</h2>
        <p className="text-center text-gray-600 mb-6">
          Upload your receipt to stock your fridge and get recipe ideas.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={loading}
          className="mb-4 w-full border rounded px-3 py-2 text-sm shadow-sm disabled:opacity-60
                     file:border-none file:bg-emerald-800 file:text-white file:px-4 file:py-2"
        />

        <button
          onClick={handleScan}
          disabled={!image || loading}
          className={`w-full mb-3 py-2 rounded-lg font-semibold text-white shadow transition ${
            loading ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-800 hover:bg-emerald-900'
          }`}
        >
          {loading ? 'Scanning…' : 'Scan Receipt'}
        </button>

        <button
          onClick={onContinue}
          disabled={loading}
          className="w-full py-2 rounded-lg font-semibold text-blue-800
                     border border-blue-700 shadow-sm hover:bg-blue-50 transition disabled:opacity-60"
        >
          Skip and go to Dashboard →
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Cleaned Items Preview */}
        {cleanedItems.length > 0 && (
          <div className="mt-6 bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-sm mb-2 text-emerald-800">Cleaned grocery items:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
              {cleanedItems.map((it, idx) => (
                <li key={idx}>
                  <span className="mr-2">{it.item}</span>
                  <span className="text-gray-600">(perish in {Number(it.perish_in_days) || 0} days)</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onContinue}
              className="mt-4 w-full bg-emerald-800 text-white px-4 py-2 rounded hover:bg-emerald-900 transition"
            >
              Continue to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
