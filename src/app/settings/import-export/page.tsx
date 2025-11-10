'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Settings, Save, Download, Upload } from 'lucide-react';

interface ImportExportSettings {
  allowMultipleCategoryRegistrations: boolean;
}

export default function ImportExportSettingsPage() {
  const [settings, setSettings] = useState<ImportExportSettings>({
    allowMultipleCategoryRegistrations: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in');
        return;
      }

      const response = await fetch('/api/settings/system', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      const importExportSettings = data.settings?.find(
        (s: any) => s.setting_key === 'import_export_settings'
      );

      if (importExportSettings) {
        setSettings(importExportSettings.setting_value);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof ImportExportSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in');
        return;
      }

      const response = await fetch('/api/settings/system', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          setting_key: 'import_export_settings',
          setting_value: settings,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      toast.success('✅ Settings saved successfully!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Import/Export Settings
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure how participant imports and bulk operations behave
        </p>
      </div>

      {/* Settings Card */}
      <Card padding="lg" className="max-w-3xl">
        <div className="space-y-6">
          {/* Section Title */}
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <Upload className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Participant Registration Settings
            </h2>
          </div>

          {/* Setting: Allow Multiple Category Registrations */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Allow Multiple Category Registrations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Controls whether participants can register for multiple categories <strong>of the same type</strong>.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Category Types:</strong>
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-3 ml-4 space-y-1">
                <li>• <strong>Individual:</strong> Singles, Singles-Advanced, etc.</li>
                <li>• <strong>Team-based:</strong> Doubles, Mixed, mojo_dojo, k_db, etc.</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                When <strong>enabled</strong>, participants can register for multiple individual categories AND multiple team categories.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                When <strong>disabled</strong>, participants can register for <strong>one individual category + one team category maximum</strong>.
              </p>

              {/* Examples */}
              <div className="mt-4 space-y-3">
                <div className={`p-3 rounded-lg border-2 ${
                  settings.allowMultipleCategoryRegistrations 
                    ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' 
                    : 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                }`}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ✅ {settings.allowMultipleCategoryRegistrations ? 'ALLOWED' : 'Would be allowed'} (When {settings.allowMultipleCategoryRegistrations ? 'ON' : 'OFF'}):
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• John registers for Singles (individual) ✓</li>
                    <li>• John registers for Doubles (team) ✓</li>
                    {settings.allowMultipleCategoryRegistrations && (
                      <>
                        <li>• John registers for Singles-Advanced (individual) ✓</li>
                        <li>• John registers for Mixed (team) ✓</li>
                        <li>• John registers for mojo_dojo (team) ✓</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="p-3 rounded-lg border-2 bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ❌ BLOCKED (Always):
                  </p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                    <li>• John registers for Doubles ✓</li>
                    <li>• John tries to register for Doubles again ✗ (Duplicate)</li>
                  </ul>
                </div>

                {!settings.allowMultipleCategoryRegistrations && (
                  <div className="p-3 rounded-lg border-2 bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ❌ BLOCKED (When OFF - Same Type):
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                      <li>• John registers for Doubles (team) ✓</li>
                      <li>• John tries to register for Mixed (team) ✗ (Already has team category)</li>
                      <li className="text-green-600 dark:text-green-400">• But John CAN register for Singles (individual) ✓ (Different type)</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex-shrink-0">
              <button
                onClick={() => handleToggle('allowMultipleCategoryRegistrations')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.allowMultipleCategoryRegistrations
                    ? 'bg-primary-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={settings.allowMultipleCategoryRegistrations}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.allowMultipleCategoryRegistrations ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <p className="mt-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                {settings.allowMultipleCategoryRegistrations ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  You have unsaved changes
                </p>
                <Button
                  onClick={handleSave}
                  variant="primary"
                  isLoading={saving}
                  leftIcon={<Save className="h-5 w-5" />}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info Box */}
      <Card padding="md" className="mt-6 max-w-3xl bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Where This Setting Applies
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• CSV bulk imports via "Import Participants"</li>
              <li>• Manual participant addition via "Add Participant" form</li>
              <li>• Self-registration forms (if enabled for tournament)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

