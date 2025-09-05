import React from 'react';

interface SmartReplyProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SmartReply: React.FC<SmartReplyProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion)}
          className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors duration-200 ease-in-out"
        >
          {suggestion}
        </button>
      ))
      }
    </div >
  );
};

export default SmartReply;
