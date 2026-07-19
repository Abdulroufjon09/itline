import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

function readStored(): Theme {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  // Birinchi kirishda tizim sozlamasiga ergashamiz
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function apply(value: Theme) {
  document.documentElement.setAttribute('data-theme', value)
}

const theme = ref<Theme>(readStored())

watch(theme, (val) => {
  localStorage.setItem('theme', val)
  apply(val)
})

// Modul yuklanishi bilan qo'llanadi (main.ts uni ilova boshida import qiladi)
apply(theme.value)

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggleTheme }
}
