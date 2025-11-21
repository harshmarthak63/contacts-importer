'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { 
  fetchUsers, 
  addUser, 
  editUser, 
  removeUser, 
  setSelectedUser, 
  clearError 
} from '@/lib/store/slices/usersSlice';
import { User } from '@/types';

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { users, loading, error, selectedUser } = useAppSelector((state) => state.users);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: '' as 'Agent' | 'Sales' | 'Developer' | 'HR' | '',
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const generateAgentId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let agentId = '';
    for (let i = 0; i < 8; i++) {
      agentId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return agentId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      dispatch(clearError());
      return;
    }

    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.designation) {
        userData.designation = formData.designation;
      }

      if (editingUser) {
        const updates: any = { ...userData };
        
        if (formData.designation === 'Agent') {
          updates.agentId = editingUser.agentId || generateAgentId();
        } else if (editingUser.agentId) {
          updates.agentId = deleteField();
        }
        
        await dispatch(editUser({ uid: editingUser.uid, userData: updates })).unwrap();
      } else {
        if (formData.designation === 'Agent') {
          userData.agentId = generateAgentId();
        }
        
        const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (existingUser) {
          return;
        }
        await dispatch(addUser(userData)).unwrap();
      }
      
      await dispatch(fetchUsers());
      setShowForm(false);
      setEditingUser(null);
      dispatch(setSelectedUser(null));
      setFormData({ name: '', email: '', designation: '' });
    } catch (err: any) {
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    dispatch(setSelectedUser(null));
    setFormData({ name: '', email: '', designation: '' });
    setShowForm(true);
    dispatch(clearError());
  };

  const handleEdit = () => {
    if (!selectedUser) return;
    setEditingUser(selectedUser);
    setFormData({ 
      name: selectedUser.name, 
      email: selectedUser.email,
      designation: selectedUser.designation || ''
    });
    setShowForm(true);
    dispatch(clearError());
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    setUserToDelete(selectedUser);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await dispatch(removeUser(userToDelete.uid)).unwrap();
      await dispatch(fetchUsers());
      dispatch(setSelectedUser(null));
      setUserToDelete(null);
      setShowDeleteConfirm(false);
      dispatch(clearError());
    } catch (err: any) {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleRowClick = (user: User) => {
    dispatch(setSelectedUser(user.uid === selectedUser?.uid ? null : user));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    dispatch(setSelectedUser(null));
    setFormData({ name: '', email: '', designation: '' });
    dispatch(clearError());
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-900">View and manage all users</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAdd}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add User"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleEdit}
                disabled={!selectedUser}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit User"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedUser}
                className="p-1.5 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete User"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value as any })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Designation</option>
                    <option value="Agent">Agent</option>
                    <option value="Sales">Sales</option>
                    <option value="Developer">Developer</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 w-full sm:w-auto"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Confirm Delete
                </h3>
                <button
                  onClick={cancelDelete}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-700 mb-4">
                  Are you sure you want to delete?
                </p>
                {userToDelete && (
                  <p className="text-xs text-gray-600 mb-4">
                    This will delete user: <span className="font-medium">{userToDelete.name}</span>
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                  <button
                    onClick={cancelDelete}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 w-full sm:w-auto"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">No users yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Id
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Id
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const isSelected = selectedUser?.uid === user.uid;
                    return (
                      <tr
                        key={user.uid}
                        onClick={() => handleRowClick(user)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50' : ''
                        }`}
                        style={isSelected ? { borderLeft: '4px solid #2563eb' } : {}}
                      >
                        <td className="px-2 sm:px-4 py-2 text-xs font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500 break-words">
                          {user.email}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500">
                          {user.designation || '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500">
                          {user.agentId || '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500 font-mono">
                          {user.uid}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
