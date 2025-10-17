import React, { useState, useEffect } from 'react';
import API_BASE_URL from './Config'; // adjust path if needed

const RegistrationTimer: React.FC = () => {
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/timer/timer`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.end_time) {
            setEndTime(data.end_time);
          }
        }
      } catch (error) {
        console.error('Error fetching timer:', error);
      }
    };

    fetchTimer();
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('Registration has begun!');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="bg-blue-500 text-white text-center p-2 z-50">
      Registration will begin in {timeLeft}
    </div>
  );
};

export default RegistrationTimer;
