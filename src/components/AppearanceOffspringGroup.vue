<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { appearanceOffspringBlocks } from '@/lib/appearance-offspring'
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

const physicalKey = 'Appearance_UseParentAppearance'
const varianceKey = 'Appearance_ParentAppearanceVariance'
const physicalAttributesOff = computed(() => props.values[physicalKey] === false
  && props.settings.some(setting => setting.key === physicalKey))
const showContextEnable = computed(() => physicalAttributesOff.value
  && props.visibleKeys.has(varianceKey) && !props.visibleKeys.has(physicalKey))
const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return appearanceOffspringBlocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key => settings.has(key) ? [settings.get(key)!] : []),
  }))
})
const hasVisibleSettings = computed(() => blocks.value.some(block =>
  block.settings.some(setting => props.visibleKeys.has(setting.key)),
))

function isDisabled(key: string) {
  return key === varianceKey && physicalAttributesOff.value
}
</script>

<template>
  <section
    v-show="hasVisibleSettings"
    :id="id"
    data-appearance-offspring-group
    class="min-w-0 space-y-6"
    :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined"
    :aria-label="showHeading === false ? 'Offspring' : undefined"
  >
    <header v-if="showHeading !== false" class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Offspring</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">Choose how offspring inherit physical attributes, skin tones, and skin details.</p>
    </header>

    <section
      v-for="block in blocks"
      v-show="block.settings.some(setting => visibleKeys.has(setting.key))"
      :key="block.id"
      :data-appearance-offspring-block="block.id"
      :aria-labelledby="`${id}-${block.id}-heading`"
      class="min-w-0 space-y-5 rounded-xl bg-muted/15 p-4 sm:p-5"
    >
      <h4 :id="`${id}-${block.id}-heading`" class="text-sm font-semibold">{{ block.label }}</h4>

      <div class="grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-2" :class="block.id === 'skin' ? 'xl:grid-cols-3' : ''">
        <article
          v-for="setting in block.settings"
          v-show="visibleKeys.has(setting.key)"
          :key="setting.key"
          :data-setting="setting.key"
          class="min-w-0 space-y-3"
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

          <fieldset
            class="min-w-0"
            :disabled="isDisabled(setting.key)"
            :aria-disabled="isDisabled(setting.key) || undefined"
            :aria-describedby="isDisabled(setting.key) ? `${id}-variance-help` : undefined"
          >
            <SettingControl
              :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
              :meta="setting"
              :model-value="values[setting.key]!"
              :disabled="isDisabled(setting.key)"
              @update:model-value="emit('update', setting.key, $event)"
              @error="emit('error', setting.key, $event)"
            />
          </fieldset>

          <div v-if="isDisabled(setting.key)" class="space-y-3 rounded-lg bg-muted/30 px-3 py-2.5">
            <p :id="`${id}-variance-help`" class="text-xs leading-relaxed text-muted-foreground">Turn on Use Parent Physical Attributes to adjust variance. Your value is kept.</p>
            <Button
              v-if="showContextEnable"
              type="button"
              variant="secondary"
              size="sm"
              class="h-auto max-w-full whitespace-normal text-left"
              @click="emit('update', physicalKey, true)"
            >Turn on Use Parent Physical Attributes</Button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
