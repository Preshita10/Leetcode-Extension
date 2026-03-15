/**
 * Student Buddy - Background service worker
 * Handles getHint (problem + code → next-step hint) and getConcept (problem → concept).
 */

// OpenRouter API key (revoke at openrouter.ai/keys if you ever share this code)
const OPENROUTER_API_KEY = 'YOUR_OPENROUTER_API_KEY'; // Get one at https://openrouter.ai/keys
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/free';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'getHint') {
    const { title, description, code } = request;
    if (!title && !description) {
      sendResponse({ success: false, error: 'Missing problem title and description.' });
      return true;
    }
    callApi(buildHintPrompt(title, description, code || ''))
      .then((hint) => sendResponse({ success: true, hint }))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Failed to generate hint.' }));
    return true;
  }

  if (request.action === 'getConcept') {
    const { title, description } = request;
    if (!title && !description) {
      sendResponse({ success: false, error: 'Missing problem title and description.' });
      return true;
    }
    callApi(buildConceptPrompt(title, description))
      .then((concept) => sendResponse({ success: true, concept }))
      .catch((err) => sendResponse({ success: false, error: err.message || 'Failed to generate concept.' }));
    return true;
  }
});

/**
 * Prompt for a next-step hint given the problem and the student's current code.
 * Does NOT ask for full solution or complete code.
 */
function buildHintPrompt(problemTitle, problemDescription, code) {
  const codeSection = code.trim()
    ? `Here is the code the student has written so far:\n\n\`\`\`\n${code.trim()}\n\`\`\`\n\n`
    : 'The student has not written any code yet.\n\n';

  return `You are an expert coding mentor helping a student solve a programming problem.

Rules:
- Do NOT give the full solution or complete code.
- Give only a small hint about what to do NEXT (e.g. one step, one idea, or one change).
- If they have code: point to what to add, fix, or think about next.
- If they have no code: suggest a first small step or key idea.
- Be concise and supportive. Encourage reasoning.

Problem:

${problemTitle}

${problemDescription}

${codeSection}

Provide one short, helpful hint only (what to do next or what to think about).`;
}

/**
 * Prompt for a concept explanation (approach, key idea, data structure, or algorithm).
 */
function buildConceptPrompt(problemTitle, problemDescription) {
  return `You are an expert coding mentor. A student is working on this problem and wants to understand the concept behind it.

Explain the main concept they need (e.g. which data structure, algorithm, or idea applies). Be concise and educational. Do NOT give the full solution or complete code—only the concept and why it helps.

Problem:

${problemTitle}

${problemDescription}

Provide a short concept explanation only.`;
}

/**
 * Call OpenRouter and return the assistant's text.
 */
async function callApi(prompt) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.startsWith('YOUR_')) {
    throw new Error('Please set your OpenRouter API key in background.js (OPENROUTER_API_KEY).');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://github.com/student-buddy-extension',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMessage = `API error: ${response.status}`;
    try {
      const parsed = JSON.parse(errBody);
      if (parsed.error?.message) errMessage = parsed.error.message;
    } catch (_) {}
    throw new Error(errMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Could not get response from the AI.');
  return content;
}
