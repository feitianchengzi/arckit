import { useEffect } from 'react'
import { useToast, setToastHandler } from './Toast'

export function ToastHost() {
  const { showToast, toastComponent } = useToast()

  useEffect(() => {
    setToastHandler(showToast)
    return () => setToastHandler(null)
  }, [showToast])

  return toastComponent
}
