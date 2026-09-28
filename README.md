# IT Support Assistant

IT Support Assistant is a web application that helps users troubleshoot everyday computer, software, and network problems. Users can describe an issue in plain words, and the assistant provides structured, step-by-step advice powered by the Google Gemini API.

---

## Features

- **Problem Analysis**: Analyzes issues and identifies the category (Hardware, Software, or Network) and severity level (Low, Medium, or High).
- **Step-by-Step Guidance**: Provides clear, sequential troubleshooting steps with an interactive checklist to track progress.
- **Causes & Prevention**: Explains probable causes in simple terms and offers practical tips to prevent the problem from happening again.
- **Resolution Feedback**: Includes "Did this solve your problem?" options. If an issue is not resolved, users can submit follow-up details to receive deeper troubleshooting assistance.
- **Example Problems**: Quick-start cards for common problems, including Wi-Fi disconnections, slow performance, offline printers, and login errors.
- **Recent Problems**: Saves queries locally during the current browser session so users can review earlier results or clear session history.
- **Demo Mode**: Includes built-in demonstration responses if no API key is provided, allowing the interface to be tested immediately.

---

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **AI Service**: Google GenAI SDK (@google/genai) with the Gemini API
- **Deployment**: Docker, ready for AWS (App Runner or Elastic Beanstalk)
