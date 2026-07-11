import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Shield, CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const status = isActive ? 'ACTIVE' : 'INACTIVE'; // Need to verify what backend expects, but isActive usually maps to status
      await api.put(`/admin/users/${userId}/status`, { status });
      toast.success('Status updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="text-white text-center p-8">Loading users...</div>;
  }

  if (!hasRole('ADMIN') && !hasRole('admin')) {
    return <div className="text-white text-center p-8">Unauthorized access</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">View and manage all registered users.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50 text-slate-300 text-sm">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-full text-slate-400">
                        <User size={18} />
                      </div>
                      <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">{user.email}</td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {user.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                        <XCircle size={14} /> {user.status || 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusChange(user.id, user.status !== 'ACTIVE')}
                      className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
