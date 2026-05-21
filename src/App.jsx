import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [activeNav, setActiveNav] = useState('home')
  const [expandedPaper, setExpandedPaper] = useState(null)

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setActiveNav(id)
  }

  const researchPapers = [
    { id: 1, title: '[Paper Title 1]', authors: 'You et al.', venue: 'Conference/Journal', year: 2024, abstract: '[Abstract goes here]', tags: ['CPS', 'Control Systems'], arxiv: '#', doi: '#' },
    { id: 2, title: '[Paper Title 2]', authors: 'You et al.', venue: 'Conference/Journal', year: 2024, abstract: '[Abstract goes here]', tags: ['Robotics', 'AI'], arxiv: '#', doi: '#' },
    { id: 3, title: '[Paper Title 3]', authors: 'You et al.', venue: 'Conference/Journal', year: 2023, abstract: '[Abstract goes here]', tags: ['IoT', 'Edge Computing'], arxiv: '#', doi: '#' },
  ]

  const technicalProjects = [
    { title: '[Project Name]', desc: '[Description]', tags: ['Backend', 'System Design'], github: '#', year: 2024 },
    { title: '[Project Name]', desc: '[Description]', tags: ['Frontend', 'Real-time'], github: '#', year: 2024 },
    { title: '[Project Name]', desc: '[Description]', tags: ['Robotics', 'Embedded'], github: '#', year: 2023 },
  ]

  const expertise = [
    { domain: 'Cyber-Physical Systems', skills: ['Control Theory', 'System Modeling', 'Real-time Processing'] },
    { domain: 'Robotics & Automation', skills: ['ROS', 'Embedded Systems', 'Computer Vision'] },
    { domain: 'Backend Engineering', skills: ['Distributed Systems', 'APIs', 'Database Design'] },
    { domain: 'Frontend Development', skills: ['React', 'UI/UX', 'Data Visualization'] },
    { domain: 'AI & Machine Learning', skills: ['Deep Learning', 'Neural Networks', 'Model Optimization'] },
    { domain: 'IoT & Edge Computing', skills: ['Edge Devices', 'Protocol Design', 'Network Optimization'] },
  ]

  return (
    <div className="app">
      {/* Navigation */}
      <header className="header">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <span className="logo-accent">&lt;</span>mypath<span className="logo-accent">/&gt;</span>
            </div>
            <nav className="nav-links">
              {['home', 'research', 'projects', 'expertise', 'about'].map((item) => (
                <button
                  key={item}
                  className={activeNav === item ? 'nav-btn active' : 'nav-btn'}
                  onClick={() => scrollToSection(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Research & Engineering
                <span className="hero-accent">in CPS, Robotics & AI</span>
              </h1>
              <p className="hero-subtitle">
                Building intelligent systems at the intersection of cyber-physical worlds.
                Specializing in backend architecture, edge computing, and autonomous systems.
              </p>
              <div className="hero-cta">
                <button className="btn-primary" onClick={() => scrollToSection('research')}>
                  view research
                </button>
                <button className="btn-secondary" onClick={() => scrollToSection('contact')}>
                  contact
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="tech-grid">
                {['CPS', 'Backend', 'Robotics', 'IoT', 'AI', 'Frontend'].map((tech, i) => (
                  <div key={i} className="tech-node">{tech}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Papers */}
      <section id="research" className="research">
        <div className="container">
          <div className="section-header">
            <h2>research & publications</h2>
            <div className="header-line"></div>
          </div>

          <div className="papers-list">
            {researchPapers.map((paper) => (
              <div key={paper.id} className="paper-card">
                <div className="paper-header">
                  <div className="paper-title-section">
                    <h3>{paper.title}</h3>
                    <p className="paper-meta">{paper.authors} • {paper.venue} {paper.year}</p>
                  </div>
                  <div className="paper-year">{paper.year}</div>
                </div>

                <p className="paper-abstract">{paper.abstract}</p>

                <div className="paper-tags">
                  {paper.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="paper-links">
                  <a href={paper.arxiv} className="link-item">arXiv</a>
                  <a href={paper.doi} className="link-item">DOI</a>
                  <a href="#" className="link-item">PDF</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Projects */}
      <section id="projects" className="projects">
        <div className="container">
          <div className="section-header">
            <h2>technical projects</h2>
            <div className="header-line"></div>
          </div>

          <div className="projects-grid">
            {technicalProjects.map((project, i) => (
              <div key={i} className="project-card">
                <div className="project-num">0{i + 1}</div>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="project-tags">
                  {project.tags.map((tag, j) => (
                    <span key={j} className="tag">{tag}</span>
                  ))}
                </div>
                <a href={project.github} className="project-link">view on github →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Matrix */}
      <section id="expertise" className="expertise">
        <div className="container">
          <div className="section-header">
            <h2>technical expertise</h2>
            <div className="header-line"></div>
          </div>

          <div className="expertise-grid">
            {expertise.map((item, i) => (
              <div key={i} className="expertise-card">
                <h3>{item.domain}</h3>
                <div className="skill-list">
                  {item.skills.map((skill, j) => (
                    <div key={j} className="skill-badge">{skill}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header">
            <h2>about</h2>
            <div className="header-line"></div>
          </div>

          <div className="about-content">
            <div className="about-text">
              <p>[Your background and research focus goes here]</p>
              <p>[Your approach to problem-solving and innovation]</p>
              <p>[Your vision for the future of CPS/Robotics/AI]</p>
            </div>

            <div className="about-stats">
              <div className="stat">
                <div className="stat-value">[X]</div>
                <div className="stat-label">publications</div>
              </div>
              <div className="stat">
                <div className="stat-value">[X]</div>
                <div className="stat-label">projects</div>
              </div>
              <div className="stat">
                <div className="stat-value">[X]</div>
                <div className="stat-label">years in tech</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header">
            <h2>get in touch</h2>
            <div className="header-line"></div>
          </div>

          <div className="contact-content">
            <p>Open to collaborations, research opportunities, and technical discussions.</p>
            <div className="social-links">
              <a href="mailto:email@example.com" className="social-link">email</a>
              <a href="#" className="social-link">github</a>
              <a href="#" className="social-link">linkedin</a>
              <a href="#" className="social-link">google scholar</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025. Built with purpose.</p>
        </div>
      </footer>
    </div>
  )
}
