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

  useEffect(() => {
    fetch(`${API_BASE_URL}/registrations/registered-users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Error fetching active users:", err))
      .finally(() => setLoading(false));
  }, []);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Active Users List", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [["Name", "Email", "Mobile", "College", "Department", "Events"]],
      body: users.map(u => [
        u.fullName,
        u.email,
        u.mobile,
        u.college,
        u.department,
        u.totalEvents.toString(),
      ]),
    });
    doc.save("ActiveUsers.pdf");
  };

  if (loading) return <Loader />;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Active Users</h1>
      <button
        onClick={exportToPDF}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Export to PDF
      </button>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-600 rounded-lg">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Mobile</th>
              <th className="py-3 px-4 text-left">College</th>
              <th className="py-3 px-4 text-left">Department</th>
              <th className="py-3 px-4 text-center">Total Events</th>
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
                <td className="py-3 px-4 text-center">{user.totalEvents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewActiveUsersPage;
