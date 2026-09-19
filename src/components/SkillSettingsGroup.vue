<script setup lang="ts">
import { computed } from 'vue'
import type { SettingMeta } from '@/lib/catalog'
import type { JsonValue, SettingsRecord } from '@/lib/config'
import { skillBlocks, skillListKeys } from '@/lib/skill-settings'
import { Button } from '@/components/ui/button'
import SettingControl from './SettingControl.vue'
import SkillListControl from './SkillListControl.vue'

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

const descriptions: Record<string, string> = {
  Skill_Difficulty_Adjustment: '0 keeps normal progression. Negative values slow learning; positive values speed it up. Range: −50 to 10.',
  Skill_Difficulty_Blacklist: 'Excludes these skills from the difficulty adjustment.',
  Skill_Difficulty_Whitelist: 'When this list has entries, the difficulty adjustment applies only to skills in this list.',
  Skill_Freeze_List: 'Skills in this list stop improving.',
  Skill_Cheats_Bypass: 'Skills in this list are skipped by MCCC commands that change all skills, such as Max All Skills or Forget All Skills.',
}

const blocks = computed(() => {
  const settings = new Map(props.settings.map(setting => [setting.key, setting]))
  return skillBlocks.map(block => ({
    ...block,
    settings: block.keys.flatMap(key => settings.has(key) ? [settings.get(key)!] : []),
  }))
})
function isSkillList(key: string) {
  return skillListKeys.has(key) && typeof props.values[key] === 'string'
}
function controlId(key: string) {
  return `setting-${encodeURIComponent(key)}`
}
</script>

<template>
  <section
    :id="id"
    data-skill-settings-group
    class="min-w-0 space-y-6"
    :aria-labelledby="showHeading !== false ? `${id}-heading` : undefined"
    :aria-label="showHeading === false ? 'Skill Settings' : undefined"
  >
    <header v-if="showHeading !== false" class="space-y-2">
      <h3 :id="`${id}-heading`" class="text-lg font-semibold tracking-tight">Skill Settings</h3>
      <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">Configure skill difficulty, progression, and MCCC skill commands.</p>
    </header>

    <section
      v-for="block in blocks"
      v-show="block.settings.some(setting => visibleKeys.has(setting.key))"
      :key="block.id"
      :data-skill-block="block.id"
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
          :class="!skillListKeys.has(setting.key) ? 'md:col-span-2' : ''"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0 space-y-1.5">
              <label :for="isSkillList(setting.key) ? `${controlId(setting.key)}-toggle` : controlId(setting.key)" class="block text-sm font-medium">{{ setting.label }}</label>
              <code class="block break-all text-[10px] leading-relaxed text-muted-foreground">{{ setting.key }}</code>
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

          <p class="text-xs leading-relaxed text-muted-foreground">{{ descriptions[setting.key] }}</p>

          <SkillListControl
            v-if="isSkillList(setting.key)"
            :id="controlId(setting.key)"
            :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
            :label="setting.label"
            :model-value="values[setting.key] as string"
            @update:model-value="emit('update', setting.key, $event)"
          />
          <SettingControl
            v-else
            :key="`${setting.key}:${resetVersions[setting.key] ?? 0}`"
            :meta="setting"
            :model-value="values[setting.key]!"
            @update:model-value="emit('update', setting.key, $event)"
            @error="emit('error', setting.key, $event)"
          />
        </article>
      </div>
    </section>
  </section>
</template>
