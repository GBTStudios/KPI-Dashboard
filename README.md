# Internal KPI Dashboard

## Project Objective
To turn our existing, offline Excel KPI spreadsheets into an interactive, live web dashboard interface. This allows the internal leadership team to visually audit active operational metrics at a glance without manually searching through cluttered rows.

## Technical Architecture & Stack
*   **Core Backend/Scripting:** Python 3.11+ (Pandas & OpenPyXL libraries for Excel parsing)
*   **Interface Framework:** Streamlit or Reflex (Python-native data visualisation frameworks)
*   **Hosting Infrastructure:** Vercel or Render (Deployed entirely on the Free Tier)

## Project Scope
### In Scope
*   Import, clean, and structure historical Excel KPI spreadsheet files.
*   Build a centralised web interface visualising current core operational metrics.
*   Optimise the application purely for internal team utility, speed, and clear data visualisation.

### Out of Scope
*   No conversational AI assistants, language prompts, or chatbot blocks.
*   No incoming user forms or automated new data collection mechanisms.
*   No premium donor-facing UI polishing, branding matching, or graphic styling layouts.

## Git Workflow & Branch Strategy
*   **Feature Branches:** Developers must build features on isolated local branches.
*   **Staging Branch:** Push completed features to the shared `staging` branch for internal review before production.
*   **Production Branch:** The production branch will be the main branch.
