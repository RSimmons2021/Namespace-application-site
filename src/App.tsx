import { ArrowDown, ArrowUpRight, Crosshair, FileText, HelpCircle, Mail, Pause, Play, RotateCcw, Rocket, X, Zap } from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { destinations, profile, type DestinationId } from './content';
import Dossier from './components/Dossier';
import Brief from './components/Brief';
import FlightHelp from './components/FlightHelp';
import type { FlightAction, FlightCommand, FlightTelemetry } from './world/flight';

const Universe = lazy(() => import('./world/Universe'));
const initialTelemetry: FlightTelemetry = { speed: 0, position: [0, 0, 95], orientation: [0, 0, 0, 1], mode: 'standby', boost: false, nearestId: 'forge', distance: 230, dockableId: null, destinationId: null, shots: 0, hull: 100, courseStartDistance: 0, destinationDistance: null };
function bookmark(): DestinationId | null {
  const id = window.location.hash.slice(1); return destinations.some(d => d.id === id) ? id as DestinationId : null;
}
function setRoute(id: DestinationId | null, replace = false) {
  const url = `${window.location.pathname}${window.location.search}${id ? `#${id}` : ''}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

export default function App() {
  const [initialDestination] = useState(bookmark);
  const sequence = useRef(0);
  const [command, setCommand] = useState<FlightCommand | null>(() => initialDestination ? { type: 'visit', destination: initialDestination, sequence: 0 } : null);
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [active, setActive] = useState<DestinationId | null>(initialDestination);
  const [visited, setVisited] = useState<DestinationId[]>(initialDestination ? [initialDestination] : []);
  const [brief, setBrief] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const map = useRef<HTMLElement>(null);
  const mapToggle = useRef<HTMLButtonElement>(null);
  const [notice, setNotice] = useState('');
  const closeMap = useCallback(() => { setMapOpen(false); mapToggle.current?.focus({ preventScroll: true }); }, []);
  const readApplication = () => { setMapOpen(false); setBrief('brief-overview'); };
  const onDockUnavailable = useCallback((id: DestinationId, distance: number) => {
    const planet = destinations.find(d => d.id === id);
    if (!planet) return;
    setNotice(`${planet.name} is ${Math.round(distance)} m away. Fly within 50 m of the surface to dock, or choose a planet for autopilot.`);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!mapOpen) return;
    map.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!map.current?.contains(event.target as Node) && !mapToggle.current?.contains(event.target as Node)) closeMap(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [mapOpen, closeMap]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const send = useCallback((action: FlightAction) => setCommand({ ...action, sequence: ++sequence.current }), []);
  const onLaunch = useCallback(() => { setPaused(false); setHelp(false); setActive(null); setRoute(null); }, []);
  const onDock = useCallback((id: DestinationId) => {
    setActive(id); setRoute(id); setMapOpen(false); setNotice('');
    setVisited(ids => ids.includes(id) ? ids : [...ids, id]);
  }, []);
  const course = useCallback((id: DestinationId) => {
    setMapOpen(false); setPaused(false); setHelp(false); setNotice('');
    if (status === 'fallback') { onDock(id); return; }
    setActive(null); setRoute(null); send({ type: 'course', destination: id });
  }, [send, status, onDock]);
  const undock = useCallback(() => { setActive(null); setRoute(null); send({ type: 'undock' }); setPaused(false); }, [send]);
  const reset = useCallback(() => { setActive(null); setMapOpen(false); setPaused(false); setHelp(false); setRoute(null); send({ type: 'reset' }); setNotice('Flight reset. Your visited planets are still marked.'); }, [send]);
  useEffect(() => {
    const history = () => { const id = bookmark(); setActive(id); setMapOpen(false); setPaused(false); if (id) setVisited(ids => ids.includes(id) ? ids : [...ids, id]); send(id ? { type: 'visit', destination: id } : { type: 'reset' }); };
    window.addEventListener('popstate', history); window.addEventListener('hashchange', history);
    return () => { window.removeEventListener('popstate', history); window.removeEventListener('hashchange', history); };
  }, [send]);
  const onFlightKey = useEffectEvent((event: KeyboardEvent) => {
    if (brief || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || (event.target as HTMLElement).matches('input, textarea, select, [contenteditable="true"]')) return;
    if (help) return;
    if (mapOpen && event.key === 'Escape') { event.preventDefault(); closeMap(); return; }
    if (/^[1-5]$/.test(event.key)) { event.preventDefault(); course(destinations[Number(event.key) - 1].id); }
    if (event.key.toLowerCase() === 'p' || event.key === 'Escape') {
      event.preventDefault();
      if (active && event.key === 'Escape') undock();
      else if (!active) setPaused(value => !value);
    }
    if (event.key.toLowerCase() === 'r') reset();
    if (event.key.toLowerCase() === 'h') { setMapOpen(false); setHelp(true); }
  });
  useEffect(() => {
    window.addEventListener('keydown', onFlightKey);
    return () => window.removeEventListener('keydown', onFlightKey);
  }, []);
  useEffect(() => { if (active) document.querySelector<HTMLElement>('.dossier-scroll')?.focus({ preventScroll: true }); }, [active]);
  useEffect(() => { document.title = `${active ? destinations.find(d => d.id === active)?.name + ' — ' : ''}Richard Simmons × Namespace — Flight application`; }, [active]);
  const destination = destinations.find(d => d.id === telemetry.destinationId);
  const nearest = destinations.find(d => d.id === telemetry.nearestId)!;
  const progress = Math.round(Math.min(100, Math.max(0, (telemetry.courseStartDistance - (telemetry.destinationDistance ?? telemetry.courseStartDistance)) / Math.max(1, telemetry.courseStartDistance - 29) * 100)));
  const rangeWorld = telemetry.mode === 'autopilot' && destination ? destination : nearest;
  const rangeDistance = telemetry.mode === 'autopilot' ? telemetry.destinationDistance ?? telemetry.distance : telemetry.distance;
  const mode = active ? 'DOCKED' : paused || mapOpen ? 'PAUSED' : telemetry.mode === 'standby' ? 'READY TO LAUNCH' : telemetry.mode === 'holding' ? 'HOLDING POSITION' : telemetry.mode === 'autopilot' ? 'AUTOPILOT' : telemetry.boost ? 'BOOSTING' : 'MANUAL FLIGHT';
  const holding = (type: 'boost' | 'brake', pressed: boolean) => send({ type: `${type}-${pressed ? 'on' : 'off'}` });

  return <div className={`app flight-app ${active ? 'flight-docked' : ''} ${telemetry.mode === 'standby' || telemetry.mode === 'holding' ? 'flight-waiting' : ''}`}>
    <a className="skip-link" href="#flight-application" onClick={event => { event.preventDefault(); readApplication(); }}>Skip flight and read application</a>
    <Suspense fallback={<div className="universe flight-universe"><div className="flight-nebula" /></div>}>
      <Universe command={command} docked={Boolean(active)} paused={paused || mapOpen || Boolean(brief) || Boolean(help)} onDockUnavailable={onDockUnavailable} onCourse={course} onDock={onDock} onLaunch={onLaunch} onTelemetry={setTelemetry} onStatus={setStatus} />
    </Suspense>
    <header className="flight-header">
      <button className="flight-identity" onClick={reset} aria-label="Richard Simmons, reset flight"><span className="flight-logo">R<span>S</span><i /></span><span>RICHARD SIMMONS<small>PRODUCT ENGINEER / NAMESPACE</small></span></button>
      <div className="flight-header-center"><span className="live-dot" /> PERSONAL STAR SYSTEM <span className="flight-header-version">RS–2026</span></div>
      <nav aria-label="Application links" className="flight-links"><button aria-label="Read application" onClick={readApplication}><FileText size={14} /><span>Read application</span></button><a href={profile.resume} download aria-label="Resume"><span>Resume</span><ArrowDown size={14} /></a><a href={`mailto:${profile.email}`} className="flight-contact" aria-label="Contact Richard Simmons"><span>Contact</span><Mail size={15} /></a></nav>
    </header>
    <main id="flight-application" className="flight-main">
      <h1 className="visually-hidden">Richard Simmons — explore my Product Engineer application for Namespace</h1>
      {!active && <>
        <div className="flight-sector"><span>THE SIMMONS SYSTEM</span><strong>LESS WAITING.<br />MORE SHIPPING.</strong><small>My application to Namespace, in five worlds.</small><button className="flight-start" disabled={status === 'loading'} onClick={() => course('forge')}>Start with shipped work <ArrowUpRight size={14} /></button></div>
        <div className="flight-reticle" aria-hidden="true"><span /><i /><b /></div>
        {status === 'loading' && <div className="flight-prompt"><span className="eyebrow">INITIALIZING FLIGHT SYSTEMS</span><p>Preparing your ship and five worlds…</p></div>}
        {status === 'fallback' && <div className="flight-prompt"><span className="eyebrow">FLIGHT UNAVAILABLE</span><p>This browser couldn’t start 3D rendering.</p><button className="primary-button" onClick={readApplication}>Read my application <ArrowUpRight size={16} /></button></div>}
        {status === 'ready' && !paused && (telemetry.mode === 'standby' || telemetry.mode === 'holding') && <div className="flight-prompt launch-prompt"><span className="eyebrow">EXPLORE AT YOUR OWN PACE.</span><button className="flight-launch" onClick={() => { setPaused(false); send({ type: 'launch' }); }}><Rocket size={18} /> {telemetry.mode === 'holding' ? 'Resume flight' : 'Launch ship'} <span>↗</span></button><p><span className="desktop-flight-hint">{telemetry.mode === 'holding' ? 'Heading preserved · Steer or boost to resume' : 'WASD to steer · Shift to boost · Space to fire'}</span><span className="touch-flight-hint">{telemetry.mode === 'holding' ? 'Heading preserved · Drag or boost to resume' : 'Drag the sky to steer · Hold boost to accelerate'}</span></p></div>}
        {paused && status === 'ready' && <div className="flight-prompt pause-prompt"><span className="eyebrow">FLIGHT PAUSED</span><button className="flight-launch" onClick={() => { setPaused(false); document.querySelector<HTMLCanvasElement>('canvas')?.focus({ preventScroll: true }); }}><Play size={18} /> Resume flight</button><p>Your ship is holding position.</p></div>}
        {!paused && telemetry.mode === 'autopilot' && destination && <div className="flight-course"><div className="course-copy"><span className="live-dot" /><span>AUTOPILOT → <strong>{destination.name.toUpperCase()}</strong><small>{Math.round(rangeDistance)} m to surface · Docking automatically</small></span><button onClick={() => send({ type: 'launch' })}>Take control</button></div><progress aria-label={`Flight progress to ${destination.name}`} value={progress} max={100} /></div>}
        {!paused && telemetry.mode === 'pilot' && telemetry.dockableId && <button className="flight-dock" onClick={() => send({ type: 'dock' })}><kbd>ENTER</kbd> Dock at {nearest.name}<ArrowUpRight size={16} /></button>}
      </>}
        <aside className={`flight-map ${mapOpen ? 'is-open' : ''}`} ref={map} id="flight-planets" aria-label="Flight destinations">
          <div className="flight-panel-heading"><span>APPLICATION PLANETS</span><small>{visited.length} / 5 visited</small></div>
          <p>Choose a chapter. Autopilot flies and docks for you.</p>
          <div className="flight-destinations">{destinations.map(d => <button key={d.id} disabled={status === 'loading'} onClick={() => course(d.id)} className={telemetry.destinationId === d.id || active === d.id ? 'is-target' : ''} style={{ '--planet-color': d.color } as React.CSSProperties} aria-label={`Autopilot to ${d.name}`} aria-describedby={`planet-purpose-${d.id}`} aria-keyshortcuts={d.number.slice(1)} aria-current={active === d.id ? 'page' : undefined}><span className="planet-mini" /><span id={`planet-purpose-${d.id}`}><strong>{d.category}</strong><small>{d.name} · {d.teaser}</small></span><kbd>{d.number.slice(1)}</kbd>{visited.includes(d.id) && <span className="visited-mark" aria-label="Visited">✓</span>}</button>)}</div>
          <div className="flight-map-footer"><span className="live-dot" />{mode}</div>
        </aside>
      {active && <Dossier active={active} onClose={undock} onNavigate={course} />}
    </main>
    <aside className="flight-instruments" aria-label="Ship instruments">
      <div className="flight-speed"><strong data-testid="ship-speed">{String(Math.round(telemetry.speed)).padStart(3, '0')}</strong><span>M / S<small>{mode}</small></span></div>
      <div className="flight-meter"><span style={{ width: `${Math.min(100, telemetry.speed / 115 * 100)}%` }} /></div>
      <div className="flight-stats"><span>HULL <b>{telemetry.hull}%</b></span><span>BLASTERS <b data-testid="ship-shots">{telemetry.shots}</b></span></div>
      <div className="flight-coordinate" data-testid="ship-position" data-position={JSON.stringify(telemetry.position)} data-orientation={JSON.stringify(telemetry.orientation)}>{telemetry.position.map(n => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(0).padStart(4, '0')}`).join(' / ')}</div>
    </aside>
    <div className="flight-nearest"><span>{telemetry.mode === 'autopilot' ? 'DESTINATION' : 'NEAREST WORLD'}</span><strong style={{ color: rangeWorld.color }}>{rangeWorld.name.toUpperCase()}</strong><small>{Math.max(0, Math.round(rangeDistance))} m to surface</small></div>
    <div className="flight-touch-controls" aria-label="Touch flight controls">
      <button disabled={status !== 'ready' || Boolean(active) || paused || mapOpen} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); holding('brake', true); }} onPointerUp={() => holding('brake', false)} onPointerCancel={() => holding('brake', false)} aria-label="Hold to brake">BRAKE</button>
      <button disabled={status !== 'ready' || Boolean(active) || paused || mapOpen} onPointerDown={event => event.preventDefault()} onClick={() => send({ type: 'fire' })} aria-label="Fire blasters"><Crosshair size={20} />FIRE</button>
      <button disabled={status !== 'ready' || Boolean(active) || paused || mapOpen} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); holding('boost', true); }} onPointerUp={() => holding('boost', false)} onPointerCancel={() => holding('boost', false)} aria-label="Hold to boost"><Zap size={18} />BOOST</button>
    </div>
    <footer className="flight-footer">
      {active ? <div className="flight-reading-hint">Ship docked · Read at your own pace <span><kbd>ESC</kbd> to undock</span></div> : <div className="flight-keyboard"><span><kbd>W A S D</kbd> STEER</span><span><kbd>Q E</kbd> ROLL</span><span><kbd>SHIFT</kbd> BOOST</span><span><kbd>SPACE</kbd> FIRE</span><span><kbd>ENTER / F</kbd> DOCK</span></div>}
      <div className="flight-utilities"><button ref={mapToggle} className="flight-map-toggle" onClick={() => mapOpen ? closeMap() : setMapOpen(true)} aria-controls="flight-planets" aria-expanded={mapOpen}>Planets <span>05</span></button><button onClick={() => { setPaused(!paused); if (paused) document.querySelector<HTMLCanvasElement>('canvas')?.focus(); }} aria-label={paused ? 'Resume flight' : 'Pause flight'} disabled={status !== 'ready' || Boolean(active) || mapOpen}>{paused ? <Play size={15} /> : <Pause size={15} />}<span>{paused ? 'Resume' : 'Pause'}</span></button><button onClick={reset} aria-label="Reset flight"><RotateCcw size={15} /></button><button onClick={() => { setMapOpen(false); setHelp(!help); }} aria-label="Flight controls" aria-expanded={help}><HelpCircle size={16} /></button></div>
    </footer>
    <div className="flight-notice" role="status">{notice && <><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss flight message"><X size={15} /></button></>}</div>
    {help && <FlightHelp onClose={() => setHelp(false)} />}
    {brief && <Brief onClose={() => setBrief(null)} initialSection={brief} />}
  </div>;
}
