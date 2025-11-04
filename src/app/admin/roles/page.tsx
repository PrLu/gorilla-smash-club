'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Roles Management Page
 * Assign and manage user roles
 * Requires super_admin role
 */
export default function RolesPage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('organizer');

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
    { value: 'organizer', label: 'Organizer', description: 'Create and manage tournaments' },
    { value: 'referee', label: 'Referee', description: 'Update match scores' },
    { value: 'finance', label: 'Finance', description: 'Manage financials and payouts' },
    { value: 'support', label: 'Support', description: 'View audit logs and assist users' },
  ];

  const handleAssignRole = async () => {
    if (!searchEmail || !selectedRole) {
      toast.error('Please enter email and select a role');
      return;
    }

    toast.success('Role assignment coming soon - Phase 3 implementation');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
          Role Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Assign and manage user permissions
        </p>
      </div>

      {/* Assign Role Form */}
      <Card padding="lg" className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Assign Role to User
        </h2>

        <div className="space-y-4">
          <Input
            label="User Email"
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="user@example.com"
            helperText="Search by email to find user"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Role
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-1 h-4 w-4 text-primary-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {role.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleAssignRole}
            leftIcon={<UserPlus className="h-5 w-5" />}
            className="w-full"
          >
            Assign Role
          </Button>
        </div>
      </Card>

      {/* Current Role Assignments */}
      <Card padding="lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Current Role Assignments
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Role listing coming soon - will show all assigned roles with revoke options
        </p>
      </Card>
    </div>
  );
}

