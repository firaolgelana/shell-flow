"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "../../../../../shared/components/ui/button"
import { useAuth } from "../../AuthProvider"
import { authRepository } from "../../../infrastructure"

export function VerifyEmail() {
    const [isResending, setIsResending] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // If user is already verified, redirect to profile
        if (user?.emailVerified) {
            router.push("/profile")
        }
    }, [user, router])

    const handleResendVerification = async () => {
        if (!user) return

        setIsResending(true)
        setMessage(null)

        try {
            await authRepository.sendEmailVerification(user)
            setMessage({ type: "success", text: "Verification email sent! Check your inbox." })
        } catch (err) {
            if (err instanceof Error) {
                setMessage({ type: "error", text: err.message })
            } else {
                setMessage({ type: "error", text: "Failed to send verification email" })
            }
        } finally {
            setIsResending(false)
        }
    }

    const handleCheckVerification = async () => {
        setIsChecking(true)
        setMessage(null)

        try {
            // TODO: Implement Supabase email verification check
            // Supabase handles email verification differently via magic links
            setMessage({ type: "error", text: "Please check your email and click the verification link. The page will auto-refresh once verified." })
        } catch (err) {
            if (err instanceof Error) {
                setMessage({ type: "error", text: err.message })
            } else {
                setMessage({ type: "error", text: "Failed to check verification status" })
            }
        } finally {
            setIsChecking(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Verify Your Email</h1>
                    <p className="text-muted-foreground">
                        We've sent a verification link to <span className="font-medium text-foreground">{user?.email}</span>
                    </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4">
                    {message && (
                        <div
                            className={`p-3 text-sm rounded-lg flex items-center gap-2 ${message.type === "success"
                                ? "text-green-700 bg-green-50 border border-green-200"
                                : "text-red-700 bg-red-50 border border-red-200"
                                }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4" />
                            ) : (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Please check your email and click the verification link to continue.
                        </p>

                        <Button
                            onClick={handleCheckVerification}
                            disabled={isChecking}
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            {isChecking ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    I've Verified My Email
                                </>
                            )}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleResendVerification}
                            disabled={isResending}
                            variant="outline"
                            className="w-full h-11 font-medium"
                        >
                            {isResending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="w-4 h-4 mr-2" />
                                    Resend Verification Email
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Wrong email?{" "}
                        <button
                            onClick={() => {
                                authRepository.signOut()
                                router.push("/sign-up")
                            }}
                            className="text-primary hover:underline font-medium"
                        >
                            Sign up again
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail
