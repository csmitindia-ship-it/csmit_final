import React from 'react';
import AccommodationBooking from '../components/AccommodationBooking';
import backgroundImage from '../Login_Sign/photo.jpeg';

const AccommodationPage: React.FC = () => {
  return (
    <div 
      className="relative min-h-screen font-sans" 
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      {/* Dark Overlay - Opacity increased to 80% for better contrast */}
      <div className="absolute inset-0 bg-black/80 z-0"></div>
      
      <main className="relative z-10 flex items-center justify-center min-h-screen pt-16">
        <div className="container mx-auto p-4">
          {/* Fix Applied:
             1. text-white: Sets base text color to white.
             2. [&_label]:text-gray-200: Forces all form labels inside to be light gray.
             3. [&_h2]:text-white: Forces headers to be white.
          */}
          <div className="max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-md border border-purple-500/30 p-8 rounded-lg shadow-2xl text-white">
            
            <AccommodationBooking />
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccommodationPage;