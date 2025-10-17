import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from './Config'; // adjust path if needed

type Round = {
  roundNumber: number;
  roundDetails: string;
  roundDateTime: string;
};

type AccountDetail = {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
};

type Event = {
  id: number;
  eventName: string;
  eventCategory: string;
  eventDescription: string;
  numberOfRounds: number;
  teamOrIndividual: 'Team' | 'Individual';
  location: string;
  registrationFees: number;
  coordinatorName: string;
  coordinatorContactNo: string;
  coordinatorMail: string;
  lastDateForRegistration: string;
  symposiumName: 'Enigma' | 'Carteblanche';
  posterImage?: string;
  rounds?: Round[];
  assignedAccounts?: AccountDetail[];
  isOpenForNonMIT?: boolean;
};

const ThemedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  children?: React.ReactNode;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
}> = ({ isOpen, onClose, title, message, children, showConfirmButton, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-lg w-full p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            &times;
          </button>
        </div>
        <p className="text-gray-300 mb-4">{message}</p>
        {children}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          {showConfirmButton && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Loader: React.FC = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
  </div>
);

const Dropdown: React.FC<{
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}> = ({ options, selectedValue, onSelect, placeholder }) => (
  <select
    value={selectedValue}
    onChange={(e) => onSelect(e.target.value)}
    className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
  >
    <option value="" disabled>
      {placeholder}
    </option>
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

// --- Main App ---
const App: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeSymposium, setActiveSymposium] = useState<'Enigma' | 'Carteblanche'>('Enigma');
  const [newEvent, setNewEvent] = useState({
    eventName: '',
    eventCategory: '',
    eventDescription: '',
    numberOfRounds: 1,
    teamOrIndividual: 'Individual',
    location: '',
    registrationFees: 0,
    coordinatorName: '',
    coordinatorContactNo: '',
    coordinatorMail: '',
    lastDateForRegistration: '',
    isOpenForNonMIT: false,
  });
  const [rounds, setRounds] = useState<Round[]>([{ roundNumber: 1, roundDetails: '', roundDateTime: '' }]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [selectedEventForAccount, setSelectedEventForAccount] = useState<Event | null>(null);
  const [selectedAccountToAssign, setSelectedAccountToAssign] = useState<AccountDetail | null>(null);
  const [isAssignAccountModalOpen, setIsAssignAccountModalOpen] = useState(false);

  const fetchAccountDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/accounts`);
      if (!response.ok) throw new Error('Failed to fetch account details');
      const data = await response.json();
      setAccounts(data.length ? data : []);
    } catch (err) {
      console.error(err);
      setModalTitle('Error');
      setModalMessage('Failed to load accounts. Check backend.');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      let eventsData: Event[] = await response.json();

      eventsData = await Promise.all(
        eventsData.map(async (event) => {
          console.log('Fetched Event ID:', event.id, 'Type:', typeof event.id); // Added log
          try {
            const accResp = await fetch(`${API_BASE_URL}/events/${event.id}/accounts`);
            const assignedAccounts = await accResp.json();
            assignedAccounts.forEach((acc: AccountDetail) => {
              console.log('Fetched Assigned Account ID:', acc.id, 'Type:', typeof acc.id); // Added log
            });
            return { ...event, assignedAccounts: assignedAccounts || [] };
          } catch (innerError) {
            console.error('Error fetching assigned accounts for event', event.id, innerError);
            return { ...event, assignedAccounts: [] };
          }
        })
      );

      setEvents(eventsData);
    } catch (err) {
      console.error(err);
      setModalTitle('Error');
      setModalMessage('Failed to load events. Check backend.');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchAccountDetails();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseInt(value, 10) : value;

    if (editingEvent) {
        const updatedEvent = { ...editingEvent, [name]: val };
        if (name === 'eventCategory' && value === 'Workshop') {
            updatedEvent.numberOfRounds = 0;
        }
        setEditingEvent(updatedEvent);
    } else {
        const updatedNewEvent = { ...newEvent, [name]: val };
        if (name === 'eventCategory' && value === 'Workshop') {
            updatedNewEvent.numberOfRounds = 0;
            setRounds([]);
        }
        setNewEvent(updatedNewEvent);
    }
  };

  const handleRoundChange = (index: number, field: keyof Round, value: string | number) => {
    const updatedRounds = rounds.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    setRounds(updatedRounds);
  };

  const handleNumberOfRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    setNewEvent((prev) => ({ ...prev, numberOfRounds: num }));
    setRounds((prevRounds) => {
      const newRounds: Round[] = [];
      for (let i = 0; i < num; i++) {
        newRounds.push(prevRounds[i] || { roundNumber: i + 1, roundDetails: '', roundDateTime: '' });
      }
      return newRounds;
    });
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = editingEvent ? { ...editingEvent, rounds } : { ...newEvent, rounds, symposiumName: activeSymposium };
    const url = editingEvent ? `${API_BASE_URL}/events/${editingEvent.id}` : `${API_BASE_URL}/events`;
    const method = editingEvent ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
      if (!response.ok) throw new Error('Failed to save event');
      fetchEvents();
      setNewEvent({
        eventName: '',
        eventCategory: '',
        eventDescription: '',
        numberOfRounds: 1,
        teamOrIndividual: 'Individual',
        location: '',
        registrationFees: 0,
        coordinatorName: '',
        coordinatorContactNo: '',
        coordinatorMail: '',
        lastDateForRegistration: '',
        isOpenForNonMIT: false,
      });
      setRounds([{ roundNumber: 1, roundDetails: '', roundDateTime: '' }]);
      setEditingEvent(null);
      setModalTitle('Success');
      setModalMessage('Event saved successfully');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setModalTitle('Error');
      setModalMessage('Failed to save event.');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    }
  };

  const handleDeleteEvent = (id: number, symposiumName: 'Enigma' | 'Carteblanche') => {
    setModalTitle('Confirm Deletion');
    setModalMessage(`Are you sure you want to delete this event?`);
    setModalOnConfirm(() => async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symposiumName }),
        });
        if (!response.ok) throw new Error('Failed to delete event');
        fetchEvents();
        setModalTitle('Success');
        setModalMessage('Event deleted successfully');
        setShowConfirmButton(false);
      } catch (err) {
        console.error(err);
        setModalTitle('Error');
        setModalMessage('Failed to delete event');
        setShowConfirmButton(false);
      }
    });
    setShowConfirmButton(true);
    setIsModalOpen(true);
  };

  const handleAssignAccount = async () => {
    if (!selectedEventForAccount || !selectedAccountToAssign) return;
    try {
      const response = await fetch(`${API_BASE_URL}/events/${selectedEventForAccount.id}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selectedAccountToAssign.id }),
      });
      if (!response.ok) throw new Error('Failed to assign account');
      fetchEvents();
      setModalTitle('Success');
      setModalMessage('Account assigned successfully');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      setModalTitle('Error');
      setModalMessage('Failed to assign account');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    } finally {
      setIsAssignAccountModalOpen(false);
      setSelectedEventForAccount(null);
      setSelectedAccountToAssign(null);
    }
  };

  const handleRemoveAccount = async (eventId: number, accountId: number) => {
    console.log('Attempting to remove account with eventId:', eventId, 'and accountId:', accountId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/events/${eventId}/accounts/${accountId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove account.');
      }

      await fetchEvents();

      setModalTitle('Success');
      setModalMessage('Account removed successfully!');
      setShowConfirmButton(false);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error removing account:', err);
      setModalTitle('Error');
      setModalMessage(`Failed to remove account: ${err}`);
      setShowConfirmButton(false);
      setIsModalOpen(true);
    }
  };

  const filteredEvents = events.filter((e) => e.symposiumName === activeSymposium);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Event Management Portal
          </h1>
          {isLoading ? (
            <Loader />
          ) : (
            <>
              <div className="flex justify-center items-center gap-4 mb-8">
                <button
                  onClick={() => setActiveSymposium('Enigma')}
                  className={`px-6 py-3 font-semibold rounded-lg ${
                    activeSymposium === 'Enigma' ? 'bg-purple-600' : 'bg-gray-800/60'
                  }`}
                >
                  Enigma
                </button>
                <button
                  onClick={() => setActiveSymposium('Carteblanche')}
                  className={`px-6 py-3 font-semibold rounded-lg ${
                    activeSymposium === 'Carteblanche' ? 'bg-purple-600' : 'bg-gray-800/60'
                  }`}
                >
                  Carteblanche
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">{editingEvent ? 'Edit' : 'Add'} Event</h3>
                  <form onSubmit={handleSaveEvent} className="space-y-6">
                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
                      <input
                        type="text"
                        name="eventName"
                        value={editingEvent?.eventName || newEvent.eventName}
                        onChange={handleInputChange}
                        placeholder="Event Name"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <textarea
                        name="eventDescription"
                        value={editingEvent?.eventDescription || newEvent.eventDescription}
                        onChange={handleInputChange}
                        placeholder="Description"
                        rows={4}
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <select
                        name="eventCategory"
                        value={editingEvent?.eventCategory || newEvent.eventCategory}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      >
                        <option value="">Select Category</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Paper Presentation">Paper Presentation</option>
                        <option value="Technical Events">Technical Events</option>
                        <option value="Non-Technical Events">Non-Technical Events</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="text"
                        name="location"
                        value={editingEvent?.location || newEvent.location}
                        onChange={handleInputChange}
                        placeholder="Location"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <label className="block text-sm font-medium text-gray-300">Registration Fees</label>
                      <input
                        type="number"
                        name="registrationFees"
                        value={editingEvent?.registrationFees || newEvent.registrationFees}
                        onChange={handleInputChange}
                        placeholder="Registration Fees"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        name="coordinatorName"
                        value={editingEvent?.coordinatorName || newEvent.coordinatorName}
                        onChange={handleInputChange}
                        placeholder="Coordinator Name"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="text"
                        name="coordinatorContactNo"
                        value={editingEvent?.coordinatorContactNo || newEvent.coordinatorContactNo}
                        onChange={handleInputChange}
                        placeholder="Coordinator Contact No"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="email"
                        name="coordinatorMail"
                        value={editingEvent?.coordinatorMail || newEvent.coordinatorMail}
                        onChange={handleInputChange}
                        placeholder="Coordinator Email"
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                      <input
                        type="datetime-local"
                        name="lastDateForRegistration"
                        value={editingEvent?.lastDateForRegistration || newEvent.lastDateForRegistration}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
<div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isOpenForNonMIT"
                          checked={editingEvent?.isOpenForNonMIT || newEvent.isOpenForNonMIT}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="isOpenForNonMIT" className="ml-2 text-sm font-medium text-gray-300">
                          Open to Non-MIT Students
                        </label>
                      </div>
                      <input
                        type="number"
                        name="numberOfRounds"
                        value={editingEvent?.numberOfRounds || newEvent.numberOfRounds}
                        onChange={handleNumberOfRoundsChange}
                        min={0}
                        required
                        disabled={(editingEvent?.eventCategory || newEvent.eventCategory) === 'Workshop'}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                      />
                    </div>

                    {(editingEvent?.eventCategory || newEvent.eventCategory) !== 'Workshop' && rounds.map((round, idx) => (
                      <div key={idx} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
                        <textarea
                          value={round.roundDetails}
                          onChange={(e) => handleRoundChange(idx, 'roundDetails', e.target.value)}
                          placeholder={`Round ${idx + 1} Details`}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                        />
                        <input
                          type="datetime-local"
                          value={round.roundDateTime}
                          onChange={(e) => handleRoundChange(idx, 'roundDateTime', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-lg text-white"
                        />
                      </div>
                    ))}

                    <button
                      type="submit"
                      className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                    >
                      {editingEvent ? 'Update Event' : 'Add Event'}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Events</h3>
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-gray-800/50 p-4 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span>{event.eventName}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setRounds(event.rounds || [{ roundNumber: 1, roundDetails: '', roundDateTime: '' }]);
                            }}
                            className="px-2 py-1 bg-blue-600 rounded-md text-sm"
                          >
                            Edit
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id, event.symposiumName)} className="px-2 py-1 bg-red-600 rounded-md text-sm">
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEventForAccount(event);
                              setIsAssignAccountModalOpen(true);
                            }}
                            className="px-2 py-1 bg-green-600 rounded-md text-sm"
                          >
                            Assign Account
                          </button>
                          <Link to={`/admin/events/registrations/${event.id}?symposium=${event.symposiumName}`}>
                            <button className="px-2 py-1 bg-yellow-600 rounded-md text-sm">
                              View Registrations
                            </button>
                          </Link>
                        </div>
                      </div>
                      {event.assignedAccounts && event.assignedAccounts.length > 0 && (
                        <ul className="list-disc list-inside mt-2 text-gray-300 text-sm">
                          {event.assignedAccounts.map((acc) => (
                            <li key={acc.id} className="flex justify-between items-center">
                              <span>{acc.accountName} ({acc.bankName})</span>
                              <button
                                onClick={() => {
                                  if (event.id !== undefined && acc.id !== undefined) {
                                    handleRemoveAccount(event.id, acc.id);
                                  } else {
                                    console.error('Attempted to remove account with undefined eventId or accountId', { eventId: event.id, accountId: acc.id });
                                    setModalTitle('Error');
                                    setModalMessage('Cannot remove account: Invalid event or account ID.');
                                    setShowConfirmButton(false);
                                    setIsModalOpen(true);
                                  }
                                }}
                                className="px-2 py-1 bg-red-600 rounded-md text-xs ml-2"
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ThemedModal
        isOpen={isAssignAccountModalOpen}
        onClose={() => {
          setIsAssignAccountModalOpen(false);
          setSelectedEventForAccount(null);
          setSelectedAccountToAssign(null);
        }}
        title={`Assign Account to ${selectedEventForAccount?.eventName || ''}`}
        message="Select an account to assign:"
        showConfirmButton={true}
        onConfirm={handleAssignAccount}
      >
        <Dropdown
          options={accounts.map((acc) => ({ label: `${acc.accountName} (${acc.bankName})`, value: acc.id.toString() }))}
          selectedValue={selectedAccountToAssign?.id.toString() || ''}
          onSelect={(val) => setSelectedAccountToAssign(accounts.find((a) => a.id.toString() === val) || null)}
          placeholder="Select Account"
        />
      </ThemedModal>
    <ThemedModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        showConfirmButton={showConfirmButton}
        onConfirm={modalOnConfirm}
      />
    </>
  );
};

export default App;
