<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { walkstyleColumns } from '@/lib/walkstyles'
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
  return walkstyleColumns.map(column => ({
    ...column,
    entries: column.profiles.flatMap(profile => {
      const meta = settings.get(profile.key)
      return meta ? [{ ...profile, meta }] : []
    }),
  }))
})
const visibleAges = computed(() => {
  const visible = new Set(columns.value.flatMap(column => column.entries
    .filter(profile => props.visibleKeys.has(profile.key)).map(profile => profile.label)))
  return [...new Set(walkstyleColumns.flatMap(column => column.profiles.map(profile => profile.label)))]
    .filter(label => visible.has(label))
})
</script>

<template>
  <section
    v-show="visibleAges.length > 0"
    :id="id"
    data-walkstyle-group
    class="min-w-0 space-y-5"
    :aria-labelledby="showHeading ? `${id}-heading` : undefined"
    :aria-label="showHeading ? undefined : 'Set Default Walkstyle'"
  >
    <header v-if="showHeading">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Set Default Walkstyle</h3>
    </header>

    <div class="walkstyle-columns grid min-w-0 gap-4" :style="{ '--walkstyle-rows': visibleAges.length + 1 }">
      <section
        v-for="column in columns"
        v-show="column.entries.some(profile => visibleKeys.has(profile.key))"
        :key="column.id"
        :data-walkstyle-column="column.id"
        class="walkstyle-column grid min-w-0 gap-4"
        :aria-labelledby="`${id}-${column.id}-heading`"
      >
        <h4 :id="`${id}-${column.id}-heading`" class="text-sm font-semibold">{{ column.label }}</h4>

        <article
          v-for="profile in column.entries"
          v-show="visibleKeys.has(profile.key)"
          :key="profile.key"
          :data-setting="profile.key"
          :style="{ '--walkstyle-row': visibleAges.indexOf(profile.label) + 2 }"
          class="walkstyle-profile min-w-0 space-y-3 rounded-xl bg-muted/15 px-4 py-5"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0 space-y-2">
              <label :for="`setting-${encodeURIComponent(profile.key)}`" class="block text-sm font-medium">{{ profile.label }}</label>
              <code class="inline-block max-w-full break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ profile.key }}</code>
            </div>
            <Button
              v-if="changedKeys.has(profile.key) || errors[profile.key]"
              type="button"
              variant="ghost"
              size="xs"
              :aria-label="`Undo ${profile.meta.label}`"
              @click="emit('undo', profile.key)"
            >Undo</Button>
          </div>

          <p class="text-xs leading-relaxed text-muted-foreground">{{ profile.meta.description }}</p>

          <SettingControl
            :key="`${profile.key}:${resetVersions[profile.key] ?? 0}`"
            :meta="profile.meta"
            :model-value="values[profile.key]!"
            @update:model-value="emit('update', profile.key, $event)"
            @error="emit('error', profile.key, $event)"
          />
        </article>
      </section>
    </div>
  </section>
</template>

<style scoped>
@media (min-width: 768px) {
  .walkstyle-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .walkstyle-column { grid-template-rows: subgrid; grid-row: span var(--walkstyle-rows); }
  .walkstyle-profile { grid-row: var(--walkstyle-row); }
}
</style>
