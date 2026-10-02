import { ArrowDown, ArrowUpRight, Mail, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ForgeContent, NexusContent, OriginContent, ScaleContent, SignalContent } from './Dossier';
import { profile } from '../content';

export default function Brief({ onClose, initialSection = 'brief-overview' }: { onClose: () => void; initialSection?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement | null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    if (initialSection !== 'brief-overview') document.getElementById(initialSection)?.scrollIntoView();
    return () => { element.close(); opener.current?.focus(); };
  }, [initialSection]);
  return <dialog ref={dialog} className="brief-modal" aria-labelledby="brief-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="brief-frame">
      <header className="brief-header"><div><span className="eyebrow">PRODUCT ENGINEER APPLICATION</span><h2 id="brief-title">Richard Simmons <span>× Namespace</span></h2></div><button className="icon-button" onClick={onClose} aria-label="Close application brief" autoFocus><X size={22} /></button></header>
      <nav className="brief-nav" aria-label="Brief sections">{[['brief-overview','Overview'],['brief-products','Products'],['brief-production','Production'],['brief-projects','Dev tools'],['brief-namespace','Why Namespace']].map(([id,label]) => <a key={id} href={`#${id}`} onClick={event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }); }}>{label}</a>)}</nav>
      <div className="brief-body">
        <section id="brief-overview"><OriginContent /></section>
        <section id="brief-products" className="brief-forge"><ForgeContent /></section>
        <section id="brief-production" className="brief-scale"><ScaleContent /></section>
        <section id="brief-projects" className="brief-nexus"><NexusContent /></section>
        <section id="brief-namespace" className="brief-signal"><SignalContent /></section>
      </div>
      <footer className="brief-footer"><a href={profile.resume} download><ArrowDown size={15} />Resume PDF</a><a href={profile.source} target="_blank" rel="noreferrer" aria-label="View site source on GitHub">Site source<ArrowUpRight size={15} /></a><a href={`mailto:${profile.email}`}><Mail size={15} />Contact</a></footer>
    </div>
  </dialog>;
}
