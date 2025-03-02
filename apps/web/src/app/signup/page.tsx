"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SignUpPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && userId) {
      router.push('/dashboard');
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen -mt-16">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join AI Hedge Fund and get access to institutional-grade insights</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <SignUp redirectUrl="/dashboard" />
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 