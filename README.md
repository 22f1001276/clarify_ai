<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clarify AI - Document Understanding Assistant

An intelligent AI-powered application designed to help users, especially seniors, understand complex documents with ease. Clarify AI uses Google's Gemini API to analyze documents and provide simple, clear explanations of medical bills, tax forms, legal letters, and other complex paperwork.

<div align="center">
  <a href="https://ai.studio/apps/drive/1XdFQQX1TjRrVsRIERGWUVDqOK_gr6nGQ?fullscreenApplet=true" target="_blank" rel="noopener noreferrer">
    <button style="padding: 10px 20px; font-size: 16px; background-color: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
      View App in AI Studio
    </button>
  </a>
</div>

## 🎯 Overview

Clarify AI is a web-based application built with React and TypeScript that leverages advanced AI to break down confusing documents into simple, understandable language. The application features:

- **Document Upload & Analysis**: Upload images or PDF files to get instant analysis
- **Camera Integration**: Capture documents directly using your device's camera
- **Multi-Language Support**: Supports English, Spanish, Hindi, French, German, and Chinese
- **Risk Detection**: Identifies potentially fraudulent or high-risk documents
- **Interactive Chat**: Ask follow-up questions about analyzed documents
- **Voice Input**: Dictate your questions using speech recognition
- **Text-to-Speech**: Listen to explanations with audio playback
- **Dark Mode**: Eye-friendly dark theme option
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Key Features

### Document Analysis
- Upload or photograph complex documents
- AI-powered analysis using Google's Gemini model
- Receives structured information including:
  - **Summary**: One-sentence bottom line of the document
  - **Action Required**: Specific steps the user needs to take
  - **Risk Level**: Classification as Low, Medium, or High risk
  - **Simple Explanation**: Easy-to-understand explanation suitable for any user

### Smart Risk Detection
- Identifies potential scams and fraudulent documents
- Alerts users about high-risk items (e.g., unsolicited wire transfer requests)
- Helps protect vulnerable users from document-based fraud

### Conversational Interface
- Ask follow-up questions about your documents
- Receive patient, warm, and reassuring responses
- Natural conversation flow with chat history

### Accessibility Features
- Voice input for hands-free questioning
- Text-to-speech for audio feedback
- Large, clear interface with excellent contrast
- Multi-language support for diverse user base
- Optimized for seniors and users with varying tech comfort levels

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Tailwind CSS
- **Build Tool**: Vite
- **AI Model**: Google Gemini 2.0 Flash
- **Icons**: Lucide React
- **APIs**: Google GenAI SDK

## 📋 Prerequisites

- Node.js (v16 or higher)
- Google Gemini API key

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd clarify_ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
clarify_ai/
├── components/
│   ├── FileUpload.tsx      # File upload and camera components
│   └── AnalysisResult.tsx  # Display analysis results
├── services/
│   └── geminiService.ts    # Gemini API integration
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── constants.ts            # Application constants and prompts
├── index.tsx               # React entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md              # This file
```

## 🔧 Configuration

### Supported Languages
- English (en)
- Spanish (es)
- Hindi (hi)
- French (fr)
- German (de)
- Chinese (zh)

### Analysis System Instructions
The AI uses specialized prompts to ensure warm, patient, and simple communication tailored for elderly users. The system avoids corporate jargon and focuses on clarity and reassurance.

## 🌐 Deployment

The application can be deployed to any static hosting service:

- **Vercel**: `npm run build` → Deploy the `dist` folder
- **Netlify**: Connect your GitHub repo for automatic deployments
- **Firebase Hosting**: Use Firebase CLI to deploy
- **GitHub Pages**: Configure GitHub Actions for CI/CD
- **Traditional Hosting**: Upload the `dist` folder to any web server

## 📖 Usage

1. **Upload a Document**:
   - Click "Upload File" to select an image or PDF
   - Or use the camera icon to photograph a document directly

2. **Review Analysis**:
   - Read the AI-generated summary and explanation
   - Check the risk level and required actions
   - Dark mode is available for comfortable viewing

3. **Ask Questions**:
   - Use the chat interface to ask follow-up questions
   - Use voice input if preferred (browser must have microphone access)
   - Listen to responses with text-to-speech

4. **Analyze Another Document**:
   - Click "Analyze Another Document" to start over

## 🔐 Security & Privacy

- API keys are stored securely in environment variables
- No data is permanently stored on servers
- All processing uses secure HTTPS connections
- Documents are analyzed by Gemini and not retained

## 🎓 Target Users

Clarify AI is designed for:
- Elderly users who need help understanding complex documents
- People with varying levels of tech literacy
- Non-native speakers who need translated explanations
- Anyone overwhelmed by complex paperwork

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report issues or bugs
- Suggest new features
- Submit pull requests with improvements
- Help with translations or localization

## 📄 License

This project is provided as-is for educational and practical use.

## 🔗 Resources

- [Google Gemini API Documentation](https://ai.google.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository or contact the development team.

---

Built with ❤️ to help users understand complex documents with ease and confidence.
