<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { appearanceLimitColumns } from '@/lib/appearance-limits'
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

const columns = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return appearanceLimitColumns.map(column => ({
    ...column,
    entries: column.keys.flatMap(key => settings.has(key) ? [settings.get(key)!] : []),
  }))
})
</script>

<template>
  <section
    v-show="columns.some(column => column.entries.some(setting => visibleKeys.has(setting.key)))"
    :id="id"
    data-appearance-limits-group
    class="min-w-0 space-y-5"
    :aria-labelledby="showHeading ? `${id}-heading` : undefined"
    :aria-label="showHeading ? undefined : 'Fit/Fat limits'"
  >
    <header v-if="showHeading">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Fit/Fat limits</h3>
    </header>

    <div class="appearance-limits-columns grid min-w-0 gap-4">
      <section
        v-for="column in columns"
        v-show="column.entries.some(setting => visibleKeys.has(setting.key))"
        :key="column.id"
        :data-appearance-limit-column="column.id"
        class="appearance-limits-column grid min-w-0 gap-4"
        :aria-labelledby="`${id}-${column.id}-heading`"
      >
        <h4 :id="`${id}-${column.id}-heading`" class="text-sm font-semibold">{{ column.label }}</h4>

        <article
          v-for="setting in column.entries"
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
        </article>
      </section>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 768px) {
  .appearance-limits-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .appearance-limits-column { grid-template-rows: subgrid; grid-row: span 3; }
}
</style>
