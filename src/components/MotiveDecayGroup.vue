<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { motiveDecaySettings, motiveDecayDescription } from '@/lib/motive-decay'
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

const entries = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return motiveDecaySettings.flatMap(item => {
    const meta = settings.get(item.key)
    return meta ? [{ ...item, meta }] : []
  })
})
</script>

<template>
  <section
    :id="id"
    data-motive-decay-group
    class="min-w-0 space-y-5"
    :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined"
    :aria-label="showHeading === false ? 'Motive Decay' : undefined"
  >
    <header v-if="showHeading !== false" class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Motive Decay</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">{{ motiveDecayDescription }}</p>
    </header>

    <div class="grid min-w-0 gap-4 md:grid-cols-2">
      <article
        v-for="entry in entries"
        v-show="visibleKeys.has(entry.key)"
        :key="entry.key"
        :data-setting="entry.key"
        class="min-w-0 space-y-4 rounded-xl bg-muted/15 px-4 py-5"
      >
        <div class="flex min-w-0 items-start justify-between gap-3">
          <div class="min-w-0 space-y-2">
            <label :for="`setting-${encodeURIComponent(entry.key)}`" class="block text-sm font-medium">{{ entry.label }}</label>
            <code class="inline-block max-w-full break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ entry.key }}</code>
          </div>
          <Button
            v-if="changedKeys.has(entry.key) || errors[entry.key]"
            type="button"
            variant="ghost"
            size="xs"
            :aria-label="`Undo ${entry.meta.label}`"
            @click="emit('undo', entry.key)"
          >Undo</Button>
        </div>

        <SettingControl
          :key="`${entry.key}:${resetVersions[entry.key] ?? 0}`"
          :meta="entry.meta"
          :model-value="values[entry.key]!"
          @update:model-value="emit('update', entry.key, $event)"
          @error="emit('error', entry.key, $event)"
        />
      </article>
    </div>
  </section>
</template>
