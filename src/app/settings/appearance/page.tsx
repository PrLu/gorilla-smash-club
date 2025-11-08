'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { 
  useAppearancePreferences, 
  useUpdateAppearancePreferences, 
  useUploadLogo,
  getEffectivePreferences 
} from '@/lib/hooks/useAppearancePreferences';
import { Upload, Save, RotateCcw, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

/**
 * Appearance Settings Page
 * Allows users to customize font colors, background colors, and upload custom logo
 */
export default function AppearanceSettingsPage() {
  const { data: preferences, isLoading } = useAppearancePreferences();
  const updatePreferences = useUpdateAppearancePreferences();
  const uploadLogo = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  const effectivePrefs = getEffectivePreferences(preferences);

  // Local state for form
  const [formData, setFormData] = useState({
    primary_font_color: effectivePrefs.primary_font_color,
    secondary_font_color: effectivePrefs.secondary_font_color,
    heading_font_color: effectivePrefs.heading_font_color,
    dark_primary_font_color: effectivePrefs.dark_primary_font_color,
    dark_secondary_font_color: effectivePrefs.dark_secondary_font_color,
    dark_heading_font_color: effectivePrefs.dark_heading_font_color,
    primary_bg_color: effectivePrefs.primary_bg_color,
    secondary_bg_color: effectivePrefs.secondary_bg_color,
    dark_primary_bg_color: effectivePrefs.dark_primary_bg_color,
    dark_secondary_bg_color: effectivePrefs.dark_secondary_bg_color,
    custom_accent_color: effectivePrefs.custom_accent_color || '',
    custom_primary_color: effectivePrefs.custom_primary_color || '',
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        primary_font_color: preferences.primary_font_color,
        secondary_font_color: preferences.secondary_font_color,
        heading_font_color: preferences.heading_font_color,
        dark_primary_font_color: preferences.dark_primary_font_color,
        dark_secondary_font_color: preferences.dark_secondary_font_color,
        dark_heading_font_color: preferences.dark_heading_font_color,
        primary_bg_color: preferences.primary_bg_color,
        secondary_bg_color: preferences.secondary_bg_color,
        dark_primary_bg_color: preferences.dark_primary_bg_color,
        dark_secondary_bg_color: preferences.dark_secondary_bg_color,
        custom_accent_color: preferences.custom_accent_color || '',
        custom_primary_color: preferences.custom_primary_color || '',
      });
    }
  }, [preferences]);

  const handleColorChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResetColor = (field: string, defaultValue: string) => {
    setFormData(prev => ({ ...prev, [field]: defaultValue }));
  };

  // Default color values
  const defaults = {
    light: {
      primary_font_color: '#111827',
      secondary_font_color: '#4b5563',
      heading_font_color: '#111827',
      primary_bg_color: '#ffffff',
      secondary_bg_color: '#f9fafb',
    },
    dark: {
      dark_primary_font_color: '#f9fafb',
      dark_secondary_font_color: '#d1d5db',
      dark_heading_font_color: '#ffffff',
      dark_primary_bg_color: '#111827',
      dark_secondary_bg_color: '#1f2937',
    },
  };

  const handleSave = () => {
    const dataToSave: any = { ...formData };
    
    // Remove empty custom colors
    if (!dataToSave.custom_accent_color) {
      dataToSave.custom_accent_color = null;
    }
    if (!dataToSave.custom_primary_color) {
      dataToSave.custom_primary_color = null;
    }
    
    updatePreferences.mutate(dataToSave);
  };

  const handleReset = () => {
    const defaults = {
      primary_font_color: '#111827',
      secondary_font_color: '#4b5563',
      heading_font_color: '#111827',
      dark_primary_font_color: '#f9fafb',
      dark_secondary_font_color: '#d1d5db',
      dark_heading_font_color: '#ffffff',
      primary_bg_color: '#ffffff',
      secondary_bg_color: '#f9fafb',
      dark_primary_bg_color: '#111827',
      dark_secondary_bg_color: '#1f2937',
      custom_accent_color: '',
      custom_primary_color: '',
    };
    setFormData(defaults);
    updatePreferences.mutate(defaults);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo.mutate(file);
    }
  };

  const handleRemoveLogo = () => {
    updatePreferences.mutate({ custom_logo_url: null });
  };

  const handleHeroLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo.mutate(file, {
        onSuccess: (logoUrl) => {
          updatePreferences.mutate({ custom_hero_logo_url: logoUrl });
        },
      });
    }
  };

  const handleRemoveHeroLogo = () => {
    updatePreferences.mutate({ custom_hero_logo_url: null });
  };

  const handleFooterLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo.mutate(file, {
        onSuccess: (logoUrl) => {
          updatePreferences.mutate({ custom_footer_logo_url: logoUrl });
        },
      });
    }
  };

  const handleRemoveFooterLogo = () => {
    updatePreferences.mutate({ custom_footer_logo_url: null });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Appearance Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your brand colors, fonts, and logo across the entire platform
          </p>
        </div>

        {/* Header Logo Upload Section */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Header Logo</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your logo for the header navigation (top of all pages).
                <br />
                <strong>Supported formats:</strong> JPG, PNG, SVG, WebP (Max 5MB)
                <br />
                <strong>Recommended size:</strong> 180×60px (compact, horizontal logo)
              </p>

              {effectivePrefs.custom_logo_url && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="relative h-16 w-32 flex items-center justify-center">
                    <Image
                      src={effectivePrefs.custom_logo_url}
                      alt="Custom header logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Header Logo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {effectivePrefs.custom_logo_url.split('/').pop()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={updatePreferences.isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  leftIcon={<Upload className="h-5 w-5" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                  isLoading={uploadLogo.isPending}
                >
                  {effectivePrefs.custom_logo_url ? 'Change Header Logo' : 'Upload Header Logo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Homepage Hero Logo Upload Section */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Homepage Hero Logo</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your logo for the main homepage display (the large logo visitors see first).
                This can be your full featured Gorilla Smash Club logo with all details.
                <br />
                <strong>Supported formats:</strong> JPG, PNG, SVG, WebP (Max 5MB)
                <br />
                <strong>Recommended size:</strong> 800×400px or larger (can be detailed, full-featured logo)
              </p>

              {effectivePrefs.custom_hero_logo_url && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="relative h-20 w-40 flex items-center justify-center">
                    <Image
                      src={effectivePrefs.custom_hero_logo_url}
                      alt="Custom hero logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Homepage Logo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {effectivePrefs.custom_hero_logo_url.split('/').pop()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveHeroLogo}
                    disabled={updatePreferences.isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleHeroLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  leftIcon={<ImageIcon className="h-5 w-5" />}
                  onClick={() => heroFileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                  isLoading={uploadLogo.isPending}
                >
                  {effectivePrefs.custom_hero_logo_url ? 'Change Homepage Logo' : 'Upload Homepage Logo'}
                </Button>
              </div>
              
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Use your full Gorilla Smash Club logo with the gorilla character and paddles for maximum impact on the homepage!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Logo Upload Section */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Footer Logo</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload your logo for the footer (bottom of all pages).
                This can be a simplified version or the same as your header/hero logo.
                <br />
                <strong>Supported formats:</strong> JPG, PNG, SVG, WebP (Max 5MB)
                <br />
                <strong>Recommended size:</strong> 240×80px (medium size, horizontal)
              </p>

              {effectivePrefs.custom_footer_logo_url && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="relative h-16 w-32 flex items-center justify-center">
                    <Image
                      src={effectivePrefs.custom_footer_logo_url}
                      alt="Custom footer logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Footer Logo</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {effectivePrefs.custom_footer_logo_url.split('/').pop()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFooterLogo}
                    disabled={updatePreferences.isPending}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={footerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleFooterLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  leftIcon={<Upload className="h-5 w-5" />}
                  onClick={() => footerFileInputRef.current?.click()}
                  disabled={uploadLogo.isPending}
                  isLoading={uploadLogo.isPending}
                >
                  {effectivePrefs.custom_footer_logo_url ? 'Change Footer Logo' : 'Upload Footer Logo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Font Colors - Light Mode */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Font Colors (Light Mode)</CardTitle>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <ColorPicker
                label="Primary Font"
                value={formData.primary_font_color}
                onChange={(val) => handleColorChange('primary_font_color', val)}
                description="Main text color"
                defaultValue={defaults.light.primary_font_color}
                onReset={() => handleResetColor('primary_font_color', defaults.light.primary_font_color)}
              />
              <ColorPicker
                label="Secondary Font"
                value={formData.secondary_font_color}
                onChange={(val) => handleColorChange('secondary_font_color', val)}
                description="Descriptive text"
                defaultValue={defaults.light.secondary_font_color}
                onReset={() => handleResetColor('secondary_font_color', defaults.light.secondary_font_color)}
              />
              <ColorPicker
                label="Heading Font"
                value={formData.heading_font_color}
                onChange={(val) => handleColorChange('heading_font_color', val)}
                description="Titles and headers"
                defaultValue={defaults.light.heading_font_color}
                onReset={() => handleResetColor('heading_font_color', defaults.light.heading_font_color)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Font Colors - Dark Mode */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Font Colors (Dark Mode)</CardTitle>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <ColorPicker
                label="Primary Font"
                value={formData.dark_primary_font_color}
                onChange={(val) => handleColorChange('dark_primary_font_color', val)}
                description="Main text color"
                defaultValue={defaults.dark.dark_primary_font_color}
                onReset={() => handleResetColor('dark_primary_font_color', defaults.dark.dark_primary_font_color)}
              />
              <ColorPicker
                label="Secondary Font"
                value={formData.dark_secondary_font_color}
                onChange={(val) => handleColorChange('dark_secondary_font_color', val)}
                description="Descriptive text"
                defaultValue={defaults.dark.dark_secondary_font_color}
                onReset={() => handleResetColor('dark_secondary_font_color', defaults.dark.dark_secondary_font_color)}
              />
              <ColorPicker
                label="Heading Font"
                value={formData.dark_heading_font_color}
                onChange={(val) => handleColorChange('dark_heading_font_color', val)}
                description="Titles and headers"
                defaultValue={defaults.dark.dark_heading_font_color}
                onReset={() => handleResetColor('dark_heading_font_color', defaults.dark.dark_heading_font_color)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Background Colors - Light Mode */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Background Colors (Light Mode)</CardTitle>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ColorPicker
                label="Primary Background"
                value={formData.primary_bg_color}
                onChange={(val) => handleColorChange('primary_bg_color', val)}
                description="Main background"
                defaultValue={defaults.light.primary_bg_color}
                onReset={() => handleResetColor('primary_bg_color', defaults.light.primary_bg_color)}
              />
              <ColorPicker
                label="Secondary Background"
                value={formData.secondary_bg_color}
                onChange={(val) => handleColorChange('secondary_bg_color', val)}
                description="Cards and sections"
                defaultValue={defaults.light.secondary_bg_color}
                onReset={() => handleResetColor('secondary_bg_color', defaults.light.secondary_bg_color)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Background Colors - Dark Mode */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Background Colors (Dark Mode)</CardTitle>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ColorPicker
                label="Primary Background"
                value={formData.dark_primary_bg_color}
                onChange={(val) => handleColorChange('dark_primary_bg_color', val)}
                description="Main background"
                defaultValue={defaults.dark.dark_primary_bg_color}
                onReset={() => handleResetColor('dark_primary_bg_color', defaults.dark.dark_primary_bg_color)}
              />
              <ColorPicker
                label="Secondary Background"
                value={formData.dark_secondary_bg_color}
                onChange={(val) => handleColorChange('dark_secondary_bg_color', val)}
                description="Cards and sections"
                defaultValue={defaults.dark.dark_secondary_bg_color}
                onReset={() => handleResetColor('dark_secondary_bg_color', defaults.dark.dark_secondary_bg_color)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Optional Accent Colors */}
        <Card className="mb-6" padding="lg">
          <CardTitle>Additional Brand Colors (Optional)</CardTitle>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ColorPicker
                label="Custom Accent Color"
                value={formData.custom_accent_color}
                onChange={(val) => handleColorChange('custom_accent_color', val)}
                description="Highlights and CTAs"
                optional
              />
              <ColorPicker
                label="Custom Primary Color"
                value={formData.custom_primary_color}
                onChange={(val) => handleColorChange('custom_primary_color', val)}
                description="Primary actions"
                optional
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            leftIcon={<RotateCcw className="h-5 w-5" />}
            onClick={handleReset}
            disabled={updatePreferences.isPending}
          >
            Reset All to Defaults
          </Button>
          <Button
            variant="primary"
            leftIcon={<Save className="h-5 w-5" />}
            onClick={handleSave}
            isLoading={updatePreferences.isPending}
            disabled={updatePreferences.isPending}
          >
            Save Changes
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            💡 Color Customization Tips
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Each color has an individual <strong>Reset</strong> button to restore its default value</li>
            <li>• Light mode colors are automatically used in light theme</li>
            <li>• Dark mode colors are automatically used in dark theme</li>
            <li>• Click the checkmark (✓) indicator when a color is at its default</li>
            <li>• Use <strong>Reset All to Defaults</strong> to restore all colors at once</li>
            <li>• Don't forget to click <strong>Save Changes</strong> after customization!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Color Picker Component
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  optional?: boolean;
  defaultValue?: string;
  onReset?: () => void;
}

function ColorPicker({ label, value, onChange, description, optional, defaultValue, onReset }: ColorPickerProps) {
  const isDefault = defaultValue && value === defaultValue;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          {label} {optional && <span className="text-gray-400 dark:text-gray-500">(Optional)</span>}
        </label>
        {defaultValue && onReset && !isDefault && (
          <button
            onClick={onReset}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
        {isDefault && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Default
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      <div className="flex gap-3 items-center">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          pattern="^#[0-9A-Fa-f]{6}$"
          className="flex-1 font-mono uppercase"
        />
      </div>
    </div>
  );
}

