import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false); 

  const fileInputRef = useRef(null);
  const uploadOptionsRef = useRef(null); 

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const handleClickOutside = (event) => {
      if (uploadOptionsRef.current && !uploadOptionsRef.current.contains(event.target)) {
        setShowUploadOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setAnswer('');

    console.log("Submitting:", { question, uploadedFile });

    setTimeout(() => {
      setAnswer(
        "Here's a step-by-step solution to your question:\n\n" +
        "1. First, understand the problem thoroughly.\n" +
        "2. Break down the problem into smaller, manageable steps.\n" +
        "3. Research or recall relevant concepts.\n" +
        "4. Apply those concepts to solve each step.\n" +
        "5. Review your solution and ensure it makes sense."
      );
      setIsLoading(false);
    }, 2000);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setShowUploadOptions(false); // Close dropdown after selection
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

  return (
    <div className={`app-container ${theme}-mode`}>
      <header className="app-header">
        <h1>AI Question Solver</h1>
        <button onClick={toggleTheme} className="theme-toggle-button">
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </header>

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
    </div>
  );
}

export default App;