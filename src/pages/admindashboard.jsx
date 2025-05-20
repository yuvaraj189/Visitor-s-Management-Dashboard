import { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const [token, setToken] = useState('');
  const [visitors, setVisitors] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        username: 'admin',
        password: 'admin123',
      });
      setToken(response.data.token);
      setError('');
    } catch {
      setError('Login failed. Please check your credentials.');
    }
  };

  const fetchVisitors = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/visitors', {
        headers: { Authorization: token },
      });
      setVisitors(res.data);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/visitors/${id}/status`,
        { status },
        { headers: { Authorization: token } }
      );
      fetchVisitors();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Status update failed.');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(visitors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');
    XLSX.writeFile(workbook, 'VisitorsList.xlsx');
  };

  useEffect(() => {
    if (token) fetchVisitors();
  }, [token]);

  // Filter visitors based on search & status
  const filteredVisitors = visitors.filter((v) => {
    const searchMatch =
      v.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vehicle_number && v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMatch =
      filterStatus === 'all' || v.status.toLowerCase() === filterStatus.toLowerCase();

    return searchMatch && statusMatch;
  });

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      {!token ? (
        <div className="max-w-sm mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          {error && <p className="text-red-500">{error}</p>}
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Login as Admin
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Visitor Dashboard</h2>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export to Excel
            </button>
          </div>

          {/* Filter and Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name, ID, or vehicle number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded shadow-sm w-full md:w-1/2"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded shadow-sm w-full md:w-1/4"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow border-l-4 border-blue-600">
              <h3 className="text-sm text-gray-500">Total Visitors</h3>
              <p className="text-2xl font-bold">
                {visitors.reduce((sum, v) => sum + parseInt(v.number_of_visitors || 0, 10), 0)}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow border-l-4 border-purple-600">
              <h3 className="text-sm text-gray-500">Unique Visit Dates</h3>
              <p className="text-2xl font-bold">
                {new Set(visitors.map(v => v.visit_date)).size}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
              <h3 className="text-sm text-gray-500">Vehicle Entries</h3>
              <p className="text-2xl font-bold">
                {visitors.filter(v => v.vehicle_number && v.vehicle_number.trim() !== '').length}
              </p>
            </div>

            <div className="bg-white p-4 rounded shadow border-l-4 border-green-600">
              <h3 className="text-sm text-gray-500">Most Recent Visit</h3>
              <p className="text-2xl font-bold">
                {visitors.length > 0
                  ? visitors
                      .map(v => new Date(v.visit_date))
                      .sort((a, b) => b - a)[0]
                      .toISOString()
                      .split('T')[0]
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Visitors Table */}
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">ID Type</th>
                  <th className="px-4 py-2">ID Number</th>
                  <th className="px-4 py-2">Vehicle Type</th>
                  <th className="px-4 py-2">Vehicle Number</th>
                  <th className="px-4 py-2">No. of Visitors</th>
                  <th className="px-4 py-2">Visit Date</th>
                  <th className="px-4 py-2">In Time</th>
                  <th className="px-4 py-2">Out Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-t">
                    <td className="px-4 py-2">{visitor.visitor_name}</td>
                    <td className="px-4 py-2">{visitor.id_type}</td>
                    <td className="px-4 py-2">{visitor.id_number}</td>
                    <td className="px-4 py-2">{visitor.vehicle_type}</td>
                    <td className="px-4 py-2">{visitor.vehicle_number}</td>
                    <td className="px-4 py-2">{visitor.number_of_visitors}</td>
                    <td className="px-4 py-2">{visitor.visit_date}</td>
                    <td className="px-4 py-2">{visitor.in_time}</td>
                    <td className="px-4 py-2">{visitor.expected_out_time}</td>
                    <td className="px-4 py-2 capitalize">{visitor.status}</td>
                    <td className="px-4 py-2">
                      {visitor.status !== 'pending' ? (
                        <label className="inline-flex items-center cursor-pointer relative">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={visitor.status === 'approved'}
                            onChange={(e) =>
                              updateStatus(visitor.id, e.target.checked ? 'approved' : 'rejected')
                            }
                          />
                          <div className="w-14 h-7 rounded-full transition-all duration-300 peer-checked:bg-green-500 bg-red-500"></div>
                          <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 transform peer-checked:translate-x-7"></div>
                          <span className="ml-4 text-sm font-medium">
                            {visitor.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </label>
                      ) : (
                        <div className="text-gray-400 italic">Pending</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
