<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ChevronRight } from '@lucide/vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { useDefaultComparisons } from '@/composables/defaultComparisonContext'
import StructuredValueEditor from './StructuredValueEditor.vue'
import DefaultStatusBadge from './DefaultStatusBadge.vue'

type LifespanProfile = { key: string; label: string; meta: SettingMeta }
type LifespanGroup = {
  id: string
  label: string
  description: string
  fields: { key: string; label: string }[]
  profiles: LifespanProfile[]
}

const props = defineProps<{
  group: LifespanGroup
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

const expanded = ref(false)
const activeProfile = ref('')
const rawProfiles = reactive(new Set<string>())
const fieldErrors = reactive(new Map<string, Map<string, string>>())
const rawErrors = reactive(new Map<string, string>())
const visibleProfiles = computed(() => props.group.profiles.filter(profile => props.visibleKeys.has(profile.key)))
const profileObjects = computed<Record<string, SettingsRecord | null>>(() => Object.fromEntries(props.group.profiles.map(profile => {
  const value = props.values[profile.key]
  return [profile.key, value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null]
})))
const fieldCount = computed(() => visibleProfiles.value.reduce((count, profile) => {
  const value = profileObjects.value[profile.key]
  return count + (value ? Object.keys(value).length : 1)
}, 0))
const hasErrors = computed(() => visibleProfiles.value.some(profile => props.errors[profile.key]))
const hasChanges = computed(() => visibleProfiles.value.some(profile => props.changedKeys.has(profile.key)))
const defaultComparisons = useDefaultComparisons()
const defaultCounts = computed(() => visibleProfiles.value.reduce((counts, profile) => {
  const status = defaultComparisons.value.get(profile.key)?.status
  if (status === 'different' || status === 'unknown') counts[status]++
  return counts
}, { different: 0, unknown: 0 }))

const fields = computed(() => {
  const result = props.group.fields.map(field => ({ ...field, known: true }))
  const seen = new Set(result.map(field => field.key))
  for (const profile of props.group.profiles) {
    for (const key of Object.keys(profileObjects.value[profile.key] ?? {})) {
      if (seen.has(key)) continue
      seen.add(key)
      result.push({ key, label: key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2'), known: false })
    }
  }
  return result
})
const visibleFields = computed(() => fields.value.filter(field => field.known
  || visibleProfiles.value.some(profile => Object.hasOwn(profileObjects.value[profile.key] ?? {}, field.key))))
const rowNumbers = computed(() => new Map(visibleFields.value.map((field, index) => [field.key, index + 2])))
const gridStyle = computed(() => ({
  '--profile-count': Math.max(1, visibleProfiles.value.length),
  '--row-count': visibleFields.value.length + 1,
}))

function profileId(key: string) {
  return `${props.id}-${encodeURIComponent(key)}`
}
function fieldId(profileKey: string, fieldKey: string) {
  // Keep imported names separate from profile IDs and control suffixes.
  return `${profileId(profileKey)}-field-${encodeURIComponent(fieldKey).replace(/-/g, '%2D')}`
}
function hasField(profileKey: string, fieldKey: string) {
  return Object.hasOwn(profileObjects.value[profileKey] ?? {}, fieldKey)
}
function updateField(profileKey: string, fieldKey: string, value: JsonValue) {
  const current = profileObjects.value[profileKey]
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
function handleTabKey(event: KeyboardEvent, key: string) {
  const profiles = visibleProfiles.value
  const current = profiles.findIndex(profile => profile.key === key)
  let next = current
  if (event.key === 'ArrowRight') next = (current + 1) % profiles.length
  else if (event.key === 'ArrowLeft') next = (current - 1 + profiles.length) % profiles.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = profiles.length - 1
  else return
  event.preventDefault()
  const profile = profiles[next]
  if (!profile) return
  activeProfile.value = profile.key
  document.getElementById(`${profileId(profile.key)}-tab`)?.focus()
}

watch(visibleProfiles, profiles => {
  if (!profiles.some(profile => profile.key === activeProfile.value)) {
    activeProfile.value = profiles.find(profile => props.errors[profile.key])?.key ?? profiles[0]?.key ?? ''
  }
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
  <section :id="id" :data-lifespan-group="group.id" :data-tracked-setting="visibleProfiles[0]?.key" class="lifespan-group min-w-0 space-y-5" :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined" :aria-label="showHeading === false ? group.label : undefined">
    <header v-if="showHeading !== false" class="space-y-2">
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
        :aria-label="`${expanded ? 'Hide' : 'Edit'} details for ${group.label} lifespans`"
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

    <!-- Keep inputs mounted so collapsing also preserves unfinished edits. -->
    <div v-show="expanded" :id="`${id}-details`" class="min-w-0 space-y-5">
    <div class="lifespan-tabs flex flex-wrap gap-2" role="tablist" :aria-label="`${group.label} lifespan profiles`">
      <Button
        v-for="profile in group.profiles"
        v-show="visibleKeys.has(profile.key)"
        :id="`${profileId(profile.key)}-tab`"
        :key="profile.key"
        type="button"
        role="tab"
        :variant="activeProfile === profile.key ? 'secondary' : 'ghost'"
        :aria-label="profile.label"
        :aria-selected="activeProfile === profile.key"
        :aria-controls="profileId(profile.key)"
        :tabindex="activeProfile === profile.key ? 0 : -1"
        @click="activeProfile = profile.key"
        @keydown="handleTabKey($event, profile.key)"
      >
        {{ profile.label }}
        <span v-if="errors[profile.key]" class="size-1.5 rounded-full bg-destructive" aria-label="Contains an invalid value" />
        <span v-else-if="changedKeys.has(profile.key)" class="size-1.5 rounded-full bg-primary" aria-label="Modified" />
      </Button>
    </div>

    <div class="lifespan-grid" :style="gridStyle">
      <div class="lifespan-age-heading px-1 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Age</div>
      <div
        v-for="field in fields"
        v-show="rowNumbers.has(field.key)"
        :key="field.key"
        class="lifespan-age-label px-1 py-4 text-sm font-medium"
        :style="{ gridRow: rowNumbers.get(field.key) }"
      >{{ field.label }}</div>

      <article
        v-for="profile in group.profiles"
        :id="profileId(profile.key)"
        :key="`${profile.key}:${resetVersions[profile.key] ?? 0}`"
        :data-setting="profile.key"
        role="tabpanel"
        class="lifespan-profile min-w-0 rounded-xl bg-muted/15"
        :class="{ 'is-visible': visibleKeys.has(profile.key), 'is-active': activeProfile === profile.key }"
        :style="{ '--profile-column': visibleProfiles.findIndex(item => item.key === profile.key) + 2 }"
        :aria-labelledby="`${profileId(profile.key)}-heading`"
      >
        <header class="min-w-0 space-y-2 px-3 py-3" style="grid-row: 1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 :id="`${profileId(profile.key)}-heading`" class="text-sm font-semibold">{{ profile.label }}</h4>
            <Button
              v-if="changedKeys.has(profile.key) || errors[profile.key]"
              type="button"
              variant="ghost"
              size="xs"
              :aria-label="`Undo ${profile.meta.label}`"
              @click="emit('undo', profile.key)"
            >Undo</Button>
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
          class="lifespan-cell min-w-0 space-y-2 px-3 py-4"
          :style="{ gridRow: rowNumbers.get(field.key) }"
        >
          <label class="lifespan-mobile-label block text-sm font-medium" :for="fieldId(profile.key, field.key)">{{ field.label }}</label>
          <StructuredValueEditor
            v-if="hasField(profile.key, field.key)"
            :id="fieldId(profile.key, field.key)"
            :label="`${profile.meta.label}: ${field.label}`"
            :model-value="profileObjects[profile.key]![field.key]!"
            :numeric-meta="profile.meta.numericFields?.[field.key]"
            compact
            @update:model-value="updateField(profile.key, field.key, $event)"
            @error="setFieldError(profile.key, field.key, field.label, $event)"
          />
          <p v-else class="text-xs text-muted-foreground">Not in this file</p>
        </div>

        <div v-if="!profileObjects[profile.key]" v-show="!rawProfiles.has(profile.key)" class="min-w-0 space-y-3 px-3 py-4" style="grid-row: 2 / -1">
          <p class="text-xs leading-relaxed text-muted-foreground">This profile has a different structure. Its imported value is preserved.</p>
          <StructuredValueEditor
            :id="`${profileId(profile.key)}-value`"
            :label="profile.meta.label"
            :model-value="values[profile.key]!"
            @update:model-value="emit('update', profile.key, $event)"
            @error="setFieldError(profile.key, '$value', profile.label, $event)"
          />
        </div>

        <div v-show="rawProfiles.has(profile.key)" class="min-w-0 space-y-3 px-3 py-4" style="grid-row: 2 / -1">
          <p class="text-xs text-muted-foreground">Preserve the existing value types. Changes are saved as you edit.</p>
          <StructuredValueEditor
            :id="`${profileId(profile.key)}-raw`"
            :label="profile.meta.label"
            :model-value="values[profile.key]!"
            :numeric-fields="profile.meta.numericFields"
            raw-only
            @update:model-value="emit('update', profile.key, $event)"
            @error="setRawError(profile.key, $event)"
          />
        </div>
      </article>
    </div>
    </div>
  </section>
</template>

<style scoped>
.lifespan-group { container-type: inline-size; }
.lifespan-grid { display: grid; min-width: 0; gap: 0 1rem; }
.lifespan-age-heading, .lifespan-age-label, .lifespan-profile { display: none; }
.lifespan-profile.is-visible.is-active { display: grid; }
.lifespan-profile { grid-template-rows: repeat(var(--row-count), auto); }

@container (min-width: 760px) {
  .lifespan-tabs, .lifespan-mobile-label { display: none; }
  .lifespan-grid {
    grid-template-columns: 6.5rem repeat(var(--profile-count), minmax(0, 1fr));
    grid-template-rows: repeat(var(--row-count), auto);
  }
  .lifespan-age-heading, .lifespan-age-label { display: block; grid-column: 1; }
  .lifespan-age-heading { grid-row: 1; }
  .lifespan-profile.is-visible { display: grid; }
  .lifespan-profile {
    grid-column: var(--profile-column);
    grid-row: 1 / -1;
    grid-template-rows: subgrid;
  }
}
</style>
