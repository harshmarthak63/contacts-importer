'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, X, Upload, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  fetchContacts,
  addContact,
  editContact,
  removeContact,
  fetchUsersForContacts,
  fetchContactFields,
  setSelectedContact,
  setSearchTerm,
  setFilterType,
  setAgentFilter,
  clearError,
} from '@/lib/store/slices/contactsSlice';
import {
  selectFilteredContacts,
  selectUniqueAgents,
  selectAgents,
  selectDisplayFields,
  selectCustomFields,
} from '@/lib/store/selectors/contactsSelectors';
import { Contact, ContactField } from '@/types';
import ImportModal from '@/components/ImportModal';

export default function ContactsPage() {
  const dispatch = useAppDispatch();
  const { contacts, loading, error, selectedContact, searchTerm, filterType, agentFilter, agentMap, contactFields } = useAppSelector((state) => state.contacts);
  const filteredContacts = useAppSelector(selectFilteredContacts);
  const uniqueAgents = useAppSelector(selectUniqueAgents);
  const availableAgents = useAppSelector(selectAgents);
  const displayFields = useAppSelector(selectDisplayFields);
  const customFields = useAppSelector(selectCustomFields);

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [useAIImport, setUseAIImport] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    agentUid: '',
  });

  useEffect(() => {
    dispatch(fetchContacts());
    dispatch(fetchUsersForContacts());
    dispatch(fetchContactFields());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchContactFields());
    }, 3000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const getFieldKey = (label: string, isCore: boolean = false): string => {
    if (isCore) {
      const labelLower = label.toLowerCase().replace(/\s+/g, '');
      const labelMap: Record<string, string> = {
        'firstname': 'firstName',
        'lastname': 'lastName',
        'phone': 'phone',
        'email': 'email',
        'agent': 'agentUid',
      };
      return labelMap[labelLower] || labelLower;
    }
    return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const getAgentName = (agentUid?: string): string => {
    if (!agentUid) return '-';
    return agentMap[agentUid]?.name || 'Unknown';
  };

  const handleAdd = () => {
    setEditingContact(null);
    dispatch(setSelectedContact(null));
    const initialData: Record<string, any> = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      agentUid: '',
    };
    customFields.forEach(field => {
      const key = getFieldKey(field.label, false);
      initialData[key] = '';
    });
    setFormData(initialData);
    setShowForm(true);
    dispatch(clearError());
  };

  const handleEdit = () => {
    if (!selectedContact) return;
    setEditingContact(selectedContact);
    const editData: Record<string, any> = {
      firstName: selectedContact.firstName || '',
      lastName: selectedContact.lastName || '',
      phone: selectedContact.phone || '',
      email: selectedContact.email || '',
      agentUid: selectedContact.agentUid || '',
    };
    customFields.forEach(field => {
      const key = getFieldKey(field.label, false);
      editData[key] = selectedContact[key] || selectedContact[field.label] || '';
    });
    setFormData(editData);
    setShowForm(true);
    dispatch(clearError());
  };

  const handleDelete = () => {
    if (!selectedContact) return;
    setContactToDelete(selectedContact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete || !contactToDelete.id) return;

    try {
      await dispatch(removeContact(contactToDelete.id)).unwrap();
      await dispatch(fetchContacts());
      dispatch(setSelectedContact(null));
      setContactToDelete(null);
      setShowDeleteConfirm(false);
      dispatch(clearError());
    } catch (err: any) {
      setShowDeleteConfirm(false);
      setContactToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setContactToDelete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (!formData.firstName || !formData.lastName) {
      return;
    }

    try {
      const contactData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || '',
        email: formData.email || '',
      };

      if (formData.agentUid) {
        contactData.agentUid = formData.agentUid;
      } else {
        contactData.agentUid = null;
      }

      customFields.forEach(field => {
        const key = getFieldKey(field.label, false);
        if (formData[key] !== undefined && formData[key] !== '') {
          contactData[key] = formData[key];
        }
      });

      if (editingContact && editingContact.id) {
        await dispatch(editContact({ id: editingContact.id, contactData })).unwrap();
      } else {
        await dispatch(addContact(contactData as Omit<Contact, 'id'>)).unwrap();
      }
      await dispatch(fetchContacts());
      setShowForm(false);
      setEditingContact(null);
      dispatch(setSelectedContact(null));
      const resetData: Record<string, any> = {
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        agentUid: '',
      };
      customFields.forEach(field => {
        const key = getFieldKey(field.label, false);
        resetData[key] = '';
      });
      setFormData(resetData);
    } catch (err: any) {
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContact(null);
    const resetData: Record<string, any> = {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      agentUid: '',
    };
    customFields.forEach(field => {
      const key = getFieldKey(field.label, false);
      resetData[key] = '';
    });
    setFormData(resetData);
    dispatch(clearError());
  };

  const handleRowClick = (contact: Contact) => {
    dispatch(setSelectedContact(contact.id === selectedContact?.id ? null : contact));
  };

  const handleImportClose = () => {
    setShowImportModal(false);
    setUseAIImport(false);
    dispatch(fetchContacts());
  };

  const handleAIImport = () => {
    setUseAIImport(true);
    setShowImportModal(true);
  };

  const handleRegularImport = () => {
    setUseAIImport(false);
    setShowImportModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-bold text-gray-900">View and manage all contacts</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAdd}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add Contact"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleEdit}
                disabled={!selectedContact}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit Contact"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedContact}
                className="p-1.5 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete Contact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleRegularImport}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                title="Import Contacts"
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                onClick={handleAIImport}
                className="p-1.5 text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                title="Import using AI"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by phone, email, name, or agent..."
                value={searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterType}
                onChange={(e) => dispatch(setFilterType(e.target.value as any))}
                className="w-full sm:w-auto px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
              >
                <option value="all">All Contacts</option>
                <option value="phone">With Phone</option>
                <option value="email">With Email</option>
                <option value="agent">With Agent</option>
              </select>
              {filterType === 'agent' && uniqueAgents.length > 0 && (
                <select
                  value={agentFilter}
                  onChange={(e) => dispatch(setAgentFilter(e.target.value))}
                  className="w-full sm:w-auto px-3 py-1.5 pr-8 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat"
                >
                  <option value="">All Agents</option>
                  {uniqueAgents.map(agent => (
                    <option key={agent.uid} value={agent.uid}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-4 text-xs text-gray-600 flex-shrink-0">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                {displayFields.filter((f: any) => f.core && f.label !== 'Agent').map((field: any) => {
                  const fieldKey = getFieldKey(field.label, field.core);
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required={field.required || false}
                      />
                    </div>
                  );
                })}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Agent</label>
                  <select
                    value={formData.agentUid || ''}
                    onChange={(e) => setFormData({ ...formData, agentUid: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">No Agent</option>
                    {availableAgents.map(agent => (
                      <option key={agent.uid} value={agent.uid}>{agent.name}</option>
                    ))}
                  </select>
                </div>
                {displayFields.filter((f: any) => !f.core).map((field: any) => {
                  const fieldKey = getFieldKey(field.label, false);
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  );
                })}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 w-full sm:w-auto"
                  >
                    {editingContact ? 'Update' : 'Create'}
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

        {showDeleteConfirm && contactToDelete && (
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
                Are you sure you want to delete contact "<span className="font-medium">{contactToDelete.firstName} {contactToDelete.lastName}</span>"? This action cannot be undone.
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

        <ImportModal isOpen={showImportModal} onClose={handleImportClose} useAI={useAIImport} />

        {loading ? (
          <div className="text-center py-8 flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600">No contacts found.</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-y-auto overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {displayFields.map((field: any) => {
                      const fieldKey = getFieldKey(field.label, field.core);
                      if (field.label === 'Agent') return null;
                      return (
                        <th
                          key={field.id}
                          className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {field.label}
                        </th>
                      );
                    })}
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-2 sm:px-4 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Id
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedContact?.id === contact.id;
                    return (
                      <tr
                        key={contact.id}
                        onClick={() => handleRowClick(contact)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary-50' : ''
                        }`}
                        style={isSelected ? { borderLeft: '4px solid #2563eb' } : {}}
                      >
                        {displayFields.map((field: any) => {
                          const fieldKey = getFieldKey(field.label, field.core);
                          if (field.label === 'Agent') return null;

                          let value: any = '-';

                          if (field.core) {
                            if (field.label === 'First Name') {
                              value = contact.firstName || '-';
                            } else if (field.label === 'Last Name') {
                              value = contact.lastName || '-';
                            } else if (field.label === 'Phone') {
                              value = contact.phone || '-';
                            } else if (field.label === 'Email') {
                              value = contact.email || '-';
                            } else {
                              value = contact[fieldKey] || '-';
                            }
                          } else {
                            value = contact[fieldKey] || contact[field.label] || '-';
                          }

                          if (field.type === 'datetime' && value && value !== '-') {
                            try {
                              value = new Date(value).toLocaleString();
                            } catch (e) {
                            }
                          }

                          return (
                            <td
                              key={field.id}
                              className="px-2 sm:px-4 py-2 text-xs text-gray-500 break-words"
                            >
                              {value}
                            </td>
                          );
                        })}
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500">
                          {getAgentName(contact.agentUid)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs text-gray-500 font-mono">
                          {contact.id || '-'}
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
