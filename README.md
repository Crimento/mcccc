# MCCC Configurator

A static, browser-only settings editor for The Sims 4 MC Command Center, built with Vue 3, Vite, TypeScript, Tailwind CSS, and shadcn-vue. No backend or account is required.

## Run locally

Use Node.js 22.12+ (or a newer supported Node release).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To build a static site:

```sh
npm run build
npm run preview
```

Deploy the `dist/` directory to a static host. The default configuration assumes the root of a domain; set Vite's `base` if hosting under a subdirectory. No files are uploaded by the app. Drafts use local storage in the user's browser.

## What works

- Import a `mc_settings.cfg` or JSON file through the picker or drag and drop.
- Search all imported settings and browse familiar MCCC modules. MCCC Settings includes Age, Auto-Save, Gameplay, Money, Relationships, and nested notification, console, and logging menus, with human lifespans before pets.
- Browse Create-a-Sim templates and default walkstyles by gender and age, alongside trait exclusions, fit/fat limits, and offspring settings. Body controls follow anatomy from neck to feet.
- Browse Dresser's facial hair, makeup, and outfit settings. Facial-hair chances have four age-labeled percentage sliders, and makeup genders are independently selectable. Full age, outfit, and situation label inventories are recorded for the remaining encoding review.
- Browse all six Occult species, with aging controls, population limits, custom pregnancy outcomes, and vampire feeding chances. Shared aging values and the custom-pregnancy switch stay synchronized across species menus and export under their original keys.
- Browse Population's moving, populating, Neighborhood Stories, and random lot challenge settings. Verified lot and immortal-Sim choices keep unfamiliar imported codes intact; complete pack and group label inventories remain available for further encoding review.
- Browse Pregnancy's ten menus for adoption, marriage, partners, offspring, pets, and Neighborhood Stories. Adjust independent human/pet age chances and percentage sliders, select adoption ages and check days, and set Neighborhood Stories adoption limits. Marriage and pregnancy confirmation prompts remain independently editable.
- Browse Tuner's interaction behavior, autonomous actions, and recent-interaction archive settings in three menus.
- Browse WooHoo's five menus with age-specific chance controls and hour-based durations, using the supplied outline and official reference for this optional module.
- Use the dark interface to edit booleans, numbers, verified enumerations, CSV multi-selections, and nested objects/arrays.
- Adjust documented bounded numbers with sliders and precise inputs. Appearance limits and body-template ranges use two handles while preserving CSV strings or numeric arrays on export.
- Set abduction pregnancy genders with a Male/Female dropdown, age-specific pregnancy chances with four independent percentage sliders, and abduction start/duration with hour sliders. The original string and number representations are preserved on export.
- Body-template sliders cover the normal EA range, while their precise inputs also preserve custom values outside it. Documented hard limits are validated separately.
- Compare lifespans by species with age rows and Short, Normal, and Long columns on desktop, or profile tabs on mobile. Human sliders cover 0–4000 days in half-day steps; pet sliders offer `0` or 1–1000 days in whole-day steps. Precise inputs accept custom decimals, and helper text shows each reported EA duration. Imported profiles and unfamiliar values retain their original keys and types.
- Preserve unfamiliar keys, unknown option codes, string-encoded values, and the original config for backup/undo.
- Review subjective gameplay notes separately from ordinary settings. Marriage approval prompts are distinct from notification posts.
- Preview three small presets and apply only compatible settings already present in the imported file.
- Review changes, undo individual edits or all changes, and download the finished `.cfg` plus an optional original backup.
- Identify settings that differ from MCCC defaults immediately after import. **Non-default only** compares against a freshly recreated MCCC **2026.5.0** configuration, including MC WooHoo; **Modified only** compares against your imported file. The separate snapshot in `src/data/default-settings.json` covers all 439 editable settings and excludes three internal values. For keys absent from that snapshot, verified in-game observations and unambiguous reference defaults are used where available. Unknown keys, incompatible structures, and ambiguous defaults remain marked **Default unknown**. Comparisons preserve the file; defaults can differ between MCCC versions.
- Resume a locally saved draft after reopening the page.

The supplied `mc_settings.cfg` is bundled as an explicitly labelled example. On 2026-09-20, the user supplied a fresh default configuration and confirmed MCCC **2026.5.0**, including MC WooHoo. All 442 values matched the existing example. The verified comparison snapshot is stored separately so replacing the example does not change the default baseline. The original file is never overwritten by this app.

To use an exported config, close The Sims 4, back up the current file, then replace `mc_settings.cfg` in the MCCC mod directory. Browser downloads do not modify the mod folder automatically.

## Settings reference and limits

Most descriptions, menu paths, and documented option values come from [Deaderpool's official settings reference](https://deaderpool-mccc.com/search.html), specifically its [settings data](https://deaderpool-mccc.com/otherassets/menu_data.json). The bundled snapshot has 433 records, retrieved on 2026-09-16; 428 match the 442 keys in the supplied example.

[In-game observations](docs/in-game-settings.md) document three horse lifespan settings, three dorm-resident exclusions, career Neighborhood Stories, pausing on zone load, homeless romance move-ins, death notification audiences, and teleport overlap, bringing coverage to all 439 editable settings in the 442-key example. User-reported defaults, bounds, and age labels also supplement the three human and six cat/dog lifespan entries already present in the reference, without changing those counts. This metadata lives separately in `src/data/in-game-settings.ts` and survives website reference refreshes. The UI identifies the source in each setting’s details. The reported EA durations are informational; selecting EA defaults preserves the numeric `0` marker in the config. Documented MCCC defaults are shown without changing imported values.

The [pet lifespan table](docs/in-game-settings.md#pet-lifespan-defaults) records user-reported Child, Adult, and Elder defaults for all nine cat, dog, and horse profiles. It includes fractional days and the corrected short horse Elder default of 6.5 days; recording these values does not replace imported custom durations.

`Career_LimitNS` corresponds to **Alter Neighborhood Stories** in MC Career. Its behavior and Disabled default come from the supplied screenshot; the user confirmed the key by toggling the option and checking the saved config.

`Autosave_CurrentSaveNumber`, `DP_OneTimeUpdate`, and `DP_UseOnly` are treated as suspected internal values after the user found no corresponding menu options. These exact keys are hidden from editing and preserved on export, including nonempty values; their actual behavior remains unverified. The example shows 439 documented editable settings plus three separately counted internal values. Other autosave settings, including `Autosave_Enabled`, remain editable.

Notification audience codes are shared through `src/lib/notification-audiences.ts`. Each supported setting uses its verified subset and any wording overrides; new keys are not assigned an audience selector solely because of their name. Notification codes, including `"0"` for None, remain strings in exported configs.

Menu organization lives in `src/lib/navigation.ts`. All 439 editable settings in the supplied example now have menu assignments, including all 114 core settings. Notifications/Console/Menu Settings contains 42 keys, including Phone Texts and Show Menu Settings. The empty **More MCCC Settings** fallback is hidden for this example and remains available for other core keys; unfamiliar imported keys remain accessible under Other settings. Relationship Settings includes separate Breakup and Move-In menus. Module assignment follows the reference path where available, so marriage settings appear under Pregnancy and child bill payments under MCCC Settings → Money Settings. Clubs follows the user's flat menu order. WooHoo uses the supplied outline and official reference; the user has not installed that module, so its menus are not verified in-game. Search, modified settings, and gameplay notes span all menus.

Change Sim Menu Order edits the existing `Menu_Order` object. The game's Save Current Order and Reset to Default Order entries are actions on that value, not separate config keys. The editor preserves its unknown menu identifiers and string positions without inventing a factory order or extra save/reset fields.

Menu organization is complete for the example; value review remains ongoing. Bypass Specific Menus retains a text input because the 11 supplied menu labels have no verified config encoding. Other pending codes and structured-value constraints are recorded in the in-game notes.

The Occult controls combine the official reference with the user's menu review. Some species codes and age positions rely on the example and existing naming conventions, and the −1–50 population-limit range is applied consistently across species from the two explicitly supplied ranges. These implementation assumptions and the remaining encoding checks are recorded in [the Occult notes](docs/in-game-settings.md#occult-menu-organization-and-encoded-values). Pregnancy controls preserve six- or seven-part strings, including their unused `-1` entries; no duplicate species keys are generated.

Population's 45 settings include the previously confirmed dorm-resident exclusion. `src/data/population-choices.ts` records all 31 requested lot labels by pack and 12 immortal-Sim groups, with values only for the 13 lot codes and five immortal-group codes supported by the reference. Remaining labels, import choices, and challenge enums stay available for later encoding checks; abbreviations in the example are not treated as proof of their meaning. See [the Population notes](docs/in-game-settings.md#population-menu-organization-and-choice-inventories) for the mappings and limits.

Pregnancy's 91 settings keep marriage trait pairs as arrays and offspring percentages as their original objects. Independent age-specific chances differ from offspring gender and birth-count distributions, which the reference requires to total 100%; their generic structured editors do not yet validate or normalize those totals. [The Pregnancy notes](docs/in-game-settings.md#pregnancy-menu-organization-and-encoded-values) record these distinctions, adoption age mappings, and rename/pause choices whose codes still need review. Baby Motive Decay remains under MCCC Settings despite its `Pregnancy_` key prefix.

The reference is not a complete, versioned machine-readable schema. The sample does not identify its MCCC version. Some choices have no documented encoding, so those remain text inputs. Controls use explicit per-key mappings, with assumptions documented separately; unfamiliar values and nested JSON types are preserved. Numeric bounds are enforced only where encoded in the curated setting metadata; unrestricted controls are not a guarantee that MCCC accepts every possible value.

Refresh the text reference with:

```sh
node scripts/update-reference.mjs
# Or use an already downloaded reference:
node scripts/update-reference.mjs /path/to/menu_data.json
```

Then review `src/lib/catalog.ts` for changed option encodings, ranges, gameplay notes, and the reference retrieval date. Automated refresh does not change these manually verified mappings or the versioned default snapshot. The default comparison is read-only: Undo and Reset changes still restore the imported file, and exports do not insert missing default settings.

## Verification

```sh
npm test
npm run build
npm run test:e2e
```

Unit tests cover lossless round trips, CSV preservation, partial presets, validation, and metadata distinctions. Browser tests cover import/edit/export, prompts, presets, invalid input, and draft restoration. Playwright uses `/usr/bin/chromium` when available; otherwise install its browser with `npx playwright install chromium`. You can also set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a local browser path. See `playwright.config.ts` for the server configuration. Exported files should also be checked with the intended MCCC version in-game; browser tests cannot establish mod compatibility.

This is an unofficial companion. MC Command Center and its documentation belong to Deaderpool and their contributors. The project is not affiliated with Deaderpool, EA, or Maxis.
