import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";

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
  symposiums?: string;
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

  // ─── CSV Export ────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = [
      "S.No",
      "Full Name",
      "Email",
      "Mobile",
      "College",
      "Department",
      "Year of Passing",
      "State",
      "District",
      "Symposia",
      "Total Items",
    ];

    const escapeCSV = (value: string | number | undefined | null) => {
      const str = value == null ? "" : String(value);
      // Wrap in quotes if it contains comma, quote, or newline
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = users.map((u, idx) => [
      idx + 1,
      escapeCSV(u.fullName),
      escapeCSV(u.email),
      escapeCSV(u.mobile),
      escapeCSV(u.college),
      escapeCSV(u.department),
      escapeCSV(u.yearOfPassing),
      escapeCSV(u.state),
      escapeCSV(u.district),
      escapeCSV(u.symposiums),
      u.totalEvents,
    ]);

    const csvContent = [
      `# CSMIT Registered Users - ${filterSymposium} | Generated: ${new Date().toLocaleString()}`,
      headers.join(","),
      ...rows.map(r => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RegisteredUsers_${filterSymposium}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-8">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <h1 className="text-2xl font-bold mb-1 text-white">Registered Users</h1>
      <p className="text-gray-400 text-sm mb-6">
        {users.length} user{users.length !== 1 ? "s" : ""} registered
        {filterSymposium !== "All" ? ` in ${filterSymposium}` : ""}
      </p>

      {/* ── Controls Row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        {/* Filter */}
        <div className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700 flex items-center gap-4">
          <span className="font-semibold text-white text-sm">Filter by Symposium:</span>
          {(["All", "Enigma", "Carteblanche"] as const).map(sym => (
            <label key={sym} className="inline-flex items-center cursor-pointer gap-1.5">
              <input
                type="radio"
                value={sym}
                checked={filterSymposium === sym}
                onChange={() => setFilterSymposium(sym)}
                className="form-radio text-purple-600 accent-purple-500"
              />
              <span className="text-white text-sm">{sym}</span>
            </label>
          ))}
        </div>

        {/* Download Buttons */}
        <div className="flex gap-3">
          {/* CSV */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200
                       bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/30"
          >
            {/* Spreadsheet icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Mobile</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">College</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Department</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Year</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">State</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">District</th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider">Symposia</th>
              <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider">Items</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-gray-400 italic">
                  No registered users found.
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-purple-900/10 transition-colors duration-100">
                  <td className="py-3 px-3 text-center text-gray-500 text-xs">{idx + 1}</td>
                  <td className="py-3 px-4 font-medium text-white">{user.fullName}</td>
                  <td className="py-3 px-4 text-gray-300">{user.email}</td>
                  <td className="py-3 px-4 text-gray-300">{user.mobile || "—"}</td>
                  <td className="py-3 px-4 text-gray-300 max-w-[180px] truncate" title={user.college}>{user.college || "—"}</td>
                  <td className="py-3 px-4 text-gray-300">{user.department || "—"}</td>
                  <td className="py-3 px-4 text-gray-300">{user.yearOfPassing || "—"}</td>
                  <td className="py-3 px-4 text-gray-300">{user.state || "—"}</td>
                  <td className="py-3 px-4 text-gray-300">{user.district || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="text-purple-400 font-medium text-xs">
                      {user.symposiums || "N/A"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-600/20 text-purple-300 font-bold text-xs">
                      {user.totalEvents}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewActiveUsersPage;
