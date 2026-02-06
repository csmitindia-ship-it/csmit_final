import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../Config'; // adjust path if needed


interface Registration {
  id: number;
  userId: number;
  name: string;
  email: string;
  round1: -1 | 0 | 1;
  round2: -1 | 0 | 1;
  round3: -1 | 0 | 1;
}

const TickIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const CrossIcon = () => (
  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

// ✅ ThemedModal reused everywhere
const ThemedModal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative bg-gray-800 border border-purple-500 text-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

const UpdateWinnersPage: React.FC = () => {
  const [loading, setLoading] = useState(false); // ✅ moved inside component
  const [events, setEvents] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState<{ eventId: number; roundNumber: number; symposiumName: string } | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibleMessage, setEligibleMessage] = useState('');
  const [ineligibleMessage, setIneligibleMessage] = useState('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const [filterSymposium, setFilterSymposium] = useState<'All' | 'Enigma' | 'Carteblanche'>('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        setModalMessage('Error fetching events.');
      }
    };

    fetchEvents();
  }, []);

  const handleRoundClick = async (eventId: number, roundNumber: number, symposiumName: string) => {
    const actualEvent = events.find(e => e.id === eventId && e.symposiumName === symposiumName && e.rounds.some((r: any) => r.roundNumber === roundNumber));
    if (!actualEvent) return;

    setSelectedRound({ eventId, roundNumber, symposiumName: actualEvent.symposiumName });
    // ... rest of function ...
    setSearchTerm('');

    setEligibleMessage(`<h2 style="color: #2c3e50;">Congratulations!</h2><p>You are <strong>eligible</strong> for <b>${actualEvent.eventName}</b> - Round ${roundNumber}.</p><p style="color: green; font-size: 16px;">We are pleased to inform you that you have successfully cleared the current round. Please stay tuned for further instructions regarding the next steps.</p>`);
    setIneligibleMessage(`<h2 style="color: #e74c3c;">Update</h2><p>Unfortunately, you are <strong>not eligible</strong> for <b>${actualEvent.eventName}</b> - Round ${roundNumber}.</p><p style="color: #e74c3c; font-size: 16px;">Thank you for your enthusiastic participation in the event. While you didn't make it to the next round this time, we appreciate your effort and hope to see you in future events.</p>`);

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations?symposium=${actualEvent.symposiumName}`);
      const data = await response.json();
      if (response.ok) {
        setRegistrations(data);
      } else {
        setModalMessage(data.message);
        setRegistrations([]);
      }
    } catch (error) {
      setModalMessage('An error occurred while fetching registrations.');
    }
  };

  const handleUpdateStatus = async (userId: number, status: 0 | 1) => {
    if (selectedRound) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/events/${selectedRound.eventId}/rounds/${selectedRound.roundNumber}/eligible?symposium=${selectedRound.symposiumName}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, status }),
          }
        );
        const data = await response.json();
        setModalMessage(data.message);
        if (response.ok) {
          // Optimistically update the UI (map 0 to -1 for the CrossIcon to show)
          const dbStatus = status === 1 ? 1 : -1;
          setRegistrations((prev) =>
            prev.map((reg) =>
              reg.userId === userId
                ? { ...reg, [`round${selectedRound.roundNumber}`]: dbStatus }
                : reg
            )
          );
        }
      } catch (error) {
        setModalMessage('An error occurred while updating the status.');
      }
    }
  };

  const handleNotify = async () => {
    if (selectedRound) {
      setLoading(true);       // show loader
      setModalMessage(null);  // reset old message
      try {
        const response = await fetch(
          `${API_BASE_URL}/events/${selectedRound.eventId}/rounds/${selectedRound.roundNumber}/notify?symposium=${selectedRound.symposiumName}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eligibleMessage, ineligibleMessage }),
          }
        );
        const data = await response.json();
        setModalMessage(data.message);
      } catch (error) {
        setModalMessage('An error occurred while sending notifications.');
      } finally {
        setLoading(false);    // hide loader
      }
    }
  };

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event => {
    if (filterSymposium === 'All') return true;
    return event.symposiumName === filterSymposium;
  });

  return (
    <div className="text-white">
      <ThemedModal
        isOpen={!!modalMessage}
        onClose={() => setModalMessage(null)}
        title="Notification"
      >
        <p>{modalMessage}</p>
      </ThemedModal>

      <h1 className="text-2xl font-bold mb-6">Update Winners</h1>

      {/* Symposium Filter */}
      <div className="mb-6 bg-gray-800 p-4 rounded-lg inline-block">
        <label className="mr-4 font-semibold">Filter Events:</label>
        <label className="inline-flex items-center mr-4 cursor-pointer">
          <input
            type="radio"
            value="All"
            checked={filterSymposium === 'All'}
            onChange={(e) => setFilterSymposium(e.target.value as any)}
            className="form-radio text-blue-600"
          />
          <span className="ml-2">All</span>
        </label>
        <label className="inline-flex items-center mr-4 cursor-pointer">
          <input
            type="radio"
            value="Enigma"
            checked={filterSymposium === 'Enigma'}
            onChange={(e) => setFilterSymposium(e.target.value as any)}
            className="form-radio text-purple-600"
          />
          <span className="ml-2">Enigma</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="radio"
            value="Carteblanche"
            checked={filterSymposium === 'Carteblanche'}
            onChange={(e) => setFilterSymposium(e.target.value as any)}
            className="form-radio text-pink-600"
          />
          <span className="ml-2">Carteblanche</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Events</h2>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={`${event.symposiumName}-${event.id}`} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold text-lg">
                  {event.eventName} ({event.symposiumName})
                </h3>
                <div className="mt-2 space-y-2">
                  {event.rounds.map((round: any) => (
                    <button
                      key={round.roundNumber}
                      onClick={() => handleRoundClick(event.id, round.roundNumber, event.symposiumName)}
                      className={`w-full text-left p-2 rounded-md ${selectedRound?.eventId === event.id &&
                        selectedRound?.roundNumber === round.roundNumber &&
                        selectedRound?.symposiumName === event.symposiumName
                        ? 'bg-purple-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                      Round {round.roundNumber}: {round.roundDetails}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registrations + Notifications */}
        {selectedRound && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Update Winners for Event {selectedRound.eventId}, Round {selectedRound.roundNumber}
            </h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 mb-4 rounded-md bg-gray-700 text-white"
            />
            <div className="space-y-2">
              {filteredRegistrations.map((reg) => {
                let previousRoundPassed = true;
                if (selectedRound.roundNumber > 1) {
                  const prevRoundName = `round${selectedRound.roundNumber - 1}` as
                    | 'round1'
                    | 'round2';
                  if (reg[prevRoundName] !== 1) {
                    previousRoundPassed = false;
                  }
                }

                const roundStatus =
                  reg[
                  `round${selectedRound.roundNumber}` as
                  | 'round1'
                  | 'round2'
                  | 'round3'
                  ];

                return (
                  <div key={reg.id} className="bg-gray-700 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-bold">{reg.name}</p>
                          <p className="text-sm text-gray-400">{reg.email}</p>
                        </div>
                        {roundStatus === 1 && <TickIcon />}
                        {roundStatus === -1 && <CrossIcon />}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(reg.userId, 1)}
                          disabled={!previousRoundPassed}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          Eligible
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(reg.userId, 0)}
                          disabled={!previousRoundPassed}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                          Not Eligible
                        </button>
                      </div>
                    </div>
                    {!previousRoundPassed && (
                      <p className="text-red-400 mt-2 text-sm">
                        User cannot proceed to Round {selectedRound.roundNumber} as they were not
                        marked eligible in the previous round.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Notification Messages</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    For Eligible Students
                  </label>
                  <textarea
                    value={eligibleMessage}
                    onChange={(e) => setEligibleMessage(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 text-white"
                    rows={4}
                    placeholder="Congratulations! You have been selected for the next round..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    For Non-Eligible Students
                  </label>
                  <textarea
                    value={ineligibleMessage}
                    onChange={(e) => setIneligibleMessage(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 text-white"
                    rows={4}
                    placeholder="Thank you for your participation. Unfortunately, you have not been selected for the next round..."
                  />
                </div>
                <button
                  onClick={handleNotify}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  )}
                  {loading ? "Sending..." : "Send Notifications"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateWinnersPage;
