# Ilaris FoundryVTT System Development Instructions

Always reference these instructions first and fallback to search or additional context gathering only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Essential Setup and Dependencies

-   Install Node.js (v18+ recommended). This repository requires ES modules support.
-   `npm install` -- installs development dependencies. Takes ~2 seconds. NEVER CANCEL.
-   All JavaScript files use ES module syntax (`import`/`export`) and target FoundryVTT v12.

### Core Development Workflow

-   **NEVER CANCEL builds or commands** - All operations complete quickly (under 5 seconds)
-   Format code: `npm run prettier` -- takes ~4 seconds, fixes formatting across all files. HTML template errors are expected and non-blocking.
-   ESLint: `npx eslint scripts/` -- currently has parsing errors due to FoundryVTT-specific syntax. Do not rely on it for validation.
-   Database operations: `node utils/create_database.js && node utils/import_database.js` -- takes ~3 seconds total. NEVER CANCEL.

### Building and Data Management

-   Database creation: `node utils/create_database.js` -- takes ~2 seconds. Converts XML data from Sephrasto to JSON format.
-   Database import: `node utils/import_database.js` -- takes ~0.3 seconds. Creates FoundryVTT-compatible .db files in `packs/` directory.
-   ALWAYS run both database commands together when updating game data: `node utils/create_database.js && node utils/import_database.js`
-   The build system processes data from `local_db/org/datenbank.xml` through `local_db/json_auto/` to final `packs/*.db` files.

## Validation and Testing

### Manual Validation Requirements

-   **CRITICAL**: This is a FoundryVTT system that requires FoundryVTT server v12+ to actually run and test functionality.
-   You can validate code structure and data processing without FoundryVTT, but full system testing requires FoundryVTT installation.
-   ALWAYS run formatting after any changes: `npm run prettier`
-   ALWAYS rebuild database files when changing game data: `node utils/create_database.js && node utils/import_database.js`

### Installation Scenarios

-   **Development**: Clone into FoundryVTT's `Data/systems/Ilaris/` directory, then restart FoundryVTT.
-   **End-user**: Install via FoundryVTT's system browser using manifest URL: `https://raw.githubusercontent.com/Ilaris-Tools/IlarisFoundryVTT/refs/heads/main/system.json`
-   **Python helper**: `utils/start.py` automates development installation (requires `settings_local.py` configuration).

## Repository Structure and Key Files

### Critical Files - NEVER DELETE

-   `system.json` -- FoundryVTT system manifest. Defines compatibility, assets, and data packs.
-   `template.json` -- FoundryVTT data model definitions for actors and items.
-   `scripts/hooks.js` -- Main entry point loaded by FoundryVTT.
-   `packs/*.db` -- Compiled game data (weapons, spells, advantages, etc.). Generated from database scripts.

### Code Organization

```
scripts/
├── actors/           # Actor (characters/creatures) logic
├── items/            # Item (equipment/spells/advantages) logic
├── sheets/           # UI forms and dialogs
├── common/           # Shared utilities, dice rolling, data import
├── config.js         # Game system configuration constants
└── hooks.js          # FoundryVTT system initialization

templates/            # Handlebars HTML templates
├── sheets/           # Character sheets, item forms
├── chat/             # Dice roll result displays
└── helper/           # Reusable UI components

local_db/             # Database processing pipeline
├── org/              # Source data (datenbank.xml from Sephrasto)
├── json_auto/        # Processed JSON (generated)
├── json_user/        # User customizations
└── db/               # Final JSON output
```

### Important Data Locations

-   Game rules data originates from `local_db/org/datenbank.xml` (Sephrasto character editor export)
-   User customizations go in `local_db/json_user/*.json`
-   Final compiled data packs are in `packs/*.db` (FoundryVTT LevelDB format)
-   Character sheet templates are in `templates/sheets/`
-   Dice rolling logic is in `scripts/common/wuerfel/`

## Common Development Tasks

### When Adding New Features

1. Edit relevant JavaScript files in `scripts/`
2. Update HTML templates in `templates/` if needed
3. Run `npm run prettier` to format
4. If changing game data, update user files in `local_db/json_user/` then run database rebuild
5. Test in FoundryVTT (requires FoundryVTT server)

### When Fixing Bugs

1. Identify if bug is in client-side logic (`scripts/`) or data (`local_db/`)
2. Check console errors in FoundryVTT (F12 developer tools)
3. Review dice rolling logic in `scripts/common/wuerfel/` for calculation issues
4. Check character sheet templates in `templates/sheets/` for UI issues

### Data Import and Updates

-   Source data comes from Sephrasto RPG character editor: https://github.com/Aeolitus/Sephrasto
-   Database rebuild process: XML → JSON → FoundryVTT database format
-   Manual customizations are preserved in `local_db/json_user/` files
-   ALWAYS use the database scripts rather than manually editing `.db` files

### Known Issues and Limitations

-   HTML templates have syntax errors that are visible in prettier output but don't affect functionality
-   ESLint configuration needs updating for FoundryVTT-specific ES syntax
-   System is currently compatible with FoundryVTT v12 (older versions used different manifest format)
-   Some advantages/features are not fully implemented (see GitHub issues)

## Timing Expectations

-   `npm install`: ~2 seconds (fresh install)
-   `npm run prettier`: ~4 seconds. NEVER CANCEL.
-   `node utils/create_database.js`: ~2 seconds. NEVER CANCEL.
-   `node utils/import_database.js`: ~0.3 seconds. NEVER CANCEL.
-   ESLint scan: ~1 second (but has parsing errors, not reliable)

## System Context

This is the Ilaris system for FoundryVTT - a German tabletop RPG system implementation. Ilaris is a streamlined version of "Das Schwarze Auge" (The Dark Eye) rules. The codebase handles character sheets, dice rolling, combat maneuvers, magic systems, and equipment management specific to Ilaris rules.
