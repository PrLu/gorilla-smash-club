'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';
import { Mail, Lock, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/motion';

/**
 * Redesigned sign-in page
 * Includes password and magic link options
 */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }

    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('✉️ Check your email for the magic link!');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card padding="lg" variant="elevated">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="h-5 w-5" />}
              placeholder="your@email.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-5 w-5" />}
              placeholder="••••••••"
            />

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-sm text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleMagicLink}
            disabled={loading || !email}
            leftIcon={<Send className="h-5 w-5" />}
            className="w-full"
          >
            Send Magic Link
          </Button>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to home
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
