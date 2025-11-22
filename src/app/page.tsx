"use client"

import { useState } from "react"
import {SignIn} from "@/features/auth/presentation/pages/sign-in/sign-in";
import {SignUp} from "@/features/auth/presentation/pages/sign-up/sign-up";

export default function Home() {
  const [showSignUp, setShowSignUp] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {showSignUp ? (
        <div>
          <SignUp />
          <button
            onClick={() => setShowSignUp(false)}
            className="fixed top-4 left-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            View Sign In
          </button>
        </div>
      ) : (
        <div>
          <SignIn />
          <button
            onClick={() => setShowSignUp(true)}
            className="fixed top-4 left-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            View Sign Up
          </button>
        </div>
      )}
    </main>
  )
}
