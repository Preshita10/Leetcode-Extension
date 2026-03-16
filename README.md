# Student Buddy AI Mentor

A Chrome extension that acts as a coding mentor on LeetCode: it gives **hints** (not full solutions) to guide your thinking.

## Setup

### 1. API key (OpenRouter)

The extension uses [OpenRouter](https://openrouter.ai/) to call Gemini. An OpenRouter API key is already set in `background.js`. To use your own:

1. Go to [OpenRouter](https://openrouter.ai/keys) and create or copy your API key.
2. In `background.js`, set `OPENROUTER_API_KEY` to your key.
3. If you ever share or publish this code, revoke the key at openrouter.ai/keys and use a new one.

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`.
2. Turn on **Developer mode** (toggle in the top-right).
3. Click **Load unpacked**.
4. Select the `student-buddy-extension` folder (the one that contains `manifest.json`).
5. The extension should appear in your extensions list and in the toolbar.

## How to use

1. Open a LeetCode problem page (e.g. `https://leetcode.com/problems/two-sum/`).
2. Click the **Student Buddy** icon in the Chrome toolbar to open the popup.
3. Click **Get Hint**.
4. Wait for “Generating hint...” to finish; your hint will appear in the text area.

## Screenshots

student-buddy-extension/screenshots/popup.png

*Add your own screenshots: place `popup.png` (extension popup) and `hint-example.png` (hint shown on a LeetCode problem) in the `screenshots/` folder.*

## Project structure

```
student-buddy-extension/
├── manifest.json    # Extension config (Manifest V3)
├── popup.html       # Popup UI
├── popup.css        # Popup styles
├── popup.js         # Popup logic & messaging
├── content.js       # Runs on LeetCode; extracts problem data
├── background.js    # Service worker; calls OpenRouter (Gemini) API
├── icons/           # Optional: add icon16.png, icon48.png, icon128.png
├── screenshots/     # Screenshots for README (popup.png, hint-example.png)
└── README.md
```

## Flow

1. You click **Get Hint** in the popup.
2. **popup.js** asks **content.js** (on the active tab) for the problem title and description.
3. **content.js** reads the DOM and sends that data back.
4. **popup.js** sends the data to **background.js**.
5. **background.js** calls the OpenRouter API (Gemini) with the mentor prompt and gets a hint.
6. The hint is returned to the popup and shown in the text area.

## Permissions

- **activeTab** – access the current tab when you use the extension.
- **scripting** – inject / communicate with content scripts.
- **storage** – reserved for future use (e.g. saving preferences).
- **host_permissions** – LeetCode problem pages and the OpenRouter API.

## Optional: custom icons

Place PNG files in the `icons/` folder:

- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

Then add this to `manifest.json` (before the closing `}`):

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

Without these, Chrome uses the default puzzle-piece icon.
