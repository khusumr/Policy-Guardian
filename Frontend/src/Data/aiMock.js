// Placeholder AI logic so the UI is fully wired up and demoable.
// Replace the body of each function with a real call to your backend
// (which would call the Anthropic API) once one exists. Keep the
// function signatures the same and nothing else needs to change.

export async function askAIAboutText(question, highlightedText) {
  await delay(600);

  return (
    `Here's a plain-language take on the highlighted section: "${trim(highlightedText)}"\n\n` +
    `Regarding your question — "${question}" — this clause generally means employees ` +
    `should follow the stated rule under normal conditions, with exceptions handled by ` +
    `HR case-by-case. (Placeholder response — connect a real AI backend to replace this.)`
  );
}

export async function rewordText(instruction, highlightedText) {
  await delay(600);

  return (
    `${trim(highlightedText)} (Rewritten per your instruction: "${instruction}". ` +
    `Placeholder response — connect a real AI backend to replace this.)`
  );
}

function trim(text, max = 120) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
