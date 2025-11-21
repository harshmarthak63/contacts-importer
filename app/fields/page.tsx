'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  fetchFields,
  addField,
  editField,
  removeField,
  setSelectedField,
  clearError,
} from '@/lib/store/slices/fieldsSlice';
import { ContactField } from '@/types';

export default function FieldsPage() {
  const dispatch = useAppDispatch();
  const { fields, loading, error, selectedField } = useAppSelector((state) => state.fields);

  const [editingField, setEditingField] = useState<ContactField | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<ContactField | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    type: 'text' as ContactField['type'],
  });

  useEffect(() => {
    dispatch(fetchFields());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    try {
      if (editingField) {
        await dispatch(editField({ id: editingField.id, fieldData: formData })).unwrap();
      } else {
        await dispatch(addField({ ...formData, core: false })).unwrap();
      }
      await dispatch(fetchFields());
      setShowForm(false);
      setEditingField(null);
      setFormData({ label: '', type: 'text' });
    } catch (err: any) {
      console.error('Error saving field:', err);
    }
  };

  const handleAdd = () => {
    setEditingField(null);
    dispatch(setSelectedField(null));
    setFormData({ label: '', type: 'text' });
    setShowForm(true);
    dispatch(clearError());
  };

  const handleEdit = () => {
    if (!selectedField) return;
    if (selectedField.core) {
      return;
    }
    setEditingField(selectedField);
    setFormData({ label: selectedField.label, type: selectedField.type });
    setShowForm(true);
    dispatch(clearError());
  };

  const handleDelete = () => {
    if (!selectedField) return;
    if (selectedField.core) {
      return;
    }
    setFieldToDelete(selectedField);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!fieldToDelete) return;

    try {
      await dispatch(removeField(fieldToDelete.id)).unwrap();
      await dispatch(fetchFields());
      dispatch(setSelectedField(null));
      setFieldToDelete(null);
      setShowDeleteConfirm(false);
      dispatch(clearError());
    } catch (err: any) {
      console.error('Error deleting field:', err);
      setShowDeleteConfirm(false);
      setFieldToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setFieldToDelete(null);
  };

  const handleRowClick = (field: ContactField) => {
    dispatch(setSelectedField(field.id === selectedField?.id ? null : field));
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingField(null);
    dispatch(setSelectedField(null));
    setFormData({ label: '', type: 'text' });
    dispatch(clearError());
  };

  const sortedFields = [...fields].sort((a, b) => {
    if (a.core && !b.core) return -1;
    if (!a.core && b.core) return 1;
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-900">Manage contact fields</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAdd}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Field"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleEdit}
                disabled={!selectedField || selectedField.core}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit Field"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedField || selectedField.core}
                className="p-1.5 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Field"
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
                  {editingField ? 'Edit Field' : 'Add New Field'}
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
                    Label
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactField['type'] })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="datetime">Date/Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingField?.core ? 'core' : 'custom'}
                    disabled
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-gray-500"
                  >
                    <option value="core" disabled>Core</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Status cannot be changed. Only custom fields can be added, edited, or deleted.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 w-full sm:w-auto"
                  >
                    {editingField ? 'Update' : 'Create'}
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

        {showDeleteConfirm && fieldToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Confirm Delete</h3>
                <button
                  onClick={cancelDelete}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4 text-sm text-gray-700">
                Are you sure you want to delete field "<span className="font-medium">{fieldToDelete.label}</span>"? This action cannot be undone.
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600">Loading fields...</p>
          </div>
        ) : sortedFields.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600">No fields yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-y-auto overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Id
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedFields.map((field) => {
                    const isSelected = selectedField?.id === field.id;
                    return (
                      <tr
                        key={field.id}
                        onClick={() => handleRowClick(field)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50' : ''
                        }`}
                        style={isSelected ? { borderLeft: '4px solid #2563eb' } : {}}
                      >
                        <td className="px-2 sm:px-4 py-2 text-xs font-medium text-gray-900">
                          {field.label}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500">
                          {field.type}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            field.core 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {field.core ? 'Core' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500 font-mono">
                          {field.id}
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
