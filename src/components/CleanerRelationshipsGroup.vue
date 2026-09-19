<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { cleanerRelationshipKeys } from '@/lib/cleaner-settings'
import { Button } from '@/components/ui/button'
import SettingControl from './SettingControl.vue'

const props = withDefaults(defineProps<{
  settings: SettingMeta[]
  values: SettingsRecord
  visibleKeys: Set<string>
  changedKeys: Set<string>
  errors: Record<string, string>
  resetVersions: Record<string, number>
  id: string
  showHeading?: boolean
}>(), { showHeading: true })
const emit = defineEmits<{
  update: [key: string, value: JsonValue]
  error: [key: string, message: string | null]
  undo: [key: string]
}>()

const entries = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return [...cleanerRelationshipKeys].flatMap(key =>
    settings.has(key) && Object.hasOwn(props.values, key) ? [settings.get(key)!] : [],
  )
})
const hasVisibleSettings = computed(() => entries.value.some(setting => props.visibleKeys.has(setting.key)))
</script>

<template>
  <section
    v-show="hasVisibleSettings"
    :id="id"
    data-cleaner-relationships-group
    class="min-w-0 space-y-5"
    :aria-labelledby="showHeading ? `${id}-heading` : undefined"
    :aria-label="showHeading ? undefined : 'Relationship Cleaner'"
  >
    <header v-if="showHeading">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Relationship Cleaner</h3>
    </header>

    <div class="grid min-w-0 gap-x-8 gap-y-6 rounded-xl bg-muted/15 p-4 sm:p-5 md:grid-cols-2">
      <article
        v-for="setting in entries"
        v-show="visibleKeys.has(setting.key)"
        :key="setting.key"
        :data-setting="setting.key"
        class="min-w-0 space-y-3"
        :class="setting.key === 'Cleaner_LeaveRelationshipCount' ? 'md:col-span-2' : ''"
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
      </article>
    </div>
  </section>
</template>
