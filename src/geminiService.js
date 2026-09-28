// src/geminiService.js - Official @google/genai integration with structured JSON output
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

/**
 * System instruction and schema requirements for the IT Support Assistant
 */
const SYSTEM_INSTRUCTION = `You are a friendly, patient, empathetic, and expert IT Support Assistant.
Your mission is to help everyday users diagnose and resolve technical issues with clear, easy-to-follow, jargon-free instructions.

Analyze the user's problem description carefully. If previous context is provided, consider what the user has already tried and provide progressive, deeper next steps without repeating already completed actions.

Determine:
1. Category: Must be exactly one of: "Hardware", "Software", or "Network".
2. Severity: Must be exactly one of: "Low", "Medium", or "High".
3. Summary: A short (1-2 sentences), warm, and encouraging summary of the problem and current diagnosis.
4. Possible Causes: 2 to 3 likely reasons for this issue in plain English.
5. Troubleshooting Steps: An ordered list of 3 to 5 clear, simple, practical steps.
   - Each step must have a short title and a concrete, actionable instruction.
   - Keep steps simple so non-technical users can perform them safely.
6. Prevention Tips: 2 practical tips on how to prevent this issue from happening again.
7. Follow-Up Questions: 1 or 2 friendly clarifying questions to ask the user if the steps do not solve the issue.

You must respond ONLY with a valid JSON object matching this exact structure:
{
  "category": "Hardware" | "Software" | "Network",
  "severity": "Low" | "Medium" | "High",
  "summary": "Friendly summary...",
  "possibleCauses": [
    "Cause 1",
    "Cause 2"
  ],
  "troubleshootingSteps": [
    {
      "stepNumber": 1,
      "title": "Clear step title",
      "instruction": "Simple step instruction..."
    }
  ],
  "preventionTips": [
    "Tip 1",
    "Tip 2"
  ],
  "followUpQuestions": [
    "Question 1?"
  ]
}`;

/**
 * Mock diagnosis returned when API_KEY is not configured, to allow local UI testing
 */
function getDemoDiagnosis(problem, previousContext) {
  const isNetwork = /wifi|internet|connection|router|dns|ping|offline|slow speed/i.test(problem);
  const isHardware = /screen|monitor|keyboard|mouse|fan|battery|power|charger|printer|cable|beeping/i.test(problem);

  const category = previousContext?.category || (isNetwork ? "Network" : (isHardware ? "Hardware" : "Software"));
  const severity = /urgent|crash|smoke|dead|blank|fail|lost/i.test(problem) ? "High" : "Medium";

  if (previousContext) {
    return {
      category,
      severity,
      summary: `We reviewed your follow-up: "${problem.slice(0, 50)}${problem.length > 50 ? '...' : ''}". Since the previous steps didn't fully resolve it, here are next-level troubleshooting steps.`,
      possibleCauses: [
        "A deeper configuration conflict or corrupted cache requiring specialized reset.",
        "Background services or firewall rules blocking communication.",
        "Hardware driver or peripheral incompatibility."
      ],
      troubleshootingSteps: [
        {
          stepNumber: 1,
          title: "Flush DNS and Reset Network/App Stack",
          instruction: "Open PowerShell or Command Prompt as Administrator, type 'ipconfig /flushdns' and press Enter. This clears corrupted routing records."
        },
        {
          stepNumber: 2,
          title: "Temporarily Disable Third-Party Antivirus/Firewall",
          instruction: "Temporarily turn off any secondary antivirus or VPN software to see if it is actively blocking the connection or program."
        },
        {
          stepNumber: 3,
          title: "Boot into Safe Mode with Networking",
          instruction: "Restart your computer while holding Shift, select Troubleshoot > Advanced options > Startup Settings, and choose Safe Mode to see if a background app is interfering."
        },
        {
          stepNumber: 4,
          title: "Reinstall or Roll Back Recent Device Drivers",
          instruction: "Open Device Manager, right-click the relevant device or adapter, select 'Properties' > 'Driver', and click 'Roll Back Driver' or 'Update Driver'."
        }
      ],
      preventionTips: [
        "Create a system restore point prior to major driver installations.",
        "Ensure your firewall whitelist contains your trusted apps and devices."
      ],
      followUpQuestions: [
        "Does any specific error code (e.g. 0x800...) appear on your screen?",
        "Have you tested connecting via an alternative cable or network hotspot?"
      ],
      isDemo: true,
      demoNotice: "🌸 Note: Demonstration response (follow-up mode). Add your Gemini API key to .env for live generation!"
    };
  }

  return {
    category,
    severity,
    summary: `We analyzed your report about "${problem.slice(0, 60)}${problem.length > 60 ? '...' : ''}". Here is a friendly guided walkthrough to help you resolve it.`,
    possibleCauses: [
      "Temporary system glitch or process hang requiring a quick refresh.",
      "Outdated settings or cached configuration files interfering with normal operation.",
      "Physical connection or service status disruption."
    ],
    troubleshootingSteps: [
      {
        stepNumber: 1,
        title: "Perform a Clean Restart",
        instruction: "Save any open work, completely shut down your computer or device, wait 30 seconds, and turn it back on. This resets temporary cache and background processes."
      },
      {
        stepNumber: 2,
        title: "Check Connections & Cables",
        instruction: "Ensure all related power, display, or network cables are securely plugged in at both ends and not damaged."
      },
      {
        stepNumber: 3,
        title: "Check for System & Driver Updates",
        instruction: "Open your system settings (Windows Update or macOS Software Update) and check if pending updates need to be installed."
      },
      {
        stepNumber: 4,
        title: "Run the Built-in Troubleshooter",
        instruction: "Navigate to Settings > System > Troubleshoot > Other troubleshooters and run the diagnostic tool matching your problem."
      }
    ],
    preventionTips: [
      "Keep your operating system and applications updated with the latest security and stability patches.",
      "Restart your device at least once a week to clear accumulated memory and background tasks."
    ],
    followUpQuestions: [
      "Did this issue start right after a specific update or installing a new program?",
      "Are other devices on the same desk or network experiencing the same behavior?"
    ],
    isDemo: true,
    demoNotice: "🌸 Note: This is a demonstration diagnosis because GEMINI_API_KEY is not yet configured in your .env file. Add your Gemini API key to .env for live generation!"
  };
}

/**
 * Clean and parse JSON from the model response, stripping any markdown backticks
 */
function parseJsonSafe(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Main function to diagnose an IT problem using the official @google/genai SDK
 * Accepts problemText and optional previousContext for multi-turn troubleshooting
 */
async function diagnoseProblem(problemText, previousContext = null) {
  const currentKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!currentKey || currentKey.trim() === '' || currentKey === 'your_gemini_api_key_here') {
    console.log('No GEMINI_API_KEY configured. Returning demo diagnosis response.');
    return getDemoDiagnosis(problemText, previousContext);
  }

  // Initialize official GoogleGenAI client
  const ai = new GoogleGenAI({ apiKey: currentKey });

  let userPrompt = `Please diagnose this user's IT problem and provide actionable troubleshooting guidance:\n\n"${problemText}"`;

  if (previousContext) {
    userPrompt = `The user is following up on a previously diagnosed IT problem because the earlier steps did not fully resolve it.

Original Issue: "${previousContext.originalProblem || 'N/A'}"
Previous Category: ${previousContext.category || 'Unknown'}
Previous Attempted Steps: ${(previousContext.attemptedSteps || []).join('; ') || 'Standard restart/checks'}

User's Follow-up Feedback / What Happened:
"${problemText}"

Please provide progressive, deeper next-level troubleshooting steps that take into account what was already attempted. Avoid repeating earlier basic steps.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text;

    if (!rawText) {
      throw new Error('Gemini API returned an empty response. Please try again.');
    }

    const parsed = parseJsonSafe(rawText);

    // Normalize category and severity fallbacks
    if (!['Hardware', 'Software', 'Network'].includes(parsed.category)) {
      parsed.category = previousContext?.category || 'Software';
    }
    if (!['Low', 'Medium', 'High'].includes(parsed.severity)) {
      parsed.severity = 'Medium';
    }

    return parsed;
  } catch (err) {
    console.error('Error invoking @google/genai generateContent:', err);
    throw new Error(err.message || 'Error occurred while analyzing problem with Gemini API.');
  }
}

module.exports = {
  diagnoseProblem
};
