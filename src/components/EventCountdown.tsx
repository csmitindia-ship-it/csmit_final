import React, { useState, useEffect } from 'react';

interface EventCountdownProps {
  lastDateForRegistration: string;
}

const EventCountdown: React.FC<EventCountdownProps> = ({ lastDateForRegistration }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(lastDateForRegistration) - +new Date();
    let timeLeft: { [key: string]: number } = {};

    if (difference > 0) {
      timeLeft = {
        d: Math.floor(difference / (1000 * 60 * 60 * 24)),
        h: Math.floor((difference / (1000 * 60 * 60)) % 24),
        m: Math.floor((difference / 1000 / 60) % 60),
        s: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (timeLeft[interval] !== undefined && timeLeft[interval] > 0) {
      timerComponents.push(
        <span key={interval} className="text-purple-300 font-semibold mx-1">
          {timeLeft[interval]} {interval}{" "}
        </span>
      );
    }
  });

  return (
    <div className="mt-2 mb-4 text-sm text-gray-200">
      {timerComponents.length ? (
        <>
          Registration ends in: {timerComponents}
        </>
      ) : (
        <span className="text-red-400 font-semibold">Registration Closed</span>
      )}
    </div>
  );
};

export default EventCountdown;
