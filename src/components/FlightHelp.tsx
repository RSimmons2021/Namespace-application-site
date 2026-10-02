import { Rocket, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function FlightHelp({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      opener.current?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="flight-help" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="help-title"><button className="icon-button" onClick={onClose} aria-label="Close flight controls"><X size={18} /></button><p className="eyebrow">FLIGHT SCHOOL / RS–01</p><h2 id="help-title">You have the controls.</h2><p>Choose a planet to fly there and dock automatically, or launch your ship to explore. Every planet opens a chapter of my application.</p><dl><div><dt>W / S</dt><dd>Pitch up / down</dd></div><div><dt>A / D</dt><dd>Turn left / right</dd></div><div><dt>Q / E</dt><dd>Roll left / right</dd></div><div><dt>Shift / B</dt><dd>Boost / brake</dd></div><div><dt>Space</dt><dd>Fire blasters at asteroids</dd></div><div><dt>Enter / F</dt><dd>Dock within 50 m of a planet</dd></div><div><dt>1–5</dt><dd>Autopilot to a planet</dd></div><div><dt>P / Esc</dt><dd>Pause / resume</dd></div><div><dt>R</dt><dd>Reset flight</dd></div></dl><p>Your ship cruises forward. Steer with WASD or drag the sky; hold brake to slow down. Steering during autopilot returns control to you. Escape closes a menu, undocks from a planet, or pauses flight. Undocking preserves your heading and holds position until you steer, boost, or choose Resume flight.</p><button className="primary-button" onClick={onClose}>Got it. Let’s fly <Rocket size={16} /></button></dialog>;
}
