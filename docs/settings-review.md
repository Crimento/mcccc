# All-settings review

Reviewed the supplied `mc_settings.cfg`, effective catalogue metadata, rendered controls, and bundled MCCC reference. The supplied file contains 442 keys: 439 displayed settings and three preserved internal values. `Cleaner_ItemCleaner` remains visible but read-only at the user's request.

## Grouping

The existing editors already grouped 340 settings. This pass groups another 71 settings into related blocks while retaining their original sidebar paths:

| Section | Newly grouped settings | Blocks |
| --- | ---: | --- |
| MCCC Settings | 11 | Child adoption, progression difficulty, death settings, logging |
| Create-a-Sim | 2 | Automatic walkstyle changes |
| Cleaner | 5 | Accessory synchronization, neighborhood cleanup |
| Dresser | 11 | Facial hair, makeup, outfit cleanup |
| Population | 7 | Lot population, special visitors, Sim persistence |
| WooHoo | 35 | Interaction availability, pregnancy, reactions, nudity, autonomy, birth control, and the optional skill |

The remaining 28 standalone settings include unrelated general toggles, large trait selectors, menu ordering, and disabled Cleaner definitions. Grouping them would not make their relationship clearer. Existing controls, per-setting Undo, imported types, validation, and filtered drafts continue to work independently.

## Descriptions and search

66 curated descriptions remove code dictionaries and repeated choice lists where the editor already presents those choices, including one legacy setting absent from the example file. Behavioral distinctions remain: empty-selection behavior, interactions between settings, timing, affected households, and performance considerations. The downloaded reference snapshot remains unchanged.

Search also includes choice labels, values, and choice groups. A setting remains discoverable by its choices even when their enumeration has been removed from its description.

## Remaining string inputs

Before this pass, the supplied file produced three genuine free-text settings. Other values stored as strings already use ranges, percentage sliders, multiselects, skill lists, or situation-outfit controls.

| Key | Result |
| --- | --- |
| `Appearance_ApplyTemplate` | Replaced with a dropdown: empty string = Manual (default), `A` = On age-up, `Z` = On zone-in. The bundled reference explicitly defines all three codes. |
| `Autosave_Name` | Remains text because it is a user-chosen save name. |
| `Autosave_HexSlotNumber` | Remains text because it is a hexadecimal slot identifier, not an enum or decimal quantity. |

The bundled reference also contains the historical `Pregnancy_OffspringGender` string setting, absent from the supplied config. The user could not find it in the current game; the example instead uses `Pregnancy_OffspringGenderPercents`. The percentage setting may have superseded it, but a migration or replacement relationship has not been established. The old key is supported only for import compatibility: when present, it uses its documented `M`/`F` multiselect under Offspring. The editor keeps both keys independent and neither aliases, converts, nor generates either one.

The internal `DP_OneTimeUpdate` and `DP_UseOnly` strings remain hidden and preserved. Malformed or unfamiliar imports can still show fallback text/structured controls so their original values are not silently converted. `Cleaner_ItemCleaner` remains disabled as previously agreed.

## Age choices corrected during review

The user retested `Dresser_RunOnAgeUp` and `Dresser_MakeupAges` with every age selected and confirmed `"I,TD,C,T,YA,A,E"` for both. The follow-up also confirmed that complete list for `Dresser_MultipleOutfitAges`. These three controls offer Infant, Toddler, Child, Teen, Young Adult, Adult, and Elder in chronological order. This expands the older reference's shorter lists without changing any saved selection or extending other settings' age lists.

## Choice mappings confirmed in the follow-up

The user supplied the remaining mappings for all four inventories identified in the previous review. Their existing selection controls now cover every label in those reviewed menus:

| Setting | Confirmed inventory |
| --- | --- |
| `Dresser_MultipleOutfitAges` | Seven ages: `I` Infant, `TD` Toddler, `C` Child, `T` Teen, `YA` Young Adult, `A` Adult, `E` Elder. |
| `Dresser_MakeupOutfits` | The eight standard outfits plus `B` Bathing, `BT` Batuu, `C` Career, `SI` Situation, and `SP` Special: 13 choices in total. |
| `Population_NumAdjustLot` | All 31 lot and situation mappings, grouped by pack. The complete table is in [the in-game notes](in-game-settings.md#adjust-sims-on-lot). |
| `Population_DisableImmortalSims` | All 12 special-Sim group mappings. The complete table is in [the in-game notes](in-game-settings.md#disable-immortal-sims). |

The special makeup categories are scoped to `Dresser_MakeupOutfits`. After-career outfits and situation replacements still use only the eight standard outfit categories. Unknown future codes remain available as values from the imported file and survive edits to known choices. Confirming these inventories does not add missing config keys, normalize selections, or establish unrelated encodings.

## Follow-up verification

- 277 unit tests and the production build pass.
- All eight Dresser and Population browser cases pass with the completed choice inventories.
- Checks cover exact code/label mappings, all-selected imports, preserving CSV order and unfamiliar values, individual edits and Undo, and the separation between the 13 makeup categories and eight standard outfit categories.

## Previous review verification

These results were recorded before the follow-up choice mappings above; they are not a claim that the new mappings have already completed regression checks.

- 275 unit tests and the production build passed.
- 25 browser tests passed across the review suite and the affected Core, Create-a-Sim, Cleaner, Dresser, Population, and WooHoo sections.
- The rendered sample contains all 439 displayed keys exactly once; all 442 saved keys survive an untouched export.
- Full and partial imports, unfamiliar codes and JSON types, per-setting Undo, invalid drafts across filters, and choice-name search were checked.
- Grouped layouts were reviewed at desktop and mobile widths without horizontal overflow.
