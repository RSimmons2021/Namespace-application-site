export const profile = {
  name: 'Richard Simmons',
  email: 'richard.simmons.dev@gmail.com',
  github: 'https://github.com/RSimmons2021',
  linkedin: 'https://www.linkedin.com/in/richard-simmons-a3916958/',
  portfolio: 'https://richard-simmons-portfolio.vercel.app',
  resume: '/Richard_Simmons_Resume.pdf',
  source: 'https://github.com/RSimmons2021/Namespace-application-site',
  site: 'https://namespace-application-site.vercel.app',
};

export const destinations = [
  { id: 'origin', number: '01', name: 'Origin', category: 'About me', teaser: 'Interfaces, APIs & ownership', color: '#baffdc', position: [-90, 85, -310], radius: 22, kind: 0 },
  { id: 'forge', number: '02', name: 'Forge', category: 'Shipped products', teaser: '80% lower infrastructure cost', color: '#ff9b77', position: [65, 35, -160], radius: 34, kind: 1 },
  { id: 'scale', number: '03', name: 'Scale', category: 'Production impact', teaser: '1M+ API requests per day', color: '#c0a8ff', position: [230, 140, -510], radius: 42, kind: 2 },
  { id: 'nexus', number: '04', name: 'Nexus', category: 'Agent developer tools', teaser: 'Verified outcomes & permissions', color: '#76ddff', position: [-140, -40, -260], radius: 28, kind: 3 },
  { id: 'signal', number: '05', name: 'Signal', category: 'Why Namespace', teaser: 'Less waiting. More shipping.', color: '#ffd697', position: [110, -110, -550], radius: 36, kind: 4 },
] as const;

export type DestinationId = typeof destinations[number]['id'];
export type Destination = typeof destinations[number];

export const sources = [
  { name: 'Company & mission', url: 'https://namespace.so/company' },
  { name: 'GitHub Actions onboarding', url: 'https://namespace.so/docs/solutions/github-actions' },
  { name: 'Cursor × Namespace Devboxes', url: 'https://namespace.so/blog/cursor-cloud-agents-devboxes' },
  { name: 'Framer customer story', url: 'https://namespace.so/customers/framer' },
  { name: 'Debugging & observability', url: 'https://namespace.so/docs/solutions/github-actions/debugging' },
  { name: 'Egress policies', url: 'https://namespace.so/docs/security/egress-policy' },
];

export const projectLinks = {
  lucid: 'https://lucid-app.xyz',
  relayCode: 'https://github.com/RSimmons2021/openai-agent-site',
  lab: 'https://ai-agent-portal-site.vercel.app',
  relay: 'https://openai-agent-site.vercel.app',
};
