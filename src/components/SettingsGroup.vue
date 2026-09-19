<script setup lang="ts">
import { computed } from 'vue'
import type { AdditionalSettingGroup } from '@/lib/additional-setting-groups'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { Button } from '@/components/ui/button'
import SettingControl from './SettingControl.vue'

const props = withDefaults(defineProps<{
  group: AdditionalSettingGroup
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

const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return props.group.blocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key =>
      settings.has(key) && Object.hasOwn(props.values, key) ? [settings.get(key)!] : [],
    ),
  }))
})
const hasVisibleSettings = computed(() => blocks.value.some(block =>
  block.settings.some(setting => props.visibleKeys.has(setting.key)),
))
const showGroupHeading = computed(() => props.showHeading && blocks.value.length > 1)
const showBlockHeadings = computed(() => props.showHeading || blocks.value.length > 1)

function defaultLabel(setting: SettingMeta): string {
  return setting.defaultLabel
    ?? setting.options?.find(option => option.value === String(setting.defaultValue))?.label
    ?? setting.valueLabels?.[String(setting.defaultValue)]
    ?? (typeof setting.defaultValue === 'boolean'
      ? setting.defaultValue ? 'Enabled' : 'Disabled'
      : String(setting.defaultValue))
}
</script>

<template>
  <section
    v-show="hasVisibleSettings"
    :id="id"
    :data-settings-group="group.id"
    class="min-w-0 space-y-6"
    :aria-labelledby="showGroupHeading ? `${id}-heading` : undefined"
    :aria-label="showGroupHeading ? undefined : group.label"
  >
    <header v-if="showGroupHeading">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">{{ group.label }}</h3>
    </header>

    <section
      v-for="block in blocks"
      v-show="block.settings.some(setting => visibleKeys.has(setting.key))"
      :key="block.id"
      :data-settings-block="block.id"
      :aria-labelledby="showBlockHeadings ? `${id}-${block.id}-heading` : undefined"
      :aria-label="showBlockHeadings ? undefined : block.label"
      class="min-w-0 space-y-5 rounded-xl bg-muted/15 p-4 sm:p-5"
    >
      <h4 v-if="showBlockHeadings" :id="`${id}-${block.id}-heading`" class="text-sm font-semibold">{{ block.label }}</h4>

      <div class="grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-2">
        <article
          v-for="setting in block.settings"
          v-show="visibleKeys.has(setting.key)"
          :key="setting.key"
          :data-setting="setting.key"
          :data-impact="setting.impact?.level"
          class="min-w-0 space-y-3"
          :class="block.fullWidthKeys?.includes(setting.key) ? 'md:col-span-2' : undefined"
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
          <div v-if="setting.impact" class="space-y-1 rounded-lg bg-warning-background px-3 py-2 text-xs text-warning">
            <p class="text-[10px] font-medium uppercase tracking-wide">{{ setting.impact.level === 'interrupts' ? 'May interrupt play' : 'Gameplay impact' }}</p>
            <p class="font-medium">{{ setting.impact.title }}</p>
            <p class="leading-relaxed">{{ setting.impact.description }}</p>
          </div>

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
  </section>
</template>
