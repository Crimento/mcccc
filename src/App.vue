<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, Download, ExternalLink, FileCheck2, FileSliders,
  FolderOpen, Heart, Info, ListFilter, Menu, MoonStar, RotateCcw,
  Search, ShieldCheck, Shirt, SlidersHorizontal, Sparkles, Sprout, Undo2,
  Users, WandSparkles, X, GraduationCap, Baby, Paintbrush, MessageSquareWarning,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import SettingControl from '@/components/SettingControl.vue'
import EditorBreadcrumbs from '@/components/EditorBreadcrumbs.vue'
import LifespanGroup from '@/components/LifespanGroup.vue'
import AutosaveGroup from '@/components/AutosaveGroup.vue'
import MotiveDecayGroup from '@/components/MotiveDecayGroup.vue'
import SkillSettingsGroup from '@/components/SkillSettingsGroup.vue'
import MoneySettingsGroup from '@/components/MoneySettingsGroup.vue'
import ConsoleSettingsGroup from '@/components/ConsoleSettingsGroup.vue'
import NotificationSettingsGroup from '@/components/NotificationSettingsGroup.vue'
import MenuVisibilityGroup from '@/components/MenuVisibilityGroup.vue'
import RelationshipSettingsGroup from '@/components/RelationshipSettingsGroup.vue'
import AutoRelationshipSettingsGroup from '@/components/AutoRelationshipSettingsGroup.vue'
import AppearanceTemplateGroup from '@/components/AppearanceTemplateGroup.vue'
import AppearanceLimitsGroup from '@/components/AppearanceLimitsGroup.vue'
import AppearanceOffspringGroup from '@/components/AppearanceOffspringGroup.vue'
import WalkstyleGroup from '@/components/WalkstyleGroup.vue'
import EducationSettingsGroup from '@/components/EducationSettingsGroup.vue'
import CleanerRelationshipsGroup from '@/components/CleanerRelationshipsGroup.vue'
import ClubSettingsGroup from '@/components/ClubSettingsGroup.vue'
import DresserOutfitsGroup from '@/components/DresserOutfitsGroup.vue'
import OccultSettingsGroup from '@/components/OccultSettingsGroup.vue'
import PopulationSettingsGroup from '@/components/PopulationSettingsGroup.vue'
import OffspringSettingsGroup from '@/components/OffspringSettingsGroup.vue'
import PregnancySettingsGroup from '@/components/PregnancySettingsGroup.vue'
import TunerSettingsGroup from '@/components/TunerSettingsGroup.vue'
import SettingsGroup from '@/components/SettingsGroup.vue'
import { categories, getSettingMeta, presets, referenceInfo, referenceSource, type SettingMeta } from '@/lib/catalog'
import { compareSettingsForNavigation, type MenuNode } from '@/lib/navigation'
import { menuHref, parseMenuHash } from '@/lib/menu-location'
import { lifespanSpecies, lifespanSpeciesForKey, type LifespanSpecies } from '@/lib/lifespans'
import { appearanceTemplateGroups, type AppearanceTemplateGroup as AppearanceTemplateGroupDefinition } from '@/lib/appearance-templates'
import { appearanceLimitKeys } from '@/lib/appearance-limits'
import { appearanceOffspringKeys } from '@/lib/appearance-offspring'
import { walkstyleKeys } from '@/lib/walkstyles'
import { educationSettingKeys } from '@/lib/career-settings'
import { cleanerRelationshipKeys } from '@/lib/cleaner-settings'
import { clubSettingKeys } from '@/lib/club-settings'
import { dresserOutfitKeys } from '@/lib/dresser-settings'
import { occultSettingKeys } from '@/lib/occult-groups'
import { populationSettingKeys } from '@/lib/population-settings'
import { offspringSettingKeys } from '@/lib/offspring-settings'
import { pregnancySettingGroups, type PregnancySettingsGroup as PregnancyGroupDefinition } from '@/lib/pregnancy-groups'
import { tunerSettingKeys } from '@/lib/tuner-settings'
import { additionalSettingGroups, type AdditionalSettingGroup } from '@/lib/additional-setting-groups'
import { autosaveKeys } from '@/lib/autosave'
import { motiveDecayKeys, motiveDecayDescription } from '@/lib/motive-decay'
import { skillSettingKeys } from '@/lib/skill-settings'
import { moneySettingKeys } from '@/lib/money-settings'
import { consoleSettingKeys } from '@/lib/console-settings'
import { notificationSettingKeys } from '@/lib/notification-settings'
import { menuVisibilityKeys } from '@/lib/menu-visibility'
import { generalRelationshipKeys, autoRelationshipKeys } from '@/lib/relationship-settings'
import { occultSpecies, settingMenuPaths } from '@/lib/occult-settings'
import { applyPreset, cloneConfig, isEqual, parseConfig, type JsonValue, type SettingsRecord } from '@/lib/config'
import { useConfigEditor } from '@/composables/useConfigEditor'
import { useVisibleSetting } from '@/composables/useVisibleSetting'

const {
  original, current, fileName, isExample, epoch, errors, availableDraft,
  draftStatus, changes, changedSet, load, update, resetAll, resumeDraft, discardDraft, download,
} = useConfigEditor()

const activeCategory = ref('all')
const activeMenu = ref<string[]>([])
const query = ref('')
const modifiedOnly = ref(false)
const impactOnly = ref(false)
const invalidOnly = ref(false)
const sidebarOpen = ref(false)
const settingsList = ref<HTMLElement>()
const { element: viewedElement, clear: clearViewedSetting } = useVisibleSetting(settingsList)
const fileInput = ref<HTMLInputElement>()
const importError = ref('')
const notice = ref('')
const noticeTimer = ref<ReturnType<typeof setTimeout>>()
const resetVersions = ref<Record<string, number>>({})
const pageSize = ref(50)
const isDragging = ref(false)
let dragDepth = 0

const presetsOpen = ref(false)
const selectedPreset = ref(presets[0]!.id)
const exportOpen = ref(false)
const aboutOpen = ref(false)
const resetOpen = ref(false)
const replaceOpen = ref(false)
const pendingFile = ref<{ config: SettingsRecord; name: string } | null>(null)

const icons: Record<string, typeof SlidersHorizontal> = {
  core: SlidersHorizontal, pregnancy: Baby,
  population: Users, appearance: Paintbrush, dresser: Shirt, occult: MoonStar,
  careers: GraduationCap, tuner: WandSparkles, cleaner: Sparkles, clubs: Users,
  woohoo: Heart, other: CircleHelp,
}

function flattenMenus(nodes: MenuNode[] = [], parent: string[] = []): { label: string; path: string[] }[] {
  return nodes.flatMap(node => {
    const path = [...parent, node.label]
    return [{ label: node.label, path }, ...flattenMenus(node.children, path)]
  })
}

function pathStartsWith(path: string[], prefix: string[]) {
  return prefix.every((part, index) => path[index] === part)
}

const menuEntries = computed(() => Object.fromEntries(categories.map(category => [
  category.id,
  flattenMenus(category.menus).filter(menu => menu.label !== 'More MCCC Settings'
    || (menuCounts.value[`${category.id}/${menu.path.join('/')}`] ?? 0) > 0),
])))
const menuDescriptions: Record<string, string> = {
  Age: 'Lifespans and aging for humans and pets.',
  'Age/Age Span Durations': 'Set human lifespans, followed by cats, dogs, and horses.',
  'Auto-Save': 'Choose when to save, which slots to use, and whether to ask for confirmation.',
  Gameplay: 'Everyday gameplay, death, motives, and skill progression.',
  'Gameplay/Death Settings': 'Choose how deaths and immortality work.',
  'Gameplay/Motive Decay': motiveDecayDescription,
  'Gameplay/Skill Settings': 'Adjust difficulty and choose which skills can progress.',
  'core/Money Settings': 'Adjust bills, child support, and inheritance.',
  'core/Notifications/Console/Menu Settings': 'Configure notifications, phone texts, console commands, logging, and menus.',
  'core/Notifications/Console/Menu Settings/Console Command Settings': 'Configure visual effects, general cheats, and Build/Buy cheats.',
  'core/Notifications/Console/Menu Settings/Console Command Settings/BuildBuy Settings': 'Set automatic Build/Buy cheats for objects, unlocks, and building.',
  'core/Notifications/Console/Menu Settings/Logging Settings': 'Choose what MCCC logs and how exception notifications appear.',
  'core/Notifications/Console/Menu Settings/Notification Settings': 'Choose which events produce notifications and whose updates you see.',
  'core/Notifications/Console/Menu Settings/Notification Settings/Aging/Death Notifications': 'Choose notifications for birthdays, aging, and deaths.',
  'core/Notifications/Console/Menu Settings/Notification Settings/MC Population Notifications': 'Choose notifications for moving Sims and empty houses.',
  'core/Notifications/Console/Menu Settings/Notification Settings/MC Pregnancy Notifications': 'Choose notifications for pregnancies, births, marriages, and relationship changes.',
  'core/Notifications/Console/Menu Settings/Notification Settings/Neighborhood Stories Settings': 'Choose notifications for Neighborhood Stories events.',
  'core/Notifications/Console/Menu Settings/Show Menu Settings': 'Choose where MCCC menus appear and which menus to hide when clicking a Sim.',
  'core/Relationship Settings': 'Adjust friendship and romance progression, relationship culling, and automatic household changes.',
  'core/Relationship Settings/Auto-Relationship Settings': 'Choose how relationships trigger breakups and move-ins, and which households are excluded.',
  'core/Relationship Settings/Auto-Relationship Settings/Breakup Settings': 'Set relationship change chances and who moves out after a breakup.',
  'core/Relationship Settings/Auto-Relationship Settings/Move-In Settings': 'Choose who can move in together, the required romance level, and the chance of a move-in.',
  'More MCCC Settings': 'Additional MCCC settings from your file.',
  'Define Appearance Template': 'Compare body ranges across ages for female and male Sims.',
  'Exclude Traits': 'Choose traits to exclude from newly generated Sims and pets.',
  'appearance/Fit/Fat limits': 'Set muscle and body fat ranges for female and male Sims.',
  'appearance/Fit/Fat limits/Female': 'Set the minimum and maximum muscle and body fat values for female Sims.',
  'appearance/Fit/Fat limits/Male': 'Set the minimum and maximum muscle and body fat values for male Sims.',
  Offspring: 'Choose which physical attributes, skintones, and skin details children can inherit.',
  'Set Default Walkstyle': 'Set default walkstyles by gender and age.',
  'careers/School': 'Adjust homework progression and allow children or teens to quit school.',
  'careers/University': 'Adjust university progression, homework, and Secret Society progress decay.',
  'Neighborhood Stories Settings': 'Choose how MCCC settings affect Neighborhood Stories.',
  'Item Cleaner': 'Define outfit cleanup rules and synchronize glasses and medical devices.',
  'Neighborhood Cleaner': 'Manage ghost cleanup, culled Sims, and household names.',
  'Relationship Cleaner': 'Choose whose relationships are cleaned, which pet relationships qualify, and how many relationships to keep.',
  'Sim Cleaner': 'Synchronize married Sims’ names.',
  'Facial Hair Settings': 'Choose eligible ages and the chance of adding facial hair at each age-up.',
  'Makeup Settings': 'Choose which Sims and outfits receive makeup during Dresser cleanup.',
  'Outfits Settings': 'Control outfit cleanup, outfit changes, and multiple outfits.',
  'Outfits Settings/Multiple Outfit Settings': 'Choose who receives multiple outfits, how often, and how many.',
  'Outfits Settings/Replace Situation Outfits': 'Choose replacement outfits for specific situations.',
  'Moving Settings': 'Choose who can move into homes, leave households, or move with their family.',
  'Populating Settings': 'Choose the ages and genders of generated Sims and how to import Sims from your library.',
  'Populating Settings/Import Tray Settings': 'Choose when and how library Sims replace randomly generated Sims.',
  'Populating Settings/CAS Custom Gender Settings': 'Set physical-frame chances and related CAS preferences for generated Sims.',
  'Random Lot Challenges': 'Choose where and how often random lot challenges change. A maximum of zero disables this feature.',
  'Other Settings': 'Manage visitors, lot populations, special Sims, and culling.',
  'population/Neighborhood Stories Settings': 'Apply MCCC moving restrictions to Neighborhood Stories.',
  'pregnancy/Adoption Settings': 'Choose adoption ages, gender chances, and when naming dialogs appear.',
  'pregnancy/Marriage Sim Selection': 'Choose which Sims are considered for random marriage and when checks run.',
  'pregnancy/Neighborhood Stories Settings': 'Apply MCCC pregnancy rules to Neighborhood Stories and set adoption limits.',
  'pregnancy/Offspring': 'Set birth counts, inherited traits, gender chances, and naming preferences.',
  'pregnancy/Other Marriage': 'Control marriage confirmations, surnames, moving families, and compatibility checks.',
  'pregnancy/Other Pregnancy': 'Control pregnancy timing, moods, aging, and confirmation dialogs.',
  'pregnancy/Partner Sim Selection': 'Choose who can be a partner in MCCC’s random pregnancy checks.',
  'pregnancy/Pet Pregnancy Settings': 'Set pet pregnancy ages, household limits, offspring counts, and notifications.',
  'pregnancy/Pet Pregnancy Settings/Pregnancy Percentage': 'Set independent adult and elder pregnancy chances for cats, dogs, and horses.',
  'pregnancy/Pregnant Sim Selection': 'Choose which Sims can become pregnant and when random pregnancy checks run.',
  'pregnancy/Spouse Sim Selection': 'Choose compatible spouses for MCCC’s random marriage checks.',
  'pregnancy/Spouse Sim Selection/Marriage Trait Limits': 'Set required and conflicting trait pairs for random marriages.',
  'tuner/Change Interaction Behavior': 'Change which interactions are available and how Sims behave.',
  'tuner/Change Interaction Autonomy': 'Choose which interactions Sims can perform on their own.',
  'tuner/Autonomy Scan': 'Keep recent interactions available in autonomy scans and set the archive size per Sim.',
  'woohoo/WooHoo Actions': 'Choose which WooHoo and Try for Baby interactions are available.',
  'woohoo/WooHoo Pregnancy': 'Set pregnancy chances and which Sim can become pregnant.',
  'woohoo/WooHoo Reactions': 'Adjust privacy, jealousy, bed sharing, and behavior afterward.',
  'woohoo/Sim Nudity': 'Choose eligible Sims, interactions, and whether Sims change clothes afterward.',
  'woohoo/Sim Nudity/Nudity Interactions': 'Choose the interactions affected by nudity settings.',
  'woohoo/Other Settings': 'Control autonomy, rest time, the optional skill, and birth control.',
}
const browsingMenus = computed(() => !query.value.trim() && !impactOnly.value && !modifiedOnly.value && !invalidOnly.value)

function isSelectedMenu(category: string, path: string[] = []) {
  return browsingMenus.value && activeCategory.value === category
    && activeMenu.value.length === path.length && pathStartsWith(activeMenu.value, path)
}

// Metadata depends on key and imported type, never on a control's in-progress text.
const allSettings = computed(() => Object.entries(original.value)
  .map(([key, value]) => getSettingMeta(key, value))
  .sort(compareSettingsForNavigation))
const settings = computed(() => allSettings.value.filter(setting => !setting.internal))
const selectedOccultSpecies = computed(() => browsingMenus.value && activeCategory.value === 'occult'
  ? occultSpecies.find(species => species.label === activeMenu.value[0])?.label : undefined)

function displayMenuPath(setting: ReturnType<typeof getSettingMeta>) {
  return browsingMenus.value && setting.category === activeCategory.value && activeMenu.value.length
    ? settingMenuPaths(setting).find(path => pathStartsWith(path, activeMenu.value)) ?? setting.menuPath
    : setting.menuPath
}

function menuBadge(setting: ReturnType<typeof getSettingMeta>) {
  const path = displayMenuPath(setting)
  if (path.length && path[0] !== 'More MCCC Settings') return path.join(' / ')
  if (setting.menuPaths?.length) return `All occult types / ${setting.occultAging ? 'Aging Settings' : 'Other Pregnancy'}`
  return setting.section
}

const orderedSettings = computed(() => [...settings.value].sort((a, b) => compareSettingsForNavigation(
  { ...a, menuPath: displayMenuPath(a) }, { ...b, menuPath: displayMenuPath(b) },
)))
type LifespanGroupData = Omit<LifespanSpecies, 'profiles'> & {
  profiles: (LifespanSpecies['profiles'][number] & { meta: SettingMeta })[]
}
type AppearanceTemplateGroupData = Omit<AppearanceTemplateGroupDefinition, 'profiles'> & {
  profiles: (AppearanceTemplateGroupDefinition['profiles'][number] & { meta: SettingMeta })[]
}
type EditorItem = { kind: 'setting'; key: string; setting: SettingMeta }
  | { kind: 'lifespan'; key: string; group: LifespanGroupData }
  | { kind: 'appearance-template'; key: string; group: AppearanceTemplateGroupData }
  | { kind: 'appearance-limits'; key: string; settings: SettingMeta[] }
  | { kind: 'appearance-offspring'; key: string; settings: SettingMeta[] }
  | { kind: 'walkstyles'; key: string; settings: SettingMeta[] }
  | { kind: 'education'; key: string; settings: SettingMeta[] }
  | { kind: 'cleaner-relationships'; key: string; settings: SettingMeta[] }
  | { kind: 'clubs'; key: string; settings: SettingMeta[] }
  | { kind: 'dresser-outfits'; key: string; settings: SettingMeta[] }
  | { kind: 'occult'; key: string; settings: SettingMeta[] }
  | { kind: 'population'; key: string; settings: SettingMeta[] }
  | { kind: 'offspring'; key: string; settings: SettingMeta[] }
  | { kind: 'pregnancy-settings'; key: string; group: PregnancyGroupDefinition; settings: SettingMeta[] }
  | { kind: 'tuner'; key: string; settings: SettingMeta[] }
  | { kind: 'settings-group'; key: string; group: AdditionalSettingGroup; settings: SettingMeta[] }
  | { kind: 'autosave'; key: string; settings: SettingMeta[] }
  | { kind: 'motive-decay'; key: string; settings: SettingMeta[] }
  | { kind: 'skills'; key: string; settings: SettingMeta[] }
  | { kind: 'money'; key: string; settings: SettingMeta[] }
  | { kind: 'console'; key: string; settings: SettingMeta[] }
  | { kind: 'notifications'; key: string; settings: SettingMeta[] }
  | { kind: 'menu-visibility'; key: string; settings: SettingMeta[] }
  | { kind: 'relationships'; key: string; settings: SettingMeta[] }
  | { kind: 'auto-relationships'; key: string; settings: SettingMeta[] }

const lifespanGroups = computed<LifespanGroupData[]>(() => {
  const metadata = new Map(settings.value.map(setting => [setting.key, setting]))
  return lifespanSpecies.map(species => ({
    ...species,
    profiles: species.profiles.flatMap(profile => {
      const meta = metadata.get(profile.key)
      return meta ? [{ ...profile, meta }] : []
    }),
  })).filter(group => group.profiles.length)
})
const appearanceGroups = computed<AppearanceTemplateGroupData[]>(() => {
  const metadata = new Map(settings.value.map(setting => [setting.key, setting]))
  return appearanceTemplateGroups.map(group => ({
    ...group,
    profiles: group.profiles.flatMap(profile => {
      const meta = metadata.get(profile.key)
      return meta ? [{ ...profile, meta }] : []
    }),
  })).filter(group => group.profiles.length)
})
const editorItems = computed<EditorItem[]>(() => {
  const seen = new Set<string>()
  const groups = new Map(lifespanGroups.value.map(group => [group.id, group]))
  const appearanceByKey = new Map(appearanceGroups.value.flatMap(group =>
    group.profiles.map(profile => [profile.key, group] as const),
  ))
  const autosaveSettings = orderedSettings.value.filter(setting => autosaveKeys.has(setting.key))
  const appearanceLimits = orderedSettings.value.filter(setting => appearanceLimitKeys.has(setting.key))
  const appearanceOffspring = orderedSettings.value.filter(setting => appearanceOffspringKeys.has(setting.key))
  const walkstyles = orderedSettings.value.filter(setting => walkstyleKeys.has(setting.key))
  const educationSettings = orderedSettings.value.filter(setting => educationSettingKeys.has(setting.key))
  const cleanerRelationships = orderedSettings.value.filter(setting => cleanerRelationshipKeys.has(setting.key))
  const clubSettings = orderedSettings.value.filter(setting => clubSettingKeys.has(setting.key))
  const dresserOutfits = orderedSettings.value.filter(setting => dresserOutfitKeys.has(setting.key))
  const occultSettings = orderedSettings.value.filter(setting => occultSettingKeys.has(setting.key))
  const populationSettings = orderedSettings.value.filter(setting => populationSettingKeys.has(setting.key))
  const offspringSettings = orderedSettings.value.filter(setting => offspringSettingKeys.has(setting.key))
  const tunerSettings = orderedSettings.value.filter(setting => tunerSettingKeys.has(setting.key))
  const additionalGroupsByKey = new Map(additionalSettingGroups.flatMap(group =>
    group.blocks.flatMap(block => block.keys.map(key => [key, group] as const)),
  ))
  const additionalSettingsByGroup = new Map(additionalSettingGroups.map(group => [
    group.id, orderedSettings.value.filter(setting => additionalGroupsByKey.get(setting.key)?.id === group.id),
  ]))
  const pregnancyGroupsByKey = new Map(pregnancySettingGroups.flatMap(group =>
    group.blocks.flatMap(block => block.keys.map(key => [key, group] as const)),
  ))
  const pregnancySettingsByGroup = new Map(pregnancySettingGroups.map(group => [
    group.id, orderedSettings.value.filter(setting => pregnancyGroupsByKey.get(setting.key)?.id === group.id),
  ]))
  const decaySettings = orderedSettings.value.filter(setting => motiveDecayKeys.has(setting.key))
  const skillSettings = orderedSettings.value.filter(setting => skillSettingKeys.has(setting.key))
  const moneySettings = orderedSettings.value.filter(setting => moneySettingKeys.has(setting.key))
  const consoleSettings = orderedSettings.value.filter(setting => consoleSettingKeys.has(setting.key))
  const notificationSettings = orderedSettings.value.filter(setting => notificationSettingKeys.has(setting.key))
  const menuVisibilitySettings = orderedSettings.value.filter(setting => menuVisibilityKeys.has(setting.key))
  const relationshipSettings = orderedSettings.value.filter(setting => generalRelationshipKeys.has(setting.key))
  const autoRelationshipSettings = orderedSettings.value.filter(setting => autoRelationshipKeys.has(setting.key))
  const items: EditorItem[] = []
  for (const setting of orderedSettings.value) {
    const additionalGroup = additionalGroupsByKey.get(setting.key)
    if (additionalGroup) {
      const key = `settings-group-${additionalGroup.id}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ kind: 'settings-group', key, group: additionalGroup, settings: additionalSettingsByGroup.get(additionalGroup.id)! })
      }
      continue
    }
    if (tunerSettingKeys.has(setting.key)) {
      if (!seen.has('tuner')) {
        seen.add('tuner')
        items.push({ kind: 'tuner', key: 'tuner', settings: tunerSettings })
      }
      continue
    }
    const pregnancyGroup = pregnancyGroupsByKey.get(setting.key)
    if (pregnancyGroup) {
      const key = `pregnancy-${pregnancyGroup.id}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ kind: 'pregnancy-settings', key, group: pregnancyGroup, settings: pregnancySettingsByGroup.get(pregnancyGroup.id)! })
      }
      continue
    }
    if (offspringSettingKeys.has(setting.key)) {
      if (!seen.has('offspring')) {
        seen.add('offspring')
        items.push({ kind: 'offspring', key: 'offspring', settings: offspringSettings })
      }
      continue
    }
    if (populationSettingKeys.has(setting.key)) {
      if (!seen.has('population')) {
        seen.add('population')
        items.push({ kind: 'population', key: 'population', settings: populationSettings })
      }
      continue
    }
    if (occultSettingKeys.has(setting.key)) {
      if (!seen.has('occult')) {
        seen.add('occult')
        items.push({ kind: 'occult', key: 'occult', settings: occultSettings })
      }
      continue
    }
    if (dresserOutfitKeys.has(setting.key)) {
      if (!seen.has('dresser-outfits')) {
        seen.add('dresser-outfits')
        items.push({ kind: 'dresser-outfits', key: 'dresser-outfits', settings: dresserOutfits })
      }
      continue
    }
    if (clubSettingKeys.has(setting.key)) {
      if (!seen.has('clubs')) {
        seen.add('clubs')
        items.push({ kind: 'clubs', key: 'clubs', settings: clubSettings })
      }
      continue
    }
    if (cleanerRelationshipKeys.has(setting.key)) {
      if (!seen.has('cleaner-relationships')) {
        seen.add('cleaner-relationships')
        items.push({ kind: 'cleaner-relationships', key: 'cleaner-relationships', settings: cleanerRelationships })
      }
      continue
    }
    if (educationSettingKeys.has(setting.key)) {
      if (!seen.has('education')) {
        seen.add('education')
        items.push({ kind: 'education', key: 'education', settings: educationSettings })
      }
      continue
    }
    if (walkstyleKeys.has(setting.key)) {
      if (!seen.has('walkstyles')) {
        seen.add('walkstyles')
        items.push({ kind: 'walkstyles', key: 'walkstyles', settings: walkstyles })
      }
      continue
    }
    if (appearanceOffspringKeys.has(setting.key)) {
      if (!seen.has('appearance-offspring')) {
        seen.add('appearance-offspring')
        items.push({ kind: 'appearance-offspring', key: 'appearance-offspring', settings: appearanceOffspring })
      }
      continue
    }
    if (appearanceLimitKeys.has(setting.key)) {
      if (!seen.has('appearance-limits')) {
        seen.add('appearance-limits')
        items.push({ kind: 'appearance-limits', key: 'appearance-limits', settings: appearanceLimits })
      }
      continue
    }
    const appearanceGroup = appearanceByKey.get(setting.key)
    if (appearanceGroup) {
      const key = `appearance-templates-${appearanceGroup.id}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({ kind: 'appearance-template', key, group: appearanceGroup })
      }
      continue
    }
    if (autoRelationshipKeys.has(setting.key)) {
      if (!seen.has('auto-relationships')) {
        seen.add('auto-relationships')
        items.push({ kind: 'auto-relationships', key: 'auto-relationships', settings: autoRelationshipSettings })
      }
      continue
    }
    if (generalRelationshipKeys.has(setting.key)) {
      if (!seen.has('relationships')) {
        seen.add('relationships')
        items.push({ kind: 'relationships', key: 'relationships', settings: relationshipSettings })
      }
      continue
    }
    if (menuVisibilityKeys.has(setting.key)) {
      if (!seen.has('menu-visibility')) {
        seen.add('menu-visibility')
        items.push({ kind: 'menu-visibility', key: 'menu-visibility', settings: menuVisibilitySettings })
      }
      continue
    }
    if (notificationSettingKeys.has(setting.key)) {
      if (!seen.has('notifications')) {
        seen.add('notifications')
        items.push({ kind: 'notifications', key: 'notifications', settings: notificationSettings })
      }
      continue
    }
    if (consoleSettingKeys.has(setting.key)) {
      if (!seen.has('console')) {
        seen.add('console')
        items.push({ kind: 'console', key: 'console', settings: consoleSettings })
      }
      continue
    }
    if (moneySettingKeys.has(setting.key)) {
      if (!seen.has('money')) {
        seen.add('money')
        items.push({ kind: 'money', key: 'money', settings: moneySettings })
      }
      continue
    }
    if (skillSettingKeys.has(setting.key)) {
      if (!seen.has('skills')) {
        seen.add('skills')
        items.push({ kind: 'skills', key: 'skills', settings: skillSettings })
      }
      continue
    }
    if (motiveDecayKeys.has(setting.key)) {
      if (!seen.has('motive-decay')) {
        seen.add('motive-decay')
        items.push({ kind: 'motive-decay', key: 'motive-decay', settings: decaySettings })
      }
      continue
    }
    if (autosaveKeys.has(setting.key)) {
      if (!seen.has('autosave')) {
        seen.add('autosave')
        items.push({ kind: 'autosave', key: 'autosave', settings: autosaveSettings })
      }
      continue
    }
    const species = lifespanSpeciesForKey(setting.key)
    const group = species ? groups.get(species.id) : undefined
    if (!group) {
      items.push({ kind: 'setting', key: setting.key, setting })
    } else if (!seen.has(group.id)) {
      seen.add(group.id)
      items.push({ kind: 'lifespan', key: `lifespans-${group.id}`, group })
    }
  }
  return items
})

function isDedicatedLifespanGroup(group: LifespanGroupData) {
  return browsingMenus.value && activeCategory.value === 'core'
    && activeMenu.value.length === 3 && activeMenu.value[2] === group.label
    && pathStartsWith(activeMenu.value, ['Age', 'Age Span Durations'])
}
const internalCount = computed(() => allSettings.value.length - settings.value.length)
const documentedCount = computed(() => settings.value.filter(setting => setting.documented).length)
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const setting of settings.value) counts[setting.category] = (counts[setting.category] ?? 0) + 1
  return counts
})
const visibleCategories = computed(() => categories.filter(category => category.id !== 'other'
  || (categoryCounts.value.other ?? 0) > 0))
const menuCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const setting of settings.value) {
    const paths = new Set<string>()
    for (const menuPath of settingMenuPaths(setting)) {
      for (let depth = 1; depth <= menuPath.length; depth++) {
        paths.add(`${setting.category}/${menuPath.slice(0, depth).join('/')}`)
      }
    }
    for (const path of paths) counts[path] = (counts[path] ?? 0) + 1
  }
  return counts
})
const currentCategory = computed(() => categories.find(category => category.id === activeCategory.value))
const impactCount = computed(() => settings.value.filter(setting => setting.impact).length)
const errorCount = computed(() => Object.keys(errors).length)
const matches = computed(() => {
  const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return orderedSettings.value.filter(setting => {
    if (browsingMenus.value && activeCategory.value !== 'all'
      && (setting.category !== activeCategory.value || !settingMenuPaths(setting).some(path => pathStartsWith(path, activeMenu.value)))) return false
    if (modifiedOnly.value && !changedSet.value.has(setting.key)) return false
    if (impactOnly.value && !setting.impact) return false
    if (invalidOnly.value && !errors[setting.key]) return false
    const categoryLabel = categories.find(category => category.id === setting.category)?.label ?? ''
    const choiceText = setting.options?.map(option => `${option.label} ${option.value} ${option.group ?? ''}`).join(' ') ?? ''
    const haystack = `${setting.label} ${setting.key} ${setting.description} ${setting.section} ${categoryLabel} ${settingMenuPaths(setting).flat().join(' ')} ${setting.impact?.description ?? ''} ${choiceText}`.toLowerCase()
    return terms.every(term => haystack.includes(term))
  })
})
const visibleKeys = computed(() => new Set(matches.value.slice(0, pageSize.value).map(setting => setting.key)))
const groupHeadings = computed(() => {
  const headings = new Map<string, string>()
  let previousGroup = ''
  for (const setting of matches.value.slice(0, pageSize.value)) {
    const menuPath = displayMenuPath(setting)
    const group = `${setting.category}/${menuPath.join('/')}`
    if (group !== previousGroup) {
      const categoryLabel = categories.find(category => category.id === setting.category)?.label ?? 'Other settings'
      const path = browsingMenus.value && activeCategory.value !== 'all'
        ? menuPath.slice(activeMenu.value.length)
        : [categoryLabel, ...menuPath]
      if (path.length) headings.set(setting.key, path.join(' / '))
      previousGroup = group
    }
  }
  return headings
})
const listTitle = computed(() => {
  if (invalidOnly.value) return 'Settings to check'
  if (query.value.trim()) return 'Search results'
  if (modifiedOnly.value && impactOnly.value) return 'Modified settings with gameplay notes'
  if (modifiedOnly.value) return 'Your changes'
  if (impactOnly.value) return 'Gameplay notes'
  return activeMenu.value.at(-1) ?? currentCategory.value?.label ?? 'All settings'
})
const settingsByKey = computed(() => new Map(settings.value.map(setting => [setting.key, setting])))
const viewedLocation = computed(() => {
  const element = viewedElement.value
  const row = element?.closest<HTMLElement>('[data-setting], [data-tracked-setting]')
  const key = row?.dataset.setting ?? row?.dataset.trackedSetting
  const setting = key ? settingsByKey.value.get(key) : undefined
  if (!element || !row || !setting || !visibleKeys.value.has(setting.key)) return undefined

  if (row.dataset.trackedSetting) {
    // A collapsed comparison represents its whole group, not the first age or
    // lifespan profile. Use the common menu shared by its visible profiles.
    const group = row.dataset.lifespanGroup
      ? lifespanSpecies.find(item => item.id === row.dataset.lifespanGroup)
      : appearanceTemplateGroups.find(item => item.id === row.dataset.appearanceTemplateGroup)
    const paths = group?.profiles.flatMap(profile => {
      const meta = settingsByKey.value.get(profile.key)
      return meta && visibleKeys.value.has(profile.key) ? [displayMenuPath(meta)] : []
    }) ?? []
    const first = paths[0] ?? []
    const differingIndex = first.findIndex((part, index) => paths.some(other => other[index] !== part))
    const path = differingIndex < 0 ? first : first.slice(0, differingIndex)
    return { category: setting.category, path }
  }

  const species = occultSpecies.find(item => item.code === element.closest<HTMLElement>('[data-occult-species]')?.dataset.occultSpecies)
  const paths = settingMenuPaths(setting)
  // Shared occult keys have several real menu locations. A species card or
  // the selected branch identifies one; otherwise don't invent a species.
  const path = setting.menuPaths?.length
    ? paths.find(path => species ? path[0] === species.label
      : browsingMenus.value && activeCategory.value === setting.category && activeMenu.value.length
        && pathStartsWith(path, activeMenu.value)) ?? []
    : displayMenuPath(setting)
  return { category: setting.category, path, key: setting.key, label: setting.label }
})
const breadcrumbs = computed(() => {
  const root = { label: 'All settings', href: menuHref('all'), category: 'all', path: [] as string[] }
  const location = viewedLocation.value
  if (!location && !browsingMenus.value) return [root, { ...root, label: listTitle.value }]
  const category = location ? categories.find(item => item.id === location.category) : currentCategory.value
  if (!category) return [root]
  const menuPath = location?.path ?? activeMenu.value
  const items = [
    root,
    { label: category.label, href: menuHref(category.id), category: category.id, path: [] },
    ...menuPath.map((label, index) => {
      const path = menuPath.slice(0, index + 1)
      return { label, href: menuHref(category.id, path), category: category.id, path }
    }),
  ]
  const title = [category.label, ...menuPath, location?.label].filter(Boolean).join(' › ')
  if (location?.key && location.label) return [...items, {
    label: location.label, href: menuHref(category.id, menuPath), category: category.id, path: menuPath,
    title: `${title} (${location.key})`,
  }]
  return items.map((item, index) => index === items.length - 1 ? { ...item, title } : item)
})
const listDescription = computed(() => {
  if (invalidOnly.value) return 'Correct these values before downloading your config.'
  if (query.value.trim()) return 'Searching names, descriptions, choices, config keys, and menu paths across all modules.'
  if (modifiedOnly.value) return 'Compared with the file you started from. Undo brings back its original value.'
  if (impactOnly.value) return 'Some players enjoy these options; others find them intrusive. Choose what suits your game.'
  if (activeMenu.value.length) {
    const path = activeMenu.value.join('/')
    if (activeCategory.value === 'core' && activeMenu.value.length === 3
      && pathStartsWith(activeMenu.value, ['Age', 'Age Span Durations'])) {
      const species = lifespanSpecies.find(species => species.label === activeMenu.value[2])
      if (species) return species.description
    }
    const description = menuDescriptions[`${activeCategory.value}/${path}`] ?? menuDescriptions[path]
    if (description) return description
    if (activeCategory.value === 'appearance' && activeMenu.value[0] === 'Define Appearance Template') {
      return 'Adjust the body ranges for the selected gender and age.'
    }
    if (activeCategory.value === 'appearance' && activeMenu.value[0] === 'Set Default Walkstyle') {
      return 'Default walkstyles for the selected gender and age.'
    }
    if (activeCategory.value === 'occult') {
      if (activeMenu.value.includes('Aging Settings')) return 'Set lifespan multipliers and the age at which this occult type stops aging. Choose Normal aging to keep aging through every life stage.'
      if (activeMenu.value.includes('Other Pregnancy')) return 'Choose offspring chances for each parent pairing. Use Custom Pregnancy applies to all occult types.'
    }
    return 'Settings from this in-game menu.'
  }
  return currentCategory.value?.description ?? 'Every editable setting from your file, organized in one place.'
})
const preset = computed(() => presets.find(item => item.id === selectedPreset.value)!)
const presetPatch = computed(() => Object.fromEntries(Object.entries(preset.value.changes)
  .filter(([key, value]) => Object.hasOwn(current.value, key) && typeof current.value[key] === typeof value)) as SettingsRecord)
const presetChanges = computed(() => Object.entries(presetPatch.value).filter(([key, value]) => !isEqual(current.value[key], value)))
const presetSkipped = computed(() => Object.keys(preset.value.changes).length - Object.keys(presetPatch.value).length)

watch([activeCategory, activeMenu, query, modifiedOnly, impactOnly, invalidOnly], () => { pageSize.value = 50 })
watch([activeCategory, activeMenu, query, modifiedOnly, impactOnly, invalidOnly, epoch], clearViewedSetting, { flush: 'sync' })

function toast(message: string) {
  notice.value = message
  clearTimeout(noticeTimer.value)
  noticeTimer.value = setTimeout(() => { notice.value = '' }, 4500)
}

function applyMenuLocation(id: string, path: string[]) {
  clearViewedSetting()
  activeCategory.value = id
  activeMenu.value = [...path]
  query.value = ''
  modifiedOnly.value = false
  impactOnly.value = false
  invalidOnly.value = false
  sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectCategory(id: string, path: string[] = []) {
  const href = menuHref(id, path)
  if (window.location.hash !== href) window.history.pushState(null, '', href)
  applyMenuLocation(id, path)
}

function restoreMenuLocation() {
  const location = parseMenuHash(window.location.hash)
  if (location) applyMenuLocation(location.category, location.path)
}

function setError(key: string, message: string | null) {
  if (message) errors[key] = message
  else delete errors[key]
}

function undo(key: string) {
  current.value[key] = cloneConfig({ value: original.value[key]! }).value!
  delete errors[key]
  resetVersions.value[key] = (resetVersions.value[key] ?? 0) + 1
}

function formatValue(value: JsonValue | undefined): string {
  if (typeof value === 'boolean') return value ? 'On' : 'Off'
  if (value === '') return '(empty)'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function labelFor(key: string) {
  const setting = getSettingMeta(key, current.value[key])
  if (!settings.value.some(other => other.key !== key && other.label === setting.label)) return setting.label
  const category = categories.find(item => item.id === setting.category)?.label ?? 'Other settings'
  return [category, ...setting.menuPath, setting.label].join(' / ')
}

async function readFile(file?: File) {
  if (!file) return
  importError.value = ''
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('This file is larger than 2 MB. Please choose your mc_settings.cfg file.')
    const config = parseConfig(await file.text())
    if (!Object.keys(config).length) throw new Error('This file has no settings. Choose a config created by MCCC.')
    pendingFile.value = { config, name: file.name }
    if (changes.value.length || errorCount.value) replaceOpen.value = true
    else acceptFile()
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'The file could not be read. Try selecting it again.'
  }
  if (fileInput.value) fileInput.value.value = ''
}

function acceptFile() {
  if (!pendingFile.value) return
  load(pendingFile.value.config, pendingFile.value.name)
  pendingFile.value = null
  replaceOpen.value = false
  resetVersions.value = {}
  selectCategory('all')
  toast('Config imported. Your original is kept for undo and backup.')
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  dragDepth = 0
  void readFile(event.dataTransfer?.files[0])
}
function onDragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return
  event.preventDefault()
  dragDepth++
  isDragging.value = true
}
function onDragLeave() {
  dragDepth--
  if (dragDepth <= 0) isDragging.value = false
}
function onDragOver(event: DragEvent) { if (event.dataTransfer?.types.includes('Files')) event.preventDefault() }

function applySelectedPreset() {
  const count = presetChanges.value.length
  current.value = applyPreset(current.value, presetPatch.value)
  for (const key of Object.keys(presetPatch.value)) delete errors[key]
  epoch.value++
  presetsOpen.value = false
  modifiedOnly.value = true
  impactOnly.value = false
  query.value = ''
  toast(count ? `Preset applied to ${count} ${count === 1 ? 'setting' : 'settings'}.` : 'Your config already matches this preset.')
}

function exportConfig() {
  if (errorCount.value) return
  try {
    download(current.value)
    exportOpen.value = false
    toast('Config downloaded. Replace mc_settings.cfg in your MCCC folder when the game is closed.')
  } catch (error) { importError.value = error instanceof Error ? error.message : 'Unable to generate the config.' }
}

function keyboard(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    document.getElementById('settings-search')?.focus()
  }
  if (event.key === 'Escape') sidebarOpen.value = false
}

onMounted(() => {
  restoreMenuLocation()
  window.addEventListener('popstate', restoreMenuLocation)
  window.addEventListener('hashchange', restoreMenuLocation)
  window.addEventListener('keydown', keyboard)
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('drop', onDrop)
})
onBeforeUnmount(() => {
  clearTimeout(noticeTimer.value)
  window.removeEventListener('popstate', restoreMenuLocation)
  window.removeEventListener('hashchange', restoreMenuLocation)
  window.removeEventListener('keydown', keyboard)
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('drop', onDrop)
})
</script>

<template>
  <div class="min-h-screen">
    <a href="#settings-list" class="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to settings</a>
    <input ref="fileInput" type="file" accept=".cfg,.json,application/json" class="sr-only" aria-label="Import config file" @change="readFile(($event.target as HTMLInputElement).files?.[0])" />

    <header data-editor-header class="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 bg-card/95 px-4 backdrop-blur-sm sm:px-6">
      <div class="flex min-w-0 items-center gap-3 lg:w-[228px] lg:shrink-0">
        <Button variant="ghost" size="icon" class="lg:hidden" aria-label="Open categories" aria-controls="settings-navigation" :aria-expanded="sidebarOpen" @click="sidebarOpen = !sidebarOpen"><Menu class="size-5" /></Button>
        <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-control" aria-hidden="true">
          <svg viewBox="0 0 32 40" class="h-7 w-6" fill="none"><path d="M16 1 29 20 16 39 3 20Z" fill="currentColor"/><path d="M16 1v38l13-19Z" fill="currentColor" opacity=".45"/><path d="M3 20h26L16 39Z" fill="currentColor" opacity=".18"/></svg>
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold tracking-tight sm:text-base">MCCC <span class="hidden font-normal text-muted-foreground sm:inline">Configurator</span></div>
          <p class="hidden text-[11px] text-muted-foreground sm:block">A little more control over your Sims.</p>
        </div>
      </div>
      <EditorBreadcrumbs :items="breadcrumbs" :data-current-setting="viewedLocation?.key" class="hidden flex-1 lg:block" @navigate="selectCategory" />
      <div class="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Import config" @click="fileInput?.click()"><FolderOpen class="size-4" />Import</Button>
        <Button size="sm" aria-label="Export config" :disabled="!!errorCount" @click="exportOpen = true"><Download class="size-4" />Export<span v-if="changes.length" class="ml-0.5 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">{{ changes.length }}</span></Button>
      </div>
    </header>

    <button v-if="sidebarOpen" class="fixed inset-0 top-[72px] z-30 bg-black/60 lg:hidden" aria-label="Close categories" @click="sidebarOpen = false" />
    <aside id="settings-navigation" class="scrollbar-thin fixed bottom-0 left-0 top-[72px] z-40 w-[252px] flex-col bg-sidebar lg:flex" :class="sidebarOpen ? 'flex' : 'hidden'" aria-label="Settings navigation">
      <div class="px-5 py-5">
        <div class="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground"><span class="size-1.5 rounded-full bg-primary" /> Current configuration</div>
        <div class="flex items-center gap-2 text-xs font-medium"><FileSliders class="size-4 shrink-0 text-muted-foreground" /><span class="truncate" :title="fileName">{{ fileName }}</span></div>
        <p class="mt-1.5 pl-6 text-[11px] text-muted-foreground">{{ settings.length }} settings <span class="px-1">·</span> {{ isExample ? 'Example file' : 'Imported file' }}</p>
      </div>
      <nav class="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <button data-category="all" class="mb-5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-accent/60" :class="isSelectedMenu('all') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'" :aria-current="isSelectedMenu('all') ? 'page' : undefined" @click="selectCategory('all')"><ListFilter class="size-4" /> All settings <span class="ml-auto text-[10px] tabular-nums">{{ settings.length }}</span></button>
        <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">MCCC menus</p>
        <template v-for="category in visibleCategories" :key="category.id">
          <button :data-category="category.id" class="my-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors hover:bg-accent/60" :class="isSelectedMenu(category.id) ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'" :aria-current="isSelectedMenu(category.id) ? 'page' : undefined" @click="selectCategory(category.id)"><component :is="icons[category.id]" class="size-4 shrink-0" /><span>{{ category.label }}</span><span class="ml-auto text-[10px] tabular-nums opacity-70">{{ categoryCounts[category.id] ?? 0 }}</span></button>
          <div v-if="activeCategory === category.id && menuEntries[category.id]?.length" class="mb-2 space-y-0.5" :aria-label="`${category.label} submenus`">
            <button v-for="menu in menuEntries[category.id]" :key="menu.path.join('/')" :data-menu-path="menu.path.join('/')" class="flex w-full items-start gap-2 rounded-lg py-2 pr-3 text-left text-[11px] leading-4 transition-colors hover:bg-accent/60" :style="{ paddingLeft: `${24 + menu.path.length * 12}px` }" :class="isSelectedMenu(category.id, menu.path) ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground'" :aria-current="isSelectedMenu(category.id, menu.path) ? 'page' : undefined" @click="selectCategory(category.id, menu.path)"><span>{{ menu.label }}</span><span class="ml-auto shrink-0 text-[10px] tabular-nums opacity-70">{{ menuCounts[`${category.id}/${menu.path.join('/')}`] ?? 0 }}</span></button>
          </div>
        </template>
        <div class="my-4 h-1" />
        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-colors hover:bg-accent/60" :class="impactOnly ? 'bg-warning-background font-medium text-warning' : 'text-muted-foreground'" @click="impactOnly = !impactOnly; modifiedOnly = false; invalidOnly = false; query = ''; sidebarOpen = false"><MessageSquareWarning class="size-4" /> Gameplay notes <span class="ml-auto text-[10px]">{{ impactCount }}</span></button>
      </nav>
      <div class="space-y-3 p-5">
        <button class="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground" @click="aboutOpen = true"><BookOpen class="size-3.5" /> About & setting reference <ExternalLink class="size-3" /></button>
        <p class="flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck class="size-3.5 shrink-0 text-primary" /> Your files stay on your device</p>
        <p class="text-[10px] leading-relaxed text-muted-foreground/80">An unofficial companion to<br />Deaderpool’s MC Command Center.</p>
      </div>
    </aside>

    <main class="mx-auto max-w-[1600px] px-4 pb-20 pt-7 sm:px-8 lg:ml-[252px] lg:px-10 lg:pt-9 xl:px-14">
      <div class="mb-7 flex items-start justify-between gap-4">
        <div><div class="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-primary"><Sprout class="size-3.5" /> Made for your kind of gameplay</div><h1 class="text-balance text-2xl font-semibold tracking-tight sm:text-[30px]">Your game. Your settings.</h1><p class="mt-2 text-sm leading-relaxed text-muted-foreground">Fine-tune MC Command Center, without the in-game menus.</p></div>
        <Button variant="outline" class="mt-5 hidden shrink-0 sm:flex" @click="presetsOpen = true"><Sparkles class="size-4 text-primary" /> Explore presets</Button>
      </div>

      <div v-if="availableDraft" class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent/50 p-4" role="status"><div class="flex items-center gap-3"><Clock3 class="size-4 text-primary" /><div><p class="text-sm font-medium">Pick up where you left off</p><p class="mt-0.5 text-xs text-muted-foreground">A draft of {{ availableDraft.name }} is saved in this browser.</p></div></div><div class="flex gap-2"><Button variant="ghost" size="sm" @click="discardDraft">Dismiss</Button><Button size="sm" @click="resumeDraft(); toast('Saved draft restored.')">Resume draft</Button></div></div>

      <div v-if="isExample" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3.5">
        <div class="flex items-center gap-3"><div class="rounded-lg bg-accent p-2 text-primary"><FileCheck2 class="size-4" /></div><div><p class="text-xs font-medium">Start with your own settings</p><p class="mt-1 text-xs leading-relaxed text-muted-foreground">You’re exploring the supplied example. Import your file to keep your setup.</p></div></div>
        <Button variant="ghost" size="sm" class="h-8 text-xs text-primary" @click="fileInput?.click()">Choose a .cfg file <ArrowRight class="size-3.5" /></Button>
      </div>

      <div v-if="importError" class="mb-5 flex items-start justify-between gap-3 rounded-lg bg-destructive/5 p-4 text-sm text-destructive" role="alert"><p>{{ importError }}</p><button aria-label="Dismiss error" @click="importError = ''"><X class="size-4" /></button></div>
      <div v-if="errorCount" class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/5 p-4 text-sm text-destructive" role="alert"><span>{{ errorCount }} {{ errorCount === 1 ? 'setting needs' : 'settings need' }} a valid value before export.</span><Button variant="outline" size="sm" @click="invalidOnly = true; query = ''; modifiedOnly = false; impactOnly = false">Show fields to fix</Button></div>

      <div class="mb-6 flex flex-wrap items-center gap-3">
        <div class="relative w-full min-w-48 sm:w-auto sm:flex-1"><Search class="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="settings-search" v-model="query" class="h-10 bg-card pl-9 pr-16 text-sm" placeholder="Find a setting…" aria-label="Search settings" /><button v-if="query" class="absolute right-3 top-3 text-muted-foreground" aria-label="Clear search" @click="query = ''"><X class="size-4" /></button><kbd v-else class="pointer-events-none absolute right-3 top-2.5 hidden rounded bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:block">⌘ / Ctrl K</kbd></div>
        <Button :variant="modifiedOnly ? 'secondary' : 'outline'" class="h-10 gap-2 bg-card text-xs" :class="modifiedOnly ? 'bg-accent text-primary' : ''" :aria-pressed="modifiedOnly" @click="modifiedOnly = !modifiedOnly; invalidOnly = false"><ListFilter class="size-3.5" /> Modified only <span class="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">{{ changes.length }}</span></Button>
        <Button variant="outline" class="h-10 text-xs sm:hidden" aria-label="Explore presets" @click="presetsOpen = true"><Sparkles class="size-4" /> Presets</Button>
      </div>

      <div v-if="impactOnly || invalidOnly" class="-mt-3 mb-5 flex flex-wrap gap-2">
        <button v-if="impactOnly" class="flex items-center gap-2 rounded-md bg-warning-background px-2.5 py-1.5 text-[11px] text-warning" aria-label="Clear gameplay notes filter" @click="impactOnly = false">Gameplay notes only <X class="size-3" /></button>
        <button v-if="invalidOnly" class="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-[11px] text-destructive" aria-label="Clear invalid fields filter" @click="invalidOnly = false">Fields to fix <X class="size-3" /></button>
      </div>

      <section id="settings-list" ref="settingsList" aria-labelledby="list-title" class="scroll-mt-24">
        <p v-if="browsingMenus && activeMenu.length" class="mb-2 text-[11px] leading-relaxed text-muted-foreground lg:hidden">{{ [currentCategory?.label, ...activeMenu.slice(0, -1)].join(' / ') }}</p>
        <div class="mb-4 flex items-start justify-between gap-3"><div><h2 id="list-title" class="flex items-center gap-2.5 text-base font-semibold tracking-tight">{{ listTitle }} <span class="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">{{ matches.length }}</span></h2><p class="mt-1 text-xs leading-relaxed text-muted-foreground">{{ listDescription }}</p></div><Button v-if="changes.length" variant="ghost" size="sm" class="h-7 shrink-0 px-2 text-xs text-muted-foreground" @click="resetOpen = true"><RotateCcw class="size-3" /> Reset changes</Button></div>

        <div v-if="impactOnly" class="mb-4 flex gap-3 rounded-lg bg-warning-background p-4 text-xs leading-relaxed text-warning"><Info class="mt-0.5 size-4 shrink-0" /><p><strong class="font-semibold">Choose what suits your game.</strong> These notes explain possible interruptions and wider effects. A highlighted setting may already be off.</p></div>

        <div class="space-y-3">
          <div v-if="!matches.length" class="flex flex-col items-center px-6 py-16 text-center"><div class="mb-4 rounded-full bg-muted p-4"><Search class="size-6 text-muted-foreground" /></div><h3 class="text-sm font-medium">{{ modifiedOnly && !query ? 'No changes here yet' : 'No matching settings' }}</h3><p class="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">{{ modifiedOnly && !query ? 'Your config matches the file you started from. Changes will appear here as you edit.' : 'Try a shorter search, a config key, or clear the active filters.' }}</p><Button variant="outline" size="sm" class="mt-5" @click="selectCategory('all')">Show all settings</Button></div>

          <!-- Keep controls mounted while filtering so incomplete input is never silently discarded. -->
          <template v-for="item in editorItems" :key="`${epoch}-${item.key}`">
          <LifespanGroup
            v-if="item.kind === 'lifespan'"
            v-show="item.group.profiles.some(profile => visibleKeys.has(profile.key))"
            :id="`lifespans-${item.group.id}`"
            :group="item.group"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isDedicatedLifespanGroup(item.group)"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <AppearanceTemplateGroup
            v-else-if="item.kind === 'appearance-template'"
            v-show="item.group.profiles.some(profile => visibleKeys.has(profile.key))"
            :id="`appearance-templates-${item.group.id}`"
            :group="item.group"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :expand-when-browsing="browsingMenus && activeCategory === 'appearance' && activeMenu[0] === 'Define Appearance Template'"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <AppearanceLimitsGroup
            v-else-if="item.kind === 'appearance-limits'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="appearance-limits"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('appearance', ['Fit/Fat limits'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <AppearanceOffspringGroup
            v-else-if="item.kind === 'appearance-offspring'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="appearance-offspring"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('appearance', ['Offspring'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <WalkstyleGroup
            v-else-if="item.kind === 'walkstyles'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="walkstyles"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('appearance', ['Set Default Walkstyle'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <EducationSettingsGroup
            v-else-if="item.kind === 'education'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="education"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('careers', ['School']) && !isSelectedMenu('careers', ['University'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <CleanerRelationshipsGroup
            v-else-if="item.kind === 'cleaner-relationships'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="cleaner-relationships"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('cleaner', ['Relationship Cleaner'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <ClubSettingsGroup
            v-else-if="item.kind === 'clubs'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="clubs"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('clubs')"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <DresserOutfitsGroup
            v-else-if="item.kind === 'dresser-outfits'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="dresser-outfits"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'dresser' && activeMenu[0] === 'Outfits Settings')"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <OccultSettingsGroup
            v-else-if="item.kind === 'occult'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="occult-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :selected-species="selectedOccultSpecies"
            :show-heading="!(browsingMenus && activeCategory === 'occult')"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <PopulationSettingsGroup
            v-else-if="item.kind === 'population'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="population-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'population')"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <SettingsGroup
            v-else-if="item.kind === 'settings-group'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            :id="item.key"
            :group="item.group"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === item.group.category && item.group.menuPath.length > 0 && pathStartsWith(activeMenu, item.group.menuPath))"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <TunerSettingsGroup
            v-else-if="item.kind === 'tuner'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="tuner-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'tuner')"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <PregnancySettingsGroup
            v-else-if="item.kind === 'pregnancy-settings'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            :id="item.key"
            :group="item.group"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'pregnancy' && pathStartsWith(activeMenu, item.group.menuPath))"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <OffspringSettingsGroup
            v-else-if="item.kind === 'offspring'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="offspring-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('pregnancy', ['Offspring'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <AutosaveGroup
            v-else-if="item.kind === 'autosave'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="autosave"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('core', ['Auto-Save'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <MotiveDecayGroup
            v-else-if="item.kind === 'motive-decay'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="motive-decay"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('core', ['Gameplay', 'Motive Decay'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <SkillSettingsGroup
            v-else-if="item.kind === 'skills'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="skill-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('core', ['Gameplay', 'Skill Settings'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <MoneySettingsGroup
            v-else-if="item.kind === 'money'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="money-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('core', ['Money Settings'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <ConsoleSettingsGroup
            v-else-if="item.kind === 'console'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="console-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!isSelectedMenu('core', ['Notifications/Console/Menu Settings', 'Console Command Settings']) && !isSelectedMenu('core', ['Notifications/Console/Menu Settings', 'Console Command Settings', 'BuildBuy Settings'])"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <NotificationSettingsGroup
            v-else-if="item.kind === 'notifications'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="notification-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'core' && pathStartsWith(activeMenu, ['Notifications/Console/Menu Settings', 'Notification Settings']))"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <MenuVisibilityGroup
            v-else-if="item.kind === 'menu-visibility'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="menu-visibility"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <RelationshipSettingsGroup
            v-else-if="item.kind === 'relationships'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="relationship-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <AutoRelationshipSettingsGroup
            v-else-if="item.kind === 'auto-relationships'"
            v-show="item.settings.some(setting => visibleKeys.has(setting.key))"
            id="auto-relationship-settings"
            :settings="item.settings"
            :values="current"
            :visible-keys="visibleKeys"
            :changed-keys="changedSet"
            :errors="errors"
            :reset-versions="resetVersions"
            :show-heading="!(browsingMenus && activeCategory === 'core' && pathStartsWith(activeMenu, ['Relationship Settings', 'Auto-Relationship Settings']))"
            @update="update"
            @error="setError"
            @undo="undo"
          />
          <template v-else>
          <template v-for="setting in [item.setting]" :key="setting.key">
          <h3 v-if="groupHeadings.has(setting.key)" class="px-4 pb-1 pt-6 text-xs font-semibold leading-relaxed text-muted-foreground sm:px-5">{{ groupHeadings.get(setting.key) }}</h3>
          <article v-show="visibleKeys.has(setting.key)" :data-setting="setting.key" class="rounded-lg px-4 py-6 transition-colors hover:bg-muted/30 sm:px-5" :class="changedSet.has(setting.key) ? 'bg-muted/60' : ''">
            <div class="flex flex-col justify-between gap-4 xl:flex-row xl:items-start xl:gap-8">
              <div class="min-w-0 flex-1 xl:max-w-[57%]">
                <div class="flex flex-wrap items-center gap-2"><label :for="`setting-${encodeURIComponent(setting.key)}`" class="text-[13px] font-medium leading-5">{{ setting.label }}</label><span v-if="changedSet.has(setting.key)" class="size-1.5 rounded-full bg-primary" title="Modified" aria-label="Modified" /><Badge v-if="setting.impact" variant="outline" class="border-0 bg-warning-background px-1.5 py-0 text-[9px] font-medium text-warning">{{ setting.impact.level === 'interrupts' ? 'May interrupt play' : 'Gameplay impact' }}</Badge><Badge v-if="!setting.documented" variant="secondary" class="border-0 px-1.5 py-0 text-[9px] font-normal">Not in reference</Badge></div>
                <p class="mt-1.5 break-words text-xs leading-[1.7] text-muted-foreground">{{ setting.description }}</p>
                <div v-if="setting.impact" class="mt-2.5 flex gap-2 rounded-md bg-warning-background px-2.5 py-2 text-[11px] leading-relaxed text-warning"><MessageSquareWarning class="mt-0.5 size-3.5 shrink-0" /><p>{{ setting.impact.description }}</p></div>
                <div class="mt-3 flex flex-wrap items-start gap-2">
                  <Badge variant="secondary" class="max-w-full whitespace-normal break-words border-0 bg-muted/60 px-2 py-1 text-left text-[10px] font-normal leading-relaxed text-muted-foreground">{{ menuBadge(setting) }}</Badge>
                  <Badge variant="secondary" class="max-w-full whitespace-normal break-all border-0 bg-muted/60 px-2 py-1 text-left text-[10px] font-normal leading-relaxed text-foreground/75"><code>{{ setting.key }}</code></Badge>
                </div>
                <div v-if="setting.defaultValue !== undefined || setting.documentationSource === 'in-game' || setting.min !== undefined || setting.max !== undefined" class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] leading-relaxed text-muted-foreground">
                  <span v-if="setting.defaultValue !== undefined">MCCC default: {{ setting.defaultLabel ?? (typeof setting.defaultValue === 'boolean' ? (setting.defaultValue ? 'Enabled' : 'Disabled') : setting.defaultValue) }}</span>
                  <span v-if="setting.min !== undefined || setting.max !== undefined">Allowed range: {{ setting.min ?? 'no documented minimum' }} to {{ setting.max ?? 'no documented maximum' }}</span>
                  <span v-if="setting.documentationSource === 'in-game'" :title="setting.sourceNote">Source: in-game documentation</span>
                </div>
              </div>
              <div class="flex min-w-0 items-start gap-3 xl:w-[38%] xl:justify-end"><SettingControl :key="`${epoch}-${resetVersions[setting.key] ?? 0}-${setting.key}`" class="min-w-0 flex-1" :meta="setting" :species="selectedOccultSpecies" :model-value="current[setting.key]!" @update:model-value="update(setting.key, $event)" @error="setError(setting.key, $event)" /><Button v-if="changedSet.has(setting.key) || errors[setting.key]" variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground" :aria-label="`Undo ${setting.label}`" :title="`Restore original: ${formatValue(original[setting.key])}`" @click="undo(setting.key)"><Undo2 class="size-3.5" /></Button></div>
            </div>
          </article>
          </template>
          </template>
          </template>
          <div v-if="matches.length > pageSize" class="flex flex-wrap items-center justify-center gap-3 p-5">
            <span class="text-xs text-muted-foreground">Showing {{ pageSize }} of {{ matches.length }}</span>
            <Button variant="outline" size="sm" @click="pageSize += 50">Show 50 more <ChevronDown class="size-3" /></Button>
            <Button variant="outline" size="sm" @click="pageSize = matches.length">Show all</Button>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span class="flex items-center gap-1.5"><ShieldCheck class="size-3.5" /> {{ draftStatus }}</span><span>{{ documentedCount }} documented settings <span class="px-1">·</span> {{ settings.length - documentedCount }} additional {{ settings.length - documentedCount === 1 ? 'key' : 'keys' }} preserved<template v-if="internalCount"><span class="px-1">·</span> {{ internalCount }} internal {{ internalCount === 1 ? 'value' : 'values' }} preserved</template></span></div>
      </section>
    </main>

    <div v-if="notice" class="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-xl bg-card p-4 shadow-lg" role="status"><Check class="mt-0.5 size-4 shrink-0 text-primary" /><p class="flex-1 text-xs leading-relaxed">{{ notice }}</p><button aria-label="Dismiss notification" class="text-muted-foreground" @click="notice = ''"><X class="size-3.5" /></button></div>
    <div v-if="isDragging" class="pointer-events-none fixed inset-3 z-[100] flex items-center justify-center rounded-2xl bg-background/95"><div class="text-center"><FolderOpen class="mx-auto mb-4 size-10 text-primary" /><p class="text-xl font-semibold">Drop your config here</p><p class="mt-2 text-sm text-muted-foreground">mc_settings.cfg stays on your device</p></div></div>

    <Dialog v-model:open="presetsOpen"><DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle class="flex items-center gap-2"><Sparkles class="size-5 text-primary" /> A small change of pace</DialogTitle><DialogDescription>Presets adjust a few settings in your current file. Review exactly what changes before applying.</DialogDescription></DialogHeader><div class="space-y-3 py-2"><button v-for="item in presets" :key="item.id" class="w-full rounded-lg p-4 text-left transition-colors hover:bg-muted/50" :class="selectedPreset === item.id ? 'bg-accent/70' : ''" :aria-pressed="selectedPreset === item.id" @click="selectedPreset = item.id"><div class="flex items-center justify-between gap-3"><span class="text-sm font-medium">{{ item.name }}</span><Check v-if="selectedPreset === item.id" class="size-4 text-primary" /></div><p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">{{ item.description }}</p></button></div><div class="rounded-lg bg-muted/60 p-4"><p class="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{{ presetChanges.length }} {{ presetChanges.length === 1 ? 'setting' : 'settings' }} will change</p><div v-for="([key, value]) in presetChanges" :key="key" class="mb-2 flex items-center justify-between gap-3 text-xs"><span>{{ labelFor(key) }}</span><span class="flex shrink-0 items-center gap-2"><span class="text-muted-foreground">{{ formatValue(current[key]) }}</span><ArrowRight class="size-3 text-muted-foreground" /><strong class="font-medium text-primary">{{ formatValue(value) }}</strong></span></div><p v-if="!presetChanges.length" class="text-xs text-muted-foreground">Your settings already match the available options in this preset.</p><p v-if="presetSkipped" class="mt-3 text-xs text-muted-foreground">{{ presetSkipped }} options aren’t compatible with this file and will be skipped.</p></div><DialogFooter><Button variant="outline" @click="presetsOpen = false">Cancel</Button><Button :disabled="!presetChanges.length || !!errorCount" @click="applySelectedPreset">Apply {{ presetChanges.length }} {{ presetChanges.length === 1 ? 'change' : 'changes' }}</Button></DialogFooter><p v-if="errorCount" class="text-xs text-destructive">Correct incomplete fields before applying a preset.</p></DialogContent></Dialog>

    <Dialog v-model:open="exportOpen"><DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Your settings, ready for the game</DialogTitle><DialogDescription>{{ changes.length ? `${changes.length} settings changed from your starting file.` : 'No settings changed. The download will preserve your current configuration.' }}</DialogDescription></DialogHeader><div v-if="isExample" class="rounded-lg bg-warning-background p-3 text-xs leading-relaxed text-warning">This config is based on the supplied example, not MCCC factory defaults. Import your own config first if you want to preserve your existing setup.</div><div v-if="changes.length" class="max-h-64 space-y-2 overflow-y-auto rounded-lg"><div v-for="key in changes" :key="key" class="px-4 py-3"><p class="mb-1.5 text-xs font-medium">{{ labelFor(key) }}</p><div class="flex items-start gap-2 text-[11px]"><span class="min-w-0 flex-1 break-all text-muted-foreground">{{ formatValue(original[key]) }}</span><ArrowRight class="mt-0.5 size-3 shrink-0 text-muted-foreground" /><span class="min-w-0 flex-1 break-all text-primary">{{ formatValue(current[key]) }}</span></div></div></div><div class="rounded-lg bg-muted/60 p-4 text-xs leading-relaxed"><p class="font-medium">Put your config into play</p><ol class="mt-2 list-inside list-decimal space-y-1.5 text-muted-foreground"><li>Close The Sims 4 before replacing the file.</li><li>Keep a backup of your current config.</li><li>Replace <code class="text-foreground">mc_settings.cfg</code> in your MCCC mod folder with the download.</li></ol></div><DialogFooter class="gap-2"><Button variant="outline" @click="download(original, 'mc_settings.original.cfg'); toast('Original configuration downloaded.')"><ArrowDownToLine class="size-4" /> Original backup</Button><Button :disabled="!!errorCount" @click="exportConfig"><Download class="size-4" /> Download mc_settings.cfg</Button></DialogFooter></DialogContent></Dialog>

    <Dialog v-model:open="resetOpen"><DialogContent><DialogHeader><DialogTitle>Restore your starting settings?</DialogTitle><DialogDescription>This will undo all {{ changes.length }} changes and restore the configuration you imported or started with. It does not restore MCCC factory defaults.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" @click="resetOpen = false">Keep editing</Button><Button @click="resetAll(); resetOpen = false; toast('Starting settings restored.')">Restore starting settings</Button></DialogFooter></DialogContent></Dialog>
    <Dialog v-model:open="replaceOpen"><DialogContent><DialogHeader><DialogTitle>Open a different configuration?</DialogTitle><DialogDescription>Importing {{ pendingFile?.name }} will replace the current draft. Download your changes first if you want to keep them.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" @click="replaceOpen = false; pendingFile = null">Keep editing</Button><Button @click="acceptFile">Import new configuration</Button></DialogFooter></DialogContent></Dialog>
    <Dialog v-model:open="aboutOpen"><DialogContent class="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>A calmer way to configure MCCC</DialogTitle><DialogDescription>An independent, unofficial editor for Deaderpool’s MC Command Center.</DialogDescription></DialogHeader><div class="space-y-4 text-sm leading-relaxed text-muted-foreground"><p>Files are read and edited in your browser. Your draft is saved on this device; no account or upload is needed.</p><p>Most descriptions and verified option values come from the official MCCC reference. The bundled snapshot contains {{ referenceInfo.recordCount }} entries, retrieved {{ referenceInfo.retrievedAt }}. Some settings are documented through user-provided in-game observations, identified in the setting details. This config does not identify its MCCC version, so some settings and EA defaults may differ.</p><p>Additional keys and unfamiliar option codes are preserved. Gameplay notes are guidance about behavior, not a judgment about how you should play.</p><p>The supplied example is a personal configuration. It is not a set of factory defaults.</p><a :href="referenceSource" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 font-medium text-primary underline underline-offset-4">Open the official settings reference <ExternalLink class="size-3.5" /></a></div></DialogContent></Dialog>
  </div>
</template>
