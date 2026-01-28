import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Lightbulb, Target, MessageSquare, ListTodo } from 'lucide-react';

interface SummaryData {
  purpose?: string;
  what_happened?: string;
  what_was_done?: string;
  what_asked?: string;
  key_takeaways?: string;
  action_items?: string;
}

interface SummaryDisplayProps {
  summaryData: SummaryData;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summaryData }) => {
  // Convert text to array of items
  const parseItems = (text: string | undefined): string[] => {
    if (!text) return [];
    
    // If already formatted as bullets, extract items
    if (text.includes('\n-') || text.includes('\n•') || text.includes('\n*')) {
      return text
        .split(/\n[-•*]\s*/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    // Split by common delimiters
    return text
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  };

  // Section component for consistent styling
  const Section: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    content: string | string[];
    highlight?: boolean;
    highlightColor?: 'red' | 'yellow';
  }> = ({ title, icon, content, highlight = false, highlightColor }) => {
    const items = Array.isArray(content) ? content : parseItems(content);
    const isList = items.length > 1 || (items.length === 1 && items[0].length < 100);
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-3 flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </h3>
        {isList ? (
          <ul className={`list-none space-y-2 mb-4 ml-0 ${
            highlight 
              ? highlightColor === 'red' 
                ? 'bg-red-50 p-3 rounded-lg border border-red-200'
                : 'bg-yellow-50 p-3 rounded-lg border border-yellow-200'
              : ''
          }`}>
            {items.map((item, idx) => (
              <li 
                key={idx}
                className={`text-sm leading-relaxed flex items-start gap-2 ${
                  highlight && highlightColor === 'red'
                    ? 'text-gray-900 font-medium px-2 py-1.5 rounded border-l-4 border-red-600 bg-white'
                    : highlight && highlightColor === 'yellow'
                    ? 'text-gray-900 px-2 py-1.5 rounded border-l-4 border-yellow-500 bg-white'
                    : 'text-gray-700 pl-2'
                }`}
              >
                <span className={`mt-1.5 flex-shrink-0 ${
                  highlight && highlightColor === 'red' 
                    ? 'text-red-600' 
                    : highlight && highlightColor === 'yellow'
                    ? 'text-yellow-600'
                    : 'text-gray-400'
                }`}>
                  {highlight && highlightColor === 'red' ? '▸' : highlight && highlightColor === 'yellow' ? '◆' : '•'}
                </span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-700 leading-relaxed mb-3">
            <ReactMarkdown 
              components={{
                p: ({ node, ...props }: any) => <p className="mb-2" {...props} />,
                strong: ({ node, ...props }: any) => <strong className="font-semibold text-gray-900" {...props} />,
                em: ({ node, ...props }: any) => <em className="italic" {...props} />,
              }}
            >
              {Array.isArray(content) ? content[0] : content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200">
        Meeting Summary Report
      </h2>
      
      {summaryData.purpose && (
        <Section
          title="Purpose"
          icon={<Target className="w-5 h-5 text-blue-600" />}
          content={summaryData.purpose}
        />
      )}
      
      {summaryData.what_happened && (
        <Section
          title="What Happened"
          icon={<MessageSquare className="w-5 h-5 text-green-600" />}
          content={summaryData.what_happened}
        />
      )}
      
      {summaryData.what_was_done && (
        <Section
          title="What Was Done"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          content={summaryData.what_was_done}
        />
      )}
      
      {summaryData.what_asked && (
        <Section
          title="Key Questions Asked"
          icon={<MessageSquare className="w-5 h-5 text-orange-600" />}
          content={summaryData.what_asked}
        />
      )}
      
      {summaryData.key_takeaways && (
        <Section
          title="Key Takeaways"
          icon={<Lightbulb className="w-5 h-5 text-yellow-600" />}
          content={summaryData.key_takeaways}
          highlight={true}
          highlightColor="yellow"
        />
      )}
      
      {summaryData.action_items && (
        <Section
          title="Action Items"
          icon={<ListTodo className="w-5 h-5 text-red-600" />}
          content={summaryData.action_items}
          highlight={true}
          highlightColor="red"
        />
      )}
    </div>
  );
};

export default SummaryDisplay;
