// Notifications navigateur : points gagnés, rappels de coup d'envoi.

const PREF_KEY = 'redioncup-notifications'

export function notificationsSupported() {
  return typeof Notification !== 'undefined'
}

export function notificationsEnabled() {
  return (
    notificationsSupported() &&
    Notification.permission === 'granted' &&
    localStorage.getItem(PREF_KEY) === 'on'
  )
}

export async function enableNotifications() {
  if (!notificationsSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    localStorage.setItem(PREF_KEY, 'on')
    return true
  }
  return false
}

export function disableNotifications() {
  localStorage.setItem(PREF_KEY, 'off')
}

export function notify(title, body) {
  if (!notificationsEnabled()) return
  new Notification(title, { body, icon: undefined, badge: undefined })
}
