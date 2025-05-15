import { useEffect, useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [token, setToken] = useState('');
  const [visitors, setVisitors] = useState([]);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (token) fetchVisitors();
  }, [token]);

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
          <h2 className="text-2xl font-bold mb-4">Visitor Dashboard</h2>
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Visit Date</th>
                  <th className="px-4 py-2">In Time</th>
                  <th className="px-4 py-2">Out Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((visitor) => (
                  <tr key={visitor.id} className="border-t">
                    <td className="px-4 py-2">{visitor.visitor_name}</td>
                    <td className="px-4 py-2">{visitor.visit_date}</td>
                    <td className="px-4 py-2">{visitor.in_time}</td>
                    <td className="px-4 py-2">{visitor.expected_out_time}</td>
                    <td className="px-4 py-2 capitalize">{visitor.status}</td>
                    <td className="px-4 py-2">
                      {visitor.status !== 'pending' ? (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="peer hidden"
                            checked={visitor.status === 'approved'}
                            onChange={(e) =>
                              updateStatus(visitor.id, e.target.checked ? 'approved' : 'rejected')
                            }
                          />
                          <div className="w-10 h-5 bg-gray-300 rounded-full relative peer-checked:bg-green-500 transition">
                            <div className="w-4 h-4 bg-white rounded-full absolute left-0 top-0.5 transition peer-checked:translate-x-5"></div>
                          </div>
                          <span className="text-sm">
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
