
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import SettingPage from './Components/SettingPage/setting.tsx';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HistoryPage from './Components/HistoryPage/HistoryPage.tsx';
import ChatDetailPage from './Components/ChatDetailPage/ChatDetailPage.tsx';
import { useParams } from 'react-router-dom';




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
  const navigate = useNavigate();

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
  
  const ChatDetailWrapper = ({ chatHistory }) => {
  const { chatId } = useParams();
  const chat = chatHistory.find(c => c.id === Number(chatId));
  return <ChatDetailPage chat={chat} theme={theme} />;
};

  const startNewChat = () => {
    setQuestion('');
    setAnswer('');
    setUploadedFile(null);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
    navigate('/');
    console.log("Starting new chat.");
  };

const loadChat = (chatId) => {
  const chatToLoad = chatHistory.find(chat => chat.id === chatId);
  if (chatToLoad) {
    // آخر سؤال:
    const lastQuestion = chatToLoad.questions[chatToLoad.questions.length - 1]?.text || '';
    setQuestion(lastQuestion);
    setAnswer(chatToLoad.answer || '');
    setUploadedFile(null);
    setCurrentChatId(chatId);
    setIsSidebarOpen(false);
    navigate(`/history/${chatId}`);
  }
};


const handleSubmit = async () => {
  if (!(question && question.trim()) && !uploadedFile) return;

  setIsLoading(true);

  try {
    const res = await fetch("http://127.0.0.1:5000/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    const newAnswer = data.response;
    const timestamp = Date.now();

    if (currentChatId) {
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                questions: [
                  ...chat.questions,
                  { text: question, answer: newAnswer, timestamp }
                ],
              }
            : chat
        )
      );
    } else {
      const newChat = {
        id: Date.now(),
        questions: [{ text: question, answer: newAnswer, timestamp }],
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    }

    setAnswer(newAnswer);
    setQuestion('');

  } catch (err) {
    console.error(err);
    setAnswer("Oops! Something went wrong.");
  } finally {
    setIsLoading(false);
  }
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
  const firstQuestion = chat.questions?.[0];
  if (!firstQuestion) return 'No questions yet';
  
  const title = firstQuestion.text.split('\n')[0].substring(0, 30);
  return title.length === 30 ? title + '...' : title;
};



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
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={(e) =>
              e.target.setSelectionRange(e.target.value.length, e.target.value.length)
            }
            placeholder="Type your question here"
          />

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
          <ReactMarkdown
            children={answer}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          />
        </div>
      )}


      {isLoading && (
        <div className="loading-indicator">
          <p>Thinking...</p>
        </div>
      )}
    </main>
  );

  return (
    <div className={`app-wrapper ${theme}-mode`}>
      <div ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button onClick={toggleSidebar} className="sidebar-toggle-button" ref={sidebarToggleRef}>
            <svg xmlns="http://www.w3.000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" onClick={startNewChat} className="nav-item">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/history" className="nav-item" onClick={() => setIsSidebarOpen(false)}>
            <i class="fas fa-clock"></i>
            <span>History</span>
          </Link>
          <Link to="/settings" className="nav-item" onClick={() => setIsSidebarOpen(false)}>
            <i class="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </nav>

        <button onClick={startNewChat} className="new-chat-button">
          <svg xmlns="http://www.w3.000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>New Chat</span>
        </button>

        <h3
          style={{
            fontWeight: 600,
            fontSize: '16px',
            marginBottom: '10px',
            color: '#ffffff8e', // تقدر تغيّر اللون حسب الثيم بتاعك
            textAlign: 'left',
            marginLeft: '35px',
          }}
        >
          Chat History :
        </h3>

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
                  <i className="fas fa-comments" style={{ marginRight: '8px' }}></i>
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
            <i class="fa-solid fa-bars"></i>
          </button>
          <h1>AI Question Solver</h1>
          <button onClick={toggleTheme} className="theme-toggle-button">
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </header>

        

        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route
            path="/history"
            element={
              <HistoryPage
                chatHistory={chatHistory}
                loadChat={loadChat}
                currentChatId={currentChatId}
              />
            }
          />        
          <Route path="/history/:chatId" element={<ChatDetailWrapper chatHistory={chatHistory} theme={theme} />} />
        </Routes>
      </div>
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;