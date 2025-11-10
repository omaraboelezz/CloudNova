// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
// Import the SettingPage component
import SettingPage from './SettingPage/setting.tsx'; // Ensure it's exported as a component
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const storedHistory = localStorage.getItem('chatHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
      return [];
    }
  });
  const [currentChatId, setCurrentChatId] = useState(null);

  const fileInputRef = useRef(null);
  const uploadOptionsRef = useRef(null);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);

  // useNavigate must be called inside a component that is rendered within a Router
  // We'll move the Router to the highest level, so App can use useNavigate
  const navigate = useNavigate();

  // Effect for theme and click outside handlers
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const handleClickOutside = (event) => {
      if (uploadOptionsRef.current && !uploadOptionsRef.current.contains(event.target)) {
        setShowUploadOptions(false);
      }
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        sidebarToggleRef.current &&
        !sidebarToggleRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [theme]);

  // Effect to save chatHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (error) {
      console.error("Failed to save chat history to localStorage", error);
    }
  }, [chatHistory]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const startNewChat = () => {
    setQuestion('');
    setAnswer('');
    setUploadedFile(null);
    setCurrentChatId(null); // No chat is active when starting a new one
    setIsSidebarOpen(false);
    navigate('/'); // Navigate to home
    console.log("Starting new chat.");
  };

  const loadChat = (chatId) => {
    const chatToLoad = chatHistory.find(chat => chat.id === chatId);
    if (chatToLoad) {
      setQuestion(chatToLoad.question);
      setAnswer(chatToLoad.answer);
      setUploadedFile(null); // Clear file as it's not saved in history for now
      setCurrentChatId(chatId);
      setIsSidebarOpen(false);
      navigate('/'); // Navigate to home after loading chat
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setAnswer('');
    setIsSidebarOpen(false);

    console.log("Submitting:", { question, uploadedFile });

    setTimeout(() => {
      const newAnswer =
        "Here's a step-by-step solution to your question:\n\n" +
        "1. First, understand the problem thoroughly.\n" +
        "2. Break down the problem into smaller, manageable steps.\n" +
        "3. Research or recall relevant concepts.\n" +
        "4. Apply those concepts to solve each step.\n" +
        "5. Review your solution and ensure it makes sense.";

      setAnswer(newAnswer);
      setIsLoading(false);

      // Save the new chat to history only if a question was asked
      if (question.trim()) {
        const newChat = {
          id: Date.now(), // Simple unique ID
          question: question,
          answer: newAnswer,
          timestamp: new Date().toISOString(), // For potential sorting later
        };

        setChatHistory((prevHistory) => {
          // If editing an existing chat, update it. Otherwise, add new.
          if (currentChatId) {
            return prevHistory.map(chat =>
              chat.id === currentChatId ? { ...chat, question, answer: newAnswer } : chat
            );
          }
          return [newChat, ...prevHistory]; // Add new chat to the beginning
        });
        setCurrentChatId(newChat.id); // Set the newly saved chat as current
      }

    }, 2000);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setShowUploadOptions(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const triggerFileInput = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getChatTitle = (chat) => {
    const title = chat.question.split('\n')[0].substring(0, 30);
    return title.length === 30 ? title + '...' : title;
  };

  // Main content component to render based on route
  const MainContent = () => (
    <main className="content-area">
      <div className="input-section">
        <label htmlFor="question-input">Enter your question or upload a file:</label>
        <div
          className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <textarea
            id="question-input"
            rows="6"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here, or drag & drop a file above."
          ></textarea>

          <div className="main-upload-button-wrapper" ref={uploadOptionsRef}>
            <button
              className="main-upload-trigger-button"
              onClick={() => setShowUploadOptions(!showUploadOptions)}
              title="Upload File"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              Upload
            </button>

            {showUploadOptions && (
              <div className="upload-options-dropdown">
                <button
                  className="upload-option-button"
                  onClick={() => triggerFileInput('.pdf')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M10 12H8"></path><path d="M16 12h-2"></path><path d="M16 16h-2"></path><path d="M10 16H8"></path><path d="M12 20h.01"></path></svg>
                  PDF
                </button>
                <button
                  className="upload-option-button"
                  onClick={() => triggerFileInput('image/*')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Image
                </button>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {uploadedFile && (
          <div className="uploaded-file-preview">
            <span>{uploadedFile.name}</span>
            <button onClick={removeUploadedFile} className="remove-file-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}

        <button onClick={handleSubmit} disabled={isLoading || (!question.trim() && !uploadedFile)}>
          {isLoading ? 'Solving...' : 'Get Solution'}
        </button>
      </div>

      {answer && (
        <div className="answer-section">
          <h2>Solution:</h2>
          <pre className="solution-text">{answer}</pre>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <p>Thinking...</p>
        </div>
      )}
    </main>
  );

  return ( // THIS IS THE ROUTER YOU NEED TO REMOVE
    // <Router>
      <div className={`app-wrapper ${theme}-mode`}>
        {/* Sidebar component */}
        <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <button onClick={toggleSidebar} className="sidebar-toggle-button" ref={sidebarToggleRef}>
              <svg xmlns="http://www.w3.000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
          <nav className="sidebar-nav">
            <Link to="/" onClick={startNewChat} className="nav-item">
              <svg xmlns="http://www.w3.000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Home</span>
            </Link>
            <Link to="/history" className="nav-item" onClick={() => setIsSidebarOpen(false)}>
              <svg xmlns="http://www.w3.000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10l4 4"></path><circle cx="12" cy="12" r="10"></circle></svg>
              <span>History</span>
            </Link>
            <Link to="/settings" className="nav-item" onClick={() => setIsSidebarOpen(false)}>
              <svg xmlns="http://www.w3.000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0-.33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1.82.33l-.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09z"></path></svg>
              <span>Settings</span>
            </Link>
          </nav>

          <button onClick={startNewChat} className="new-chat-button">
            <svg xmlns="http://www.w3.000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>New Chat</span>
          </button>

          <div className="sidebar-chat-history">
            {chatHistory.length === 0 ? (
              <h3 className="no-history-message">Start a new chat!</h3>
            ) : (
              <ul>
                {chatHistory.map((chat) => (
                  <li
                    key={chat.id}
                    className={`history-item ${chat.id === currentChatId ? 'active' : ''}`}
                    onClick={() => loadChat(chat.id)}
                  >
                    <svg xmlns="http://www.w3.000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <span>{getChatTitle(chat)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="user-profile">
              <svg xmlns="http://www.w3.000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Get Mamun</span>
            </div>
          </div>
        </div>

        {isSidebarOpen && <div className="overlay" onClick={toggleSidebar}></div>}

        <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <header className="app-header">
            <button onClick={toggleSidebar} className="sidebar-toggle-button" ref={sidebarToggleRef}>
              <svg xmlns="http://www.w3.000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1>AI Question Solver</h1>
            <button onClick={toggleTheme} className="theme-toggle-button">
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
          </header>

          {/* Define your routes */}
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/history" element={<div><h2>Chat History</h2><p>Display your chat history here.</p></div>} />
          </Routes>
        </div>
      </div>
  );
}

// Wrapper component to provide Router context to App
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;