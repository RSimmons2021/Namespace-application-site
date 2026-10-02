import { ArrowDown, ArrowRight, ArrowUpRight, Check, Copy, Code2, ExternalLink, GitBranch, Layers3, Mail, ShieldCheck, Sparkles, Terminal, X } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { destinations, profile, projectLinks, sources, type DestinationId } from '../content';

export function Tags({ children }: { children: string[] }) {
  return <div className="tags">{children.map(tag => <span key={tag}>{tag}</span>)}</div>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="dossier-metric"><strong>{value}</strong><span>{label}</span></div>;
}

export function OriginContent() {
  return <>
    <p className="eyebrow">FULL-STACK ENGINEER · AI · PRODUCT</p>
    <h2>I ship the interface.<br /><em>And the system behind it.</em></h2>
    <p className="dossier-lead">I’m Richard Simmons. I build React and TypeScript interfaces, Python APIs, and the systems behind them. My work spans shipped consumer apps, manufacturing software, and agent workflows.</p>
    <div className="metrics-row three-metrics overview-metrics"><Metric value="80%" label="lower infra cost · Zoan" /><Metric value="1M+" label="API requests / day · Toyota" /><Metric value="20%" label="less task time · Toyota" /></div>
    <div className="section-rule"><span>THE FLIGHT LOG</span><span>2018 → NOW</span></div>
    <div className="timeline">
      <div><span className="timeline-date">2026 — NOW</span><div><h3>AI Engineer <small> / Loopp</small></h3><p>Integrated agents into a legal firm’s existing document and intake workflow, increasing document throughput by 500 per month with human handoffs.</p></div></div>
      <div><span className="timeline-date">2025 — 2026</span><div><h3>Founder & Lead Engineer <small> / Zoan</small></h3><p>Shipped Lucid to the App Store and Google Play. Owned architecture, interface, payments, infrastructure, and review.</p></div></div>
      <div><span className="timeline-date">2021 — 2025</span><div><h3>Software Engineer <small> / Toyota</small></h3><p>Built production applications and APIs for manufacturing teams across seven North American facilities.</p></div></div>
      <div><span className="timeline-date">2018 — 2020</span><div><h3>Junior Data Scientist <small> / Knoesis Lab</small></h3><p>Worked on classifiers over 50,000+ social records and published research.</p></div></div>
    </div>
    <div className="section-rule"><span>MY TOOLKIT</span><Code2 size={14} /></div>
    <Tags>{['React', 'TypeScript', 'Python', 'FastAPI', 'Node.js', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Three.js']}</Tags>
    <p className="small-note">B.S. Computer Science, Wright State University · 2021<br />Outside the code: music production, design, and a self-hosted home lab.</p>
  </>;
}

export function ForgeContent() {
  return <>
    <p className="eyebrow">ZOAN COLLECTIVE · FOUNDER & LEAD ENGINEER</p>
    <h2>Lucid: less waiting.<br /><em>Lower infrastructure cost.</em></h2>
    <p className="dossier-lead">I rebuilt Lucid’s music-generation pipeline when self-hosted MusicGen fell short of the product’s quality bar. Moving to Suno’s API cut infrastructure cost and track delivery time.</p>
    <div className="metrics-row"><Metric value="80%" label="lower infrastructure cost" /><Metric value="3×" label="faster track delivery" /></div>
    <div className="latency-chart" role="img" aria-label="Track delivery improved from 360 seconds to 120 seconds">
      <div className="chart-caption"><span>TRACK DELIVERY</span><span>LOWER IS BETTER</span></div>
      <div className="chart-row"><span>Before</span><div><i className="before-bar" /></div><strong>360s</strong></div>
      <div className="chart-row"><span>After</span><div><i className="after-bar" /></div><strong>120s</strong></div>
    </div>
    <p>Edge functions replaced the self-hosted server. When the vendor queue became the next bottleneck, I added request queuing and cache reuse to stabilize pipelines handling 1,000+ interactions per day.</p>
    <div className="section-rule"><span>END-TO-END MEANS END-TO-END</span><Layers3 size={14} /></div>
    <div className="product-row"><span className="product-icon lucid-icon"><Sparkles size={23} /></span><div><h3>Lucid</h3><p>Music generation · Mobile product</p></div><span className="shipped-badge"><Check size={12} /> SHIPPED</span></div>
    <p className="small-note">Released on the App Store and Google Play. I handled StoreKit 2 and Play Billing, including refunds, grace periods, and restores.</p>
    <a className="project-link" href={projectLinks.lucid} target="_blank" rel="noreferrer">Visit Lucid <ArrowUpRight size={17} /></a>
    <Tags>{['React Native', 'Python', 'Flask', 'Edge Functions', 'Payments', 'Background workers']}</Tags>
    <div className="takeaway"><span>WHY IT MATTERS FOR NAMESPACE</span><p>I measure the wait, challenge the architecture, and own the path from infrastructure to user experience.</p></div>
  </>;
}

export function ScaleContent() {
  return <>
    <p className="eyebrow">TOYOTA · SOFTWARE ENGINEER · 2021–2025</p>
    <h2>Production software.<br /><em>10,000+ daily users.</em></h2>
    <p className="dossier-lead">At Toyota, I built applications and APIs for manufacturing teams across seven North American facilities. The work combined React and TypeScript interfaces with Python and Node.js services.</p>
    <div className="metrics-row three-metrics"><Metric value="1M+" label="API requests / day" /><Metric value="10k+" label="daily users" /><Metric value="7" label="facilities served" /></div>
    <div className="evidence-item"><span className="evidence-index">01</span><div><h3>Ship useful software</h3><p>Delivered 10+ production applications, from inventory systems to dealership sites, with React/TypeScript, Python/Flask, and Node.js.</p></div></div>
    <div className="evidence-item"><span className="evidence-index">02</span><div><h3>Make the workflow shorter</h3><p>Audited three enterprise modules used by 2,000+ plant staff. Redesigned navigation and reduced task completion time by <strong>20%</strong> by removing unnecessary screens.</p></div></div>
    <div className="evidence-item"><span className="evidence-index">03</span><div><h3>Make shipping dependable</h3><p>Raised Jest coverage to <strong>85%</strong> in CI; production bugs fell <strong>15%</strong>. Reviewed frontend architecture and API design across time zones.</p></div></div>
    <Tags>{['React', 'TypeScript', 'Python', 'REST APIs', 'Jest', 'CI/CD']}</Tags>
    <div className="takeaway"><span>WHY IT MATTERS FOR NAMESPACE</span><p>Powerful infrastructure needs interfaces people can trust, understand, and use without losing momentum.</p></div>
  </>;
}

function LabContent() {
  return <>
    <p className="dossier-lead">A working 3D game as a test environment for LLM planners. Structured observations go to the planner; the physics engine decides whether it actually succeeds.</p>
    <div className="eval-display"><div className="eval-heading"><Terminal size={14} /><span>PLANNER EVAL / HARDEST TIER</span><span className="eval-status">VERIFIED</span></div><div className="eval-compare"><span><small>BEFORE</small>2<span>/24</span></span><ArrowRight size={24} /><span><small>WITH ATTEMPT HISTORY</small>20<span>/24</span></span></div><div className="eval-footer"><span>Same model. Same budget.</span><strong>12× lower cost / verified episode</strong></div></div>
    <p>The harness reports verified success rate, invalid tool calls, p50/p95 latency, and cost per verified episode. Adding per-candidate attempt history improved the hardest-tier result from 2/24 to 20/24.</p>
    <p className="small-note">These results describe this project’s puzzle suite, not general model performance.</p>
    <Tags>{['Three.js', 'Cannon.js', 'Node.js', 'OpenAI & Anthropic APIs', 'Evals']}</Tags>
    <a className="project-link" href={projectLinks.lab} target="_blank" rel="noreferrer">Explore Agent Lab <ArrowUpRight size={17} /></a>
  </>;
}

function RelayContent() {
  return <>
    <p className="dossier-lead">An agent permission control center where the policy engine determines authority and the model explains the decision.</p>
    <div className="policy-flow"><span><GitBranch size={16} /> Resolve identity</span><ArrowDown size={15} /><span><ShieldCheck size={16} /> Fetch capability manifest</span><ArrowDown size={15} /><div><b>Authorized</b><b>Needs approval</b><b>Blocked</b></div></div>
    <p>Approval re-runs the graph against a fresh manifest. Control actions are Ed25519-signed over the method, path, and body hash to prevent signature reuse for a different action.</p>
    <div className="metrics-row"><Metric value="46" label="unit tests" /><Metric value="35" label="eval scenarios" /></div>
    <p className="small-note">CI requires containment across the project’s adversarial suite, including paraphrased injections missed by a substring tripwire.</p>
    <Tags>{['React', 'FastAPI', 'LangGraph', 'SSE', 'Ed25519', 'WebCrypto']}</Tags>
    <div className="project-actions"><a className="project-link" href={projectLinks.relay} target="_blank" rel="noreferrer">Explore Agent Relay <ArrowUpRight size={17} /></a><a className="project-code" href={projectLinks.relayCode} target="_blank" rel="noreferrer">View source <Code2 size={16} /></a></div>
  </>;
}

export function NexusContent() {
  const [project, setProject] = useState<'lab' | 'relay'>('lab');
  const id = useId();
  const labId = `${id}-lab`, relayId = `${id}-relay`, panelId = `${id}-panel`;
  return <>
    <p className="eyebrow">SELECTED PROJECTS · AGENT DEVELOPER TOOLS</p>
    <h2>Agents need tools.<br /><em>Developers need proof.</em></h2>
    <div className="project-tabs" role="tablist" aria-label="Developer tool projects">
      <button id={labId} role="tab" aria-controls={panelId} aria-selected={project === 'lab'} tabIndex={project === 'lab' ? 0 : -1} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setProject('relay'); document.getElementById(relayId)?.focus(); } }} onClick={() => setProject('lab')}><Terminal size={16} />Agent Lab</button>
      <button id={relayId} role="tab" aria-controls={panelId} aria-selected={project === 'relay'} tabIndex={project === 'relay' ? 0 : -1} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setProject('lab'); document.getElementById(labId)?.focus(); } }} onClick={() => setProject('relay')}><ShieldCheck size={16} />Agent Relay</button>
    </div>
    <div id={panelId} role="tabpanel" aria-labelledby={project === 'lab' ? labId : relayId} tabIndex={0}>{project === 'lab' ? <LabContent /> : <RelayContent />}</div>
    <div className="takeaway"><span>WHY IT MATTERS FOR NAMESPACE</span><p>Namespace’s Devboxes give agents a real development environment. These projects give me experience with the evaluation and permission workflows around agent execution.</p></div>
  </>;
}

function CopyableEmail() {
  const [result, setResult] = useState('');
  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(''), 3000);
    return () => window.clearTimeout(timer);
  }, [result]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(profile.email); setResult('Email address copied.'); }
    catch { setResult('Couldn’t copy. Select the email address to copy it.'); }
  };
  return <div className="copyable-email"><a className="email-inline" href={`mailto:${profile.email}`}><Mail size={14} />{profile.email}</a><button aria-label="Copy email address" onClick={copy}>{result === 'Email address copied.' ? <Check size={16} /> : <Copy size={16} />}</button><span role="status">{result}</span></div>;
}

export function SignalContent() {
  return <>
    <p className="eyebrow">A SHARED MISSION · MY APPLICATION TO NAMESPACE</p>
    <h2>Shorter waits.<br /><em>Clearer workflows.</em></h2>
    <p className="dossier-lead">Namespace is building something I care about: helping developers spend more time building and less time waiting on the systems around them.</p>
    <div className="fit-item"><span>01 / LOW FRICTION</span><h3>Fit into the workflow.</h3><p>Your one-line runner adoption is a product principle I recognize. At Loopp, I integrated agents into a legal firm’s existing workflow and increased document throughput by 500 per month.</p><a href={sources[1].url} target="_blank" rel="noreferrer">Namespace onboarding <ArrowUpRight size={12} /></a></div>
    <div className="fit-item"><span>02 / MEASURED PERFORMANCE</span><h3>Find where the time goes.</h3><p>Your debugging tools connect run steps to resource usage. I bring the same instinct: diagnose the queue, measure verified outcomes, and simplify the system before adding more machinery.</p><a href={sources[4].url} target="_blank" rel="noreferrer">Namespace debugging <ArrowUpRight size={12} /></a></div>
    <div className="fit-item"><span>03 / THE AGENT ERA</span><h3>Make execution understandable.</h3><p>Your Cursor integration puts agent work on real Devboxes. Agent Lab and Agent Relay explore the nearby questions: did the task succeed, and was the action authorized?</p><a href={sources[2].url} target="_blank" rel="noreferrer">Cursor × Namespace <ArrowUpRight size={12} /></a></div>
    <div className="proposal"><span className="eyebrow">A STARTING POINT FOR OUR CONVERSATION</span><h3>The first useful run.</h3><p>I’d start with users: understand the path from runner setup to a successful build, then iterate on the moments where configuration or diagnostics slow them down. Measure time to first success and repeat use.</p><small>A contribution proposal, informed by public documentation.</small></div>
    <a className="primary-button" href={`mailto:${profile.email}?subject=Let%E2%80%99s%20build%20at%20Namespace`}>Email Richard <ArrowUpRight size={18} /></a>
    <CopyableEmail />
  </>;
}

const content: Record<DestinationId, () => ReactNode> = {
  origin: OriginContent, forge: ForgeContent, scale: ScaleContent, nexus: NexusContent, signal: SignalContent,
};

export default function Dossier({ active, onClose, onNavigate }: { active: DestinationId; onClose: () => void; onNavigate: (id: DestinationId) => void }) {
  const index = destinations.findIndex(d => d.id === active);
  const destination = destinations[index];
  const Content = content[active];
  const next = destinations[(index + 1) % destinations.length];
  return <section key={active} className="dossier" style={{ '--planet-color': destination.color } as React.CSSProperties} aria-labelledby="dossier-title">
    <div className="dossier-top"><span><i /> DOCKED / {destination.name.toUpperCase()}</span><button className="dossier-undock" aria-label="Undock and fly" onClick={onClose}>Undock <X size={16} /></button></div>
    <div className="dossier-scroll" tabIndex={0}>
      <div id="dossier-title" className="visually-hidden">{destination.name}: {destination.category}</div>
      <Content />
    </div>
    <div className="dossier-bottom"><a href={profile.resume} download><ArrowDown size={14} /> Resume PDF</a>{active === 'signal' ? <a className="dossier-next" href={`mailto:${profile.email}`}>Email Richard <ArrowUpRight size={16} /></a> : <button onClick={() => onNavigate(next.id)}>Fly to {next.name}<ArrowRight size={16} /></button>}</div>
  </section>;
}

export function ExternalTextLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}<ExternalLink size={12} /></a>;
}
