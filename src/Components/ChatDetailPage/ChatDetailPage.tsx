// ChatDetailPage.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface QuestionItem {
  text: string;
  answer: string;      // الإجابة مرتبطة بكل سؤال
  timestamp: number;   // وقت السؤال
}

interface Chat {
  id: number;
  questions: QuestionItem[];
}

interface ChatDetailProps {
  chat?: Chat; // ممكن يكون undefined لو URL غلط
  theme: 'light' | 'dark'; // نضيف الثيم كـ prop

}

const ChatDetailPage: React.FC<ChatDetailProps> = ({ chat, theme }) => {
  if (!chat) {
    return <p style={{ padding: '20px', textAlign: 'center' }}>Chat not found!</p>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Chat Details</h2>
      {chat.questions.map((q, index) => (
        <div
          key={index}
          style={{
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '15px',
            backgroundColor: theme === 'dark' ? '#2c3e50' : '#f0f4f8',
            color: theme === 'dark' ? '#f0f0f0' : '#2c3e50',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Question :</p>
          <p style={{ margin: '0 0 12px 0', paddingLeft: '10px' }}>{q.text}</p>

          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Answer :</p>
          <div style={{ margin: '0 0 12px 0', paddingLeft: '10px' }}>
            <ReactMarkdown
              children={q.answer}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            />
          </div>

          <small style={{ color: '#dad7d7ff', display: 'block', textAlign: 'right' }}>
            {new Date(q.timestamp).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
};


export default ChatDetailPage;
