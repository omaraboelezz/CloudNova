// HistoryPage.tsx
import React from 'react';
import './HistoryPage.css';

interface QuestionItem {
  text: string;
  timestamp: number;
}

interface Chat {
  id: number;
  questions?: QuestionItem[]; // ممكن تكون optional
  answer?: string;
}

interface HistoryPageProps {
  chatHistory: Chat[];
  loadChat: (id: number) => void;
  currentChatId: number | null;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ chatHistory, loadChat, currentChatId }) => {
  return (
    <div className="history-page">
      <h2>Chat History</h2>
      {chatHistory.length === 0 ? (
        <p>No chats yet. Start a new chat!</p>
      ) : (
        <div className="chat-boxes-container">
          {chatHistory.map(chat => {
            const firstQuestion = chat.questions?.[0]; // حماية من undefined
            return (
              <div
                key={chat.id}
                className={`chat-box ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => loadChat(chat.id)}
              >
                {firstQuestion ? (
                  <>
                    <h4 className="chat-question">
                      {firstQuestion.text.substring(0, 50)}
                      {firstQuestion.text.length > 50 && '...'}
                    </h4>
                    <p className="chat-timestamp">
                      {new Date(firstQuestion.timestamp).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p>No questions yet</p>
                )}
                
                {chat.answer && (
                  <p className="chat-answer-preview">
                    {chat.answer.substring(0, 100)}
                    {chat.answer.length > 100 && '...'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
