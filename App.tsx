import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResultDisplay } from './components/AnalysisResult';
import { analyzeDocument, sendChatMessage } from './services/geminiService';
import { AppState, AnalysisResult, ChatMessage } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { Loader2, RefreshCw, Send, Image as ImageIcon, MessageCircle, Mic, MicOff, Sun, Moon, X, Camera, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0].label); // Default English
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize Theme
  useEffect(() => {
    // Check local storage first
    const savedTheme = localStorage.getItem('clarify_theme') as 'light' | 'dark' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // If no save, check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('clarify_theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErrorMsg(null);
    setCameraError(null);
  };

  const handleStartOver = () => {
    setState(AppState.IDLE);
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setChatHistory([]);
    setErrorMsg(null);
    setVoiceError(null);
    setCameraError(null);
    stopCamera();
    stopListening();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setState(AppState.ANALYZING);
    try {
      const base64Data = await fileToBase64(selectedFile);
      const result = await analyzeDocument(base64Data, selectedFile.type, selectedLanguage);
      setAnalysisResult(result);
      setState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      setErrorMsg("We couldn't read that document comfortably. Please try taking a clearer photo.");
      setState(AppState.ERROR);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedFile) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setVoiceError(null);
    setIsChatLoading(true);

    try {
      const base64Data = await fileToBase64(selectedFile);
      const responseText = await sendChatMessage(chatHistory, userMsg.text, base64Data, selectedFile.type);
      
      const modelMsg: ChatMessage = { role: 'model', text: responseText };
      setChatHistory(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Camera Logic ---

  const startCamera = async () => {
    setCameraError(null);
    try {
      // requesting camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Camera error:", err);
      let msg = "Could not access the camera.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
         msg = "Camera access denied. Please use the upload option or check your browser permissions.";
      } else if (err.name === 'NotFoundError') {
         msg = "No camera found on this device.";
      } else if (err.name === 'NotReadableError') {
         msg = "Your camera might be in use by another application.";
      }
      
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_document.jpg", { type: "image/jpeg" });
            handleFileSelect(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };
  
  const handleCameraClick = () => {
    startCamera();
  };

  // --- Voice Logic ---

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    // Cleanup of timers and state is handled in the onend callback
  };

  const startListening = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. You can type instead.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const langObj = SUPPORTED_LANGUAGES.find(l => l.label === selectedLanguage);
      const langCode = langObj ? langObj.code : 'en';
      recognition.lang = langCode === 'en' ? 'en-US' : langCode;
      
      // Enable continuous results so it doesn't stop after one sentence
      recognition.continuous = true;
      // Enable interim results for real-time typing effect
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Capture the text currently in the input so we can append to it
      const startText = chatInput;

      // Silence Detection
      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 3000); // Stop after 3 seconds of silence
      };

      recognition.onstart = () => {
        setIsListening(true);
        resetSilenceTimer();
      };
      
      recognition.onresult = (event: any) => {
        resetSilenceTimer(); // Reset timer when speech is detected

        let transcript = '';
        // Combine results
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setChatInput(() => {
          const spacer = startText.length > 0 && !startText.endsWith(' ') ? ' ' : '';
          return startText + spacer + transcript;
        });
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        
        // Ignore 'no-speech' errors as they just mean silence and browser stops
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setVoiceError("Microphone access blocked.");
          setIsListening(false);
        } else {
          // For other errors, we might want to just stop silently or show a message
          setIsListening(false);
          setVoiceError("We couldn't hear you clearly. Please try again.");
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };
      
      recognition.start();
    } catch (err) {
      console.error(err);
      setVoiceError("Unable to start voice input.");
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      // Clean up timer and recognition on unmount
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 relative transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <ImageIcon className="text-white w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clarify AI</h1>
               <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Grandma's Document Helper</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {state !== AppState.IDLE && (
              <button 
                onClick={handleStartOver}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2 rounded-full transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* State: IDLE - Upload & Config */}
        {state === AppState.IDLE && !cameraStream && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4 mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
                Confused by a letter? <br/> Let us help.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Upload a photo of your mail, medical bill, or legal document. We will explain it simply.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
              <label className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">
                I want the explanation in:
              </label>
              <div className="flex flex-wrap justify-center gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.label)}
                    className={`px-6 py-2 rounded-full text-base font-medium transition-all ${
                      selectedLanguage === lang.label
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <FileUpload 
              onFileSelect={handleFileSelect}
              onCameraClick={handleCameraClick}
            />
            
            {cameraError && (
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-red-700 dark:text-red-200">{cameraError}</p>
              </div>
            )}

            {selectedFile && previewUrl && (
               <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-300 transition-colors duration-300">
                 <div className="flex flex-col items-center">
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Does this look right?</h3>
                   <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-80 rounded-xl object-contain border-2 border-slate-100 dark:border-slate-700 shadow-sm mb-6 bg-slate-50 dark:bg-slate-900" 
                   />
                   <button
                     onClick={handleAnalyze}
                     className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                   >
                     Help Me Understand This
                   </button>
                 </div>
               </div>
            )}
          </div>
        )}

        {/* Camera Overlay */}
        {cameraStream && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in">
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
               <video 
                ref={(node) => {
                  if (node && cameraStream && node.srcObject !== cameraStream) {
                    node.srcObject = cameraStream;
                    videoRef.current = node;
                    node.play().catch(console.error);
                  }
                }}
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
               />
               <div className="absolute top-0 left-0 right-0 p-6 flex justify-end bg-gradient-to-b from-black/50 to-transparent">
                  <button 
                    onClick={stopCamera}
                    className="text-white bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <X className="w-8 h-8" />
                  </button>
               </div>
            </div>
            <div className="bg-slate-900 p-8 flex justify-center items-center pb-12">
               <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:bg-white/30 transition-all active:scale-95 hover:bg-white/20"
                aria-label="Capture Photo"
               >
                 <div className="w-16 h-16 bg-white rounded-full pointer-events-none"></div>
               </button>
            </div>
          </div>
        )}

        {/* State: ANALYZING */}
        {state === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 dark:bg-blue-900 rounded-full animate-ping opacity-25"></div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg relative z-10">
                <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Reading your document...</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">Just a moment while I review your document.</p>
            </div>
          </div>
        )}

        {/* State: ERROR */}
        {state === AppState.ERROR && (
          <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl text-center border border-red-100 dark:border-red-900/50 animate-in shake duration-500">
             <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Oh dear, something went wrong.</h2>
             <p className="text-lg text-red-800 dark:text-red-300 mb-6">{errorMsg || "We couldn't process this file."}</p>
             <button 
               onClick={handleStartOver}
               className="px-8 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-colors"
             >
               Try Again
             </button>
          </div>
        )}

        {/* State: RESULTS */}
        {state === AppState.RESULTS && analysisResult && (
          <div className="space-y-10">
            <AnalysisResultDisplay result={analysisResult} />
            
            {/* Chat Interface */}
            <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 mt-8 relative transition-colors duration-300">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                 <MessageCircle className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                 Still have questions?
              </h2>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 px-5 py-3 rounded-2xl rounded-bl-none">
                      <div className="flex gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleMicClick}
                    disabled={isChatLoading}
                    className={`p-4 rounded-full shadow-lg transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse scale-105' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    title={isListening ? "Stop listening" : "Speak your question"}
                  >
                     {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      if (voiceError) setVoiceError(null); // Clear error on typing
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isListening}
                    placeholder={isListening ? "Listening..." : "Ask a question..."}
                    className="flex-1 px-6 py-4 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder:text-slate-400 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
                {voiceError && (
                  <p className="text-red-500 dark:text-red-400 text-sm font-medium ml-2 animate-in slide-in-from-top-1">
                    {voiceError}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;