/**
 * Student Buddy - Content script
 * Runs on LeetCode problem pages. Extracts problem title and description from the DOM.
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getProblemData') {
    try {
      const data = extractProblemData();
      sendResponse({ success: true, ...data });
    } catch (err) {
      sendResponse({
        success: false,
        error: err.message || 'Failed to extract problem data.',
      });
    }
  }
  return true; // Keep the message channel open for async sendResponse
});

/**
 * Extract problem title, description, and user's current code from the LeetCode page DOM.
 */
function extractProblemData() {
  const title = getProblemTitle();
  const description = getProblemDescription();
  const code = getEditorCode();

  return {
    title: title || 'Unknown Problem',
    description: description || 'No description available.',
    code: code || '',
  };
}

/**
 * Extract the user's code from the LeetCode code editor (Monaco or textarea).
 * Tries Monaco view-line DOM first, then textarea fallbacks.
 */
function getEditorCode() {
  // Monaco editor: lines are in .view-line elements inside .view-lines
  const viewLines = document.querySelectorAll('.view-lines .view-line, [class*="view-line"]');
  if (viewLines.length > 0) {
    const lines = Array.from(viewLines).map(function (lineEl) {
      return (lineEl.textContent || '').replace(/\u00A0/g, ' '); // nbsp -> space
    });
    const code = lines.join('\n').trim();
    if (code.length > 0) return code;
  }

  // Fallback: textarea used by some editor implementations
  const textareas = document.querySelectorAll(
    '.monaco-editor textarea, #editor textarea, [class*="inputarea"], textarea[class*="editor"]'
  );
  for (const ta of textareas) {
    const val = (ta.value || '').trim();
    if (val.length > 0) return val;
  }

  // Fallback: any code block that might hold the solution (e.g. CodeMirror)
  const codeEl = document.querySelector(
    '.CodeMirror-code, [data-cy="code-editor"] pre, .code-editor pre'
  );
  if (codeEl) {
    const text = (codeEl.textContent || '').trim();
    if (text.length > 0) return text;
  }

  return '';
}

/**
 * Try several possible selectors for the problem title.
 */
function getProblemTitle() {
  // LeetCode often uses data-cy or specific class names for the question title
  const selectors = [
    '[data-cy="question-title"]',
    '.question-title',
    '.text-lg.font-medium',
    'div[class*="question-title"]',
    'a[href*="/problems/"]', // Breadcrumb or nav link with problem name
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el.textContent || '').trim();
      if (text && text.length < 200) return text; // Sanity check: title shouldn't be huge
    }
  }

  // Fallback: use the first h1 or the page title (e.g. "1. Two Sum - LeetCode")
  const h1 = document.querySelector('h1');
  if (h1) {
    const text = (h1.textContent || '').trim();
    if (text) return text;
  }

  const pageTitle = document.title || '';
  if (pageTitle.includes(' - LeetCode')) {
    return pageTitle.replace(' - LeetCode', '').trim();
  }

  return '';
}

/**
 * Try several possible selectors for the problem description.
 */
function getProblemDescription() {
  // Common containers for the problem statement
  const selectors = [
    '[data-cy="question-description"]',
    '.question-content__JfgR',
    '[class*="question-description"]',
    '[class*="description__"]',
    '.content__u3I1',
    'div[class*="QuestionDescription"]',
    '.description',
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el.textContent || '').trim();
      if (text && text.length > 20) return text;
    }
  }

  // Fallback: get text from the main content area (often in a div with "description" in class or role)
  const main = document.querySelector('main') || document.querySelector('[role="main"]');
  if (main) {
    const text = (main.textContent || '').trim();
    if (text && text.length > 20 && text.length < 50000) return text;
  }

  return '';
}
