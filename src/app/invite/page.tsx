'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle, Mail, Trophy } from 'lucide-react';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const token = searchParams?.get('token');
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For signup flow
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (token) {
      validateInvitation(token);
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const validateInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invite/accept?token=${token}`);
      const result = await response.json();

      if (!response.ok || !result.valid) {
        setError(result.error || 'Invalid or expired invitation');
      } else {
        setInvitation(result.invitation);
      }
    } catch (err: any) {
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      if (result.requiresAuth) {
        setShowSignup(true);
        setAccepting(false);
        return;
      }

      toast.success('Invitation accepted successfully!');
      router.push(`/tournament/${result.tournament.id}`);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleSignUpAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setAccepting(true);

    try {
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: name,
        });

        // Now accept the invitation
        await handleAccept();
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <XCircle className="mx-auto h-16 w-16 text-red-600" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Invalid Invitation</h1>
          <p className="mt-2 text-gray-600">{error || 'This invitation is no longer valid.'}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // User already logged in
  if (user && !showSignup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <Trophy className="mx-auto h-16 w-16 text-primary-600" />
          <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Tournament Invitation
          </h1>

          <div className="mt-6 rounded-lg bg-primary-50 p-4">
            <h2 className="font-semibold text-primary-900">{invitation.tournament.title}</h2>
            <p className="mt-1 text-sm text-primary-700">
              📍 {invitation.tournament.location}
            </p>
            <p className="text-sm text-primary-700">
              📅 {invitation.tournament_date}
            </p>
          </div>

          <p className="mt-4 text-center text-gray-600">
            You've been invited by <strong>{invitation.display_name}</strong>
          </p>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="mt-6 w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <Link
            href="/dashboard"
            className="mt-4 block text-center text-sm text-gray-600 hover:text-gray-800"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // User not logged in - show signup/signin options
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <Trophy className="mx-auto h-16 w-16 text-primary-600" />
        <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">You're Invited!</h1>

        <div className="mt-6 rounded-lg bg-primary-50 p-4">
          <h2 className="font-semibold text-primary-900">{invitation.tournament.title}</h2>
          <p className="mt-1 text-sm text-primary-700">📍 {invitation.tournament.location}</p>
          <p className="text-sm text-primary-700">📅 {invitation.tournament_date}</p>
        </div>

        <p className="mt-4 text-center text-gray-600">
          To accept this invitation, please create an account or sign in
        </p>

        {!showSignup ? (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setShowSignup(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Mail className="h-5 w-5" />
              Sign Up & Accept
            </button>

            <Link
              href={`/auth/signin?redirect=/invite?token=${token}`}
              className="block w-full rounded-lg border-2 border-primary-600 px-6 py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-primary-50"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignUpAndAccept} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={invitation.email}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="w-full rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {accepting ? 'Creating Account...' : 'Create Account & Accept'}
            </button>

            <button
              type="button"
              onClick={() => setShowSignup(false)}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to options
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

