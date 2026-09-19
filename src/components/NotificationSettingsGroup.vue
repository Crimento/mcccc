<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquareWarning } from '@lucide/vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { notificationMasterKey, notificationBlocks } from '@/lib/notification-settings'
import { Badge } from '@/components/ui/badge'
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

const master = computed(() => props.settings.find(setting => setting.key === notificationMasterKey))
const masterIsOff = computed(() => !!master.value && props.values[notificationMasterKey] === false)
const masterIsHidden = computed(() => !props.visibleKeys.has(notificationMasterKey))
const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return notificationBlocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key => key !== notificationMasterKey && settings.has(key) ? [settings.get(key)!] : []),
  }))
})
const hasVisibleSettings = computed(() => (!!master.value && !masterIsHidden.value)
  || blocks.value.some(block => block.settings.some(setting => props.visibleKeys.has(setting.key))))

function defaultLabel(setting: SettingMeta) {
  return setting.defaultLabel
    ?? setting.options?.find(option => option.value === String(setting.defaultValue))?.label
    ?? String(setting.defaultValue)
}
</script>

<template>
  <section
    v-show="hasVisibleSettings"
    :id="id"
    data-notification-settings-group
    class="min-w-0 space-y-6"
    :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined"
    :aria-label="showHeading === false ? 'Notification Settings' : undefined"
  >
    <header v-if="showHeading !== false" class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Notification Settings</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">Choose which MCCC notifications appear and who they include.</p>
    </header>

    <article
      v-if="master"
      v-show="!masterIsHidden"
      :data-setting="master.key"
      class="min-w-0 space-y-4 rounded-xl bg-muted/30 p-4 sm:p-5"
    >
      <div class="flex min-w-0 items-start justify-between gap-3">
        <div class="min-w-0 space-y-2">
          <label :for="`setting-${encodeURIComponent(master.key)}`" class="block text-base font-semibold">{{ master.label }}</label>
          <code class="inline-block max-w-full break-all rounded-md bg-muted/40 px-2 py-1 text-[10px] leading-relaxed text-muted-foreground">{{ master.key }}</code>
        </div>
        <Button
          v-if="changedKeys.has(master.key) || errors[master.key]"
          type="button"
          variant="ghost"
          size="xs"
          :aria-label="`Undo ${master.label}`"
          @click="emit('undo', master.key)"
        >Undo</Button>
      </div>

      <p class="text-xs leading-relaxed text-muted-foreground">{{ master.description }}</p>
      <SettingControl
        :key="`${master.key}:${resetVersions[master.key] ?? 0}`"
        :meta="master"
        :model-value="values[master.key]!"
        @update:model-value="emit('update', master.key, $event)"
        @error="emit('error', master.key, $event)"
      />
      <p v-if="master.defaultLabel !== undefined || master.defaultValue !== undefined" class="text-xs text-muted-foreground">Default: {{ defaultLabel(master) }}</p>
    </article>

    <div v-if="masterIsOff" class="space-y-3 rounded-lg bg-muted/30 px-4 py-3">
      <p class="text-sm leading-relaxed text-muted-foreground">Event notifications are off. Your choices below are kept and can still be edited.</p>
      <div v-if="master && masterIsHidden" class="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" @click="emit('update', master.key, true)">Turn on notifications</Button>
        <Button
          v-if="changedKeys.has(master.key) || errors[master.key]"
          type="button"
          variant="ghost"
          size="sm"
          :aria-label="`Undo ${master.label}`"
          @click="emit('undo', master.key)"
        >Undo {{ master.label }}</Button>
      </div>
    </div>

    <section
      v-for="block in blocks"
      v-show="block.settings.some(setting => visibleKeys.has(setting.key))"
      :key="block.id"
      :data-notification-block="block.id"
      :aria-labelledby="`${id}-${block.id}-heading`"
      class="min-w-0 space-y-5 rounded-xl bg-muted/15 p-4 sm:p-5"
    >
      <header class="space-y-2">
        <h4 :id="`${id}-${block.id}-heading`" class="text-sm font-semibold">{{ block.label }}</h4>
        <p class="max-w-3xl text-xs leading-relaxed text-muted-foreground">{{ block.description }}</p>
      </header>

      <div class="grid min-w-0 gap-x-8 gap-y-6 md:grid-cols-2">
        <article
          v-for="setting in block.settings"
          v-show="visibleKeys.has(setting.key)"
          :key="setting.key"
          :data-setting="setting.key"
          class="min-w-0 space-y-3"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <label :for="`setting-${encodeURIComponent(setting.key)}`" class="block text-sm font-medium">{{ setting.label }}</label>
                <Badge v-if="setting.impact" variant="outline" class="border-0 bg-warning-background px-1.5 py-0 text-[9px] font-medium text-warning">{{ setting.impact.level === 'interrupts' ? 'May interrupt play' : 'Gameplay impact' }}</Badge>
              </div>
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
          <div v-if="setting.impact" class="flex gap-2 rounded-md bg-warning-background px-2.5 py-2 text-[11px] leading-relaxed text-warning">
            <MessageSquareWarning class="mt-0.5 size-3.5 shrink-0" />
            <div class="space-y-1">
              <p class="font-medium">{{ setting.impact.title }}</p>
              <p>{{ setting.impact.description }}</p>
            </div>
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
