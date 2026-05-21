# mypath — Technical Portfolio

A sophisticated, research-forward portfolio for professionals in **Cyber-Physical Systems, Robotics, AI, Backend/Frontend Engineering, and IoT**.

## Design Philosophy

**Technical Excellence Meets Design Sophistication**

This portfolio is built for researchers and engineers who need to showcase:
- Research papers and publications
- Technical projects across multiple domains
- Expertise in CPS, Robotics, AI, Backend, Frontend, and IoT
- Professional publications with citations, abstracts, and links

## Structure

```
sections:
├── Hero          — Research focus and expertise overview
├── Research      — Publications with abstracts, links (ArXiv, DOI, PDF)
├── Projects      — Technical implementations across domains
├── Expertise     — Skills matrix across 6 technical domains
├── About         — Professional background + stats
└── Contact       — Social links and collaboration info
```

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Customization

**Add Your Content** in `src/App.jsx`:

### Research Papers
```javascript
const researchPapers = [
  {
    id: 1,
    title: 'Your Paper Title',
    authors: 'You et al.',
    venue: 'Conference Name',
    year: 2024,
    abstract: 'Your abstract here',
    tags: ['CPS', 'Control'],
    arxiv: 'https://arxiv.org/abs/...',
    doi: 'https://doi.org/...'
  },
  // Add more papers
]
```

### Technical Projects
```javascript
const technicalProjects = [
  {
    title: 'Project Name',
    desc: 'Project description',
    tags: ['Backend', 'System Design'],
    github: 'https://github.com/...',
    year: 2024
  },
  // Add more projects
]
```

### Expertise Domains
```javascript
const expertise = [
  {
    domain: 'Cyber-Physical Systems',
    skills: ['Control Theory', 'System Modeling', 'Real-time Processing']
  },
  // 6 domains total
]
```

### About Section
- Background paragraphs: Update in the `<section id="about">`
- Stats: Publications count, Projects count, Years in tech

## Features

✅ Research-focused layout  
✅ Paper showcase with publication details  
✅ Expertise matrix across 6 domains  
✅ Technical project portfolio  
✅ Publication statistics  
✅ Responsive design  
✅ Smooth animations  
✅ Dark, sophisticated aesthetic  
✅ Monospace typography for technical credibility  

## Build for Production

```bash
npm run build
```

Output goes to `dist/`

## Tech Stack

- **React 18** — Component framework
- **Vite** — Fast build tooling
- **CSS Grid/Flexbox** — Responsive layouts
- **Syne + Lexend + JetBrains Mono** — Distinctive typography

---

**Ready to add your content?** Update the data arrays in `src/App.jsx` with your papers, projects, and expertise details.

