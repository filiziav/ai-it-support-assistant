// server.js - AI IT Support Assistant Web Server
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { diagnoseProblem } = require('./src/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health Check endpoint (useful for AWS load balancers & monitoring)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'IT Support Assistant',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Diagnose endpoint
app.post('/api/diagnose', async (req, res) => {
  const { problem, previousContext } = req.body;

  if (!problem || typeof problem !== 'string' || problem.trim().length === 0) {
    return res.status(400).json({
      error: 'Please describe the IT problem you are experiencing.'
    });
  }

  if (problem.trim().length < 5) {
    return res.status(400).json({
      error: 'Please provide a little more detail about the issue so we can help.'
    });
  }

  try {
    const diagnosis = await diagnoseProblem(problem.trim(), previousContext);
    return res.json(diagnosis);
  } catch (err) {
    console.error('Diagnosis error:', err);
    return res.status(500).json({
      error: err.message || 'Something went wrong while analyzing your problem. Please try again.'
    });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`🌸 IT Support Assistant is running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.warn('⚠️ Warning: GEMINI_API_KEY is not set in .env. Please add it to enable AI diagnostics.');
  }
});
