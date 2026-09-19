<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { generalRelationshipKeys } from '@/lib/relationship-settings'
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
}>()
const emit = defineEmits<{
  update: [key: string, value: JsonValue]
  error: [key: string, message: string | null]
  undo: [key: string]
}>()

const entries = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return [...generalRelationshipKeys].flatMap(key => settings.has(key) ? [settings.get(key)!] : [])
})
function defaultLabel(setting: SettingMeta) {
  return setting.defaultLabel
    ?? setting.options?.find(option => option.value === String(setting.defaultValue))?.label
    ?? String(setting.defaultValue)
}
</script>

<template>
  <section
    v-show="entries.some(setting => visibleKeys.has(setting.key))"
    :id="id"
    data-relationship-settings-group
    class="min-w-0 space-y-5"
    :aria-labelledby="`${id}-heading`"
  >
    <header class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">General relationships</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">Configure relationship culling, teen parenting, and how friendships and romances grow or decay.</p>
    </header>

    <div class="grid min-w-0 gap-4 md:grid-cols-2">
      <article
        v-for="setting in entries"
        v-show="visibleKeys.has(setting.key)"
        :key="setting.key"
        :data-setting="setting.key"
        class="min-w-0 space-y-3 rounded-xl bg-muted/15 px-4 py-5"
      >
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0 space-y-2">
            <label :for="`setting-${encodeURIComponent(setting.key)}`" class="block text-sm font-medium">{{ setting.label }}</label>
            <code class="inline-block max-w-full break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ setting.key }}</code>
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

        <p class="text-xs leading-relaxed text-muted-foreground">{{ setting.description }}</p>

        <SettingControl
          :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
          :meta="setting"
          :model-value="values[setting.key]!"
          @update:model-value="emit('update', setting.key, $event)"
          @error="emit('error', setting.key, $event)"
        />

        <p v-if="setting.defaultLabel !== undefined || setting.defaultValue !== undefined" class="text-xs text-muted-foreground">Default: {{ defaultLabel(setting) }}</p>
      </article>
    </div>
  </section>
</template>
