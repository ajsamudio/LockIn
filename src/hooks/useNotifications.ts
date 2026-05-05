import { useCallback, useRef } from 'react'

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  )

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted'
      return
    }
    if (Notification.permission === 'denied') return
    const result = await Notification.requestPermission()
    permissionRef.current = result
  }, [])

  const notify = useCallback(async (title: string, body: string) => {
    if (typeof Notification === 'undefined') return
    if (permissionRef.current !== 'granted') return

    const options = {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'lockin-timer',
      renotify: true,
    }

    // Use SW notification so it works even in background tabs
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification(title, options)
        return
      } catch {
        // fall through
      }
    }

    new Notification(title, options)
  }, [])

  return { requestPermission, notify }
}
