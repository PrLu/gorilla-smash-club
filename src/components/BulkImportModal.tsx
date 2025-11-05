'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  successfulPlayers: Array<{ id: string; email: string; full_name: string }>;
  failedPlayers: Array<{ email: string; full_name: string; error: string }>;
}

export function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
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
    setImportResult(null);
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
    const players = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const player: any = {};

      headers.forEach((header, index) => {
        if (header === 'full_name' || header === 'full name' || header === 'name') {
          player.full_name = values[index];
        } else if (header === 'email') {
          player.email = values[index];
        } else if (header === 'phone' || header === 'phone_number') {
          player.phone = values[index];
        } else if (header === 'gender') {
          player.gender = values[index]?.toLowerCase();
        } else if (header === 'dupr_id' || header === 'dupr id' || header === 'dupr') {
          player.dupr_id = values[index];
        }
      });

      if (player.email) {
        players.push(player);
      }
    }

    return players;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const players = parseCSV(text);

      if (players.length === 0) {
        toast.error('No valid players found in CSV file');
        setImporting(false);
        return;
      }

      // Get auth session to send token
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error('Please sign in to import players');
        setImporting(false);
        return;
      }

      const response = await fetch('/api/participants/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ players }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Import failed: ${data.error || 'Unknown error'}`);
        setImporting(false);
        return;
      }

      setImportResult(data.results);

      if (data.results.successful > 0) {
        toast.success(`Successfully imported ${data.results.successful} player(s)`);
        if (data.results.failed === 0) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      } else {
        toast.error('No players were imported successfully');
      }

    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to import players');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'full_name,email,phone,gender,dupr_id\nJohn Doe,john@example.com,+1234567890,male,12345\nJane Smith,jane@example.com,+0987654321,female,67890';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Players" size="lg">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold">CSV Format Instructions:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Required columns: <strong>full_name</strong>, <strong>email</strong></li>
                <li>Optional columns: <strong>phone</strong>, <strong>gender</strong> (male/female/other), <strong>dupr_id</strong></li>
                <li>First row must contain column headers</li>
                <li>Each subsequent row represents one player</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Download Template */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={downloadTemplate}
          >
            Download CSV Template
          </Button>
        </div>

        {/* File Upload */}
        {!importResult && (
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {file ? file.name : 'Drag and drop CSV file here'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">or click to browse</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-100 p-4 text-center dark:bg-gray-700">
                <FileText className="mx-auto h-6 w-6 text-gray-600 dark:text-gray-400" />
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{importResult.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              </div>
              <div className="rounded-lg bg-green-100 p-4 text-center dark:bg-green-900/20">
                <CheckCircle className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                <p className="mt-2 text-2xl font-bold text-green-900 dark:text-green-300">{importResult.successful}</p>
                <p className="text-xs text-green-700 dark:text-green-400">Success</p>
              </div>
              <div className="rounded-lg bg-red-100 p-4 text-center dark:bg-red-900/20">
                <XCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
                <p className="mt-2 text-2xl font-bold text-red-900 dark:text-red-300">{importResult.failed}</p>
                <p className="text-xs text-red-700 dark:text-red-400">Failed</p>
              </div>
            </div>

            {/* Failed Players List */}
            {importResult.failed > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
                <h4 className="mb-2 font-semibold text-red-900 dark:text-red-300">Failed Imports:</h4>
                <ul className="space-y-2 text-sm">
                  {importResult.failedPlayers.map((player, index) => (
                    <li key={index} className="text-red-800 dark:text-red-400">
                      <strong>{player.full_name}</strong> ({player.email}) - {player.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="flex-1"
          >
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && (
            <Button
              type="button"
              variant="primary"
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1"
            >
              {importing ? 'Importing...' : 'Import Players'}
            </Button>
          )}
          {importResult && importResult.failed > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setImportResult(null);
                setFile(null);
              }}
              className="flex-1"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

