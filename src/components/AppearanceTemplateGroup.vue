<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ChevronRight } from '@lucide/vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import type { AppearanceTemplateGroup } from '@/lib/appearance-templates'
import { Button } from '@/components/ui/button'
import { useDefaultComparisons } from '@/composables/defaultComparisonContext'
import StructuredValueEditor from './StructuredValueEditor.vue'
import DefaultStatusBadge from './DefaultStatusBadge.vue'

type TemplateGroup = Omit<AppearanceTemplateGroup, 'profiles'> & {
  profiles: (AppearanceTemplateGroup['profiles'][number] & { meta: SettingMeta })[]
}
const props = defineProps<{
  group: TemplateGroup
  values: SettingsRecord
  visibleKeys: Set<string>
  changedKeys: Set<string>
  errors: Record<string, string>
  resetVersions: Record<string, number>
  id: string
  expandWhenBrowsing?: boolean
}>()
const emit = defineEmits<{
  update: [key: string, value: JsonValue]
  error: [key: string, message: string | null]
  undo: [key: string]
}>()

const expanded = ref(false)
const rawProfiles = reactive(new Set<string>())
const fieldErrors = reactive(new Map<string, Map<string, string>>())
const rawErrors = reactive(new Map<string, string>())
const visibleProfiles = computed(() => props.group.profiles.filter(profile => props.visibleKeys.has(profile.key)))
const profileObjects = computed<Record<string, SettingsRecord | null>>(() => Object.fromEntries(props.group.profiles.map(profile => {
  const value = props.values[profile.key]
  return [profile.key, value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null]
})))

function fieldLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
}
const fields = computed(() => {
  const result: { key: string; label: string; known: boolean }[] = []
  const seen = new Set<string>()
  for (const profile of props.group.profiles) {
    for (const key of Object.keys(profile.meta.rangeFields ?? {})) {
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ key, label: fieldLabel(key), known: true })
    }
  }
  for (const profile of props.group.profiles) {
    for (const key of Object.keys(profileObjects.value[profile.key] ?? {})) {
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ key, label: fieldLabel(key), known: false })
    }
  }
  return result
})
const visibleFields = computed(() => fields.value.filter(field => field.known
  || visibleProfiles.value.some(profile => Object.hasOwn(profileObjects.value[profile.key] ?? {}, field.key))))
const rowNumbers = computed(() => new Map(visibleFields.value.map((field, index) => [field.key, index + 2])))
const rowCount = computed(() => Math.max(1, visibleFields.value.length) + 1)
const gridStyle = computed(() => ({
  '--profile-count': Math.max(1, visibleProfiles.value.length),
  '--tablet-columns': Math.min(2, Math.max(1, visibleProfiles.value.length)),
  '--row-count': rowCount.value,
  '--tablet-row-count': Math.max(1, Math.ceil(visibleProfiles.value.length / 2)) * rowCount.value,
}))
const fieldCount = computed(() => visibleProfiles.value.reduce((count, profile) =>
  count + (profileObjects.value[profile.key] ? Object.keys(profileObjects.value[profile.key]!).length : 1), 0))
const hasErrors = computed(() => visibleProfiles.value.some(profile => props.errors[profile.key]))
const hasChanges = computed(() => visibleProfiles.value.some(profile => props.changedKeys.has(profile.key)))
const defaultComparisons = useDefaultComparisons()
const defaultCounts = computed(() => visibleProfiles.value.reduce((counts, profile) => {
  const status = defaultComparisons.value.get(profile.key)?.status
  if (status === 'different' || status === 'unknown') counts[status]++
  return counts
}, { different: 0, unknown: 0 }))

function profileId(key: string) {
  return `${props.id}-${encodeURIComponent(key)}`
}
function fieldId(profileKey: string, fieldKey: string) {
  return `${profileId(profileKey)}-field-${encodeURIComponent(fieldKey).replace(/-/g, '%2D')}`
}
function profileStyle(key: string) {
  const index = visibleProfiles.value.findIndex(profile => profile.key === key)
  return {
    '--desktop-column': index + 2,
    '--tablet-column': index % 2 + 1,
    '--tablet-row': Math.floor(index / 2) * rowCount.value + 1,
  }
}
function hasField(profileKey: string, fieldKey: string) {
  return Object.hasOwn(profileObjects.value[profileKey] ?? {}, fieldKey)
}
function updateField(profileKey: string, fieldKey: string, value: JsonValue) {
  const current = profileObjects.value[profileKey]
  // Preserve sibling array references so their unfinished range drafts survive.
  if (current && Object.hasOwn(current, fieldKey)) emit('update', profileKey, { ...current, [fieldKey]: value })
}
function emitProfileError(profileKey: string) {
  emit('error', profileKey, rawErrors.get(profileKey) ?? fieldErrors.get(profileKey)?.values().next().value ?? null)
}
function setFieldError(profileKey: string, fieldKey: string, label: string, message: string | null) {
  let errors = fieldErrors.get(profileKey)
  if (!errors) {
    errors = new Map()
    fieldErrors.set(profileKey, errors)
  }
  if (message) errors.set(fieldKey, `${label}: ${message}`)
  else errors.delete(fieldKey)
  emitProfileError(profileKey)
}
function setRawError(profileKey: string, message: string | null) {
  if (message) rawErrors.set(profileKey, message)
  else rawErrors.delete(profileKey)
  emitProfileError(profileKey)
}
function toggleRaw(profileKey: string) {
  if (props.errors[profileKey]) return
  if (rawProfiles.has(profileKey)) rawProfiles.delete(profileKey)
  else rawProfiles.add(profileKey)
}

watch(() => props.expandWhenBrowsing, value => {
  if (value) expanded.value = true
}, { immediate: true })
watch(() => ({ ...props.resetVersions }), (versions, previous) => {
  for (const profile of props.group.profiles) {
    if (versions[profile.key] === previous?.[profile.key]) continue
    fieldErrors.delete(profile.key)
    rawErrors.delete(profile.key)
    emitProfileError(profile.key)
  }
})
onBeforeUnmount(() => {
  for (const profile of props.group.profiles) emit('error', profile.key, null)
})
</script>

<template>
  <section v-show="visibleProfiles.length" :id="id" :data-appearance-template-group="group.id" :data-tracked-setting="visibleProfiles[0]?.key" class="appearance-template-group min-w-0 space-y-5" :aria-labelledby="`${id}-heading`">
    <header class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">{{ group.label }}</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">{{ group.description }}</p>
    </header>

    <div class="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        :aria-expanded="expanded"
        :aria-controls="`${id}-details`"
        :aria-label="`${expanded ? 'Hide' : 'Edit'} details for ${group.label} appearance templates`"
        :aria-describedby="!expanded && hasErrors ? `${id}-collapsed-error` : undefined"
        @click="expanded = !expanded"
      >
        <ChevronRight class="size-3.5 transition-transform" :class="expanded ? 'rotate-90' : ''" aria-hidden="true" />
        {{ expanded ? 'Hide details' : 'Edit details' }}
        <span class="text-xs font-normal text-muted-foreground">{{ fieldCount }} {{ fieldCount === 1 ? 'field' : 'fields' }}</span>
        <span v-if="hasErrors" class="size-1.5 rounded-full bg-destructive" aria-label="Contains an invalid value" />
        <span v-else-if="hasChanges" class="size-1.5 rounded-full bg-primary" aria-label="Modified" />
      </Button>
      <div v-if="!expanded && (defaultCounts.different || defaultCounts.unknown)" :data-default-group-summary="group.id" class="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <span v-if="defaultCounts.different" data-default-count="different" class="text-control">{{ defaultCounts.different }} non-default</span>
        <span v-if="defaultCounts.unknown" data-default-count="unknown" class="text-muted-foreground" title="A documented default is not known for these profiles.">{{ defaultCounts.unknown }} unknown</span>
      </div>
      <p v-if="!expanded && hasErrors" :id="`${id}-collapsed-error`" class="text-xs text-destructive">Expand to correct invalid values.</p>
    </div>

    <div v-show="expanded" :id="`${id}-details`" class="appearance-template-grid" :style="gridStyle">
      <div class="appearance-anatomy-heading px-1 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Anatomy</div>
      <div v-for="field in fields" v-show="rowNumbers.has(field.key)" :key="field.key" class="appearance-anatomy-label px-1 py-3 text-sm font-medium" :style="{ gridRow: rowNumbers.get(field.key) }">{{ field.label }}</div>

      <article
        v-for="profile in group.profiles"
        v-show="visibleKeys.has(profile.key)"
        :id="profileId(profile.key)"
        :key="`${profile.key}:${resetVersions[profile.key] ?? 0}`"
        :data-setting="profile.key"
        class="appearance-template-profile min-w-0 rounded-xl bg-muted/15"
        :style="profileStyle(profile.key)"
        :aria-labelledby="`${profileId(profile.key)}-heading`"
      >
        <header class="min-w-0 space-y-2 px-3 py-3" style="grid-row: 1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 :id="`${profileId(profile.key)}-heading`" class="text-sm font-semibold">{{ profile.label }}</h4>
            <Button v-if="changedKeys.has(profile.key) || errors[profile.key]" type="button" variant="ghost" size="xs" :aria-label="`Undo ${profile.meta.label}`" @click="emit('undo', profile.key)">Undo</Button>
          </div>
          <code class="block break-all text-[10px] leading-relaxed text-muted-foreground">{{ profile.key }}</code>
          <DefaultStatusBadge :setting-key="profile.key" />
          <Button
            type="button"
            variant="ghost"
            size="xs"
            class="-ml-1 text-muted-foreground"
            :disabled="!!errors[profile.key]"
            :aria-label="`${rawProfiles.has(profile.key) ? 'Use fields' : 'Edit JSON'} for ${profile.meta.label}`"
            :aria-describedby="errors[profile.key] ? `${profileId(profile.key)}-mode-help` : undefined"
            @click="toggleRaw(profile.key)"
          >{{ rawProfiles.has(profile.key) ? 'Use fields' : 'Edit JSON' }}</Button>
          <p v-if="errors[profile.key]" :id="`${profileId(profile.key)}-mode-help`" class="text-xs text-muted-foreground">Correct the invalid value before switching editors.</p>
        </header>

        <div
          v-for="field in fields"
          v-show="!rawProfiles.has(profile.key) && profileObjects[profile.key] && rowNumbers.has(field.key)"
          :key="field.key"
          :data-appearance-field="field.key"
          class="min-w-0 space-y-2 px-3 py-3"
          :style="{ gridRow: rowNumbers.get(field.key) }"
        >
          <p class="appearance-cell-label text-sm font-medium">{{ field.label }}</p>
          <StructuredValueEditor
            v-if="hasField(profile.key, field.key)"
            :id="fieldId(profile.key, field.key)"
            :label="`${profile.meta.label}: ${field.label}`"
            :model-value="profileObjects[profile.key]![field.key]!"
            :range-bounds="profile.meta.rangeFields?.[field.key]"
            compact
            @update:model-value="updateField(profile.key, field.key, $event)"
            @error="setFieldError(profile.key, field.key, field.label, $event)"
          />
          <p v-else class="text-xs text-muted-foreground">Not in this file</p>
        </div>

        <div v-if="!profileObjects[profile.key]" v-show="!rawProfiles.has(profile.key)" class="min-w-0 space-y-3 px-3 py-3" style="grid-row: 2 / -1">
          <p class="text-xs leading-relaxed text-muted-foreground">This profile has a different structure. Its imported value is preserved.</p>
          <StructuredValueEditor :id="`${profileId(profile.key)}-value`" :label="profile.meta.label" :model-value="values[profile.key]!" @update:model-value="emit('update', profile.key, $event)" @error="setFieldError(profile.key, '$value', profile.label, $event)" />
        </div>

        <div v-show="rawProfiles.has(profile.key)" class="min-w-0 space-y-3 px-3 py-3" style="grid-row: 2 / -1">
          <p class="text-xs text-muted-foreground">Preserve the existing value types. Changes are saved as you edit.</p>
          <StructuredValueEditor :id="`${profileId(profile.key)}-raw`" :label="profile.meta.label" :model-value="values[profile.key]!" :range-fields="profile.meta.rangeFields" raw-only @update:model-value="emit('update', profile.key, $event)" @error="setRawError(profile.key, $event)" />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.appearance-template-group { container-type: inline-size; }
.appearance-template-grid { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; gap: 1rem; }
.appearance-anatomy-heading, .appearance-anatomy-label { display: none; }
.appearance-template-profile { display: grid; grid-template-rows: repeat(var(--row-count), auto); }

@container (min-width: 480px) {
  .appearance-template-grid {
    grid-template-columns: repeat(var(--tablet-columns), minmax(0, 1fr));
    grid-template-rows: repeat(var(--tablet-row-count), auto);
    gap: 0 0.75rem;
  }
  .appearance-template-profile {
    grid-column: var(--tablet-column);
    grid-row: var(--tablet-row) / span var(--row-count);
    grid-template-rows: subgrid;
  }
}

@container (min-width: 900px) {
  .appearance-template-grid {
    grid-template-columns: 6.5rem repeat(var(--profile-count), minmax(0, 1fr));
    grid-template-rows: repeat(var(--row-count), auto);
  }
  .appearance-anatomy-heading, .appearance-anatomy-label { display: block; grid-column: 1; }
  .appearance-anatomy-heading { grid-row: 1; }
  .appearance-cell-label { display: none; }
  .appearance-template-profile { grid-column: var(--desktop-column); grid-row: 1 / -1; }
}
</style>
