/**
 * Student Buddy - Popup script
 * Handles UI logic and messaging between popup, content script, and background.
 */

document.addEventListener('DOMContentLoaded', function () {
  const getHintBtn = document.getElementById('getHintBtn');
  const getConceptBtn = document.getElementById('getConceptBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const loadingText = document.getElementById('loadingText');
  const resultArea = document.getElementById('resultArea');
  const resultLabel = document.getElementById('resultLabel');
  const hintText = document.getElementById('hintText');
  const errorArea = document.getElementById('errorArea');
  const errorText = document.getElementById('errorText');

  /**
   * Show loading state and hide result/error.
   * @param {string} message - e.g. "Generating hint..." or "Generating concept..."
   */
  function showLoading(message) {
    getHintBtn.disabled = true;
    getConceptBtn.disabled = true;
    loadingText.textContent = message || 'Generating...';
    loadingIndicator.hidden = false;
    resultArea.hidden = true;
    errorArea.hidden = true;
    hintText.value = '';
    errorText.textContent = '';
  }

  /**
   * Hide loading and show the result (hint or concept).
   */
  function showResult(label, text) {
    getHintBtn.disabled = false;
    getConceptBtn.disabled = false;
    loadingIndicator.hidden = true;
    errorArea.hidden = true;
    resultLabel.textContent = label;
    hintText.value = text;
    resultArea.hidden = false;
  }

  /**
   * Hide loading and show an error message.
   */
  function showError(message) {
    getHintBtn.disabled = false;
    getConceptBtn.disabled = false;
    loadingIndicator.hidden = true;
    resultArea.hidden = true;
    errorArea.hidden = false;
    errorText.textContent = message;
  }

  /**
   * Request problem data (title, description, code) from the content script.
   */
  function getProblemFromPage() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        if (!tab || !tab.id) {
          reject(new Error('No active tab found.'));
          return;
        }
        chrome.tabs.sendMessage(tab.id, { action: 'getProblemData' }, function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Could not get problem data.'));
            return;
          }
          if (response && response.success) {
            resolve({
              title: response.title,
              description: response.description,
              code: response.code || '',
            });
          } else {
            reject(new Error(response?.error || 'Could not extract problem data.'));
          }
        });
      });
    });
  }

  /**
   * Request a hint from the background (problem + code → next-step hint).
   */
  function getHintFromBackground(problemData) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'getHint',
          title: problemData.title,
          description: problemData.description,
          code: problemData.code,
        },
        function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Background error.'));
            return;
          }
          if (response && response.success) {
            resolve(response.hint);
          } else {
            reject(new Error(response?.error || 'Failed to get hint.'));
          }
        }
      );
    });
  }

  /**
   * Request a concept explanation from the background.
   */
  function getConceptFromBackground(problemData) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'getConcept',
          title: problemData.title,
          description: problemData.description,
        },
        function (response) {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Background error.'));
            return;
          }
          if (response && response.success) {
            resolve(response.concept);
          } else {
            reject(new Error(response?.error || 'Failed to get concept.'));
          }
        }
      );
    });
  }

  /** Get Hint: use problem + code to get a next-step hint. */
  getHintBtn.addEventListener('click', async function () {
    showLoading('Generating hint...');
    try {
      const problemData = await getProblemFromPage();
      if (!problemData.title && !problemData.description) {
        showError('No problem data found. Make sure you are on a LeetCode problem page.');
        return;
      }
      const hint = await getHintFromBackground(problemData);
      showResult('Hint', hint);
    } catch (err) {
      let message = err.message || 'Something went wrong. Try again.';
      if (message.includes('Receiving end does not exist') || message.includes('Could not establish connection')) {
        message = 'Open a LeetCode problem page (e.g. leetcode.com/problems/two-sum/) and try again.';
      }
      showError(message);
    }
  });

  /** Get Concept: explain the concept needed for the problem. */
  getConceptBtn.addEventListener('click', async function () {
    showLoading('Generating concept...');
    try {
      const problemData = await getProblemFromPage();
      if (!problemData.title && !problemData.description) {
        showError('No problem data found. Make sure you are on a LeetCode problem page.');
        return;
      }
      const concept = await getConceptFromBackground(problemData);
      showResult('Concept', concept);
    } catch (err) {
      let message = err.message || 'Something went wrong. Try again.';
      if (message.includes('Receiving end does not exist') || message.includes('Could not establish connection')) {
        message = 'Open a LeetCode problem page (e.g. leetcode.com/problems/two-sum/) and try again.';
      }
      showError(message);
    }
  });
});
