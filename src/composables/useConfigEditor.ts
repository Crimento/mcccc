import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import exampleText from '../../mc_settings.cfg?raw'
import { changedKeys, cloneConfig, parseConfig, serializeConfig, type JsonValue, type SettingsRecord } from '@/lib/config'

const draftKey = 'mccc-configurator.draft.v1'
type Draft = { original: SettingsRecord; current: SettingsRecord; name: string; example: boolean; savedAt: string }

export function useConfigEditor() {
  const original = ref(parseConfig(exampleText))
  const current = ref(cloneConfig(original.value))
  const fileName = ref('Example configuration')
  const isExample = ref(true)
  const epoch = ref(0)
  const errors = reactive<Record<string, string>>({})
  const availableDraft = ref<Draft | null>(null)
  const draftStatus = ref('Changes stay in this browser')
  const changes = computed(() => changedKeys(original.value, current.value))
  const changedSet = computed(() => new Set(changes.value))
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let savePending = false

  try {
    const stored = localStorage.getItem(draftKey)
    if (stored) {
      const candidate = JSON.parse(stored) as Draft
      if (typeof candidate.name === 'string' && typeof candidate.example === 'boolean') {
        candidate.original = parseConfig(JSON.stringify(candidate.original))
        candidate.current = parseConfig(JSON.stringify(candidate.current))
        availableDraft.value = candidate
      }
    }
  } catch { /* An unavailable or old browser draft must not prevent file import. */ }

  function saveDraft() {
    if (!savePending) return
    clearTimeout(saveTimer)
    try {
      const draft: Draft = { original: original.value, current: current.value, name: fileName.value, example: isExample.value, savedAt: new Date().toISOString() }
      localStorage.setItem(draftKey, JSON.stringify(draft))
      draftStatus.value = 'Draft saved in this browser'
      savePending = false
    } catch {
      draftStatus.value = 'Browser storage unavailable — download to keep changes'
    }
  }

  watch([current, original, fileName, isExample], () => {
    clearTimeout(saveTimer)
    savePending = true
    draftStatus.value = 'Saving draft…'
    saveTimer = setTimeout(saveDraft, 350)
  }, { deep: true })

  function clearErrors() {
    for (const key of Object.keys(errors)) delete errors[key]
  }

  function load(config: SettingsRecord, name: string, example = false) {
    original.value = cloneConfig(config)
    current.value = cloneConfig(config)
    fileName.value = name
    isExample.value = example
    availableDraft.value = null
    clearErrors()
    epoch.value++
  }

  function update(key: string, value: JsonValue) {
    current.value[key] = value
  }

  function resetAll() {
    current.value = cloneConfig(original.value)
    clearErrors()
    epoch.value++
  }

  function resumeDraft() {
    const draft = availableDraft.value
    if (!draft) return
    load(draft.original, draft.name, draft.example)
    current.value = cloneConfig(draft.current)
  }

  function discardDraft() {
    availableDraft.value = null
    try { localStorage.removeItem(draftKey) } catch { /* File export remains available. */ }
  }

  function download(config: SettingsRecord, name = 'mc_settings.cfg') {
    const blob = new Blob([serializeConfig(config)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    saveDraft()
    if (Object.keys(errors).length || (savePending && changes.value.length)) event.preventDefault()
  }
  window.addEventListener('beforeunload', beforeUnload)
  window.addEventListener('pagehide', saveDraft)
  onBeforeUnmount(() => {
    saveDraft()
    window.removeEventListener('beforeunload', beforeUnload)
    window.removeEventListener('pagehide', saveDraft)
  })

  return { original, current, fileName, isExample, epoch, errors, availableDraft, draftStatus, changes, changedSet, load, update, resetAll, resumeDraft, discardDraft, download }
}
