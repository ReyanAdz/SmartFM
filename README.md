# SmartFM
 Final Project for CMPT 469: HCI, Visualization, Vision and Multimedia - SmartFM is a software that is integrated with (Windows) File Explorer and provides real time suggestions on where to contain a given file. The research paper (in README) aims to answer how suggestion accuracy impacts a users trust and ability to refind their files?

## Running the study app

SmartFM is a standalone mock file manager that runs in the browser. You don't need to install or build anything.

1. Open `index.html` in Chrome or Firefox (double-click it, or serve the folder with GitHub Pages).
2. On the setup screen, enter the participant number. The mode order is set automatically and rotates through all 6 orders.
3. Hand the computer to the participant. At the end, download the CSVs from the final screen.

Data is also kept in the browser's localStorage. The setup screen can export every stored session.

## Study design

- **Three automation levels, within-subjects:** manual (browse and save), suggested (top 3 folders with a short reason, one click to accept), automatic (SmartFM picks the folder).
- **Three matched scenarios** (student, freelance photographer, event organizer), one per mode, always run in that order. Mode order is counterbalanced.
- Each part has 12 files to save, then a 60 s arithmetic distractor, then 6 files to refind by browsing (no search, 60 s limit each).
- A "Saved to …" confirmation appears in **every** mode, so exposure to the file's location is equal across conditions.

## Prediction (rule-based, no AI)

`js/core.js` scores every folder for an incoming file using:
- filename keywords matching the folder's own name (+3), a parent folder's name (+2), or names of files already in it (+1.5);
- the share of files in the folder with the same extension (up to +1);
- recency and frequency of the participant's saves in this session (small bonuses);
- a ×0.75 penalty for non-leaf folders.

Ties are broken by fixed tree order, so the lists stay stable. Run `node tests/predict_accuracy.js` to check top-1 accuracy, currently about 92% per scenario. In each scenario, exactly one file deliberately has no keyword cue.

## Data files

| File | One row per |
|---|---|
| `save_trials.csv` | saved file: mode, intended vs saved folder, prediction correct, suggestion rank used, time, clicks, folders opened |
| `refind_trials.csv` | refind attempt: success / gave up / timed out, time, clicks, wrong folders opened, wrong file clicks |
| `events.csv` | timestamped UI event (full log) |
| `distractor.csv` | distractor task score per part |
