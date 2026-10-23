# SkillSpring — Career Readiness Lab

SkillSpring is a responsive, static career-readiness web app for students. It helps users make a manageable plan, track small career-prep missions, self-assess skills, and practise interview answers.

## Features

- Overview dashboard with readiness score, mission completion, and practice count
- Role-specific roadmaps for Business Analyst, Software Developer, Data Analyst, and Product Associate
- Add, complete, filter, and track daily missions
- Skill self-assessment with four levels per skill
- Interview practice with eight prompts and an offline reflection checklist
- Editable workspace name and career goal
- Saves progress in the browser with `localStorage`
- Responsive layout for mobile and desktop
- No paid API, no build step, and no backend required

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For a local web server, you can also run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## Deploy free with GitHub Pages

1. Create a **public** GitHub repository named `skillspring`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/(root)`, then click **Save**.
6. Wait for the Pages deployment to finish. Your site will be available at `https://YOUR-USERNAME.github.io/skillspring/`.

If the repository has a different name, the URL path will use that name. The first deployment may take a few minutes.

## Notes

- User data is stored locally in the current browser. It is not synced across devices and clearing browser storage will remove it.
- Interview reflection feedback is a local heuristic checklist, not AI-generated feedback.
- Google Fonts is an optional external font request; the page remains usable if it cannot load.
- This is a static demo project. It intentionally avoids secrets, paid APIs, and server dependencies.

## Suggested project explanation

“I built SkillSpring to help students prepare for careers through small, trackable actions rather than an overwhelming checklist. It includes role-based roadmaps, local progress tracking, a self-assessment, and interview practice. I used HTML, CSS, and vanilla JavaScript, with localStorage to persist user progress in the browser. I designed it as a static app so it can be deployed free through GitHub Pages without a backend.”
