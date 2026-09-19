<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { autosaveBlocks } from '@/lib/autosave'
import { Button } from '@/components/ui/button'
import SettingControl from './SettingControl.vue'

const props = defineProps<{
  settings: SettingMeta[]
  values: SettingsRecord
  visibleKeys: Set<string>
  changedKeys: Set<string>
  errors: Record<string, string>
  resetVersions: Record<string, number>
  id: string
  showHeading?: boolean
}>()
const emit = defineEmits<{
  update: [key: string, value: JsonValue]
  error: [key: string, message: string | null]
  undo: [key: string]
}>()

const enabledKey = 'Autosave_Enabled'
const autosaveOff = computed(() => props.values[enabledKey] === false)
const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return autosaveBlocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key => settings.has(key) ? [settings.get(key)!] : []),
  }))
})
const showContextEnable = computed(() => autosaveOff.value && !props.visibleKeys.has(enabledKey)
  && props.settings.some(setting => setting.key === enabledKey))
const intervalUnit = computed(() => {
  switch (props.values.Autosave_IntervalType) {
    case 'RH': return 'real hours'
    case 'SD': return 'Sim days'
    case 'SH': return 'Sim hours'
    default: return undefined
  }
})
const intervalHelp = computed(() => props.values.Autosave_IntervalType === 'PM'
  ? 'Pre-Midnight Alarm saves before midnight each Sim night, before MCCC alarms run. The interval amount is not used.'
  : null)

function isDisabled(key: string) {
  return autosaveOff.value && key !== enabledKey
}
function controlMeta(setting: SettingMeta): SettingMeta {
  return setting.key === 'Autosave_IntervalAmount' && intervalUnit.value
    ? { ...setting, unit: intervalUnit.value }
    : setting
}
function visibleBlock(settings: SettingMeta[]) {
  return settings.some(setting => props.visibleKeys.has(setting.key))
}
</script>

<template>
  <section
    :id="id"
    data-autosave-group
    class="min-w-0 space-y-6"
    :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined"
    :aria-label="showHeading === false ? 'Auto-Save' : undefined"
  >
    <header v-if="showHeading !== false" class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Auto-Save</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">Choose when MCCC saves and how it names and rotates save slots.</p>
    </header>

    <div v-if="autosaveOff" :id="`${id}-disabled-help`" class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 px-4 py-3">
      <p class="text-sm leading-relaxed text-muted-foreground">Auto-save is off. Turn it on to adjust the options below. Your settings are kept.</p>
      <Button v-if="showContextEnable" type="button" variant="secondary" size="sm" @click="emit('update', enabledKey, true)">Turn on auto-save</Button>
    </div>

    <section
      v-for="block in blocks"
      v-show="visibleBlock(block.settings)"
      :key="block.id"
      :data-autosave-block="block.id"
      :aria-labelledby="`${id}-${block.id}-heading`"
      class="min-w-0 space-y-5 rounded-xl bg-muted/15 p-4 sm:p-5"
    >
      <h4 :id="`${id}-${block.id}-heading`" class="text-sm font-semibold">{{ block.label }}</h4>
      <div class="grid min-w-0 gap-x-8 gap-y-6" :class="block.id === 'settings' ? 'lg:grid-cols-3' : 'md:grid-cols-2'">
        <article
          v-for="setting in block.settings"
          v-show="visibleKeys.has(setting.key)"
          :key="setting.key"
          :data-setting="setting.key"
          class="min-w-0 space-y-3"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0 space-y-1.5">
              <label :for="`setting-${encodeURIComponent(setting.key)}`" class="block font-medium" :class="setting.key === enabledKey ? 'text-base' : 'text-sm'">{{ setting.label }}</label>
              <code class="block break-all text-[10px] leading-relaxed text-muted-foreground">{{ setting.key }}</code>
            </div>
            <Button
              v-if="changedKeys.has(setting.key) || errors[setting.key]"
              type="button"
              variant="ghost"
              size="xs"
              :aria-label="`Undo ${setting.label}`"
              @click="emit('undo', setting.key)"
            >Undo</Button>
          </div>

          <fieldset
            class="min-w-0"
            :disabled="isDisabled(setting.key)"
            :aria-disabled="isDisabled(setting.key) || undefined"
            :aria-describedby="isDisabled(setting.key) ? `${id}-disabled-help` : undefined"
          >
            <SettingControl
              :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
              :meta="controlMeta(setting)"
              :model-value="values[setting.key]!"
              :disabled="isDisabled(setting.key)"
              @update:model-value="emit('update', setting.key, $event)"
              @error="emit('error', setting.key, $event)"
            />
          </fieldset>

          <p v-if="setting.key !== 'Autosave_ShowConfirmation'" class="text-xs leading-relaxed text-muted-foreground">{{ setting.description }}</p>
          <div v-else class="space-y-1 rounded-lg bg-warning-background px-3 py-2.5 text-xs leading-relaxed text-warning">
            <p class="font-medium">{{ setting.impact?.title ?? 'May interrupt play' }}</p>
            <p>{{ setting.impact?.description ?? 'Shows a confirmation dialog at each auto-save, allowing you to continue or cancel that save.' }}</p>
          </div>
        </article>
      </div>
      <p v-if="block.id === 'interval' && intervalHelp" class="text-xs leading-relaxed text-muted-foreground">{{ intervalHelp }}</p>
    </section>
  </section>
</template>
