<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { offspringSettingBlocks, offspringGenders, isSettingsObject } from '@/lib/offspring-settings'
import { Button } from '@/components/ui/button'
import SettingControl from './SettingControl.vue'
import PercentageDistributionControl from './PercentageDistributionControl.vue'
import OffspringWeightsControl from './OffspringWeightsControl.vue'

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

const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return offspringSettingBlocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key =>
      settings.has(key) && Object.hasOwn(props.values, key) ? [settings.get(key)!] : [],
    ),
  }))
})
const hasVisibleSettings = computed(() => blocks.value.some(block =>
  block.settings.some(setting => props.visibleKeys.has(setting.key)),
))
function defaultLabel(setting: SettingMeta) {
  return setting.defaultLabel
    ?? setting.options?.find(option => option.value === String(setting.defaultValue))?.label
    ?? String(setting.defaultValue)
}
function updateGenders(value: number[]) {
  const current = props.values.Pregnancy_OffspringGenderPercents
  if (!isSettingsObject(current) || value.length !== 2) return
  emit('update', 'Pregnancy_OffspringGenderPercents', { ...current, M: value[0]!, F: value[1]! })
}
</script>

<template>
  <section
    v-show="hasVisibleSettings"
    :id="id"
    data-offspring-settings-group
    class="min-w-0 space-y-6"
    :aria-labelledby="showHeading ? `${id}-heading` : undefined"
    :aria-label="showHeading ? undefined : 'Offspring settings'"
  >
    <header v-if="showHeading">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Offspring settings</h3>
    </header>
    <section
      v-for="block in blocks"
      v-show="block.settings.some(setting => visibleKeys.has(setting.key))"
      :key="block.id"
      :data-offspring-block="block.id"
      :aria-labelledby="`${id}-${block.id}-heading`"
      class="min-w-0 space-y-5 rounded-xl bg-muted/15 p-4 sm:p-5"
    >
      <h4 :id="`${id}-${block.id}-heading`" class="text-sm font-semibold">{{ block.label }}</h4>
      <div class="grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-2">
        <article
          v-for="setting in block.settings"
          v-show="visibleKeys.has(setting.key)"
          :key="setting.key"
          :data-setting="setting.key"
          class="min-w-0 space-y-3"
          :class="setting.key === 'Pregnancy_PercentWeights' ? 'md:col-span-2' : ''"
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
          <div v-if="setting.impact" class="space-y-1 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p class="font-medium">{{ setting.impact.title }}</p>
            <p class="leading-relaxed">{{ setting.impact.description }}</p>
          </div>
          <PercentageDistributionControl
            v-if="setting.key === 'Pregnancy_OffspringGenderPercents' && offspringGenders(values[setting.key])"
            :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
            :id="`setting-${encodeURIComponent(setting.key)}`"
            :label="setting.label"
            :labels="['Male', 'Female']"
            :model-value="offspringGenders(values[setting.key])!"
            @update:model-value="updateGenders"
            @error="emit('error', setting.key, $event)"
          />
          <OffspringWeightsControl
            v-else-if="setting.key === 'Pregnancy_PercentWeights' && isSettingsObject(values[setting.key])"
            :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
            :id="`setting-${encodeURIComponent(setting.key)}`"
            :label="setting.label"
            :model-value="values[setting.key] as SettingsRecord"
            :human-maximum="values.Pregnancy_MaxOffspring"
            :pet-maximum="values.Pregnancy_PetMaxOffspring"
            @update:model-value="emit('update', setting.key, $event)"
            @error="emit('error', setting.key, $event)"
          />
          <SettingControl
            v-else
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
