import { useEffect, useRef, useState } from 'react';
import { destinations, type DestinationId } from '../content';
import type { WorldController } from './createWorld';
import type { FlightCommand, FlightTelemetry } from './flight';

type Props = { command: FlightCommand | null; paused: boolean; docked: boolean; onCourse: (id: DestinationId) => void; onDock: (id: DestinationId) => void; onDockUnavailable: (id: DestinationId, distance: number) => void; onLaunch: () => void; onTelemetry: (value: FlightTelemetry) => void; onStatus: (status: 'ready' | 'fallback') => void };
export default function Universe({ command, paused, docked, ...events }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null), controller = useRef<WorldController | null>(null);
  const labels = useRef(new Map<DestinationId, HTMLElement>()), callbacks = useRef(events);
  const [ready, setReady] = useState(false);
  useEffect(() => { callbacks.current = events; });
  useEffect(() => {
    let cancelled = false;
    const fail = () => { if (!cancelled) callbacks.current.onStatus('fallback'); };
    import('./createWorld').then(({ createWorld }) => {
      if (cancelled || !canvas.current) return;
      try { controller.current = createWorld(canvas.current, {
        labelElements: labels.current, onFailure: fail,
        onReady: () => { setReady(true); callbacks.current.onStatus('ready'); },
        onDockUnavailable: (id, distance) => callbacks.current.onDockUnavailable(id, distance),
        onDock: id => callbacks.current.onDock(id), onLaunch: () => callbacks.current.onLaunch(), onTelemetry: value => callbacks.current.onTelemetry(value),
      }); } catch { fail(); }
    }).catch(fail);
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { if (ready && command) controller.current?.command(command); }, [command, ready]);
  useEffect(() => { if (ready) controller.current?.setPaused(paused); }, [paused, ready]);
  return <div className="universe flight-universe">
    <div className="flight-nebula" /><div className="star-backdrop" />
    <canvas ref={canvas} className="space-canvas" tabIndex={0} aria-label="Pilot your spaceship. WASD steers, Q and E roll, Shift boosts, Space fires, Enter or F docks. Drag to steer on touchscreens." />
    <nav hidden={docked} className="planet-labels flight-labels" aria-label="Planet waypoints">{destinations.map(d => <button key={d.id} ref={element => { if (element) labels.current.set(d.id, element); else labels.current.delete(d.id); }} className="flight-waypoint" style={{ '--planet-color': d.color } as React.CSSProperties} onClick={() => events.onCourse(d.id)} aria-label={`Set course to ${d.name}`}><span className="waypoint-diamond" /><strong>{d.name}</strong><small data-range>— m</small></button>)}</nav>
  </div>;
}
