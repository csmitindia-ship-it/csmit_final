import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Loader from '../components/Loader';
import API_BASE_URL from '../Config'; // adjust path if needed

interface Registration {
  userName: string;
  email: string;
  college: string;
  transactionId: string;
  transactionUsername: string;
  transactionTime: string;
  transactionDate: string;
  transactionAmount: number;
}

interface EventDetails {
    eventName: string;
    coordinatorName: string;
    coordinatorContactNo: string;
}

const ViewEventRegistrationsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams(); // Get search params
  const symposium = searchParams.get('symposium'); // Extract symposium
  console.log('Symposium from URL:', symposium); // Debugging line
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/registrations/event/${eventId}`);
        const data = await response.json();
        setRegistrations(data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      }
    };

    const fetchEventDetails = async () => {
        if (!symposium) { // Check if symposium is available
            console.error('Symposium name is missing for fetching event details.');
            setIsLoading(false);
            return;
        }
        try {
          const response = await fetch(`${API_BASE_URL}/events/${eventId}?symposium=${symposium}`); // Modified API call
          const data = await response.json();
          setEventDetails(data);
        } catch (err) {
          console.error('Error fetching event details:', err);
        }
      };

    Promise.all([fetchRegistrations(), fetchEventDetails()]).finally(() => setIsLoading(false));
  }, [eventId, symposium]); // Added symposium to dependency array

  const downloadPdf = () => {
    console.log('Attempting to download PDF...');
    console.log('Event Details:', eventDetails);
    console.log('Registrations:', registrations);

    if (!eventDetails) {
      console.error('PDF download failed: Event details not available.');
      return;
    }

    const doc = new jsPDF();
    doc.text(`Registrations for ${eventDetails.eventName}`, 14, 16);
    doc.text(`Coordinator: ${eventDetails.coordinatorName} (${eventDetails.coordinatorContactNo})`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Email', 'College']],
      body: registrations.map(r => [r.userName, r.email, r.college]),
    });

    doc.save(`event_${eventDetails.eventName}_registrations.pdf`);
    console.log('PDF download initiated.');
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-20">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          {eventDetails?.eventName} Registrations
        </h1>
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadPdf}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Download as PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">College</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3 px-4">{registration.userName}</td>
                  <td className="py-3 px-4">{registration.email}</td>
                  <td className="py-3 px-4">{registration.college}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewEventRegistrationsPage;
