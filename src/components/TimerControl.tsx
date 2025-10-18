import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config'; // adjust path if needed

const TimerControl: React.FC = () => {
  const [endTime, setEndTime] = useState('');
  const [activeTimer, setActiveTimer] = useState<any>(null);

  const fetchTimer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/timer/timer`);
      if (response.ok) {
        const data = await response.json();
        setActiveTimer(data);
      }
    } catch (error) {
      console.error('Error fetching timer:', error);
    }
  };

  useEffect(() => {
    fetchTimer();
  }, []);

  const handleStartTimer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/timer/timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endTime }),
      });

      if (response.ok) {
        alert('Timer started successfully!');
        fetchTimer();
      } else {
        alert('Failed to start timer.');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('An error occurred while starting the timer.');
    }
  };

  const handleStopTimer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/timer/timer`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Timer stopped successfully!');
        setActiveTimer(null);
      } else {
        alert('Failed to stop timer.');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('An error occurred while stopping the timer.');
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Registration Timer</h2>
      {activeTimer ? (
        <div>
          <p>Timer is active and will end at: {new Date(activeTimer.end_time).toLocaleString()}</p>
          <button
            onClick={handleStopTimer}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 mt-4"
          >
            Stop Timer
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded-md p-2 text-black"
          />
          <button
            onClick={handleStartTimer}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Start Timer
          </button>
        </div>
      )}
    </div>
  );
};

export default TimerControl;
