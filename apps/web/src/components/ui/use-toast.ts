"use client"

import { useState } from "react"

// Define types for toast data
export type ToastProps = {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

interface UseToastReturn {
  toast: (props: ToastProps) => void
  dismiss: (id: string) => void
  toasts: ToastProps[]
}

// Generate a unique ID for each toast
const generateUniqueId = () => Math.random().toString(36).substring(2, 9)

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  // Add a new toast
  const toast = (props: ToastProps) => {
    const id = props.id || generateUniqueId()
    const newToast = { ...props, id, duration: props.duration || 5000 }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto-dismiss after duration
    setTimeout(() => {
      dismiss(id)
    }, newToast.duration)
  }
  
  // Remove a toast by ID
  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }
  
  return {
    toast,
    dismiss,
    toasts
  }
}

// Create a ToastProvider component that will be used to wrap the app
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return children
} 