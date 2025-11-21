'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Upload, Loader2, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { parseFile } from '@/lib/file-parser';
import { suggestFieldMappings, suggestFieldMappingsWithAI } from '@/lib/field-mapping';
import { getContactFields, getUsers, getUserByEmail, importContacts } from '@/lib/firebase/services';
import { ParsedFileData, FieldMapping, Contact, ContactField, User, ImportSummary as ImportSummaryType } from '@/types';
import Stepper from './Stepper';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  useAI?: boolean;
}

const STEPS = [
  { number: 1, label: 'Detect Fields', description: 'Review data structure' },
  { number: 2, label: 'Map Fields', description: 'Connect to CRM Fields' },
  { number: 3, label: 'Final Checks', description: 'For Duplicates or Errors' },
];

export default function ImportModal({ isOpen, onClose, onSuccess, useAI = false }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [customFields, setCustomFields] = useState<ContactField[]>([]);
  const [allContactFields, setAllContactFields] = useState<ContactField[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [detectingFields, setDetectingFields] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummaryType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedData(null);
      setMappings([]);
      setCurrentStep(1);
      setSummary(null);
      setError(null);
      setDetectingFields(false);
      setCheckingDuplicates(false);
      setImportProgress(0);
      setEditingField(null);
    }
  }, [isOpen, useAI]);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setDetectingFields(true);
    setCurrentStep(1);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      let data;
      try {
        data = await parseFile(selectedFile);
      } catch (error: any) {
        throw new Error(`Failed to parse file: ${error.message || 'Invalid file format'}`);
      }

      if (!data || !data.headers || data.headers.length === 0) {
        throw new Error('File contains no headers. Please ensure the file has column names.');
      }

      if (!data.rows || data.rows.length === 0) {
        throw new Error('File contains no data rows.');
      }

      setParsedData(data);

      let fields, userList;
      try {
        [fields, userList] = await Promise.all([
          getContactFields(),
          getUsers(),
        ]);
      } catch (error: any) {
        throw new Error(`Failed to load contact fields or users: ${error.message || 'Unknown error'}`);
      }

      if (!fields || !Array.isArray(fields)) {
        throw new Error('Failed to load contact fields');
      }

      setAllContactFields(fields);
      setCustomFields(fields.filter(f => !f.core));
      setUsers(userList || []);

      let suggestedMappings: FieldMapping[];
      try {
        if (useAI) {
          suggestedMappings = await suggestFieldMappingsWithAI(data, fields);
        } else {
          suggestedMappings = suggestFieldMappings(data, fields);
        }
      } catch (error: any) {
        console.error('Error generating field mappings:', error);
        throw new Error(`Failed to generate field mappings: ${error.message || 'Unknown error'}`);
      }

      if (!suggestedMappings || !Array.isArray(suggestedMappings)) {
        suggestedMappings = [];
      }

      setMappings(suggestedMappings);
      setDetectingFields(false);
    } catch (err: any) {
      console.error('Error in handleFileSelect:', err);
      setError(err.message || 'Failed to parse file. Please ensure the file is valid.');
      setDetectingFields(false);
      setFile(null);
      setParsedData(null);
      setMappings([]);
    }
  }, [useAI]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleNext = useCallback(() => {
    if (currentStep === 1 && parsedData) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleFinalChecks();
    }
  }, [currentStep, parsedData]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleFinalChecks = useCallback(async () => {
    if (!parsedData || mappings.length === 0) return;

    setCurrentStep(3);
    setCheckingDuplicates(true);
    setImportProgress(0);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const agentMapping = mappings.find(m => m.systemField === 'agentUid');
      const agentEmailMap = new Map<string, string>();

      if (agentMapping) {
        try {
          const agentEmails = new Set<string>();
          for (const row of parsedData.rows) {
            try {
              const email = row[agentMapping.fileColumn];
              if (email) {
                agentEmails.add(String(email).trim().toLowerCase());
              }
            } catch (error: any) {
              console.error('Error processing agent email from row:', error);
              continue;
            }
          }

          const agentEmailArray = Array.from(agentEmails);
          for (const email of agentEmailArray) {
            try {
              const user = await getUserByEmail(email);
              if (user) {
                agentEmailMap.set(email.toLowerCase(), user.uid);
              }
            } catch (error: any) {
              console.error(`Error fetching user by email ${email}:`, error);
              continue;
            }
          }
        } catch (error: any) {
          console.error('Error processing agent mappings:', error);
        }
      }

      const contacts: Omit<Contact, 'id' | 'createdOn'>[] = [];

      try {
        for (const row of parsedData.rows) {
          try {
            const contact: any = {
              firstName: '',
              lastName: '',
              phone: '',
              email: '',
            };

            for (const mapping of mappings) {
              try {
                const value = row[mapping.fileColumn];
                if (value !== null && value !== undefined && value !== '') {
                  const stringValue = String(value).trim();

                  if (mapping.systemField === 'agentUid') {
                    const uid = agentEmailMap.get(stringValue.toLowerCase());
                    if (uid) {
                      contact.agentUid = uid;
                    }
                  } else {
                    contact[mapping.systemField] = stringValue;
                  }
                }
              } catch (error: any) {
                console.error(`Error processing mapping for ${mapping.fileColumn}:`, error);
                continue;
              }
            }

            if (contact.phone || contact.email) {
              contacts.push(contact);
            }
          } catch (error: any) {
            console.error('Error processing contact row:', error);
            continue;
          }
        }
      } catch (error: any) {
        console.error('Error building contacts array:', error);
        throw new Error('Failed to process contact data');
      }

      if (contacts.length === 0) {
        throw new Error('No valid contacts found to import');
      }

      let importSummary;
      try {
        importSummary = await importContacts(contacts, (progress) => {
          setImportProgress(progress);
        });
      } catch (error: any) {
        console.error('Error importing contacts:', error);
        throw new Error(`Failed to import contacts: ${error.message || 'Unknown error'}`);
      }

      setSummary(importSummary);
      setCheckingDuplicates(false);
    } catch (err: any) {
      console.error('Error in handleFinalChecks:', err);
      setError(err.message || 'Failed to import contacts. Please try again.');
      setCheckingDuplicates(false);
      setCurrentStep(2);
    }
  }, [parsedData, mappings]);

  const handleMappingChange = (fileColumn: string, systemField: string) => {
    const existingIndex = mappings.findIndex(m => m.fileColumn === fileColumn);

    if (systemField === '') {
      if (existingIndex >= 0) {
        setMappings(mappings.filter(m => m.fileColumn !== fileColumn));
      }
    } else {
      const newMappings = [...mappings];
      if (existingIndex >= 0) {
        newMappings[existingIndex] = { ...newMappings[existingIndex], systemField };
      } else {
        newMappings.push({ fileColumn, systemField });
      }
      setMappings(newMappings);
    }
    setEditingField(null);
  };

  const getConfidenceLevel = (confidence?: number): { label: string; color: string; bgColor: string } => {
    if (!confidence) return { label: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (confidence >= 0.5) return { label: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getFieldKey = (label: string): string => {
    const labelLower = label.toLowerCase().replace(/\s+/g, '');
    const labelMap: Record<string, string> = {
      'firstname': 'firstName',
      'lastname': 'lastName',
      'phone': 'phone',
      'email': 'email',
      'agent': 'agentUid',
    };
    return labelMap[labelLower] || labelLower;
  };

  const allSystemFields = useMemo(() => {
    const fields: Array<{ key: string; label: string; type: string; required: boolean; core?: boolean }> = [];
    
    const coreFields = allContactFields.filter(f => f.core);
    coreFields.forEach(field => {
      const key = getFieldKey(field.label);
      if (key === 'agentuid') {
        fields.push({
          key: 'agentUid',
          label: field.label,
          type: `Core Field - ${field.type}`,
          required: false,
          core: true,
        });
      } else {
        fields.push({
          key,
          label: field.label,
          type: `Core Field - ${field.type}`,
          required: key === 'firstName' || key === 'lastName',
          core: true,
        });
      }
    });
    
    customFields.forEach(cf => {
      fields.push({
        key: cf.id,
        label: cf.label,
        type: `Custom Field - ${cf.type}`,
        required: false,
        core: false,
      });
    });
    
    return fields;
  }, [allContactFields, customFields]);

  const highConfidenceCount = mappings.filter(m => (m.confidence || 0) >= 0.8).length;
  const customFieldsCount = mappings.filter(m => customFields.some(cf => cf.id === m.systemField)).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[62rem] h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-primary-50 rounded-lg">
              <ArrowRight className="h-3 w-3 text-primary-600 rotate-90" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Move Entry to Contact Section</h2>
              <p className="text-xs text-gray-500">Step {currentStep} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        </div>

        <div className="px-3 pt-3 flex-shrink-0 flex justify-center">
          <Stepper currentStep={currentStep} steps={STEPS} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
          {currentStep === 1 && (
            <>
              {detectingFields ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-xl mb-4">
                    <Sparkles className="h-8 w-8 text-primary-600 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-primary-600 mb-2">Auto Detecting Field Mapping...</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Matching spreadsheets columns to CRM fields using intelligent pattern recognition..
                  </p>
                  <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-1.5">
                    <div className="bg-primary-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              ) : !parsedData ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors"
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-3" />
                      <p className="text-base font-medium text-gray-700 mb-1">
                        Drop your file here or click to browse
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports CSV and Excel (.xlsx, .xls) files
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Column Detection Results</h3>
                    <p className="text-sm text-gray-600">
                      Our intelligent mapping has mapped {mappings.length} fields in this entry with the CRM Contact Fields
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium text-green-700">{mappings.length} Fields Detected</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      <span className="text-sm font-medium text-purple-700">{highConfidenceCount} High Confidence</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 rounded-lg border border-pink-200">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                      <span className="text-sm font-medium text-pink-700">{customFieldsCount} Custom Fields</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {parsedData.headers.map(header => {
                      const mapping = mappings.find(m => m.fileColumn === header);
                      const confidence = mapping?.confidence || 0;
                      const confLevel = getConfidenceLevel(confidence);
                      const systemField = allSystemFields.find(f => f.key === mapping?.systemField);

                      return (
                        <div key={header} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <div className={cn('px-1 py-0.5 rounded text-xs font-medium', confLevel.bgColor, confLevel.color)}>
                            {Math.round(confidence * 100)}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900">{header}</div>
                            {mapping && systemField && (
                              <div className="text-xs text-gray-500">{systemField.label}</div>
                            )}
                          </div>
                          {mapping && (
                            <>
                              <ArrowRight className="h-2.5 w-2.5 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-primary-600">{systemField?.label || mapping.systemField}</div>
                                <div className="text-xs text-gray-500">{systemField?.type}</div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 2 && parsedData && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Smart Field Mapping</h3>
                <p className="text-xs text-gray-600">
                  Review and adjust the AI-powered field mappings below. Click "Edit" next to any mapping to change it. You can map to existing CRM fields or create custom fields with different data types.
                </p>
              </div>

              <div className="space-y-1.5">
                {parsedData.headers.map(header => {
                  const mapping = mappings.find(m => m.fileColumn === header);
                  const confidence = mapping?.confidence || 0;
                  const confLevel = getConfidenceLevel(confidence);
                  const systemField = allSystemFields.find(f => f.key === mapping?.systemField);
                  const sampleData = parsedData.rows[0]?.[header];
                  const isEditing = editingField === header;

                  return (
                    <div key={header} className="bg-white border border-gray-200 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-medium text-pink-600 bg-pink-50 px-1 py-0.5 rounded">DATABASE FIELD</span>
                            <span className={cn('text-xs font-medium px-1 py-0.5 rounded', confLevel.bgColor, confLevel.color)}>
                              {Math.round(confidence * 100)}% - {confLevel.label}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-gray-900 mb-0.5">{header}</div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Sample</span> {String(sampleData || '').substring(0, 35)}
                          </div>
                        </div>

                        <ArrowRight className="h-3 w-3 text-gray-400 mt-3" />

                        <div className="flex-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded mb-1 inline-block">CRM FIELD</span>
                          {isEditing ? (
                            <select
                              value={mapping?.systemField || ''}
                              onChange={(e) => handleMappingChange(header, e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                              className="w-full px-1.5 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">Don't import this field</option>
                              <optgroup label="Core Fields">
                                {allSystemFields.filter(f => f.core).map(field => (
                                  <option key={field.key} value={field.key}>{field.label}</option>
                                ))}
                              </optgroup>
                              {customFields.length > 0 && (
                                <optgroup label="Custom Fields">
                                  {customFields.map(field => (
                                    <option key={field.id} value={field.id}>{field.label}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          ) : (
                            <>
                              <div className="text-xs font-semibold text-primary-600 mb-0.5">
                                {systemField?.label || 'Not Mapped'}
                              </div>
                              <div className="text-xs text-gray-500">{systemField?.type || 'Unmapped'}</div>
                            </>
                          )}
                          {confidence < 0.5 && mapping && (
                            <div className="mt-1 flex items-center gap-0.5 text-xs text-red-600 bg-red-50 px-1 py-0.5 rounded">
                              <span>⚠</span> Manual Review Recommended
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1 mt-3">
                          <button
                            onClick={() => setEditingField(header)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <>
              {checkingDuplicates ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-xl mb-4">
                    <Shield className="h-8 w-8 text-primary-600 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-primary-600 mb-2">Checking for Duplicates & Errors....</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Reviewing the entry data to ensure no duplicate contacts or invalid data slip through.
                  </p>
                  <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Running Final Checks...</p>
                </div>
              ) : summary ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-xl mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Final Checks Complete</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    No duplicates or errors found — your data is clean and ready to import.
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xl font-bold text-green-900 mb-0.5">{summary.created}</div>
                      <div className="text-sm text-green-700">Total Contacts Imported</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-xl font-bold text-orange-900 mb-0.5">{summary.merged}</div>
                      <div className="text-sm text-orange-700">Contacts Merged</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xl font-bold text-red-900 mb-0.5">{summary.errors.length}</div>
                      <div className="text-sm text-red-700">Errors</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    No Issue Found! This Database entries are good to move to contacts section.
                  </p>
                </div>
              ) : null}
            </>
          )}

          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start">
              <span className="text-red-500 mr-2 text-xs">⚠</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex gap-1.5">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-2.5 w-2.5" />
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!parsedData || (currentStep === 2 && mappings.length === 0)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onSuccess && summary) {
                    onSuccess();
                  }
                  onClose();
                }}
                disabled={checkingDuplicates || !summary}
                className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Move to Contacts
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

