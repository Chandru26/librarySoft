import React from 'react';

const faqPageStyle: React.CSSProperties = {
  paddingTop: '20px', // Only vertical padding
  paddingBottom: '20px', // Only vertical padding
  // maxWidth: '800px', // Removed to allow full width
  // margin: '0 auto', // Removed to allow full width
  fontFamily: 'Arial, sans-serif', // Keep font style
};

const faqItemStyle: React.CSSProperties = {
  marginBottom: '15px',
  borderBottom: '1px solid #eee',
  paddingBottom: '10px',
};

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  padding: '10px 0',
  fontSize: '1.1em',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#333', // Added text color for the button
};

const answerStyle: React.CSSProperties = {
  padding: '10px',
  backgroundColor: '#f9f9f9',
  marginTop: '5px',
  borderRadius: '4px',
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div style={faqItemStyle}>
      <button onClick={() => setIsOpen(!isOpen)} style={buttonStyle}>
        {question}
        <span>{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && <p style={answerStyle}>{answer}</p>}
    </div>
  );
};

const FAQPage: React.FC = () => {
  const faqs = [
    {
      question: "What is LibrarySoft?",
      answer: "LibrarySoft is a comprehensive library management system designed to help libraries of all sizes manage their collections, members, and operations efficiently."
    },
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. An email will be sent to you with further instructions."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, LibrarySoft is web-based and fully responsive, providing a seamless experience on desktops, tablets, and mobile browsers. A dedicated mobile app is planned for future development."
    },
    {
      question: "Can I import existing data into LibrarySoft?",
      answer: "Yes, LibrarySoft supports data import for books, members, and other relevant information. Please contact our support team for assistance with the data migration process."
    }
  ];

  return (
    <div style={faqPageStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Frequently Asked Questions</h1>
      {faqs.map((faq, index) => (
        <FAQItem key={index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
};

export default FAQPage;
