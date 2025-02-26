"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="font-bold text-2xl text-blue-600 dark:text-blue-400">
            AI Hedge Fund
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/alerts" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Alerts
          </Link>
          <Link href="/stocks" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            Stocks
          </Link>
          <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
            About
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <SignedIn>
            <Link href="/preferences">
              <Button variant="outline" size="sm" className="hidden md:block">
                My Account
              </Button>
            </Link>
            <div className="hidden md:block">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          
          <SignedOut>
            <div className="hidden md:block">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Log In
                </Button>
              </SignInButton>
            </div>
            <div className="hidden md:block">
              <SignUpButton mode="modal">
                <Button size="sm">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12"></line>
                  <line x1="4" x2="20" y1="6" y2="6"></line>
                  <line x1="4" x2="20" y1="18" y2="18"></line>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-6">
                <Link href="/dashboard" className="text-xl font-medium" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/alerts" className="text-xl font-medium" onClick={() => setIsOpen(false)}>
                  Alerts
                </Link>
                <Link href="/stocks" className="text-xl font-medium" onClick={() => setIsOpen(false)}>
                  Stocks
                </Link>
                <Link href="/about" className="text-xl font-medium" onClick={() => setIsOpen(false)}>
                  About
                </Link>
                
                <div className="border-t pt-4 mt-2">
                  <SignedIn>
                    <Link href="/preferences" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full mb-2">
                        My Account
                      </Button>
                    </Link>
                    <div className="flex justify-center mt-4">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                  
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full mb-2" onClick={() => setIsOpen(false)}>
                        Log In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full" onClick={() => setIsOpen(false)}>
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 