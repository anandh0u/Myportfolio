import { useState, useEffect } from 'react'
import FlowingBackground from './components/FlowingBackground'
import WelcomeScreen from './components/WelcomeScreen'
import SectionRobot from './components/SectionRobot'
import './App.css'

export default function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [activeCategory, setActiveCategory] = useState('all')
  const [scrollWidth, setScrollWidth] = useState(0)
  const [activePaperId, setActivePaperId] = useState(null)
  const [copiedPaperId, setCopiedPaperId] = useState(null)

  // Interactive Terminal State
  const [consoleHistory, setConsoleHistory] = useState([
    { text: 'Initializing portfolio diagnostics...', type: 'system' },
    { text: 'Type help or click the shortcuts below to query the database.', type: 'info' },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Track page scroll to update progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll > 0) {
        const percentage = (window.scrollY / totalScroll) * 100
        setScrollWidth(percentage)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation scrolling
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setActiveNav(id)
  }

  const copyCitation = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPaperId(id)
      setTimeout(() => {
        setCopiedPaperId(null)
      }, 2000)
    })
  }

  // Predefined terminal command responses
  const COMMAND_RESPONSES = {
    help: [
      { text: 'Available system query logs:', type: 'success' },
      { text: '  about      - Display biographic profile narrative', type: 'system' },
      { text: '  research   - Query academic publications and preprints', type: 'system' },
      { text: '  skills     - List active technical domains and expertise', type: 'system' },
      { text: '  status     - Show current academic enrollment metrics', type: 'system' },
      { text: '  clear      - Clear terminal screen log', type: 'system' }
    ],
    research: [
      { text: 'Academic Publications & Preprints:', type: 'success' },
      { text: '  1. Non-Anthropomorphic Bipedal Robotic System (NCREEE \'19)', type: 'system' },
      { text: '  2. Speed & Direction Control of DC Motor via Wireless (NCREEE \'19)', type: 'system' },
      { text: '  3. Intelligent Threat Classification in Cyber-Physical Nodes (Preprint \'26)', type: 'system' },
      { text: '  Type "query_sys --target <id>" or explore the Research section below.', type: 'info' }
    ],
    about: [
      { text: 'Profile Narrative:', type: 'success' },
      { text: '  Anandhu P is a Cyber Physical Systems student and Robotics Developer based at Government Engineering College, Thrissur.', type: 'system' },
      { text: '  Specialization centers on fusing intelligent hardware control, embedded systems, computer vision, and secure network infrastructure.', type: 'system' },
      { text: '  Goal: Designing intelligent real-world architectures that assist, protect, and automate.', type: 'system' }
    ],
    skills: [
      { text: 'Active Domain Clusters:', type: 'success' },
      { text: '  Programming  - Python, C++, C, MATLAB, Dart, Rust (Basic)', type: 'system' },
      { text: '  Robotics     - Robot Operating System (ROS), AUBO Robot Safety Pipelines', type: 'system' },
      { text: '  Embedded     - Microcontroller Programming (Arduino, ESP8266), Servo Actuation', type: 'system' },
      { text: '  Sec & Web    - Threat Assessment, Kali Linux, Node.js, Next.js, Flutter', type: 'system' }
    ],
    status: [
      { text: 'Current Status Parameters:', type: 'success' },
      { text: '  Affiliation  : Government Engineering College, Thrissur', type: 'system' },
      { text: '  Program      : Bachelor of Technology in Cyber Physical Systems (2024 - 2028)', type: 'system' },
      { text: '  Role         : Project Lead at Vtron', type: 'system' },
      { text: '  Uptime       : Active engineering management state', type: 'system' }
    ]
  }

  const handleCommand = (cmd) => {
    const cleanCmd = cmd.trim().toLowerCase()
    
    // Add command to history
    const commandLine = { text: `$ query_sys --target ${cleanCmd}`, type: 'input' }
    
    if (cleanCmd === 'clear') {
      setConsoleHistory([commandLine])
      return
    }

    let response = [
      { text: `Unknown command "${cleanCmd}". Type "help" to list valid directives.`, type: 'error' }
    ]

    if (COMMAND_RESPONSES[cleanCmd]) {
      response = COMMAND_RESPONSES[cleanCmd]
    }

    setConsoleHistory(prev => [...prev, commandLine, ...response])
  }

  // Trigger typing simulation when clicking shortcut buttons
  const triggerShortcut = (cmd) => {
    if (isTyping) return
    setIsTyping(true)
    setInputValue('')
    
    let currentText = ''
    let charIndex = 0
    
    const typingInterval = setInterval(() => {
      if (charIndex < cmd.length) {
        currentText += cmd[charIndex]
        setInputValue(currentText)
        charIndex++
      } else {
        clearInterval(typingInterval)
        setTimeout(() => {
          handleCommand(cmd)
          setInputValue('')
          setIsTyping(false)
        }, 300)
      }
    }, 60)
  }

  const researchPapers = [
    {
      id: 'bipedal-robot',
      title: 'Non-Anthropomorphic Bipedal Robotic System',
      authors: 'Amal R, Anandhu P Shaju, Jibin Thomas, Vishnu S, Anjana Manuel',
      venue: 'National Conference on Recent Advances in Electrical and Electronics Engineering (NCREEE \'19)',
      year: 2019,
      abstract: 'A hybrid bipedal-wheeled robotic system designed to address the stability and motion limits of traditional anthropomorphic legged robots. By placing limbs in the sagittal plane and integrating wheeled drive units at contact points, the system achieves higher translation velocities and reduces hip-offset oscillations while maintaining vertical climbing and adaptability in uneven terrains.',
      tags: ['Robotics', 'Kinematics', 'Hybrid Locomotion', 'Control Systems'],
      link: 'https://mbcpeermade.com',
      citation: 'Amal R, Anandhu P Shaju, Jibin Thomas, Vishnu S, Anjana Manuel. "Non-Anthropomorphic Bipedal Robotic System." NCREEE, 2019.'
    },
    {
      id: 'dc-motor',
      title: 'Speed and Direction Control of DC Motor through Wireless Communication',
      authors: 'Anandhu P Shaju, Amal R, Jibin Thomas, Vishnu S, Anjana Manuel',
      venue: 'National Conference on Recent Advances in Electrical and Electronics Engineering (NCREEE \'19)',
      year: 2019,
      abstract: 'Details the deployment of a wireless microcontroller-actuated system for DC motor velocity and direction profiling. Utilizing low-latency telemetry protocols, the system allows remote operators to query real-time angular feedback metrics and issue direct command overrides to maintain motor synchronization under varying payload boundaries.',
      tags: ['Wireless Telemetry', 'ESP8266', 'DC Motors', 'Embedded Systems'],
      link: 'https://mbcpeermade.com',
      citation: 'Anandhu P Shaju, Amal R, Jibin Thomas, Vishnu S, Anjana Manuel. "Speed and Direction Control of DC Motor through Wireless Communication." NCREEE, 2019.'
    },
    {
      id: 'threat-classification',
      title: 'Intelligent Threat Classification in Cyber-Physical Nodes using LLM Reasoning',
      authors: 'Anandhu P, et al.',
      venue: 'Preprint / Technical Report',
      year: 2026,
      abstract: 'Explores the integration of lightweight reasoning agents on edge nodes in industrial micro-grids. The paper details how local threat models query the security state of AUBO controllers and ESP8266 networks, utilizing LLM-guided context extraction to identify telemetry spoofing and initiate rapid containment protocols.',
      tags: ['AI Agents', 'Cyber-Physical Security', 'Threat Classification', 'Embedded Security'],
      link: 'https://github.com/anandh0u',
      citation: 'Anandhu P, et al. "Intelligent Threat Classification in Cyber-Physical Nodes using LLM Reasoning." Preprint, 2026.'
    }
  ];

  const technicalProjects = [
    {
      title: 'AUBO Robot Safety System',
      desc: 'Developing an intelligent safety system for an AUBO robotic arm to improve industrial safety, automation reliability, and human-machine interaction through real-time monitoring and control.',
      tags: ['ROS', 'Robotics', 'Safety Systems', 'Industrial Automation'],
      category: 'robotics',
      github: 'https://github.com/anandh0u',
      year: 2025
    },
    {
      title: 'Speech Emotion Detection using LLM',
      desc: 'Designed an AI-powered emotion recognition system that analyzes speech signals using machine learning and Large Language Model concepts to improve human-computer interaction.',
      tags: ['Python', 'AI', 'Machine Learning', 'NLP', 'LLM'],
      category: 'ai_ml',
      github: 'https://github.com/anandh0u/Speech-Ai-llm-',
      year: 2025
    },
    {
      title: 'Multimodal Emotion Recognition',
      desc: 'Multimodal emotion recognition internship project focusing on processing multiple feedback channels to classify emotional states in real-time.',
      tags: ['Python', 'AI', 'Deep Learning', 'Signal Processing'],
      category: 'ai_ml',
      github: 'https://github.com/anandh0u/emotion_recognition_internship',
      year: 2025
    },
    {
      title: 'MedBridge AI Reasoning Agent',
      desc: 'MedBridge AI: Microsoft Foundry reasoning agent for community health triage using Foundry IQ, Work IQ, and Fabric IQ systems.',
      tags: ['AI Agents', 'Reasoning', 'Foundry IQ', 'Healthcare Automation'],
      category: 'ai_ml',
      github: 'https://github.com/anandh0u/medbridge-ai',
      year: 2026
    },
    {
      title: 'Memori Memory Infrastructure',
      desc: 'An agent-native memory infrastructure providing a LLM-agnostic layer that structures execution logs and conversation data into persistent states for production systems.',
      tags: ['LLM', 'AI Agents', 'Data Infrastructure', 'Database Design'],
      category: 'ai_ml',
      github: 'https://github.com/anandh0u/Memori',
      year: 2026
    },
    {
      title: 'EEG-EMG Controlled Exoskeleton Arm',
      desc: 'Developed a smart robotic exoskeleton that utilizes EEG and EMG signals to assist movement and rehabilitation applications.',
      tags: ['Biomedical Signals', 'Robotics', 'Embedded Systems', 'AI'],
      category: 'robotics',
      github: 'https://github.com/anandh0u',
      year: 2025
    },
    {
      title: 'Camera-Based Obstacle Detection System',
      desc: 'Built a computer vision solution that detects obstacles using external camera systems, enabling robotic path awareness and environmental sensing.',
      tags: ['Computer Vision', 'Python', 'Robotics', 'AI'],
      category: 'ai_ml',
      github: 'https://github.com/anandh0u',
      year: 2025
    },
    {
      title: 'Dual Servo Control using ESP8266',
      desc: 'Implemented wireless multi-servo control using ESP8266 microcontrollers for robotic movement and automation applications.',
      tags: ['ESP8266', 'Embedded Systems', 'IoT', 'Robotics'],
      category: 'embedded',
      github: 'https://github.com/anandh0u',
      year: 2024
    },
    {
      title: 'Hardware Password Checker using Digital ICs',
      desc: 'Designed and implemented a hardware-based password authentication system using digital IC components for secure access control.',
      tags: ['Digital Electronics', 'Logic Design', 'Hardware Security'],
      category: 'embedded',
      github: 'https://github.com/anandh0u',
      year: 2024
    }
  ];

  const filteredProjects = activeCategory === 'all'
    ? technicalProjects
    : technicalProjects.filter(p => p.category === activeCategory);

  const expertise = [
    { domain: 'Programming Languages', skills: ['Python', 'C++', 'C', 'MATLAB', 'Dart', 'Rust (Basic)'] },
    { domain: 'Web & Software Development', skills: ['Node.js', 'Next.js', 'Backend Development', 'Flutter'] },
    { domain: 'Robotics & Automation', skills: ['ROS (Robot Operating System)', 'AUBO Robot Integration', 'Robot Safety Systems', 'Industrial Automation', 'Human-Robot Interaction'] },
    { domain: 'Embedded Systems', skills: ['Arduino', 'ESP8266', 'Microcontroller Programming', 'Sensor Integration', 'Servo Motor Control'] },
    { domain: 'Cybersecurity', skills: ['Cyber Defense', 'Cybercrime Investigation', 'Security Analysis', 'Digital Threat Assessment'] },
    { domain: 'Tools & Platforms', skills: ['Git', 'Linux / Ubuntu', 'Kali Linux', 'VS Code', 'MATLAB', 'SolidWorks'] }
  ];

  const experience = [
    {
      role: 'Project Lead',
      company: 'Vtron',
      location: 'Thrissur / Kochi (Remote / Hybrid)',
      period: 'Nov 2025 – Present',
      badge: '[ professional_record // active ]',
      points: [
        'Directing engineering and project management for intelligent hardware-software fusions and cyber-physical systems.',
        'Overseeing design of modular robotics controllers, network infrastructure audits, and embedded systems integration.',
        'Coordinating across multidisciplinary teams to ensure security protocols and safety compliance pipelines are met.'
      ]
    },
    {
      role: 'Cybersecurity Intern',
      company: 'Cybernix YLLP',
      location: 'Kochi, Kerala',
      period: 'Sep 2025 – Oct 2025',
      badge: '[ internship_record // completed ]',
      points: [
        'Worked on cybersecurity defense initiatives, understanding digital protection mechanisms.',
        'Assisted in forensic analysis and security investigations for virtual safety assessments.',
        'Conducted vulnerability testing and threat mitigation analyses.',
        'Developed structural logs utilizing threat modeling strategies to secure data flows.'
      ]
    }
  ];

  const certifications = [
    'Python Programming Core Certificate',
    'Cybernix YLLP Cybersecurity Internship Credentials',
    'Industrial Robotics and Safety Controls Workshops',
    'Embedded Systems & Microcontroller Programming Symposium'
  ];

  return (
    <div className={`app ${hasEntered ? 'site-entered' : 'site-hidden'}`}>
      <WelcomeScreen onEnter={() => setHasEntered(true)} />
      {/* Top Scroll Progress Indicator */}
      <div className="scroll-progress" style={{ width: `${scrollWidth}%` }}></div>

      <FlowingBackground />

      {/* Navigation */}
      <header className="header">
        <div className="container">
          <div className="nav-content">
            <div className="logo-group">
              <div className="logo">
                <span className="logo-accent">&lt;</span>anandhu_p<span className="logo-accent">/&gt;</span>
              </div>
              <div className="logo-status">
                <span className="status-dot"></span>
                <span className="status-text">system_online</span>
              </div>
            </div>
            <nav className="nav-links">
              {['home', 'about', 'research', 'projects', 'expertise', 'experience'].map((item) => (
                <button
                  key={item}
                  id={`nav-btn-${item}`}
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

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-hud-badge">
                <span className="hud-badge-tag">[ engineering_node ]</span>
                <span className="hud-badge-ping">ping: 14ms</span>
              </div>
              <h1 className="hero-title">
                Anandhu P
                <span className="hero-accent">Cyber Physical Systems & Robotics</span>
              </h1>
              <p className="hero-subtitle">
                I study the boundary where intelligent software meets hardware controls. As an engineer specializing in Cyber Physical Systems, I construct robotic safety frameworks, train speech ML classifiers, and program embedded hardware nodes.
              </p>
              <div className="hero-cta">
                <button id="hero-btn-explore" className="btn-primary" onClick={() => scrollToSection('about')}>
                  explore engineering logs
                </button>
                <button id="hero-btn-connect" className="btn-secondary" onClick={() => scrollToSection('contact')}>
                  connect
                </button>
              </div>
            </div>

            {/* Interactive Console Visual */}
            <div className="hero-visual">
              <div className="console-container">
                <div className="console-header">
                  <div className="console-buttons">
                    <span className="console-btn red"></span>
                    <span className="console-btn yellow"></span>
                    <span className="console-btn green"></span>
                  </div>
                  <span className="console-title">node: gec_thrissur // system_query</span>
                </div>
                <div className="console-body">
                  {consoleHistory.map((line, idx) => (
                    <div key={idx} className="console-line">
                      {line.type === 'input' ? (
                        <>
                          <span className="console-prompt">&gt;</span>
                          <span className="console-input">{line.text}</span>
                        </>
                      ) : line.type === 'error' ? (
                        <span className="console-output" style={{ color: '#ef4444' }}>{line.text}</span>
                      ) : line.type === 'success' ? (
                        <span className="console-output" style={{ color: 'var(--accent)' }}>{line.text}</span>
                      ) : (
                        <span className="console-output">{line.text}</span>
                      )}
                    </div>
                  ))}
                  
                  {/* Active input simulation line */}
                  <div className="console-line">
                    <span className="console-prompt">&gt;</span>
                    <span className="console-input">
                      {inputValue}
                      <span className="blink-cursor" style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '15px', 
                        background: 'var(--accent)', 
                        marginLeft: '4px',
                        animation: 'pulse 1s infinite' 
                      }}></span>
                    </span>
                  </div>
                </div>
                <div className="console-footer" style={{ 
                  background: 'rgba(15, 10, 32, 0.9)', 
                  padding: '12px 18px', 
                  borderTop: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--text-secondary)' }}>Quick query:</span>
                  {['about', 'research', 'skills', 'status', 'clear'].map((cmd) => (
                    <button 
                      key={cmd}
                      id={`terminal-shortcut-${cmd}`}
                      disabled={isTyping}
                      onClick={() => triggerShortcut(cmd)}
                      style={{ 
                        padding: '4px 10px', 
                        fontSize: '11px', 
                        fontFamily: 'JetBrains Mono',
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '3px',
                        color: 'var(--accent)',
                        cursor: 'pointer'
                      }}
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header-row">
            <div className="section-header">
              <h2>about me</h2>
              <div className="header-line"></div>
            </div>
            <div className="section-robot-wrapper">
              <SectionRobot action="coffee" />
            </div>
          </div>

          <div className="about-content">
            <div className="about-text">
              <p className="profile-intro">
                Bridging mechanical hardware, electronic routing, and cognitive AI layer engineering.
              </p>
              <p style={{ marginBottom: '24px', fontSize: '15px', color: 'var(--text-secondary)' }}>
                Based at the Government Engineering College, Thrissur (2024–2028), I specialize in Cyber Physical Systems. My academic curriculum and practical build logs explore how complex, real-world machines integrate with AI feedback networks and secure interfaces. 
              </p>

              {/* Pillars Cards (No emojis, highly structured) */}
              <div className="pillars-grid">
                <div className="pillar-card">
                  <div className="pillar-meta">Academic Focus</div>
                  <h3>Cyber Physical Systems</h3>
                  <p>Enrolled at Government Engineering College, Thrissur (2024–2028), concentrating on real-world software integration, control algorithms, and system engineering.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-meta">Primary Domain</div>
                  <h3>Robotics & Automation</h3>
                  <p>Building with Robot Operating System (ROS), custom safety pipelines, human-robot interfaces, and kinematics workflows.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-meta">Intelligence Layer</div>
                  <h3>Applied Machine Learning</h3>
                  <p>Developing neural nets, signal emotion analysis classifiers, and computer vision systems for environmental awareness.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-meta">Hardware Layer</div>
                  <h3>Embedded Systems</h3>
                  <p>Programming ESP8266 and Arduino microcontrollers, calibrating sensor modules, and implementing actuator controls.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-meta">Security Node</div>
                  <h3>Cybersecurity & Defense</h3>
                  <p>Studying digital threats vectors, threat classification, system audits, and digital forensic investigations.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-meta">Software Stack</div>
                  <h3>Full-Stack Programming</h3>
                  <p>Developing APIs, cross-platform apps, and backends utilizing Node.js, Next.js, and Flutter architectures.</p>
                </div>
              </div>
            </div>

            <div className="about-stats">
              <div className="stat">
                <div className="stat-value">6</div>
                <div className="stat-label">completed physical & software systems</div>
              </div>
              <div className="stat">
                <div className="stat-value">1</div>
                <div className="stat-label">cyber security defense internship</div>
              </div>
              <div className="stat">
                <div className="stat-value">4</div>
                <div className="stat-label">professional certifications and credentials</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Publications Section */}
      <section id="research" className="research">
        <div className="container">
          <div className="section-header-row">
            <div className="section-header">
              <h2>publications</h2>
              <div className="header-line"></div>
            </div>
            <div className="section-robot-wrapper">
              <SectionRobot action="reading" />
            </div>
          </div>

          <div className="research-grid">
            {researchPapers.map((paper) => {
              const isExpanded = activePaperId === paper.id;
              const isCopied = copiedPaperId === paper.id;
              
              return (
                <div key={paper.id} className={`research-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="research-header">
                    <div className="research-meta">
                      <span className="research-year">{paper.year}</span>
                      <span className="research-divider">//</span>
                      <span className="research-venue">{paper.venue}</span>
                    </div>
                    <h3 className="research-title">{paper.title}</h3>
                    <p className="research-authors">{paper.authors}</p>
                  </div>
                  
                  <div className="research-tags">
                    {paper.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="research-actions">
                    <button 
                      id={`research-abstract-toggle-${paper.id}`}
                      className={`btn-action toggle-abstract ${isExpanded ? 'active' : ''}`}
                      onClick={() => setActivePaperId(isExpanded ? null : paper.id)}
                    >
                      {isExpanded ? '[ hide abstract ]' : '[ view abstract ]'}
                    </button>
                    <button 
                      id={`research-citation-copy-${paper.id}`}
                      className={`btn-action copy-citation ${isCopied ? 'copied' : ''}`}
                      onClick={() => copyCitation(paper.id, paper.citation)}
                    >
                      {isCopied ? '[ copied! ]' : '[ copy citation ]'}
                    </button>
                    <a 
                      id={`research-link-${paper.id}`}
                      href={paper.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="research-link-btn"
                    >
                      [ link ]
                    </a>
                  </div>

                  <div className={`abstract-drawer ${isExpanded ? 'open' : ''}`}>
                    <div className="abstract-content">
                      <h4>Abstract</h4>
                      <p>{paper.abstract}</p>
                      <div className="citation-preview">
                        <h5>Citation (IEEE format)</h5>
                        <code>{paper.citation}</code>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="projects">
        <div className="container">
          <div className="section-header">
            <h2>featured projects</h2>
            <div className="header-line"></div>
          </div>

          {/* Filtering Tabs */}
          <div className="project-filters">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'robotics', label: 'Robotics & Automation' },
              { id: 'ai_ml', label: 'AI & Machine Learning' },
              { id: 'embedded', label: 'Embedded & Hardware' }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`project-filter-${tab.id}`}
                className={activeCategory === tab.id ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project, i) => (
              <div key={i} className="project-card">
                <div className="project-num">0{i + 1}</div>
                <h3>{project.title}</h3>
                <p>{project.desc}</p>
                <div className="project-tags">
                  {project.tags.map((tag, j) => (
                    <span key={j} className="tag">{tag}</span>
                  ))}
                </div>
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">view project_log →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="expertise" className="expertise">
        <div className="container">
          <div className="section-header-row">
            <div className="section-header">
              <h2>technical skills</h2>
              <div className="header-line"></div>
            </div>
            <div className="section-robot-wrapper">
              <SectionRobot action="working" />
            </div>
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

      {/* Experience & Certifications */}
      <section id="experience" className="experience">
        <div className="container">
          <div className="experience-layout">
            
            {/* Experience Panel */}
            <div className="experience-panel">
              <div className="section-header">
                <h2>experience</h2>
                <div className="header-line"></div>
              </div>
              <div className="experience-list">
                {experience.map((exp, i) => (
                  <div key={i} className="experience-card">
                    <div className="exp-badge">{exp.badge}</div>
                    <div className="exp-header">
                      <h3>{exp.role}</h3>
                      <span className="exp-company">{exp.company}</span>
                    </div>
                    <div className="exp-meta">
                      <span>{exp.location}</span>
                      <span>{exp.period}</span>
                    </div>
                    <ul className="exp-points">
                      {exp.points.map((pt, j) => (
                        <li key={j}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Panel */}
            <div className="certifications-panel">
              <div className="section-header">
                <h2>certifications</h2>
                <div className="header-line"></div>
              </div>
              <div className="certifications-grid">
                {certifications.map((cert, i) => (
                  <div key={i} className="cert-card">
                    <div className="cert-icon">//</div>
                    <div className="cert-title">{cert}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header">
            <h2>get in touch</h2>
            <div className="header-line"></div>
          </div>

          <div className="contact-content">
            <p>I am open to discussions regarding internship collaborations, robotic system designs, AI implementations, or sensor integrations. Drop a line to start a dialogue.</p>
            
            <div className="contact-details" style={{ margin: '30px auto', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>
              <div><span style={{ color: 'var(--accent)' }}>primary_email //</span> <a id="email-primary" href="mailto:anandhupulikkl22@gmail.com">anandhupulikkl22@gmail.com</a></div>
              <div><span style={{ color: 'var(--accent)' }}>academic_email //</span> <a id="email-academic" href="mailto:24b771.anandhu@gectcr.ac.in">24b771.anandhu@gectcr.ac.in</a></div>
              <div><span style={{ color: 'var(--accent)' }}>alternate_email //</span> <a id="email-alternate" href="mailto:anandhup167@gmail.com">anandhup167@gmail.com</a></div>
            </div>

            <div className="social-links">
              <a id="social-github" href="https://github.com/anandh0u" target="_blank" rel="noopener noreferrer" className="social-link">github</a>
              <a id="social-linkedin" href="https://www.linkedin.com/in/anandhu-p-6ba98231a/" target="_blank" rel="noopener noreferrer" className="social-link">linkedin</a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Anandhu P. Engineered with modern dark components.</p>
        </div>
      </footer>
    </div>
  );
}
