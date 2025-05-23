
import { ReactNode } from "react";

interface QuickSuggestionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export const QuickSuggestionCard = ({ icon, title, description, onClick }: QuickSuggestionCardProps) => {
  return (
    <div 
      className="bg-white border border-green-200 rounded-xl p-4 cursor-pointer 
                 hover:shadow-lg hover:border-green-300 transition-all duration-200
                 hover:scale-105 group"
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center
                       group-hover:bg-green-200 transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};
