import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";
import jsPDF from "jspdf";
import "jspdf-autotable";
import API_BASE_URL from "../Config";

interface ActiveUser {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  department: string;
  yearOfPassing: number;
  state: string;
  district: string;
  totalEvents: number;
}

const ViewActiveUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSymposium, setFilterSymposium] = useState<'All' | 'Enigma' | 'Carteblanche'>('All');

  useEffect(() => {
    setLoading(true);
    let url = `${API_BASE_URL}/registrations/registered-users`;
    if (filterSymposium !== 'All') {
      url += `?symposium=${filterSymposium}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching active users:", err))
      .finally(() => setLoading(false));
  }, [filterSymposium]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Active Users List - ${filterSymposium}`, 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [["Name", "Email", "Mobile", "College", "Department", "Symposia", "Events"]],
      body: users.map(u => [
        u.fullName,
        u.email,
        u.mobile,
        u.college,
        u.department,
        (u as any).symposiums || 'N/A',
        u.totalEvents.toString(),
      ]),
    });
    doc.save(`ActiveUsers_${filterSymposium}.pdf`);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Active Users</h1>

      <div className="flex justify-between items-center mb-6">
        {/* Filter Controls */}
        <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
          <span className="font-semibold mr-4 text-white">Filter by Symposium:</span>
          <label className="inline-flex items-center mr-4 cursor-pointer">
            <input
              type="radio"
              value="All"
              checked={filterSymposium === 'All'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-white">All</span>
          </label>
          <label className="inline-flex items-center mr-4 cursor-pointer">
            <input
              type="radio"
              value="Enigma"
              checked={filterSymposium === 'Enigma'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-purple-600"
            />
            <span className="ml-2 text-white">Enigma</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              value="Carteblanche"
              checked={filterSymposium === 'Carteblanche'}
              onChange={(e) => setFilterSymposium(e.target.value as any)}
              className="form-radio text-pink-600"
            />
            <span className="ml-2 text-white">Carteblanche</span>
          </label>
        </div>

        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Export to PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-600 rounded-lg">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Mobile</th>
              <th className="py-3 px-4 text-left">College</th>
              <th className="py-3 px-4 text-left">Department</th>
              <th className="py-3 px-4 text-left">Symposia</th>
              <th className="py-3 px-4 text-center">Total Items</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="hover:bg-gray-800/40">
                <td className="py-3 px-4">{user.fullName}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.mobile}</td>
                <td className="py-3 px-4">{user.college}</td>
                <td className="py-3 px-4">{user.department}</td>
                <td className="py-3 px-4 text-purple-400 font-medium">{(user as any).symposiums || 'N/A'}</td>
                <td className="py-3 px-4 text-center font-bold">{user.totalEvents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewActiveUsersPage;
