import React from 'react';
import { Outlet } from 'react-router-dom';
import backgroundImage from '../Login_Sign/photo.jpeg';

const OrganizerPage: React.FC = () => {
  return (
    <div 
          className="relative min-h-screen font-sans text-gray-200 overflow-x-hidden"
          style={{
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-fixed -z-10"
            style={{
              backgroundImage: `url(${backgroundImage})`
            }}
          ></div>
          <div className="absolute inset-0 bg-black/70 -z-10"></div>
          <main className="relative z-10 p-8">
            <Outlet />
          </main>
        </div>  );
};

export default OrganizerPage;
