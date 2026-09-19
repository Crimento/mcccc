# In-game settings documentation

These observations supplement the bundled website reference. Keep them separate from `src/data/settings-reference.json`, which the reference refresh script replaces.

See [the all-settings review](settings-review.md) for the final grouping pass, description cleanup, remaining text inputs, and confirmed choice inventories.

## Stop human aging

Source: the user's in-game option list and saved `AgeStopHuman` value with all options selected: `"I,TD,C,T,YA,A,E"`.

Under MCCC Settings → Age, **Stop Human Aging** uses seven independent checkboxes in chronological order: Infant (`I`), Toddler (`TD`), Child (`C`), Teen (`T`), Young Adult (`YA`), Adult (`A`), and Elder (`E`). It remains a comma-separated string on export; no selected ages produces `""`. Unfamiliar imported codes remain available and are preserved when known choices change. This confirms choices for this key without extending other settings' age lists.

## Gameplay numeric controls

The user reported these ranges while reviewing Gameplay: `Game_Time_Speed` is 1–1000 with default 25, `Maximum_Household_Size` is 8–104, and `Maximum_Rename_Length` is 14–255. The controls use whole-number sliders with precise inputs. The default is informational; opening the editor does not replace imported values.

The user corrected an initial household maximum typo to 104, matching the bundled reference. Imported values outside the reviewed ranges remain intact until edited. The reference supplies the descriptions of time-speed behavior and CAS limitations.

## Motive decay group

The user confirmed the same 0–500 range for the eight entries under Gameplay → Motive Decay. The editor groups `MotiveDecay_Sims`, `Pregnancy_BabyMotiveDecay`, `MotiveDecay_Vampires`, `MotiveDecay_Cats`, `MotiveDecay_Dogs`, `MotiveDecay_Horses`, `Decay_Ratio_Fame`, and `Decay_Ratio_Prestige` with independent percentage sliders and precise inputs, plus one shared explanation.

The bundled descriptions identify 100% as normal/default decay, 50% as half the rate, and 0% as no decay. Higher percentages increase decay; traits and buffs still apply unless the rate is zero. The desktop view uses two columns, with one column on small screens. Each setting keeps its original key, separate Undo, search/filter behavior, and validation state. Missing fields are not created, and unfamiliar imported types or out-of-range values remain preserved until edited. Other decay settings outside this exact eight-key list are unaffected.

## Skill settings group

Source: the user's skill names and saved IDs, with the bundled reference supplying the behavior of the five existing settings. `src/lib/skill-settings.ts` groups difficulty adjustment and its include/exclude lists under **Skill difficulty**, and the freeze and cheat-bypass lists under **Skill progression and cheats**. The existing difficulty range remains −50 to 10, default 0; negative values slow skill progress and positive values speed it up.

The four list keys are `Skill_Difficulty_Blacklist`, `Skill_Difficulty_Whitelist`, `Skill_Freeze_List`, and `Skill_Cheats_Bypass`. The exclude/include lists limit which skills receive the difficulty adjustment; the freeze list stops progression, and the bypass list excludes skills from MC Cheat commands that change all skills. No precedence between simultaneous include/exclude selections is inferred.

The known inventory has 62 unique choices in alphabetical label order. The user clarified the initially duplicated mappings: **Entrepreneur** is `274197`, **Fabrication** is `231908`, **Media Production** is `192655`, and **Medium** is `255249`. All four are included. **Tattooing** corrects a display typo without changing its supplied ID.

Unfamiliar or modded skill IDs stay read-only and local to the imported config. Known-choice edits preserve every unrelated raw CSV token exactly, including whitespace, duplicate IDs, empty segments, and integers too large for JavaScript's safe numeric range. Selecting a known skill already present with surrounding whitespace leaves the string unchanged; deselecting it removes only matching known segments. Other tokens are never trimmed, deduplicated, numerically converted, or reordered. Missing settings and unfamiliar imported types remain preserved.

## Neighborhood Action Plan choices

Source: the user's supplied menu labels and saved codes for `Neighborhood_Action_Plan_Bypass`. `src/data/neighborhood-action-plans.ts` records all 19 choices in alphabetical label order, including **Water Conservation** (`233563`) and **We Wear Bags** (`237916`). Checked choices are plans to bypass, and an empty string means no plans are bypassed. Unfamiliar imported codes remain preserved.

The setting remains a comma-separated string. The supplied example `"231969,231973,231971"` selects Juiced Community, Fun-Loving Community, and Tech Support, in that stored order. It is not numerically sorted. Existing checkbox edits preserve token insertion order and retain unfamiliar imported tokens; alphabetical display order does not reorder the saved selections.

## Lifespan editor layout

Age → Age Span Durations groups the twelve existing settings under **Humans**, **Cats**, **Dogs**, and **Horses**, in that order. Each species retains its three Short, Normal, and Long profile keys. Desktop layouts place ages in rows and the three profiles in columns; mobile layouts use profile tabs. Choosing a tab changes the editor view, not the game's lifespan mode.

Each species starts collapsed behind an **Edit details** button with its field count. Collapsing the group keeps edits and incomplete inputs intact; invalid values still prevent export and are indicated beside the button.

`src/lib/lifespans.ts` holds the exact species, field, and profile mappings without importing the settings catalogue. Human rows use Newborn, Infant, Toddler, Child, Teen, Young Adult, Adult, Elder, while the stored keys remain `Baby`, `Infant`, `Toddler`, `Child`, `Teen`, `YoungAdult`, `Adult`, `Elder`. Pet rows use `Child`, `Adult`, and `Elder`.

Grouping changes presentation only. The twelve saved keys and their labels remain unchanged, absent profiles or age fields are not inserted, and unfamiliar fields or imported types remain preserved. The existing precise inputs, default markers, and validation rules continue to apply. Autosave settings are unaffected.

## Human lifespans

Source: the user's reported age order, allowed range, decimal support, and EA defaults for all three human lifespan modes. These observations supplement the existing reference entries for `AgeSpanShort`, `AgeSpanNormal`, and `AgeSpanLong`. The game and MCCC versions were not supplied.

The game's lifespan mode selects the relevant profile. Each profile stores eight numeric durations in days. The editor uses the following chronological order and display labels while preserving the original object keys:

| Config field | Display label | Short EA default | Normal EA default | Long EA default |
| --- | --- | ---: | ---: | ---: |
| `Baby` | Newborn | 0.5 | 1 | 4 |
| `Infant` | Infant | 2.5 | 5 | 20 |
| `Toddler` | Toddler | 3.5 | 7 | 28 |
| `Child` | Child | 7 | 14 | 56 |
| `Teen` | Teen | 10.5 | 21 | 84 |
| `YoungAdult` | Young Adult | 14 | 28 | 112 |
| `Adult` | Adult | 21 | 42 | 168 |
| `Elder` | Elder | 7 | 14 | 56 |

The confirmed range is **0–4000 days**. Numeric `0` means **Use EA default**, rather than an age lasting zero days. Setting the input or slider to zero saves that numeric marker; the input shows `0` and the helper text shows the reported EA duration. A custom duration can be any supported decimal greater than zero through 4000; the slider's half-day increment is a convenience, not a precision restriction on the numeric input. For example, a custom `2.25` remains valid and is not rounded to a half day.

`DefaultNumberFieldMeta.label` supplies the display aliases, and its optional `sliderStep` opts these human fields into sliders at `0.5` increments. Numeric validation uses the allowed range independently of that slider increment. Pet lifespan fields have their own 1–1000-day custom range and whole-day slider increment.

The reported defaults are informational and may change in future game versions. Adding this metadata neither changes imported values nor inserts absent age fields or profiles. Unfamiliar object fields and imported representations remain preserved. These three observations overlap existing reference entries, so the example still contains 439 editable settings and three preserved internal values.

## Pet lifespan defaults

Source: the user's reported defaults for all nine cat, dog, and horse profiles, supplementing the earlier screenshot of **Set Horse Age Span Duration…**. The user checked the saved config and confirmed that numeric `0` uses the EA default. The game and MCCC versions were not supplied.

The game's lifespan setting selects the relevant profile. Each profile stores durations in days for `Child`, `Adult`, and `Elder`, in that order. The reported “medium” profile corresponds to the config key containing `Normal`. The confirmed custom-duration range is **1–1000 days**, including fractions.

| Config key | Child | Adult | Elder |
| --- | ---: | ---: | ---: |
| `AgeSpanCatShort` | 1 | 15 | 5.5 |
| `AgeSpanCatNormal` | 2 | 30 | 11 |
| `AgeSpanCatLong` | 8 | 120 | 44 |
| `AgeSpanDogShort` | 1 | 12.5 | 4.5 |
| `AgeSpanDogNormal` | 2 | 25 | 9 |
| `AgeSpanDogLong` | 8 | 100 | 36 |
| `AgeSpanHorseShort` | 3.5 | 25 | 6.5 |
| `AgeSpanHorseNormal` | 7 | 50 | 13 |
| `AgeSpanHorseLong` | 28 | 200 | 52 |

The latest report corrects the short horse Elder default from the previously reported **6** to **6.5 days**. This corrects the informational default, not an imported custom value. These reported defaults may change in future game versions.

All nine profiles use sliders and precise numeric inputs. Setting either control to **0** saves the EA-default marker; the input continues to show `0`, and helper text shows the reported EA duration. Custom values from **1 through 1000 days** are accepted, including fractions such as `3.5` or `12.25`. A value of `1` is a custom one-day duration, not the default marker.

Pet sliders use whole-day steps, so the first step above the default marker is `1`; the slider cannot select a value in the invalid interval between `0` and `1`. The precise input accepts any supported decimal within the custom range, independently of the slider step. Editing another age does not round existing fractional values. Profiles and age fields absent from the imported file are not inserted, and unfamiliar fields and representations remain preserved.

These observations extend metadata for the six cat/dog entries already in the reference and update the three horse observations. They do not change the example's 439 editable settings or three preserved internal values.

### Earlier horse observation

The screenshot states that `0` uses EA’s default for the selected age span. It shows a custom range of **1–1000**, with a default and input value of **3.5** for the short child span. Fractional days are therefore supported; no fixed increment has been established.

The screenshot alone did not establish a menu hierarchy beyond its dialog title. The species grouping places these profiles under MCCC Settings → Age → Age Span Durations → Horses. The horse observations are kept separate from the official website reference.

## Bypass dorm residents

Source: three user-provided **Bypass Dorm Residents** screenshots, identified as the Marriage, Population (move-outs), and Pregnancy settings respectively. The MCCC version was not supplied. Each screenshot explicitly lists **Enabled** as the default.

| Config key | When enabled | MCCC default |
| --- | --- | --- |
| `Marriage_BypassDorms` | Skips dorm residents as either the target or spouse in scheduled random marriages. | `true` (Enabled) |
| `Population_MovingBypassDorms` | Skips dorm residents when moving Sims to retirement homes or moving single Sims out. | `true` (Enabled) |
| `Pregnancy_BypassDorms` | Skips dorm residents as either the target or pregnancy partner in scheduled random pregnancies. | `true` (Enabled) |

Here, “bypass” means excluding dorm residents from the specified feature. Disabling one of these options removes that exclusion for its feature; other eligibility settings still apply. The population option is documented specifically for retirement-home moves and single-Sim move-outs.

The editor uses ordinary boolean toggles for these settings and preserves imported values. Recording the defaults does not apply them automatically. The module associations above were supplied by the user; a complete menu hierarchy has not been recorded.

## Autosave controls

Source: the user's confirmed interval dropdown codes and integer ranges, supplemented by the bundled official descriptions. `Autosave_IntervalType` offers **Pre-Midnight Alarm** (`PM`), **Real Hours** (`RH`), **Sim Day** (`SD`), and **Sim Hour** (`SH`). Pre-Midnight Alarm saves before midnight each Sim night, before MCCC alarms run, and ignores the interval amount. Other interval types interpret the amount in their selected time unit.

`Autosave_IntervalAmount` accepts integers **1–24**, and `Autosave_MaxSaveNumber` accepts integers **1–10**. Both use sliders and precise numeric inputs. The save name and hexadecimal slot number retain their existing text controls without new constraints; for example, the reference maps slot text `"1111"` to `Slot_00001111.save`.

`src/lib/autosave.ts` groups the seven saved settings into **Main** (enabled, confirmation), **Autosave interval** (type, amount), and **Autosave settings** (name, slot number, maximum save number). Grouping adds no keys or defaults. Unfamiliar interval codes, unusual imported types, and missing settings remain preserved.

### Autosave internal value

The user checked the in-game Auto-Save settings menu and found no control corresponding to `Autosave_CurrentSaveNumber`. The supplied screenshot shows the name, slot number, maximum save slot number, interval amount/type, and confirmation dialog options. The user also confirmed that `Autosave_Enabled` appears farther down the menu, outside the screenshot.

Within the autosave options, the editor treats only `Autosave_CurrentSaveNumber` as internal at the user’s request: it is omitted from settings controls, search results, and the undocumented-settings count. Its imported value and JSON type remain in the config for draft storage, backup, and export. Other autosave settings remain editable.

Its name suggests a counter for autosave rotation, possibly related to `Autosave_MaxSaveNumber`. That role and the exact counter behavior have **not** been verified, so the editor does not reset it, constrain it, or mark it as documented.

## Career Neighborhood Stories

Source: a user-provided **Alter Neighborhood Stories** screenshot. The user confirmed that toggling this menu option changes `Career_LimitNS` between `false` and `true` in the saved config. The screenshot establishes the menu’s behavior and **Disabled** default. The MCCC version was not supplied.

When the pictured option is enabled, Neighborhood Stories career changes are limited by MC Career settings. Played Sims are skipped if **Bypass Played Households** is enabled, and Sims flagged **Freeze Careers** are skipped.

The editor displays this as **Alter Neighborhood Stories** under **Career → Neighborhood Stories Settings**, with the documented MCCC default of `false` (Disabled). It preserves the imported boolean value until edited. The key is counted as documented in-game.

## Unidentified DP values

The user found no corresponding menu options for `DP_OneTimeUpdate` or `DP_UseOnly`. Both are empty strings in the supplied config. Their purpose and actual defaults are unknown; an empty example value does not establish either.

The editor treats these two exact keys as suspected internal values, alongside `Autosave_CurrentSaveNumber`. They are hidden from editing and their contents and JSON types are preserved in drafts, backups, and exports, including when another file contains nonempty values. Other keys starting with `DP_` are not automatically hidden. No update, migration, or other behavior is inferred from their names.

## Pause on zone load

Source: the user-provided **Pause on Zone** screenshot and confirmation that toggling the menu option changes `Pause_on_Zone` in the config. The MCCC version was not supplied.

When enabled, the game pauses each time a new zone loads. The screenshot shows **Disabled** as the default, corresponding to `false`. The editor lists it under General & gameplay and highlights the repeated pauses with a **May interrupt play** note. This describes the enabled behavior even when the imported value is off.

## Allow homeless romance move-ins

Source: the user-provided **Allow Homeless Romance Move-In** screenshot and confirmation that toggling the option changes `Relationship_MoveinHomeless`. The user identified its in-game location as the auto-relationship settings in the general section. The MCCC version was not supplied.

When enabled, homeless Sims can move in with Sims who live on a lot, or with other homeless Sims, based on their current romance levels. The screenshot shows **Enabled** as the default, corresponding to `true`. This setting allows those moves; enabling it does not by itself trigger a move-in or replace the other auto-relationship settings.

The user's later full outline places it under Relationship Settings → Auto-Relationship Settings → Move-In Settings. Both this option and Pause on Zone retain their imported boolean values until edited; documenting a default does not apply it automatically.

## Death notification audience

Source: the user-provided **Show Death Notifications** screenshot and reported audience codes for `Show_DeathNotificationType`. The MCCC version was not supplied.

The setting chooses which Sims’ deaths produce a notification post. The screenshot identifies **None** as the default; **Played Only** is the current selection shown by the checkmark. These are distinct: the editor displays the documented default without changing the value imported from a file.

| Config string | Audience |
| --- | --- |
| `"0"` | None / no notifications |
| `"N"` | NPCs only |
| `"P"` | Played or active Sims |
| `"R"` | Sims related to the active household |
| `"AF"` | Friends of the active household |
| `"AR"` | Romantic interests of the active household |
| `"AL"` | All |

The user supplied the six letter codes. The string `"0"` for None is consistent with the supplied config and the existing notification reference; it is preserved as a string on export.

`src/lib/notification-audiences.ts` provides the shared code-to-label map and creates option lists for settings with verified audience codes. The full list is used for death notifications and the documented marriage, birth, pregnancy, pregnancy-affair, age-up, and moving notifications. Existing official descriptions qualify `AL` as all Sims outside the active household for those older entries; their option lists retain that wording. Neighborhood Stories and pet notifications use their documented subsets and wording, without acquiring extra choices from the shared list.

The older reference key `Show_DeathNotifications` remains a separate supported key. The editor does not rename it or add it to files containing `Show_DeathNotificationType`. Unrecognized imported codes remain available and round-trip unchanged until the user selects a replacement.

## Teleport Sim overlap

Source: the user-provided **Teleport Sim Overlap** screenshot for `Teleport_Sims_Overlap`. The MCCC version and full menu path were not supplied.

When enabled, teleporting a Sim to another Sim’s location places the arriving Sim directly on top of the other Sim. When disabled, the arriving Sim is placed to the side instead. The screenshot identifies **Enabled** as the default, corresponding to `true`.

The editor lists this under General & gameplay with the section Teleportation. It uses the existing boolean control and preserves the imported value until edited.

## Abduction controls and encoded values

Source: user-provided code mappings, age order, and ranges, supplementing the existing official descriptions. The MCCC version was not supplied.

| Config key | Editor control | Config representation |
| --- | --- | --- |
| `Occult_AbductionPregnancyGenders` | Male / Female dropdown | `"M"` / `"F"` strings |
| `Occult_AgePercentage` | Four independent 0–100% sliders: Teen, Young Adult, Adult, Elder | Four numbers in one comma-separated string, in that order |
| `Occult_AbductionStartHour` | 0–23 hour slider | JSON number; 0 is midnight and 23 is 11 PM |
| `Occult_AbductionDuration` | 1–24 hour slider | JSON number of hours after the start time during which abductions may occur |

The four age percentages are separate pregnancy chances, not a distribution that must total 100. The supplied `"30,30,30,30"` is preserved until edited. Changing one age changes only its corresponding value; it does not normalize the others. Precise numeric inputs accompany the sliders.

Unknown imported gender codes remain available as values from the file. Unrecognized age-list formats retain their original representation instead of being shortened or coerced into four fields. Values are not reset to defaults or silently clamped on import. Only these verified keys receive the new controls; similar-looking strings elsewhere remain available for manual review.

## MCCC Settings menu organization

Source: the user's in-game menu outlines, matched against the reference and config. Reviewed branches cover Age, Auto-Save, Gameplay, Money Settings, Notifications/Console/Menu Settings, and Relationship Settings, including the final Phone Texts and Show Menu Settings entries. The latest hierarchy additions change navigation and labels only; they add no enum controls or numeric bounds.

| Menu | Editable settings in the example | Organization |
| --- | ---: | --- |
| Age | 13 | Age Span Durations → Humans / Cats / Dogs / Horses, each with Short, Normal, Long profiles; Stop Human Aging remains directly under Age |
| Auto-Save | 7 | Name, Slot Number, Maximum Save Slot Number, Save Interval Amount, Save Interval Type, Show Confirmation Dialog, Use Auto-Save |
| Gameplay | 28 | General gameplay plus nested Death Settings, Motive Decay, and Skill Settings |
| Money Settings | 8 | Bills, child support, and inheritance |
| Notifications/Console/Menu Settings | 42 | One menu-order value, Phone Texts, five Show Menu settings, ten console settings, three logging settings, and 22 notification settings |
| Relationship Settings | 16 | Six direct settings and ten Auto-Relationship settings, including Breakup and Move-In menus |
| More MCCC Settings | 0 | Hidden for this example; retained as a fallback for other core keys |

Reviewed menus now organize all 114 core settings in the example. **Skill Difficulty Include List** maps to `Skill_Difficulty_Whitelist`, which the older reference calls Skill Adjustment Whitelist. Modern keys such as `Pause_on_Zone`, `Teleport_Sims_Overlap`, and `Show_DeathNotificationType` retain their exact spelling.

The top-level navigation follows the supplied module names. Existing reference paths resolve cases where a setting's module field differs from its in-game location: MC Marriage settings belong under Pregnancy, as do pet pregnancy notifications; `Tuner_Child_Pay_Bills` belongs under MCCC Settings. WooHoo remains a separate module. Other settings provides a fallback for unknown imported keys. All 439 editable settings and three hidden internal values remain in the config; navigation never adds, removes, or renames keys.

`src/lib/navigation.ts` stores the menu tree, explicit reviewed key mappings, and display order separately from descriptions and control types. Search includes module and submenu names and remains global. Changing menus keeps controls mounted so incomplete edits and validation errors survive navigation.

### Money Settings

| Menu label | Config key | Stored type |
| --- | --- | --- |
| Allow Child Pay Bills | `Tuner_Child_Pay_Bills` | Boolean |
| Apartment Bill Percent | `Bill_AmountPercentApartment` | Number |
| Auto-pay Bills | `Bill_AutoPay` | Boolean |
| Change Bills Percent | `Bill_Amount_Percent` | Number |
| Child Support Percent | `Pay_Child_Support_Percent` | Number |
| Inheritance Sim Type | `Inherit_Sim_Type` | String |
| Inheritance Spouse First | `Inherit_Spouse_First` | Boolean |
| Pay Child Support | `Pay_Child_Support_Type` | String |

`src/lib/money-settings.ts` groups these eight existing keys into **Bills** (apartment and house adjustments, auto-pay, child bill payment), **Child support** (type and percentage), and **Inheritance** (Sim type and spouse priority). Each setting stays independent: changing one does not disable, reset, or insert another.

The user confirmed integer ranges of **−100–1000%** for both bill adjustments. The reference explains that 0 leaves normal bills unchanged, −100 removes the normal bill component except child support, and 100 doubles it. Apartment and house adjustments use separate sliders and precise inputs. Child Support Percent keeps its documented **1–1000%** range, based on total worth per child. Pay Child Support keeps its existing codes `A` = All, `M` = Married Only, `U` = Unmarried Only, `N` = None.

The user confirmed four Inheritance Sim Type codes: `0` = **None** (default), `A` = **Active Only**, `AL` = **All**, and `N` = **NPC Only**. The older reference lists two additional audiences without verified encodings; the editor does not infer those codes. Its updated description retains the documented behavior: the deceased Sim's share of household funds goes to an eligible spouse or is divided equally among children, with other adults' shares retained. Unfamiliar imported inheritance codes and JSON types remain preserved, and bounds attach only to actual numeric values. Grouping and informational defaults do not change the imported config.

### Notifications, console commands, and logging

| Branch | Config keys | Contents |
| --- | ---: | --- |
| Change Sim Menu Order | 1 | `Menu_Order` |
| Phone Texts | 1 | `Silence_Phone_Texts` |
| Show Menu Settings | 5 | `Bypass_Sim_Menus`, `Show_Cheats_Menu_Type`, `Show_Computer_Menu_Type`, `Show_Gnome_Menu_Type`, `Show_Sim_Menu_Type` |
| Console Command Settings, direct | 5 | `Debug_Cheats_Enabled`, `Full_Edit_CAS`, `Headline_Effects_Enabled`, `Hover_Effects_Enabled`, `Testing_Cheats_Enabled` |
| Console Command Settings → BuildBuy Settings | 5 | `BB_Debug_Objects_Enabled`, `BB_Free_Build_Enabled`, `BB_Ignore_Unlocks_Enabled`, `BB_Move_Objects_Enabled`, `BB_Show_Live_Objects` |
| Logging Settings | 3 | `Logging_Enabled`, `Logging_Append`, `Logging_LessLENotes` |
| Notification Settings, direct | 4 | Show Notifications, Show Version Update Notifications, Show Autosave Notifications, Show Club Monitor Notifications |
| Notification Settings → Aging/Death Notifications | 4 | Age-Up, NPC Birthday, Death, and Pet Death notifications |
| Notification Settings → MC Population Notifications | 2 | Empty House and Moving notifications |
| Notification Settings → MC Pregnancy Notifications | 6 | Marriage, Birth, Birth details, Pregnancy, Pregnancy Affair, and Relationship Change notifications |
| Notification Settings → Neighborhood Stories Settings | 6 | Population, Pregnancy, Death, Pet Adoption, Adoption, and Career notifications |

Console Command Settings contains ten persistent booleans, including its five BuildBuy children. The official label is **Debug Commands in Cheats**. Logging's three settings are also booleans. Notification Settings contains 22 keys in the example: seven booleans and 15 strings for audience/version choices. `Show_NSPetAdoption` is a boolean, while the other five Neighborhood Stories notification fields select audiences.

Logging keeps three separate rows in the requested order: `Logging_Enabled`, `Logging_Append`, then `Logging_LessLENotes`. The last row's shorter, fully visible description summarizes the official reference: enabled shows the first LE notification until a zone change or lot reload, disabled shows every LE notification, and `mc_cmd_center.log` errors still appear each time.

The console editor groups those ten settings using `src/lib/console-settings.ts`: **Visuals** contains Headline Effects and Hover Effects; **General cheats** contains Testing Cheats, Debug Commands, and Full Edit CAS; **BuildBuy mode cheats** contains Move Objects, Ignore Unlocks, Free Build, Debug Objects, and Show Live Objects, in that order. The existing Console Command Settings → BuildBuy Settings navigation and individual reference descriptions remain unchanged.

This grouping changes presentation only. Every saved value stays independent, missing keys are not created, and unfamiliar imported types remain preserved. The reference says enabling Show Live Objects also runs the hidden-object cheat in-game; the editor does not infer a saved dependency or rewrite `BB_Debug_Objects_Enabled` when `BB_Show_Live_Objects` changes.

`src/lib/notification-settings.ts` presents the highlighted `Show_Notifications` master first, followed by **General notifications**, **Aging/Death notifications**, **MC Population**, **MC Pregnancy**, and **Neighborhood Stories** blocks. Existing navigation paths remain unchanged. A saved boolean `false` shows a banner that event notifications are off; all individual settings remain editable so choices can be prepared while the master is off. Changing the master never rewrites those choices or inserts missing settings.

Individual descriptions use shorter reference-based summaries shown without truncation, while audience labels stay in their existing selectors. These summaries retain the applicable exceptions and behavior, including excluded retirement/manual household moves, affair target-or-partner matching, legacy death inheritance details, birth details, and scheduled relationship logging. The original bundled descriptions and official attribution remain intact.

The master `Show_Notifications` switch suppresses the notification behavior described by the reference without rewriting the individually saved audience choices. Existing verified audience selectors retain their own subsets and labels. The user confirmed Show Version Update Notifications (`Show_VersionCheckNotification`) choices: `N` = **None** (default), `A` = **Always Check**, and `G` = **When Game Updates**. The bundled reference explains that Always Check checks each game startup, When Game Updates checks after a Sims 4 version change, and None leaves checking manual rather than automatic.

The user confirmed that Show Relationship Changes (`Show_RelChangeNotificationType`) uses the same seven dropdown codes as the current death notifications: `0` = **No notifications** (default None), `N` = **NPCs only**, `P` = **Played / active Sims**, `R` = **Related to active household**, `AF` = **Friends of active household**, `AR` = **Romantic interests of active household**, and `AL` = **All**. This applies to relationship changes from the scheduled process. As the reference explains, when logging is enabled, process details still go to `mc_cmd_center.log` regardless of the selected notification audience. Unfamiliar imported codes remain preserved.

The supplied config's death setting is `Show_DeathNotificationType`, documented from the screenshot earlier in this file. The older `Show_DeathNotifications` key has its own reference entry and appears immediately after the current death setting only when present in an imported config; it is not renamed or added automatically. This gives 22 grouped notification settings in the sample and 23 possible keys when both death settings are present. The latest user outline omitted Neighborhood Stories Adoption and Career notifications; both existing settings remain accessible after the four requested Neighborhood Stories entries. Pet pregnancy notifications retain their Pregnancy location outside this core notification group.

### Saved menu order and in-game actions

Change Sim Menu Order maps to the single `Menu_Order` object. The example contains 14 hexadecimal menu identifiers with string positions such as `"0"` and `"13"`. Position values determine the displayed order; object property order and alphabetical labels do not.

The following label mapping was matched from the user's supplied default-order list and the sample's numeric positions, then **confirmed by the user after exporting the config and testing it in-game**. Labels are attached to fixed identifiers, so importing a custom order does not reassign names according to its current positions.

| Sample saved position | Menu identifier | Confirmed label |
| ---: | --- | --- |
| 0 | `0xC0B3CF8C` | Modify Household in CAS |
| 1 | `0x3FA9FDC1` | Modify in CAS |
| 2 | `0xDAD0806C` | Sim Commands |
| 3 | `0x9F3AFD77` | MC CAS |
| 4 | `0x3E440449` | MC Cheats |
| 5 | `0x25224441` | MC Cleaner |
| 6 | `0xE8517BB7` | MC Control |
| 7 | `0x982C6AB9` | Self Command |
| 8 | `0xAEE08715` | MC Dresser |
| 9 | `0x923468DF` | MC Pregnancy |
| 10 | `0xA5200215` | MC Tuner |
| 11 | `0xE418BF6D` | Sim Flags |
| 12 | `0x63C82106` | Flag Active Sims |
| 13 | `0x68A8F19F` | Relationships |

The editor starts collapsed behind **Edit order**. Valid imported positions support moving an entry up, down, to the top, or to the bottom with keyboard-accessible buttons. Reordering preserves the original identifiers, property order, each value's string or number type, and the existing position slots, including sparse positions. Missing identifiers are not inserted. Unknown identifiers remain visible under their own IDs and are preserved. Malformed or duplicate positions use the existing structured editor without automatic repair or conversion.

The reference describes **Save Current Order** as committing the rearranged menu and **Reset to Default Order** as restoring MCCC's default positions. These are in-game operations on `Menu_Order`, not separate persistent keys. Config export saves web-editor changes, and its per-setting Undo restores the imported value. There is no factory-reset action: neither an arbitrary imported baseline nor the confirmed sample order establishes a universal factory order across MCCC versions. No `Bypass_Sim_Menus` codes or combination format are inferred from these menu identifiers.

### Phone texts and menu visibility

Phone Texts (`Silence_Phone_Texts`) is a direct entry under Notifications/Console/Menu Settings. Show Menu Settings keeps Bypass Specific Menus separate and first, followed by one **Menu visibility** block in the requested order: Show Sim Menu (`Show_Sim_Menu_Type`), Show Computer Menu (`Show_Computer_Menu_Type`), Show Gnome Menu Type (`Show_Gnome_Menu_Type`), and Show Cheats Menu (`Show_Cheats_Menu_Type`). Existing navigation paths and setting counts remain unchanged.

All six saved values remain strings in the example. Existing selectors retain the explicit reference codes: Phone Texts `A`/`F`/`N`; Cheats, Computer, and Gnome menus `A`/`ASH`/`N`; Sim Menu `A`/`ASH`/`N`/`S`/`SSH`/`R`. Grouping preserves each field's independent choices and edits, unfamiliar imported values and types, and missing fields without inserting defaults. Shorter reference-based descriptions retain Sim-menu location choices, the computer menu's `mc_settings` fallback, the gnome menu's hidden default, and the cheats menu's Sim/mailbox scope.

The user confirmed these 11 case-sensitive codes for Bypass Specific Menus (`Bypass_Sim_Menus`), displayed as checkboxes in the supplied order:

| Saved code | Menu label |
| --- | --- |
| `REL` | Relationships |
| `SimCom` | Sim Commands |
| `Flag` | Sim Flags |
| `CAS` | Modify in CAS |
| `HCAS` | Modify Household in CAS |
| `MCCH` | MC Cheats |
| `MCCA` | MC CAS |
| `MCCO` | MC Control |
| `MCDR` | MC Dresser |
| `MCPR` | MC Pregnancy |
| `MCTU` | MC Tuner |

Checked menus are hidden/bypassed in the Sim-click MCCC menu. The `mccc` console command still offers all menus, as described by the bundled reference. Selections remain a comma-separated string; `""` means no specific menu bypasses. These tokens are distinct from the hexadecimal identifiers in `Menu_Order`; no additional bypass codes are inferred from that inventory.

Unfamiliar imported values remain preserved when known choices change. The existing generic checkbox helper may trim whitespace and deduplicate CSV tokens during an edit, so it does not promise exact raw formatting preservation.

### Relationship Settings

Source: the user's complete Relationship Settings outline. All 16 leaves match existing keys: 15 have official reference entries, and Allow Homeless Romance Move-In uses the screenshot and toggle confirmation documented above. There are six direct settings, two direct Auto-Relationship settings, four Breakup settings, and four Move-In settings.

| Menu | Menu label | Config key |
| --- | --- | --- |
| Direct settings | Relationship Culling | `RelationshipCullingType` |
| Direct settings | Allow Teen Parenting | `Allow_Teen_Parenting` |
| Direct settings | Friendship Difficulty Adjustment | `Friendship_Difficulty_Adjustment` |
| Direct settings | Friendship Decay Percentage | `Decay_Ratio_Friendship` |
| Direct settings | Romance Difficulty Adjustments | `Romance_Difficulty_Adjustment` |
| Direct settings | Romantic Decay Percentage | `Decay_Ratio_Romantic` |
| Auto-Relationship Settings | Bypass Played Households | `Relationship_BypassPlayedHouseholds` |
| Auto-Relationship Settings | Bypass Ancestral Households | `Relationship_BypassAncestral` |
| Auto-Relationship Settings → Breakup Settings | Couple Relationship Change Percent | `Relationship_BreakupPercent` |
| Auto-Relationship Settings → Breakup Settings | Spouse Relationship Change Percent | `Relationship_BreakupMarriagePercent` |
| Auto-Relationship Settings → Breakup Settings | Breakup Move-Out Sims | `Relationship_BreakupMoveoutSim` |
| Auto-Relationship Settings → Breakup Settings | Move Children With Breakup | `Relationship_BreakupMoveoutOffspring` |
| Auto-Relationship Settings → Move-In Settings | Move-In Ages | `Relationship_MoveinAges` |
| Auto-Relationship Settings → Move-In Settings | Romance Move-In Percent | `Relationship_MoveinPercent` |
| Auto-Relationship Settings → Move-In Settings | Move-In Romance Level | `Relationship_MoveinRomanceAmt` |
| Auto-Relationship Settings → Move-In Settings | Allow Homeless Romance Move-In | `Relationship_MoveinHomeless` |

The six direct settings form one **General relationships** block, scoped by `generalRelationshipKeys` in `src/lib/relationship-settings.ts`. Relationship Culling and Allow Teen Parenting appear first, followed by paired difficulty/decay rows for friendship and romance. All ten auto-relationship descendants retain their existing settings and navigation paths.

The user confirmed **0–500%** for both friendship and romantic decay, with an informational default of **100%**. The bundled reference explains that 0 stops decay, 100 is the normal rate, lower values slow decay, and higher values accelerate it. Imported values remain unchanged until edited, missing settings are not inserted, and each field stays independent without automatic dependencies or resets.

The ten auto-relationship settings are grouped by `autoRelationshipBlocks` into **Household bypass**, **Breakup Settings**, and **Move-In Settings**, in the table's order. `autoRelationshipKeys` contains only those ten exact keys. Existing menu paths and the six-setting General relationships block stay intact.

The user confirmed **0–100%** for Couple Relationship Change Percent, Spouse Relationship Change Percent, Move Children With Breakup, and Romance Move-In Percent. The first two govern chances of applying relationship changes rather than direct breakup probabilities; Move Children With Breakup controls the chance that children or younger offspring accompany the moving Sim.

Breakup Move-Out Sims retains numeric values: `0` = **None**, `1` = **Male Sim**, `2` = **Female Sim**, and `3` = **Random Sim**. Move-In Romance Level also remains numeric: `25` = **Lovers**, `50` = **Sweethearts**, `75` = **Soul Mates**, and `100` = **True Lovers**. Move-In Ages offers the confirmed CSV codes `T` = **Teen**, `YA` = **Young Adult**, `A` = **Adult**, and `E` = **Elder**; the example's `"YA,A,E"` is unchanged until edited.

This hierarchy preserves four booleans, ten numbers, and two strings in the example. Grouping and controls do not coerce imported types, replace unfamiliar values, insert missing settings, or create dependencies between fields. User-supplied plural labels do not rename their singular stored keys.

## Create-a-Sim menu organization

Source: the user's Create-a-Sim menu outline, matched against the bundled reference and config. The reference confirms the template-application dropdown: empty string **Manual**, `A` **On age-up**, and `Z` **On zone-in**. Walkstyle, personality-trait, and pet-trait mappings are documented below.

All 31 Create-a-Sim settings are covered:

| Menu | Settings in the example |
| --- | ---: |
| Direct settings: Apply Appearance Template, Auto-Set Celebrity Walkstyle, Change Walkstyles on Age-up, Monitor Physique | 4 |
| Define Appearance Template → Female / Male → age | 8 |
| Exclude Traits → Personality Traits / Exclude Pet Traits | 2 |
| Fit/Fat limits → Female → Fit limits / Fat limits | 2 |
| Fit/Fat limits → Male → Fit limits / Fat limits | 2 |
| Offspring | 5 |
| Set Default Walkstyle → Female / Male → age | 8 |

Both template and walkstyle menus use ascending chronological order: Teen, Young Adult, Adult, Elder. Two Teen templates and two Teen walkstyle entries exist in both the sample and the older reference and remain available alongside the ages from the first outline.

The appearance-template editor uses two blocks, **Female** then **Male**, defined by the eight exact profiles in `src/lib/appearance-templates.ts`. Each block places body parts in shared anatomical rows and the four ages in columns: Teen, Young Adult, Adult, Elder. Body fields come from each profile's existing `rangeFields` metadata. Each age retains its independent saved values and Undo; editing one profile never copies ranges into another. Missing profiles or body fields are not inserted, and unfamiliar fields or imported representations remain preserved.

At the user's request, body fields follow anatomy rather than the alphabetical in-game order: Neck, Shoulders, Chest Depth, Chest Lift / Chest Expand, Chest Size, Upper Arms, Lower Arms, Belly, Waist, Hips, Butt, Upper Legs, Lower Legs, Feet. The user clarified that **Chest Lift is the female field and Chest Expand is the male field**; both templates also have Chest Depth and Chest Size. Unfamiliar imported fields are appended. The normal slider domain remains −100 to 100, while existing precise inputs continue to support custom template ranges. This changes only the display order, preserving all stored keys, values, and numeric arrays.

`Appearance_*FitLimits` maps to Fit limits and `Appearance_*LeanLimits` to Fat limits. Offspring settings follow the supplied order: Use Parent Physical Attributes, Parent Values Variance Percent, Use Parent Skintones, Use Parent Skin Details, Bypass Blue Babies. This menu pass does not add guessed dropdown choices or change the config representation of any setting.

The four fit/fat limits share one **Fit/Fat limits** menu and editor block. Female and Male columns each show Fit limits followed by Fat limits, with the columns stacked on small screens. The sidebar's Female and Male children narrow the same mounted controls. Existing range sliders, precise minimum/maximum inputs, validation, separate Undo, and comma-separated string values remain unchanged; missing or unfamiliar imported values are preserved.

### Default walkstyles

The eight `Appearance_DefaultWalkstyle_*` settings share the choices in `src/lib/walkstyles.ts`. The user confirmed these codes: `B` Bouncy, `CR` Creepy, `F` Feminine, `G` Goofy, `P` Perky, `SL` Sluggish, `SN` Snooty, `SW` Swagger, and `T` Tough. **Default walkstyle** stores the empty string, matching the sample config and the bundled reference's “Sims 4 Default walkstyle.”

One editor places Male and Female in two columns, each ordered Teen, Young Adult, Adult, Elder; columns stack on small screens. Each age keeps its own dropdown, config key, and Undo. The existing gender/age sidebar paths filter these same controls. Unknown imported codes remain available as “from file” choices, unfamiliar value types retain their existing editors, and absent settings are never inserted.

The reference distinguishes changing a walkstyle through the in-game UI (which also updates existing Sims) from configuring walkstyles for newly generated Sims and age-ups when Change Walkstyles on Age-up is enabled. Exporting this config does not itself apply the in-game UI action.

### Offspring appearance

The five Create-a-Sim Offspring settings share a grouped editor. **Physical attributes** pairs `Appearance_UseParentAppearance` with `Appearance_ParentAppearanceVariance`; **Skin inheritance** contains `Appearance_UseParentSkinTones`, `Appearance_UseParentFacialDetails`, and `CAS_BypassBlueBabies`. These exact keys are scoped separately from MC Pregnancy's Offspring settings.

The user confirmed the variance range of **0–100%** and its dependency on Use Parent Physical Attributes. Numeric variance uses a slider plus a precise input with integer steps. Only the variance control is disabled when `Appearance_UseParentAppearance` is explicitly `false`; its value and validation draft remain intact, and its Undo stays available. The skin settings are independent. When filtering hides the parent toggle, a contextual button can enable the existing setting. A missing or unfamiliar parent value does not disable variance or cause a setting to be inserted.

The bundled descriptions explain that variance applies in both directions: 10% allows up to 10% above or below the inherited values, while 0% adds no extra variation. Physical attributes and facial skin details are applied at the Teen age-up. Custom skintone inheritance and the human-form baby color option retain their separate behavior. Concise descriptions preserve those distinctions, and imported values/types round-trip unchanged until edited.

### Personality trait exclusions

The user supplied 97 personality-trait IDs and 97 labels in matching order for `CAS_Trait_Blacklist`. Both lists have 97 unique entries and no pairing mismatch. `src/lib/trait-settings.ts` preserves that supplied order and spelling, including **Noncommital**. Mapping anchors include **Active** = `27419`, **Heart on Your Sleeve** = `501609`, **Noncommital** = `16833`, and **Wise** = `341151`.

The bundled reference limits the blacklist to randomly generated Sims and Sims gaining new traits while aging up. It does not remove traits from existing Sims, apply to Sims created through testing/debug cheats, or replace traits saved with Sims imported from the player's library. Traits required by a Sim's role are retained.

Selections remain a comma-separated string. `toggleKnownTrait` changes only a confirmed trait ID; unfamiliar or modded IDs remain read-only and local to the imported file. Editing a known choice preserves all unrelated raw tokens, including whitespace, duplicates, empty segments, and large numeric strings. Existing known IDs with surrounding whitespace are recognized without rewriting the string; deselecting a known ID removes only its matching segments. Other values are never parsed as numbers, sorted, trimmed, or deduplicated, and missing settings are not inserted.

### Pet trait exclusions

The user supplied 45 unique IDs and 45 unique species-qualified labels for `CAS_Pet_Trait_Blacklist`: 17 cat traits, 17 dog traits, and 11 horse traits. The user identified some species assignments as guesses. All 45 IDs were checked against the community-hosted game XML extraction in [Sims-4-Tuning](https://github.com/BigBadBleuCheese/Sims-4-Tuning/blob/master/README.md), using each file's numeric `s` ID, `n` tuning name, and extracted display-name string. The [Cats & Dogs trait files](https://github.com/BigBadBleuCheese/Sims-4-Tuning/tree/master/Name%20Only/EP04/trait) and [Horse Ranch trait files](https://github.com/BigBadBleuCheese/Sims-4-Tuning/tree/master/Name%20Only/EP14/trait) matched 41 supplied labels and established four species corrections:

| Saved ID | Correct label | Extracted tuning evidence |
| --- | --- | --- |
| `171610` | Friendly (Dogs) | [`trait_Pet_Friendly_Dog`](https://github.com/BigBadBleuCheese/Sims-4-Tuning/blob/master/Name%20Only/EP04/trait/trait_Pet_Friendly_Dog.xml) |
| `158765` | Friendly (Cats) | [`trait_Pet_Friendly_Cat`](https://github.com/BigBadBleuCheese/Sims-4-Tuning/blob/master/Name%20Only/EP04/trait/trait_Pet_Friendly_Cat.xml) |
| `171609` | Glutton (Dogs) | [`trait_Pet_Glutton_Dog`](https://github.com/BigBadBleuCheese/Sims-4-Tuning/blob/master/Name%20Only/EP04/trait/trait_Pet_Glutton_Dog.xml) |
| `159977` | Glutton (Cats) | [`trait_Pet_Glutton_Cat`](https://github.com/BigBadBleuCheese/Sims-4-Tuning/blob/master/Name%20Only/EP04/trait/trait_Pet_Glutton_Cat.xml) |

`petTraitOptions` keeps the supplied ID order and all other labels. These corrections follow the actual tuning identifiers, not an inference from similar ID numbers. The source is a game-data mirror, separate from the bundled MCCC website reference.

The MCCC reference says exclusions apply to randomly generated pets and pets gaining traits while aging up. They do not remove existing traits, apply to pets generated through testing/debug cheats, or remove traits required by a pet's role.

`toggleKnownPetTrait` uses its own 45-ID whitelist, separate from the personality-trait whitelist. Both helpers retain the same raw CSV preservation: unknown/modded IDs cannot be changed through known choices, and unrelated tokens keep their whitespace, duplicates, order, and string representation. The pet list remains independent of the personality list; missing settings and unfamiliar imported types remain preserved.

## Career menu organization

Source: the user's Career menu outline, matched against the bundled reference and config. All nine settings exist in the example: eight have website reference entries, and `Career_LimitNS` was confirmed through the screenshot and toggle check documented above.

| Menu label | Config key |
| --- | --- |
| Bypass Played Household | `Career_FillCareerInactiveOnly` |
| Career Difficulty Adjustment | `Career_Difficulty_Adjustment` |
| School → School Homework Progression | `Career_Homework_Speed` |
| School → Children Quit School | `Career_ChildrenQuitSchool` |
| School → Teens Quit School | `Career_TeensQuitSchool` |
| University → University Difficulty Adjustment | `Career_University_Difficulty_Adjustment` |
| University → University Homework Progression | `Career_University_Homework_Speed` |
| University → Secret Society Decay Percent | `Career_Decay_Ratio_SecretSociety` |
| Neighborhood Stories Settings → Alter Neighborhood Stories | `Career_LimitNS` |

The editor groups homework and the two quit-school toggles under **School**, followed by **University** progression, homework, and Secret Society decay. Matching sidebar menus filter the same controls. Bypass Played Household and Career Difficulty Adjustment remain direct settings; Alter Neighborhood Stories retains its submenu. The singular **Bypass Played Household** label uses the existing key that the website calls Bypass Played Households. Reference paths using either MC Career or MC Careers belong to the same Career category.

The user confirmed **−3–50** for both homework progression settings and **0–500%** for Secret Society decay. Numeric values use integer-step sliders with precise inputs. Homework keeps 0 as the normal/default rate; negative values slow progression and positive values speed it up. Secret Society decay uses 100% for normal decay, 0% for no decay, and 200% for double decay. University Difficulty Adjustment retains its existing −50–10 range. These six fields remain independent, with individual Undo, preserved invalid drafts, and no inserted or renamed keys. Unfamiliar imported types and out-of-range values are retained until edited.

Concise quit-school descriptions retain the reference's gameplay implications: active children and teens return only through Resume School and restart with low grades. While the respective option is enabled, children cannot combine school and Scouts, and teens cannot combine school with another job.

## Cleaner menu organization

Source: the user's Cleaner menu outline, matched against the bundled reference and config. The 13 in-game menu leaves correspond to 12 config keys because two relationship-cleaning choices share one stored value.

| Menu | Config keys | Organization |
| --- | ---: | --- |
| Direct settings | 2 | Clean-up Multi-Relations, Detail Logging |
| Item Cleaner | 3 | Cleaner Definitions, Sync Glasses, Sync Medical Devices |
| Neighborhood Cleaner | 3 | Bypass Family Ghosts, Clean Culled Sims, Sync Household Names |
| Relationship Cleaner | 3 | Households to Clean / Relationships to Clean, Pet Relationships to Clean, Relationships to Leave |
| Sim Cleaner | 1 | Sync Married Names |

| Menu label | Config key |
| --- | --- |
| Clean-up Multi-Relations | `Cleaner_CleanupMultiRelations` |
| Detail Logging | `Cleaner_DetailLogging` |
| Cleaner Definitions | `Cleaner_ItemCleaner` |
| Sync Glasses | `Cleaner_MatchGlasses` |
| Sync Medical Devices | `Cleaner_MatchMedicalDevices` |
| Bypass Family Ghosts | `Cleaner_BypassFamilyGhosts` |
| Clean Culled Sims | `Cleaner_CleanCulled` |
| Sync Household Names | `Cleaner_SyncHouseholdNames` |
| Households to Clean | `Cleaner_CleanRelationships` |
| Pet Relationships to Clean | `Cleaner_CleanPetRelationships` |
| Relationships to Leave | `Cleaner_LeaveRelationshipCount` |
| Sync Married Names | `Cleaner_SyncMarriedNames` |

The three Relationship Cleaner settings share one block. The user confirmed these household choices for `Cleaner_CleanRelationships`: `A,A` Include Active Household, `AO,A` Include Active Sims Only, `N,A` Include NPC Households (default), `P,A` Include Played Households, and `PO,A` Include Played Sims Only. The reference identifies the first position as the affected Sims and the remaining value as the relationship-cleaning level. Only the household choice was available in the user's in-game menu, so the dropdown edits that first position and preserves every byte after the first comma. An imported `N,F` becomes `AO,F` when selecting Active Sims Only; unknown suffixes are retained as well. Unrecognized first codes remain selectable as imported values, while strings without a usable pair retain their generic editor. This is a positional string, not a multiselect.

For `Cleaner_CleanPetRelationships`, the user confirmed `A` Acquaintances, `F` Friends, `Z` Zero Level Relationships, and `C,25` for Custom Level Relationships at level 25. Custom mode exposes a **0–100** integer slider with a precise input and saves `C,<level>`. Selecting Custom for the first time starts at the supplied example of 25; this is not a claimed MCCC default. Scores use absolute values, so level 25 covers −25 through 25. Imported custom values retain their original representation until edited, including outliers; unfamiliar strings remain “from file” choices and unfamiliar JSON types retain their generic controls. Invalid custom drafts block export and survive filtering and unrelated edits; selecting another mode intentionally clears that draft.

`Cleaner_LeaveRelationshipCount` uses the user-confirmed **0–100** integer range. Each setting has its own Undo, and absent settings are not inserted.

At the user's request, only `Cleaner_ItemCleaner` (**Cleaner Definitions**) is temporarily read-only because the in-game option raised an exception during their testing. The saved value is displayed and preserved on export, including nonstandard imported types. Other Item Cleaner settings remain editable. This disables editing in the configurator; it does not alter the game's saved cleaner definitions or claim the error affects every MCCC installation.

## Dresser menu organization and choices

Source: the user's complete Dresser menu outline, matched against the bundled reference and config. All 23 existing keys are covered: four direct settings, two Facial Hair settings, seven Makeup settings, and ten Outfits settings. The Outfits total includes four settings under Multiple Outfit Settings and one stored value for Replace Situation Outfits.

| Menu | Menu label | Config key |
| --- | --- | --- |
| Direct settings | Ages to run on age-up | `Dresser_RunOnAgeUp` |
| Direct settings | Automatically clean bathing outfits | `Dresser_CleanBathingOutfit` |
| Direct settings | Custom items only | `Dresser_CustomItemsOnly` |
| Direct settings | Percent use custom skin tone | `Dresser_PercentUseCustomSkinTone` |
| Facial Hair Settings | Facial hair ages | `Dresser_FacialHairAges` |
| Facial Hair Settings | Facial hair percents | `Dresser_FacialHairPercent` |
| Makeup Settings | Check Dark Form Makeup | `Dresser_IncludeDarkFormMakeup` |
| Makeup Settings | Copy/Paste Facepaint | `Dresser_CopyPasteFacepaint` |
| Makeup Settings | Makeup ages | `Dresser_MakeupAges` |
| Makeup Settings | Makeup genders | `Dresser_MakeupGenders` |
| Makeup Settings | Makeup outfits | `Dresser_MakeupOutfits` |
| Makeup Settings | Remove makeup/facepaint | `Dresser_MakeupIncludesFacePaint` |
| Makeup Settings | Run makeup check | `Dresser_RunMakeupCheck` |
| Outfits Settings | Clean Dark Form Outfits | `Dresser_IncludeDarkFormOutfits` |
| Outfits Settings | Female After Career Outfit | `Dresser_ChangeOutfitAfterCareerF` |
| Outfits Settings | Male After Career Outfit | `Dresser_ChangeOutfitAfterCareerM` |
| Outfits Settings → Multiple Outfit Settings | Multiple Outfit Percentage | `Dresser_PercentMultipleOutfits` |
| Outfits Settings → Multiple Outfit Settings | Maximum Outfits | `Dresser_MaximumMultipleOutfits` |
| Outfits Settings → Multiple Outfit Settings | Multiple Outfit Genders | `Dresser_MultipleOutfitGenders` |
| Outfits Settings → Multiple Outfit Settings | Multiple Outfit Ages | `Dresser_MultipleOutfitAges` |
| Outfits Settings | Only Use Saved Outfits | `Dresser_OnlyUseSavedOutfits` |
| Outfits Settings | Replace Situation Outfits | `Dresser_ReplaceSituationOutfits` |
| Outfits Settings | Situation use standard | `Dresser_SituationUseStandardOutfits` |

The complete menu labels are recorded separately in `src/data/dresser-choices.ts`. The user confirmed the all-selected saved value `"I,TD,C,T,YA,A,E"` for `Dresser_RunOnAgeUp`, `Dresser_MakeupAges`, and, in the follow-up, `Dresser_MultipleOutfitAges`. All three controls expose these seven ages in chronological order:

| Age | Confirmed code |
| --- | --- |
| Infant | `I` |
| Toddler | `TD` |
| Child | `C` |
| Teen | `T` |
| Young Adult | `YA` |
| Adult | `A` |
| Elder | `E` |

The user also confirmed all 13 makeup outfit categories. The first eight are the standard categories shared with after-career outfits and situation replacements. The last five apply only to the makeup selector and are not added to either standard-outfit dropdown:

| Outfit category | Confirmed code | Selection scope |
| --- | --- | --- |
| Everyday | `E` | Makeup, after-career, situation replacements |
| Formal | `F` | Makeup, after-career, situation replacements |
| Athletic | `AT` | Makeup, after-career, situation replacements |
| Sleep | `SL` | Makeup, after-career, situation replacements |
| Party | `P` | Makeup, after-career, situation replacements |
| Swimwear | `SW` | Makeup, after-career, situation replacements |
| Hot Weather | `HW` | Makeup, after-career, situation replacements |
| Cold Weather | `CW` | Makeup, after-career, situation replacements |
| Bathing | `B` | Makeup only |
| Batuu | `BT` | Makeup only |
| Career | `C` | Makeup only |
| Situation | `SI` | Makeup only |
| Special | `SP` | Makeup only |

These confirmations extend only the named selectors. They do not change saved selections, insert missing keys, or infer additional choices for other age or outfit settings. Unknown future tokens remain preserved during edits to known choices.

Replace Situation Outfits contains these 12 menu entries, in order: City Walkby Situations (`CW`), Date Situations (`D`), For Rent Street Loungers (`RNT`), Horse Ranch Dance Hall (`HOR`), Humor Festival Situations (`HF`), Island Living Situations (`IL`), Rain Walkby Situations (`SRN`), Romantic Festival Situations (`RF`), Spice Festival Situations (`SF`), Thrift Store Situations (`THR`), University Situations (`UNV`), Vampire Situations (`V`). These are fields within one string, not new config keys. The user supplied `V:E,RF:E,D:E,HF:E,SF:E,CW:AT,SRN:E,IL:E,UNV:E,THR:E,HOR:E,RNT:E`, confirming comma-separated `situation:outfit` pairs. Situation `CW` is City Walkby; outfit `CW` is Cold Weather, with meaning determined by its position around the colon.

Each situation now has a dropdown. An absent entry displays **Keep situation outfit**; choosing that option removes the selected situation's matching entries. Choosing a standard outfit edits that situation or appends its pair if absent. Unrelated raw tokens, order, whitespace, duplicate entries, and empty segments are preserved. Unknown situations and malformed tokens are displayed read-only, and unfamiliar outfit values remain “from file” choices. Conflicting duplicates remain explicit until a selection updates every matching entry. Opening the editor inserts nothing; the empty sample string remains empty until edited. Non-string imports retain generic editors and their original types.

The grouped outfit editor has **After-work outfits** (Female and Male), **Multiple outfits** (percentage, count, genders, ages), and **Situation outfits** (Situation Use Standard plus the replacement map). Controls remain independent with per-setting Undo and preserved drafts when filtering. The after-career dropdowns include **Keep career outfit**, storing the empty string documented by the bundled reference. The user's uppercase codes take precedence over the older reference's mixed-case examples; unfamiliar imported codes stay preserved.

The user confirmed numeric ranges: `Dresser_PercentUseCustomSkinTone` and `Dresser_PercentMultipleOutfits` use **0–100%**, and `Dresser_MaximumMultipleOutfits` uses **1–5**, all with integer sliders and precise inputs. Maximum Outfits is the fixed count generated per applicable category for eligible Sims who pass the percentage check; 1 generates no additional outfits. Missing config keys are not inserted, and imported types/outliers are preserved until edited.

Facial hair percentages retain their four independent 0–100 sliders and raw CSV preservation. Makeup genders retains `M` / `F` selections. The follow-up closes the previously recorded gaps for Multiple Outfit Ages and special makeup categories without extending facial-hair ages or the eight standard outfit choices.

## Occult menu organization and encoded values

Source: the user's six-species Occult menu outline, the bundled official reference, and the supplied config. All 52 existing Occult settings remain available across Aliens, Fairies, Mermaids, Spellcasters, Vampires, and Werewolves. The MCCC version is unknown. The outline supplies menu labels and several ranges; it does not independently prove every serialized code or array position. The assumptions below are kept explicit for later in-game verification.

Each species has Aging Settings and Other Pregnancy menus. Aliens additionally contains Abduction Settings and Abduction Pregnancy Settings; Vampires contains Risky Vampirism. Reference inconsistencies are normalized for display: **Faires** belongs to Fairies, **Vampire Settings** belongs to Vampires, and keys containing **Witch** use the Spellcaster label. These display corrections do not rename any config keys.

### Shared aging values and pregnancy switch

Three settings are shared across species:

| Config key | Display and storage |
| --- | --- |
| `Occult_OccultTypeAgeMultiplier` | One object containing per-species arrays of five age multipliers |
| `Occult_OccultTypeMaximumAge` | One object containing each species' maximum aging stage |
| `Occult_UseCustomPregnancy` | One global boolean, accessible through every Other Pregnancy menu |

Each shared setting appears once in the Occult overview. Species menus provide access to the same underlying control; an Aging Settings menu shows only the selected species, while the overview and global search show all species. Controls remain mounted as menus change so incomplete edits and validation errors survive navigation. Editing the custom-pregnancy switch through any species changes the same global value. Export contains each original key once, with no invented per-species copies.

| Object key | Species label | Basis |
| --- | --- | --- |
| `A` | Aliens | Inferred from the example's species keys and existing naming conventions |
| `FR` | Fairies | Inferred from the example's species keys and existing naming conventions |
| `MM` | Mermaids | Supported by the example's final multiplier of 335 and the official Mermaid Elder default |
| `V` | Vampires | Supported by the example's `YA` maximum and the official Vampire maximum-age default |
| `WT` | Spellcasters | Inferred from the example and the reference's use of Witch in Spellcaster config keys |
| `WW` | Werewolves | Inferred from the example's species keys and existing naming conventions |

The bundled reference does not contain an explicit dictionary of these object keys. The five multiplier positions follow the user's menu order: Child, Teen, Young Adult, Adult, Elder. The editor applies the officially documented 1–500% range; 100% means the normal duration. Fractional values remain supported and preserved, including the supplied Fairy values `135.72` and `214.5`. The reference identifies Mermaid Elder's usual multiplier as 335%; these defaults are contextual information, not replacements for imported values.

Maximum aging stage offers Normal (`0`), Teen (`T`), Young Adult (`YA`), Adult (`A`), and Elder (`E`). The official aging reference explicitly documents `0` and `YA`; the other age codes follow the established age-code conventions elsewhere in the reference and the user's supplied choices. These per-object mappings remain an in-game verification item. The user's **Y** shorthand is presented as Young Adult with the existing `YA` code; imported unfamiliar codes are preserved rather than silently rewritten.

The occult editor groups the 52 reviewed keys into shared aging and pregnancy controls followed by species-specific settings, abductions, pregnancy outcomes, and risky vampirism. The shared Age Multiplier and Aging Maximum objects show species in responsive columns, ordered Aliens, Fairies, Mermaids, Spellcasters, Vampires, Werewolves. Age multipliers retain chronological Child, Teen, Young Adult, Adult, Elder fields within each column. Species menus narrow the same mounted controls; each shared object still exists once in the config, with whole-setting Undo. Missing or unknown species and nonstandard value types retain their original data.

### Population limits and abduction choices

The six population-limit keys are `Occult_MaximumAliens`, `Occult_MaximumFairies`, `Occult_MaximumMermaids`, `Occult_MaximumSpellcasters`, `Occult_MaximumVampires`, and `Occult_MaximumWerewolves`. Their controls use −1 through 50, with **Unlimited** for −1. The reference explicitly documents −1 as unlimited. The user supplied the numerical range for Aliens and Fairies; applying the same upper bound to the other four species is a consistency assumption pending review. These limits prevent new babies of that species once the limit is reached; they do not remove existing Sims or stop the game from generating homeless Sims.

Abduction ages offers Child, Teen, Young Adult, Adult, Elder; abduction pregnancy ages offers Teen, Young Adult, Adult, Elder. The selections use `C`, `T`, `YA`, `A`, `E` as applicable and retain comma-separated strings. The existing abduction pregnancy gender dropdown remains Male / Female. Pollinator Gender also offers the user-supplied Male (`M`) and Female (`F`) choices. The official reference additionally mentions **both**, but its serialized value is unverified, so no code for that option is invented. An unfamiliar imported pollinator value remains preserved. This setting affects creation of a new pollinator, not an existing one.

The user confirmed `Occult_ForceAlienDisguiseType` as a single choice: empty string **Default (don't force)**, `H` **Force Disguise**, and `A` **Force No Disguise**. Unknown imported codes remain available as “from file” choices. The reference says this applies when aliens enter a lot, with the alien homeworld retaining its no-disguise behavior. `Occult_TimeBetweenAbductions` uses the user-confirmed **1–24 hours** integer slider and precise input; the reference limits its effect to High or Alien Invasion abduction frequency.

### Custom pregnancy outcomes

There are 24 existing parent-pair settings. All appear under the corresponding species' Other Pregnancy → Custom Percentages menu:

| Species | Parent pairing | Config key |
| --- | --- | --- |
| Aliens | Alien and Hybrid | `Occult_CustomPregnancyAlienHybrid` |
| Aliens | Hybrid | `Occult_CustomPregnancyHybridHybrid` |
| Aliens | Alien and Human | `Occult_CustomPregnancyAlienHuman` |
| Aliens | Hybrid and Human | `Occult_CustomPregnancyHybridHuman` |
| Fairies | Fairy and Human | `Occult_CustomPregnancyFairyHuman` |
| Fairies | Fairy and Alien | `Occult_CustomPregnancyFairyAlien` |
| Fairies | Fairy and Vampire | `Occult_CustomPregnancyFairyVampire` |
| Fairies | Fairy and Mermaid | `Occult_CustomPregnancyFairyMermaid` |
| Fairies | Fairy and Spellcaster | `Occult_CustomPregnancyFairyWitch` |
| Fairies | Fairy and Werewolf | `Occult_CustomPregnancyFairyWerewolf` |
| Mermaids | Mermaid and Human | `Occult_CustomPregnancyMermaidHuman` |
| Mermaids | Mermaid and Alien | `Occult_CustomPregnancyMermaidAlien` |
| Mermaids | Mermaid and Vampire | `Occult_CustomPregnancyMermaidVampire` |
| Spellcasters | Spellcaster and Human | `Occult_CustomPregnancyWitchHuman` |
| Spellcasters | Spellcaster and Alien | `Occult_CustomPregnancyWitchAlien` |
| Spellcasters | Spellcaster and Vampire | `Occult_CustomPregnancyWitchVampire` |
| Spellcasters | Spellcaster and Mermaid | `Occult_CustomPregnancyWitchMermaid` |
| Vampires | Vampire and Human | `Occult_CustomPregnancyVampireHuman` |
| Vampires | Vampire and Alien | `Occult_CustomPregnancyVampireAlien` |
| Werewolves | Werewolf and Human | `Occult_CustomPregnancyWerewolfHuman` |
| Werewolves | Werewolf and Alien | `Occult_CustomPregnancyWerewolfAlien` |
| Werewolves | Werewolf and Vampire | `Occult_CustomPregnancyWerewolfVampire` |
| Werewolves | Werewolf and Mermaid | `Occult_CustomPregnancyWerewolfMermaid` |
| Werewolves | Werewolf and Spellcaster | `Occult_CustomPregnancyWerewolfWitch` |

Comparing the official per-pair descriptions and default strings establishes this positional order: Alien, Hybrid, Vampire, Mermaid, Spellcaster, Werewolf, then Fairy when a seventh token exists. The 18 non-Fairy settings in the example contain six tokens; the six Fairy settings contain seven. Controls expose only the applicable outcome positions for each pair and retain the complete original string and all other tokens.

The user requested a shared **100%** limit for each pairing and confirmed **Human = 100 − the sum of its applicable occult percentages**. For Spellcaster and Alien, 50% Spellcaster, 0% Hybrid, and 0% Alien displays 50% Human; 80% Spellcaster plus 20% Hybrid displays 0% Human. Each outcome slider is limited by the percentages assigned to the other outcomes, and precise inputs reject totals above 100%. Human appears as a calculated, read-only slider and value; it is never stored in the CSV.

The `-1` entries consistently occupy outcomes not offered for that parent pair. They are excluded from the sum and remain untouched, as do unfamiliar extra numeric positions. Changing outcomes preserves every untouched raw token and the original six- or seven-part shape. Fractional values remain supported by the precise inputs. Imported outliers or totals over 100% are retained without automatic normalization; Human displays as unavailable until the relevant values form a valid distribution. Once editing starts, incomplete or invalid drafts block export and stay mounted across filters. Multiple pending corrections can be committed together when their total becomes valid, allowing an imported over-budget distribution to be repaired without rewriting unrelated positions.

This shared limit applies only to the 24 verified custom-pregnancy pairings. Abduction Pregnancy Percent by age and Risky Vampirism feeding percentages remain independent rolls and do not acquire a Human remainder or sum limit. Unsupported keys, nonnumeric CSV formats, and unfamiliar imported types retain their generic editors.

The Alien and Hybrid reference is internally inconsistent: its description says the default is 100% Alien, while its default string starts `0,100`. The supplied file starts `100,0`. The editor retains the imported value and does not use the contradictory reference string to reset this setting. The shared `Occult_UseCustomPregnancy` switch controls whether the custom rules are used; its reference default is Disabled.

### Risky Vampirism

`Occult_RiskyVampPercentages` keeps its four-part string and exposes four independent 0–100% sliders in the reference's order: Ask for Permission to Drink, Compel for a Small Drink, Compel for a Deep Drink, Drink Uncontrollably. A zero chance disables risk for that interaction. Only with Creation and Vampire Creation Notification remain separate existing booleans. No new top-level keys, inferred population counters, or automatic default resets are introduced by these controls.

## Population menu organization and choice inventories

Source: the user's Population menu outline and subsequent code/range confirmations, the bundled reference, and the supplied config. All 45 Population keys remain available. The reference covers 44; the previously documented `Population_MovingBypassDorms` screenshot supplies the remaining setting. The MCCC version is unknown. The six dropdowns below have confirmed codes, and the latest follow-up confirms all 31 lot/situation choices and all 12 immortal-Sim groups.

| Menu | Config keys | Organization |
| --- | ---: | --- |
| Direct settings | 1 | Enable or Disable Bar Nights |
| Moving Settings | 13 | Move-ins, move-outs, household exclusions, housing, and pet limits |
| Neighborhood Stories Settings | 1 | Alter Neighborhood Stories |
| Other Settings | 7 | Lot populations, immortality groups, culling, and visiting Sims |
| Populating Settings | 19 | Nine direct settings, three CAS Custom Gender settings, seven Import Tray settings |
| Random Lot Challenges | 4 | Lot type, challenge count, frequency, and time unit |

The initial Population grouping organizes the **36** Moving Settings, Populating Settings, and Random Lot Challenges fields into related blocks while retaining their existing navigation paths. The later all-settings review also groups the seven Other Settings fields; Bar Nights and Alter Neighborhood Stories retain regular setting rows. Each imported key remains independent, with its own validation and Undo; grouping does not create missing keys, apply defaults, or couple stored values.

**Enforce Vampire Homes** retains the official label and `Population_EnforceVampireHomes` key. It restricts moving to lots with the Registered Vampire Lair trait and affects related marriage/pregnancy eligibility; **Homeless** would misdescribe its scope. Move Teens as Dependents belongs with Moving Settings despite the older reference's shortened **Move Settings** path. The dorm-resident exclusion continues to apply to retirement-home moves and single-Sim move-outs, as documented above.

### Adjust Sims on Lot

`Population_NumAdjustLot` remains one comma-separated string. The complete 31-choice inventory is stored in `src/data/population-choices.ts`, grouped in the user's requested pack order. The user explicitly confirmed every mapping below; the additional codes are no longer inferred from abbreviations or the number of imported tokens.

| Pack | Menu labels and confirmed codes |
| --- | --- |
| Base Game | Bar (`BAR`), Gym (`GYM`), Library (`LIB`), Lounge (`LOU`), Museum (`MUS`), Park (`PAR`), Pool (`POL`), Walkby on All Lots (`WBY`) |
| City Living | Apartments (`APT`), Arts Center (`ART`), Karaoke Bar (`KAO`), Myshuno Meadows (`MYS`) |
| Get Together | Cafe (`CAF`), Chalet Gardens (`CHA`), Go Dancing on Lot (`DAN`), Nightclub (`CLU`) |
| Dine Out | Restaurant (`RES`) |
| Spa Day | Spa (`SPA`) |
| Island Living | Beach (`BCH`) |
| Discover University | College Cram (`CRM`), Debate Practice (`DEB`), Robot Building Meetup (`RBM`), Study Group (`SDY`), University Commons (`CMM`), University Mixer Night (`MIX`), eSports Tournament (`ESP`) |
| Eco Lifestyle | Garden (`GAR`), Maker Space (`MAK`), Marketplace (`MRK`) |
| High School Years | High School (`HSC`), Thrift Store (`THR`) |

The reference calls `CLU` **clubs**; the reviewed menu labels that venue Nightclub. Earlier versions of this inventory exposed only the 13 mappings established by the bundled reference. The user's follow-up confirms the other 18, including Museum and the pack-specific venues. Display grouping does not reorder the saved CSV. Unfamiliar future codes remain available as imported choices and are retained when a known choice is edited.

### Disable Immortal Sims

`Population_DisableImmortalSims` uses the following complete 12-choice inventory. The user confirmed all mappings, extending the five previously established by the reference:

| Menu label | Confirmed code |
| --- | --- |
| City Living | `CL` |
| Cottage Living | `CTL` |
| For Rent | `RNT` |
| Get Famous | `GF` |
| Get To Work | `GTW` |
| Horse Ranch | `HOR` |
| Jasmine Holiday | `JH` |
| Journey to Batuu | `BTU` |
| Seasons | `SN` |
| Service Sims | `SV` |
| Snowy Escape | `SE` |
| Tragic Clown | `CLN` |

These selections allow normally immortal groups to age and die. The reference identifies City Living special-role Sims, Get To Work's alien pollinator and detective-career criminals, Seasons scarecrows, and service Sims such as nannies and butlers. The example's empty string is preserved as no selected groups. The user's all-selected example `CTL,RNT,GF,GTW,HOR,JH,BTU,SN,SV,SE,CLN,CL` identifies the same 12 groups; its saved order is independent of the menu's display order. Importing it does not reorder or normalize the string.

### Confirmed challenge, import, and elder choices

The user confirmed the following exact mappings and display order. They are recorded once in the six existing choice inventories in `src/data/population-choices.ts`; the catalogue builds these dropdowns with `populationChoiceOptions`. A confirmed empty string is a selectable value. These six dropdown inventories remain separate from the now-complete lot and immortal-group lists above.

| Config key | Confirmed choices, in display order | Default |
| --- | --- | --- |
| `Population_MoveOutEldersType` | Empty string = None; `A` = All Elders; `NA` = Non-Ancestral | Empty string, None |
| `Population_RandomLimitHouseholdType` | `A` = Any Saved Sims; `P` = Only My Sims; `O` = Only Other Sims | `A`, Any Saved Sims |
| `Population_UseTagsOnImportSims` | Empty string = Disabled; `B` = Limit Bypass Tags; `T` = Only Limit Tag | Empty string, Disabled |
| `Population_ImportSimNameChoice` | `N` = Skip Sim If Name Exists; `U` = Always Use Import Name; `NN` = Never Use Import Name; `D` = Use Non-Duplicate Name | `N`, Skip Sim If Name Exists |
| `Population_RandomChallengeLotType` | `A` = Active Home Lot Only; `ALL` = All Lots; `R` = Residential Lots Only | `A`, Active Home Lot Only |
| `Population_RandomChallengeTimeUnits` | `SD` = Sim Days; `SH` = Sim Hours | `SD`, Sim Days (bundled reference) |

The confirmed import-name codes distinguish `N` (**Skip Sim If Name Exists**) from `NN` (**Never Use Import Name**). The user supplied **Only Limit Tag** for `T`; the older reference describes the include-tag option as **Only Include Tags**. Its description explains the `#mccc_include` and `#mccc_bypass` household tags and keeps manual copy/paste imports available. Curated descriptions retain behavioral details without repeating the available choices; the original bundled reference remains unchanged.

Default labels are informational and never replace a saved value. Unfamiliar string codes remain available as choices from the imported file; importing a number, boolean, or structured value keeps its original type and generic control rather than converting it to a string choice.

### Moving limits and numeric controls

The user confirmed integer ranges for two moving controls:

| Config key | Range | Default and behavior |
| --- | --- | --- |
| `Population_MaximumHomeless` | −1–100 | −1 means Unlimited, as stated by the bundled reference. The limit concerns generated homeless families; it does not remove the core game's single-Sim NPC career/role households. |
| `Population_OpenHouses` | 0–100 | The bundled reference explicitly gives default **1**. This is the number of lots left unoccupied when moving homeless Sims into empty homes. |

Both controls use sliders with precise integer inputs. Imported outliers remain unchanged and exportable until edited; their sliders stay disabled while their values are outside the confirmed range. New invalid drafts block export and can be corrected or undone.

Maximum Challenge Frequency (`Population_RandomChallengeMaxTime`) uses 1–100, confirmed by the reference and the user's outline. Maximum Challenge Number (`Population_RandomChallengeMaxNum`) uses the user's 0–12 range; zero disables random challenges, and the configured number is an upper limit rather than a promise that every lot receives that many. Percentage controls use 0–100 independently. Existing imported values are not normalized or reset when these controls are displayed.

Bar-night labels follow the user's requested display order while retaining the existing codes `GU`, `BE`, `AL`, `GH`, `KN`, `LA`, and `SI`. As the reference explains, disabling a bar night suppresses invitations and announcements; it does not stop themed Sims from appearing when the active Sim is already at the bar. No config keys are added, removed, or renamed by this menu and choice review.

## Pregnancy menu organization and encoded values

Source: the user's Pregnancy menu outline, the bundled official reference, and the supplied config. All 91 existing settings assigned to MC Pregnancy remain available across these ten menus. This includes MC Marriage settings and the previously documented marriage/pregnancy dorm exclusions. The MCCC version is unknown; the menu review does not establish every option's saved code.

| Menu | Config keys | Organization |
| --- | ---: | --- |
| Adoption Settings | 5 | Adoption ages, three adoption percentages, Rename Non-Active Adoptions |
| Marriage Sim Selection | 11 | Eligible Sims, exclusions, check days, and age-specific marriage chances |
| Neighborhood Stories Settings | 4 | Neighborhood Stories rules, exclusive scheduling, child and pet adoption limits |
| Offspring | 9 | Gender percentages, birth-count percentages, child limits, naming, and inherited traits |
| Other Marriage | 10 | Naming, moving families, matching rules, and marriage confirmation |
| Other Pregnancy | 11 | Pregnancy duration, progression, moods, and pregnancy confirmation |
| Partner Sim Selection | 10 | Partner ages, genders, preferences, and eligibility |
| Pet Pregnancy Settings | 9 | Six direct settings plus Cats, Dogs, and Horses under Pregnancy Percentage |
| Pregnant Sim Selection | 13 | Eligible Sims, exclusions, check days, and age-specific pregnancy chances |
| Spouse Sim Selection | 9 | Seven direct settings plus Required Traits and Conflicting Traits under Marriage Trait Limits |

`src/lib/pregnancy-groups.ts` arranges the **82 settings outside Offspring** into nine groups matching their existing menus. The nine Offspring fields keep their established group, giving all 91 imported Pregnancy settings one place in the layout. Existing navigation paths, including Pet Pregnancy Percentage and Marriage Trait Limits, stay unchanged.

Within each group, related controls share blocks: schedules and chances; ages and gender preferences; household exclusions; confirmation and naming; pregnancy timing and moods; relationship preferences; and pet eligibility and limits. Each block contains two to six settings. Cats, Dogs, and Horses share a three-column percentage block on wide screens, and the two marriage trait-pair editors have room for their paired selectors.

This grouping changes presentation only. Full descriptions, default labels where provided, and gameplay or interruption notices remain visible. Each imported field keeps its own control, validation, and Undo; filtering retains mounted controls and incomplete drafts. Stored values remain independent, missing settings stay absent, and grouping never rewrites the config.

`Marriage_RequiredTraitsList` and `Marriage_ConflictTraitsList` remain two arrays of trait pairs under Spouse Sim Selection → Marriage Trait Limits. The reference explicitly defines the pair-based rules, described below. Empty imported lists remain empty until a pair is added. Pet Pregnancy Percentage contains three existing keys, rather than one combined setting. Pet pregnancy notifications stay in the pet menu according to the reference; general notifications retain their existing locations. `Pregnancy_BabyMotiveDecay` stays under MCCC Settings → Gameplay → Motive Decay, where the official path places it.

Both Other Marriage and Other Pregnancy contain a **Manual Confirmation** leaf. They remain separate booleans: `Marriage_ManualConfirmation` approves random MCCC marriages, while `Pregnancy_ManualConfirmation` approves random MCCC pregnancies. Pregnancy confirmation does not apply to Neighborhood Stories or manually started pregnancies. These dialogs are distinct from notification-audience choices.

### Adoption ages, percentages, and naming

| Display label | Code | Basis |
| --- | --- | --- |
| Newborn | `B` | The reference calls this age Baby; the reviewed menu uses Newborn |
| Infant | `I` | Present in the supplied `B,I,TD,C,T` string and matched to the user's Infant option; absent from the older reference list |
| Toddler | `TD` | Explicit reference mapping |
| Child | `C` | Explicit reference mapping |
| Teen | `T` | Explicit reference mapping |

`Pregnancy_AdoptionAges` retains a comma-separated string, including any unfamiliar codes. The reference says the chosen age is randomly selected from the enabled ages. The Infant mapping combines the user's menu observation with the example, rather than claiming it appears in the older website documentation.

The three adoption percentage keys are `Pregnancy_AdoptionPercentMale`, `Pregnancy_OppositeSexAdoptionPercent`, and `Pregnancy_SameSexAdoptionPercent`. Each uses the user-specified 0–100 range. The first controls the male/female chance for children generated by scheduled adoptions; it does not affect active-Sim computer adoptions. The other two determine whether a scheduled pregnancy becomes an adoption instead. They do not convert an already established pregnancy, and an adoption creates one child without the parents' genetics.

The user confirmed the same four naming choices for Rename Non-Active Adoptions (`Pregnancy_NameInactiveAdoption`) and Rename Non-Active Offspring (`Pregnancy_NameInactiveOffspring`):

| Display label | Saved code |
| --- | --- |
| All | `N` |
| Include Active Sims Only | `A` (default) |
| Include Played Households | `P` |
| Related to Active Household | `R` |

These remain separate saved settings with independent controls and Undo. The active-only default also agrees with the bundled reference. The broader choices can open additional naming dialogs, so both settings retain their interruption notices. These codes are confirmed specifically for naming and are not inferred from notification audiences.

### Check days and age-specific percentages

`Marriage_DaysToRun` and `Pregnancy_DaysToRun` use the explicitly documented codes below. Display order starts with Monday as requested; existing strings are not reordered merely by opening the menu. An empty string keeps MCCC's built-in schedule for the current aging speed.

| Day | Code |
| --- | --- |
| Monday | `MO` |
| Tuesday | `TU` |
| Wednesday | `WE` |
| Thursday | `TH` |
| Friday | `FR` |
| Saturday | `SA` |
| Sunday | `SU` |

| Config key | Percentage fields in order | Stored shape |
| --- | --- | --- |
| `Marriage_AgePercentage` | Teen, Young Adult, Adult, Elder | Four numbers in one comma-separated string |
| `Pregnancy_AgePercentage` | Teen, Young Adult, Adult, Elder | Four numbers in one comma-separated string |
| `Pregnancy_CatAgePercentage` | Adult, Elder | Two numbers in one comma-separated string |
| `Pregnancy_DogAgePercentage` | Adult, Elder | Two numbers in one comma-separated string |
| `Pregnancy_HorseAgePercentage` | Adult, Elder | Two numbers in one comma-separated string |

The four human-age positions follow the user's menu order and existing age conventions; the reference describes the age-specific behavior but does not explicitly index each token. The pet descriptions name Adult and Elder and explicitly specify 0–100. All five settings use separate sliders for their age fields while preserving the original strings and untouched tokens. These are independent per-age chances, with zero disabling the corresponding random process. Their totals do not need to equal 100. The reference notes that teen marriage/pregnancy choices depend on MC Woohoo being installed.

Pet Age to Run (`Pregnancy_PetAgeToRun`) offers Adult (`A`) and Elder (`E`), following its explicit description. The user separately confirmed the same two independent selections for Pet Partner Age (`Pregnancy_PetPartnerAge`). This setting remains a comma-separated string and preserves unfamiliar imported tokens when a known age is changed. Its bundled reference default is `A`, **Adult**; displaying that default does not replace an empty or different imported selection.

Ten scalar percentage controls use 0–100 sliders with precise inputs that accept fractions: the three adoption percentages above, `Marriage_SameSexPercentage`, `Pregnancy_SameSexPercentage`, `Marriage_FlagGenderPreferencePercent`, `Pregnancy_FlagGenderPreferencePercent`, `Pregnancy_AllowAffairsPercent`, `Pregnancy_AutoMarryPercent`, and `Pregnancy_IdenticalOffspringChance`. These independent values are not normalized against one another.

`Marriage_FlagGenderPreferencePercent` and `Pregnancy_FlagGenderPreferencePercent` are numeric chances, not boolean switches. A successful check can permanently flag a Sim for same-sex-only or opposite-sex-only matches in future random cycles; the reference says those flags need to be cleared manually if the player wants different behavior. Gameplay notes call attention to this lasting effect. The separate Use Gender Preference settings keep their own keys and types.

Pregnancy Duration (`Pregnancy_Duration`) displays days. Days Until Max Age (`Pregnancy_AgeUpDaysLimit`) now uses the confirmed integer range **0–10 days**, with reference default **0**. It controls the remaining-age restriction used by scheduled random pregnancy checks. The user confirmed Random Mood Duration (`Pregnancy_RandomMoodDuration`) as **1–23 Sim hours**; the bundled reference gives a default of **1**. Its slider steps by one hour, while the precise input retains fractional support because an integer-only restriction was not supplied. This setting controls both how often a new random pregnancy buff is added and how long it lasts.

Human Maximum Offspring (`Pregnancy_MaxOffspring`) and the separately confirmed Pet Maximum Offspring (`Pregnancy_PetMaxOffspring`) both use the integer range **1–6**, with default **3**. They remain independent limits and keep their separate markers on the offspring-count distributions. Defaults are shown as information without replacing imported values. Imported outliers and unusual types remain preserved; new invalid numeric edits can be corrected or undone.

### Neighborhood Stories adoption limits

`Pregnancy_NSAdoptChildLimit` and `Pregnancy_NSAdoptPetLimit` use the user's −1–7 range. The reference defines −1 as leaving Neighborhood Stories adoptions at normal behavior; it is not a claim that every underlying game limit is removed. Zero blocks the corresponding adoptions even when the household currently contains no children or pets. Positive values check the existing household count against the configured threshold. These numeric markers remain unchanged on import.

### Grouped Offspring controls and linked distributions

The nine existing Offspring settings are presented together while retaining their original keys and navigation. Limits, trait inheritance, naming, gender percentages, and offspring-count percentages remain separate saved values. Each setting keeps its own Undo and validation state, and filtering preserves incomplete drafts.

`Pregnancy_OffspringGenderPercents` is an object with numeric `F` and `M` fields, shown in the example as `{"F":50,"M":50}`. Its percentages must total 100 according to the reference. The historical `Pregnancy_OffspringGender` string setting has a bundled reference entry but is absent from this example, and the user could not find it in the current game. It may have been superseded by the percentage setting, but no migration or replacement relationship has been proven. The editor supports the old key only when imported, using its documented `M`/`F` multiselect; it does not alias, convert, generate, or replace either key. If a file contains both, both remain independent.

`Pregnancy_PercentWeights` is a separate object whose keys `1` through `6` hold arrays for the possible offspring counts. For example, row `3` contains `[89,10,1]`, corresponding to single, twin, and triplet chances. Each row must total 100. Both distributions retain their imported object/array types and remain distinct from independent age-specific chances.

Their linked controls keep the edited percentage and proportionally adjust the other known outcomes in that distribution to total **100%**. This happens only after an explicit valid edit; displaying an imported distribution does not normalize it. Editing one distribution preserves every other distribution. Unknown fields, missing data, and incompatible types remain preserved, and changing Maximum Offspring does not rewrite the saved rows.

The user confirmed that **all imported distributions for one through six offspring remain editable**, because human and pet maximums can differ. The editor marks the profiles matching the current `Pregnancy_MaxOffspring` and `Pregnancy_PetMaxOffspring` values as **Human maximum** and **Pet maximum**. These markers describe the two saved limits without selecting a single active distribution or claiming which row the game will use. Missing profiles are not created, and additional imported fields remain preserved.

### Confirmed trait, marriage, and pregnancy-pause choices

The user confirmed these single-choice mappings, in the displayed order:

| Config key | Choices | Default |
| --- | --- | --- |
| `Pregnancy_OffspringTraitsType` | `N` = Inherit no Traits; `F` = Inherit Maximum Number; `R` = Inherit Random Number | `N`, Inherit no Traits |
| `Marriage_ManualRenameSpouses` | `N` = All; `P` = Played households; `A` = None | `A`, None |
| `Marriage_SameNeighborhood` | `A` = Always Limit Partners by Neighborhood; `N` = Never Limit Partners by Neighborhood; `P` = Prefer Partners In Same Neighborhood | `N`, Never Limit Partners by Neighborhood |
| `Pregnancy_RelationshipOnly` | `N` = No limits; `M` = Married Only; `S` = Significant Other; `W` = WooHoo partners | `N`, No limits |
| `Pregnancy_AllowMalePregnancy` | `N` = No pregnancy; `Y` = Allow pregnancy; `S` = Same sex only | `N`, No pregnancy |

Trait inheritance follows the separately saved maximum: the maximum option uses as many traits as allowed and available, while the random option chooses between one and that maximum. Choosing no inheritance does not clear the stored maximum. Spouse naming retains its interruption notice: All or Played households can open a surname-selection dialog for non-active marriages; None disables those dialogs. The reference excludes active households and Ancestral homes and describes further naming limitations in the full setting description.

For Same Neighborhood, Always requires both partners to live in the same world, even when they already have a boyfriend/girlfriend/engagement relationship. Never ignores the world. Prefer allows those established partners to marry across worlds but requires other partners to live in the same world.

Limit By Relationship applies alongside the other pregnancy-selection rules. Significant Other includes married partners; WooHoo partners includes those relationships and Sims who have previously had WooHoo together. Male Pregnancy controls scheduled random NPC pregnancies: Allow pregnancy permits male pregnancies, and Same sex only limits them to male partners. The reference explicitly separates this setting from WooHoo/Try for Baby behavior.

Pause Sims Pregnancy (`Pregnancy_PauseSimsPregnancy`) now exposes the confirmed independent selections `A` = **Active Sims**, `P` = **Played Sims**, and `N` = **NPC Sims**. An empty string means **None** (default), represented by leaving all three unchecked rather than adding an empty checkbox. The saved value remains a comma-separated string. This is separate from the boolean Pause on Playable Labor (`Pregnancy_PauseOnPlayableLabor`): the first stops progression for selected groups; the second continues until labor and then shows a dialog. Selecting no groups does not undo pregnancies paused with an individual MCCC command.

Unfamiliar imported string codes remain available as choices from the file, and unfamiliar pause tokens remain preserved when known selections change. Other JSON types keep their generic controls. None of these confirmations adds missing keys or applies default values automatically.

### Marriage trait pairs

Required Traits (`Marriage_RequiredTraitsList`) and Conflicting Traits (`Marriage_ConflictTraitsList`) are **arrays of two-trait pairs**, with separate rules for MCCC's random marriages:

- A required pair means that when one Sim has the first trait, the other must have the second trait, and vice versa.
- A conflicting pair prevents a marriage when one Sim has the first trait and the other has the second, in either direction.

For example, a conflicting pair `["16858","203542"]` means **Neat × Paranoid**. A one-pair setting is stored as `[["16858","203542"]]`, retaining the string IDs inside each pair. It blocks that combination between partners; neither trait is globally blacklisted. These restrictions apply to MCCC's random marriage process, while marriages initiated elsewhere retain their own behavior.

The pair editor uses two trait selectors per row, drawing names from the same 97 confirmed personality-trait mappings. Pairs can be added or removed explicitly. Editing one pair preserves the other pairs and keeps the nested array shape. A supported pair contains exactly two nonblank strings; padded or unfamiliar IDs remain preserved without being relabeled as a known trait. Numeric IDs and other malformed entries are retained without automatic conversion or repair. Opening the editor never inserts a pair into an empty list.

Either side of a valid pair can be explicitly replaced with a known trait while the other saved ID stays unchanged. Valid pairs containing unfamiliar IDs can also be explicitly removed. IDs are never trimmed or assigned inferred names, and malformed entries remain read-only.

## Tuner menu organization

Source: the user's Tuner outline and confirmed archive range, matched against the bundled reference and config. All 22 existing settings retain their three menus: 12 under Change Interaction Behavior, eight under Change Interaction Autonomy, and two under Autonomy Scan. The user confirmed that the other 21 settings are booleans. The editor preserves the actual type of every imported value rather than converting an unfamiliar representation into a boolean or number.

| Menu | Menu label | Config key |
| --- | --- | --- |
| Change Interaction Behavior | Allow Child Baby Care | `Tuner_Child_Baby_Care` |
| Change Interaction Behavior | Allow Emotional Deaths | `Tuner_AllowMoodDeath` |
| Change Interaction Behavior | Allow Instant Upgrades | `Tuner_InstantUpgrade` |
| Change Interaction Behavior | Allow Monster Under Bed | `Tuner_AllowMonsterUnderBed` |
| Change Interaction Behavior | Allow Multiple BFFs | `Tuner_AllowMultipleBFFs` |
| Change Interaction Behavior | Allow Teen Move-in | `Tuner_AllowTeenAskMoveIn` |
| Change Interaction Behavior | Disable Witness Death | `Tuner_DisableWitnessDeath` |
| Change Interaction Behavior | Friendly Ask If Single | `Tuner_FriendlyAskSingle` |
| Change Interaction Behavior | Friendly Stay The Night | `Tuner_FriendlyStayNight` |
| Change Interaction Behavior | Kisses Always Available | `Tuner_KissesAlwaysAvailable` |
| Change Interaction Behavior | Put Away Books Fix | `Put_Away_Books_Fix` |
| Change Interaction Behavior | Stop Random Flirting | `Tuner_StopRandomFlirting` |
| Change Interaction Autonomy | Autonomous Cleaning | `Tuner_AutoClean` |
| Change Interaction Autonomy | Autonomous Flirty | `Tuner_AutoFlirty` |
| Change Interaction Autonomy | Autonomous Gardening | `Tuner_AutoGarden` |
| Change Interaction Autonomy | Autonomous Marriage | `Tuner_AutoMarriage` |
| Change Interaction Autonomy | Autonomous Mean | `Tuner_AutoMean` |
| Change Interaction Autonomy | Autonomous Mischief | `Tuner_AutoMischief` |
| Change Interaction Autonomy | Autonomous Proposals | `Tuner_AutoProposal` |
| Change Interaction Autonomy | Autonomous Repairs | `Tuner_AutoRepair` |
| Autonomy Scan | Archive Autonomous Actions | `Tuner_ArchiveInteractions` |
| Autonomy Scan | Maximum Autonomy Archive | `Tuner_MaximumArchive` |

Within those existing menus, the editor arranges the settings into seven related blocks:

| Menu | Block | Settings |
| --- | --- | ---: |
| Change Interaction Behavior | Social interaction rules | 5 |
| Change Interaction Behavior | Children and households | 3 |
| Change Interaction Behavior | Death-related behavior | 2 |
| Change Interaction Behavior | Upgrades and homework | 2 |
| Change Interaction Autonomy | Autonomous social interactions | 5 |
| Change Interaction Autonomy | Autonomous household tasks | 3 |
| Autonomy Scan | Autonomy scan archive | 2 |

Grouping preserves each field's full description, original key, saved value, and individual Undo. Filtering keeps controls mounted so invalid drafts remain available to correct or undo. Missing keys stay absent and all settings remain independently editable.

`Put_Away_Books_Fix` belongs to Tuner despite lacking the `Tuner_` prefix. Its reference describes teenagers putting completed homework into their inventory; the broad key name does not establish behavior for every kind of book. Conversely, `Tuner_Child_Pay_Bills` belongs under MCCC Settings → Money Settings, following its official path.

Autonomy Scan uses the official **Archive Autonomous Actions** label: enabling it adds recently completed interactions to the Currently Running Scan dialog. Maximum Autonomy Archive (`Tuner_MaximumArchive`) controls the number of interactions retained per Sim and now uses the user-confirmed integer range **0–200**, with a slider and precise input. Its displayed default **50** comes from the bundled reference; the editor does not apply that default automatically. No special behavior is inferred for zero beyond its inclusion in the confirmed range.

Maximum Autonomy Archive stays editable when Archive Autonomous Actions is off, allowing a limit to be prepared in advance. Changing the archive toggle never resets the limit. Imported outliers remain preserved and exportable until edited, while new invalid numeric drafts block export until corrected or undone. **Autonomous Repairs** uses the corrected spelling from the reference.

Stop Random Flirting requires some existing romance for ordinary autonomous flirting and takes precedence over Autonomous Flirty when both are in use. The reference identifies vampire charm and clubs that encourage flirting as exceptions to the usual autonomy rules. It also notes that the setting can affect autonomous WooHoo outside romantic situations.

## WooHoo menu organization and controls

Source: the user's supplied outline, matched against the official reference and example config, supplemented by their later confirmation of pregnancy-recipient codes and defaults. At the time of the original outline, the user reported that MC WooHoo was not installed; other controls remain outline/reference-based. All 35 existing keys have reference entries and remain available; the editor does not insert this optional module's keys into a file that lacks them.

| Menu | Config keys | Organization |
| --- | ---: | --- |
| WooHoo Actions | 7 | Existing interaction availability settings |
| WooHoo Pregnancy | 5 | Age-specific chances, fertility modifier, overall chance, and two recipient settings |
| WooHoo Reactions | 4 | Bed Sharing, No Jealousy, Use Privacy for WooHoo, Sleepy WooHoo |
| Sim Nudity | 11 | Three direct settings and eight booleans under Nudity Interactions |
| Other Settings | 8 | Autonomy, skill, and birth-control settings |

| Config key | Control | Reference basis |
| --- | --- | --- |
| `Woohoo_RiskyWoohooPercents` | Four independent 0–100% sliders: Teen, Young Adult, Adult, Elder | The reference explicitly names these age groups and range; the example stores `"0,0,0,0"` |
| `Woohoo_TryForBabyPercent` | 0–100% slider with precise input | The reference defines a percentage chance |
| `Woohoo_BirthControlDuration` | 1–24 hour slider | Explicitly documented duration bounds |
| `Woohoo_AutonomousMinRestTime` | 0–24 hour slider | Existing documented bounds, now with an hours unit |
| `Woohoo_SameSexPregnantSim` | Multiselect: `T` = Target, `I` = Initiator; default `T` (Target) | Codes, comma-separated combinations, and default confirmed by the user |
| `Woohoo_OppositeSexPregnantSim` | Multiselect: `F` = Female, `M` = Male, `T` = Target, `I` = Initiator; default `F` (Female) | Codes, combinations, and default confirmed by the user |

The age-specific chances retain their comma-separated string representation and do not need to total 100. The reference says that when the two Sims have different age-group chances, the target Sim's chance is used. Editing one field preserves the other tokens; malformed or unfamiliar imported representations are not silently reshaped.

The existing `Woohoo_NudeWoohooGender` and `Woohoo_NudityAges` multiselects retain their documented string codes and unfamiliar imported values. Both pregnancy-recipient settings now use the same checkbox controls, with independent selections saved as comma-separated strings such as `"T,I"` and `"F,M,T,I"`. Target receives the interaction and Initiator starts it. The opposite-sex setting allows genders and interaction roles to be combined; the editor does not make them mutually exclusive. Defaults are informational and never replace imported selections, including an empty string. Unfamiliar codes and unexpected imported JSON types are preserved, and each setting has independent Undo.

Extreme WooHoo (`Woohoo_ExtremeWoohoo`) receives a gameplay note for its documented increase in autonomous activity. It requires either `Woohoo_AutonomousWoohoo` or `Woohoo_AutonomousTryForBaby` to be enabled. Editing it does not automatically change either dependency or the rest-time setting. This pass adds no other behavior notes or default resets.

## Clubs menu organization

Source: the user's confirmed flat Clubs menu, matched to the five existing reference entries and config keys. The sidebar remains flat; the editor groups related settings into two blocks:

| Menu label | Config key |
| --- | --- |
| Club limits → Club Member Count | `Club_ClubMemberCount` |
| Club limits → Maximum Joinable Clubs | `Club_MaximumClubCount` |
| Membership management → Monitor Club Members | `Club_MonitorMembers` |
| Membership management → Bypass Played Households | `Club_BypassPlayedHouseholds` |
| Membership management → Open Members | `Club_OpenMemberSlots` |

The user confirmed **8–50** for Club Member Count and **1–50** for Maximum Joinable Clubs. Both numeric values use integer sliders with precise inputs; Open Members retains its **0–7** range. The reference defaults are 8 members, 3 joinable clubs, and 1 open slot. Each setting retains its own Undo, imported types and outliers are preserved until edited, and missing keys are never inserted.

Concise descriptions retain the reference's in-game UI limitations: clubs need both extra-slot perks and the full 8-member capacity before exceeding 8, and additional members must be invited through interactions. Joining more than 3 clubs requires invitations or MC Cheats because the club dialog cannot add them. Open Members affects automatic filling while monitoring is enabled; it does not remove current members. Membership controls stay independently editable without changing one another.

## Menu coverage and remaining value review

All 439 editable settings in the supplied example now have menu assignments, including all 114 core settings. The example has no keys left under More MCCC Settings, so that empty branch is hidden. Fallback navigation remains available for other core/reference keys, and unfamiliar imported keys can still appear under Other settings. These coverage counts apply to the supplied example, not every MCCC version or possible config.

The latest follow-up closes the four choice-inventory gaps recorded in the all-settings review: Multiple Outfit Ages, Makeup Outfits, Adjust Sims on Lot, and Disable Immortal Sims. Other explicitly noted assumptions or unverified structured-value constraints remain separate; these confirmations do not establish every option across all MCCC versions. Bypass Specific Menus already has its own user-confirmed mapping above.

The complete example still contains 442 keys: 439 editable settings and three preserved internal values. Menu organization neither drops keys nor adds settings for modules absent from an imported config.
