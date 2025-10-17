import React from 'react';
import { createPortal } from 'react-dom';

const Loader: React.FC = () => {
  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50">
      <div className="relative flex justify-center items-center">
        <div className="absolute w-24 h-24 rounded-full animate-ping-slow border-4 border-purple-400"></div>
        <div className="absolute w-16 h-16 rounded-full animate-ping-slow border-4 border-purple-500" style={{ animationDelay: '-0.5s' }}></div>
        <div className="absolute w-8 h-8 rounded-full animate-ping-slow border-4 border-purple-600" style={{ animationDelay: '-1s' }}></div>
      </div>
      <style>{`
        @keyframes ping-slow {
          0%, 100% {
            transform: scale(0.2);
            opacity: 0.2;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default Loader;
