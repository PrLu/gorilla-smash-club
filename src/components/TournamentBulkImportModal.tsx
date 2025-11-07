'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText, Eye, AlertTriangle, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface TournamentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
}

interface ValidationResult {
  valid: any[];
  invalid: any[];
  warnings: any[];
  statistics: {
    total: number;
    validCount: number;
    invalidCount: number;
    warningCount: number;
    duplicateEmails: number;
    existingUsers: number;
    newUsers: number;
    alreadyRegistered: number;
    categoriesUsed: string[];
  };
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  details?: any;
}

type ImportStep = 'upload' | 'validate' | 'preview' | 'importing' | 'complete';

export function TournamentBulkImportModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  tournamentId 
}: TournamentBulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedParticipants, setParsedParticipants] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'valid' | 'warnings' | 'invalid'>('valid');

  const handleClose = () => {
    setFile(null);
    setStep('upload');
    setValidationResult(null);
    setImportResult(null);
    setParsedParticipants([]);
    setSelectedTab('valid');
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setFile(selectedFile);
    setValidationResult(null);
    setImportResult(null);
    setStep('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const participants = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const participant: any = {};

      headers.forEach((header, index) => {
        if (header === 'full_name' || header === 'full name' || header === 'name') {
          participant.full_name = values[index];
        } else if (header === 'email') {
          participant.email = values[index];
        } else if (header === 'phone' || header === 'phone_number') {
          participant.phone = values[index];
        } else if (header === 'gender') {
          participant.gender = values[index]?.toLowerCase();
        } else if (header === 'dupr_id' || header === 'dupr id' || header === 'dupr') {
          participant.dupr_id = values[index];
        } else if (header === 'category') {
          participant.category = values[index]?.toLowerCase();
        } else if (header === 'rating' || header === 'player_rating') {
          participant.rating = values[index];
        } else if (header === 'partner_email' || header === 'partner email') {
          participant.partner_email = values[index];
        } else if (header === 'payment_status' || header === 'payment') {
          participant.payment_status = values[index]?.toLowerCase();
        }
      });

      if (participant.email || participant.full_name) {
        participants.push(participant);
      }
    }

    return participants;
  };

  const handleValidate = async () => {
    if (!file) return;

    setStep('validate');

    try {
      const text = await file.text();
      const participants = parseCSV(text);

      if (participants.length === 0) {
        toast.error('No valid participants found in CSV file');
        setStep('upload');
        return;
      }

      setParsedParticipants(participants);

      // Get auth session to send token
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in to validate participants');
        setStep('upload');
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/import-participants/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ participants }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Validation failed: ${data.error || 'Unknown error'}`);
        setStep('upload');
        return;
      }

      setValidationResult(data.validation);
      setStep('preview');

      // Auto-select appropriate tab
      if (data.validation.statistics.invalidCount > 0) {
        setSelectedTab('invalid');
        toast.error(`Found ${data.validation.statistics.invalidCount} invalid entries. Please review errors.`);
      } else if (data.validation.statistics.warningCount > 0) {
        setSelectedTab('warnings');
        toast.warning(`Found ${data.validation.statistics.warningCount} warnings. Review before importing.`);
      } else {
        setSelectedTab('valid');
        toast.success(`✅ All ${data.validation.statistics.validCount} participants validated successfully!`);
      }

    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error('Failed to validate file');
      setStep('upload');
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.statistics.invalidCount > 0) {
      toast.error('Please fix all errors before importing');
      return;
    }

    setStep('importing');

    try {
      // Get auth session to send token
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in to import participants');
        setStep('preview');
        return;
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/import-participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ participants: parsedParticipants }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Import failed: ${data.error || 'Unknown error'}`);
        setStep('preview');
        return;
      }

      setImportResult(data.results);
      setStep('complete');

      if (data.results.successful > 0) {
        const newCount = data.results.newUsers || 0;
        const existingCount = data.results.existingUsers || 0;
        
        if (newCount > 0 && existingCount > 0) {
          toast.success(`🎉 Imported ${data.results.successful} participants: ${newCount} new (invited), ${existingCount} existing`);
        } else if (newCount > 0) {
          toast.success(`🎉 Created and invited ${newCount} new participant(s)`);
        } else {
          toast.success(`🎉 Registered ${existingCount} existing participant(s)`);
        }
        
        if (data.results.failed === 0) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      } else {
        toast.error('Import failed. Please check the results.');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Failed to import participants');
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const template = `full_name,email,phone,gender,category,rating,partner_email,payment_status
John Doe,john@example.com,1234567890,male,singles,<3.6,,paid
Jane Smith,jane@example.com,0987654321,female,doubles,<3.8,partner@example.com,pending`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tournament_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded!');
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Template Download */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950">
        <div className="mb-2 flex items-center gap-2 text-primary-900 dark:text-primary-100">
          <FileText className="h-5 w-5" />
          <h4 className="font-semibold">Need a template?</h4>
        </div>
        <p className="mb-3 text-sm text-primary-800 dark:text-primary-200">
          Download our CSV template with all required columns and example data
        </p>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={downloadTemplate}
        >
          Download Template
        </Button>
      </div>

      {/* File Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-gray-300 hover:border-primary-400 dark:border-gray-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
          {file ? file.name : 'Drop your CSV file here'}
        </p>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          or click to browse
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {file && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<Eye className="h-4 w-4" />}
            onClick={handleValidate}
          >
            Validate File
          </Button>
        </div>
      )}

      {/* Required Fields Info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Required CSV Columns:</h4>
        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>• <strong>email</strong> - Participant's email address</li>
          <li>• <strong>full_name</strong> - Full name</li>
          <li>• <strong>category</strong> - singles, doubles, or mixed</li>
          <li>• <strong>gender</strong> - male or female (optional)</li>
          <li>• <strong>rating</strong> - &lt;3.2, &lt;3.6, &lt;3.8, or open (optional)</li>
          <li>• <strong>partner_email</strong> - For doubles/mixed (optional)</li>
          <li>• <strong>payment_status</strong> - pending, paid, or waived (optional)</li>
        </ul>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!validationResult) return null;

    const { statistics } = validationResult;
    const canImport = statistics.invalidCount === 0;

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Rows</div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{statistics.validCount}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Valid</div>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{statistics.warningCount}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Warnings</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{statistics.invalidCount}</div>
            <div className="text-sm text-red-600 dark:text-red-400">Errors</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">New Users:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">{statistics.newUsers}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Existing Users:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{statistics.existingUsers}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Duplicates:</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">{statistics.duplicateEmails}</span>
          </div>
          <div className="flex items-center justify-between rounded border border-gray-200 p-3 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Already Registered:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">{statistics.alreadyRegistered}</span>
          </div>
        </div>

        {/* Categories Used */}
        {statistics.categoriesUsed.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Categories Found:</h4>
            <div className="flex flex-wrap gap-2">
              {statistics.categoriesUsed.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Import Status Alert */}
        {!canImport && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-100">Cannot Import</h4>
              <p className="text-sm text-red-800 dark:text-red-200">
                Please fix all errors before importing. Review the "Errors" tab below.
              </p>
            </div>
          </div>
        )}

        {canImport && statistics.warningCount > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Warnings Present</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                You can proceed with import, but please review warnings below.
              </p>
            </div>
          </div>
        )}

        {canImport && statistics.warningCount === 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-100">Ready to Import!</h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                All participants validated successfully. Click "Confirm Import" to proceed.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTab('valid')}
              className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                selectedTab === 'valid'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Valid ({statistics.validCount})
            </button>
            {statistics.warningCount > 0 && (
              <button
                onClick={() => setSelectedTab('warnings')}
                className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'warnings'
                    ? 'border-yellow-600 text-yellow-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Warnings ({statistics.warningCount})
              </button>
            )}
            {statistics.invalidCount > 0 && (
              <button
                onClick={() => setSelectedTab('invalid')}
                className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                  selectedTab === 'invalid'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Errors ({statistics.invalidCount})
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-h-96 overflow-y-auto">
          {selectedTab === 'valid' && (
            <div className="space-y-2">
              {validationResult.valid.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        {item.full_name} ({item.email})
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        Category: {item.category} | {item.existingUser ? 'Existing User' : 'New User (will be invited)'}
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  {item.warnings && (
                    <div className="mt-2 space-y-1">
                      {item.warnings.map((warning: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <AlertTriangle className="h-3 w-3" />
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'warnings' && (
            <div className="space-y-2">
              {validationResult.warnings.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-yellow-900 dark:text-yellow-100">
                        {item.full_name} ({item.email})
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        Category: {item.category}
                      </div>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  {item.warnings && (
                    <div className="mt-2 space-y-1">
                      {item.warnings.map((warning: string, i: number) => (
                        <div key={i} className="text-sm text-yellow-800 dark:text-yellow-200">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'invalid' && (
            <div className="space-y-2">
              {validationResult.invalid.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-100">
                        {item.full_name || 'Unknown'} ({item.email || 'No email'})
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        Category: {item.category || 'Not specified'}
                      </div>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  {item.errors && (
                    <div className="mt-2 space-y-1">
                      {item.errors.map((error: string, i: number) => (
                        <div key={i} className="text-sm font-medium text-red-800 dark:text-red-200">
                          ❌ {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              setStep('upload');
              setValidationResult(null);
              setFile(null);
            }}
          >
            Start Over
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmImport}
            disabled={!canImport}
            leftIcon={<Users className="h-4 w-4" />}
          >
            {canImport ? 'Confirm Import' : 'Fix Errors First'}
          </Button>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => {
    if (!importResult) return null;

    const hasFailures = importResult.failed > 0;

    return (
      <div className="space-y-6 text-center">
        {!hasFailures ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Import Successful!</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Successfully imported {importResult.successful} participants
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Partial Import</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Imported {importResult.successful} of {importResult.total} participants
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {importResult.failed} failed - check details below
              </p>
            </div>
          </>
        )}

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{importResult.total}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Successful</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importResult.successful}</div>
            </div>
          </div>
        </div>

        <Button variant="primary" onClick={handleClose} className="w-full">
          Close
        </Button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === 'upload' ? 'Import Participants' :
        step === 'validate' ? 'Validating...' :
        step === 'preview' ? 'Review & Confirm Import' :
        step === 'importing' ? 'Importing...' :
        'Import Complete'
      }
      size="lg"
    >
      {step === 'upload' && renderUploadStep()}
      {step === 'validate' && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="mb-4 h-12 w-12 animate-spin text-primary-600" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Validating participants...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This may take a moment</p>
        </div>
      )}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="mb-4 h-12 w-12 animate-spin text-primary-600" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">Importing participants...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we process your data</p>
        </div>
      )}
      {step === 'complete' && renderCompleteStep()}
    </Modal>
  );
}
