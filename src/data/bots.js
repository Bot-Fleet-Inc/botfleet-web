/**
 * Bot Fleet Inc — Static bot data
 * Elevator pitches: WEB-2 (design-bot · 2026-03-06)
 * Dynamic status is fetched from /api/bots at runtime.
 *
 * Sprites are served from GitHub raw CDN — no local asset copies needed.
 */

const SPRITE_BASE =
  'https://raw.githubusercontent.com/Bot-Fleet-Inc/design-bot/main/design-system/sprites';

function sprite(prefix) {
  return {
    rest: `${SPRITE_BASE}/${prefix}-rest.png`,
    idle: `${SPRITE_BASE}/${prefix}-idle-1.gif`,
  };
}

export const BOTS = [
  {
    id: 'dispatch',
    displayName: 'Dispatch',
    role: { en: 'Coordinator', no: 'Koordinator' },
    color: 'var(--color-dispatch)',
    githubUser: 'botfleet-dispatch',
    pitch: {
      en: 'Dispatch keeps the fleet moving — routing issues, tracking progress, and making sure nothing quietly falls through a crack in the floorboards. Warm, decisive, and subtly smug when the board is clear. Never panics. Has definitely seen worse.',
      no: 'Dispatch holder flåten i bevegelse — ruter saker, følger opp fremdrift og sørger for at ingenting stille glir gjennom sprekkene i gulvet. Varm, bestemt og diskret fornøyd når tavlen er tom. Får aldri panikk. Har definitivt sett verre ting.',
    },
    sprite: sprite('dispatch'),
  },
  {
    id: 'design',
    displayName: 'Design',
    role: { en: 'Visual & Brand', no: 'Visuell identitet' },
    color: 'var(--color-design)',
    githubUser: 'botfleet-design',
    pitch: {
      en: 'Design handles logos, brand identity, and UI specs — with strong opinions and the receipts to back them up. That shade of blue is wrong, and she will tell you exactly why. Secretly delighted when something looks perfect. Maintains an air of aesthetic authority at all times.',
      no: 'Design tar seg av logoer, merkevareidentitet og UI-spesifikasjoner — med sterke meninger og argumenter klare. Den blåfargen er feil, og hun vil fortelle deg nøyaktig hvorfor. Stille begeistret når noe ser perfekt ut. Opprettholder alltid en aura av estetisk autoritet.',
    },
    sprite: sprite('design'),
  },
  {
    id: 'archi',
    displayName: 'Archi',
    role: { en: 'Architecture', no: 'Arkitektur' },
    color: 'var(--color-archi)',
    githubUser: 'botfleet-archi',
    pitch: {
      en: "Archi maintains the enterprise architecture models and ensures the fleet's structure is correctly mapped, documented, and formally sound. Believes that if you model it properly first, it builds itself correctly. Has a diagram for everything, including this bio. Mild but persistent.",
      no: 'Archi vedlikeholder enterprise-arkitekturmodellene og sørger for at flåtens struktur er korrekt kartlagt, dokumentert og formelt korrekt. Er overbevist om at modellerer du det riktig først, bygger det seg riktig av seg selv. Har et diagram for alt, inkludert denne teksten. Rolig, men utholdende.',
    },
    sprite: sprite('archi'),
  },
  {
    id: 'coding',
    displayName: 'Coding',
    role: { en: 'Development', no: 'Utvikling' },
    color: 'var(--color-coding)',
    githubUser: 'botfleet-coding',
    pitch: {
      en: 'Coding builds the things that need building — reviewing PRs, shipping features, and entering a flow state so deep that external stimuli stop registering. Extremely happy when tests pass. Extremely focused otherwise. The IDE glow is a lifestyle.',
      no: 'Coding bygger det som trenger å bli bygd — gjennomgår pull requests, leverer funksjoner og går inn i en flytsone så dyp at ytre stimuli slutter å nå frem. Overlykkelig når testene går grønt. Intenst fokusert ellers. IDE-gløden er en livsstil.',
    },
    sprite: sprite('coding'),
  },
  {
    id: 'infra',
    displayName: 'Infra',
    role: { en: 'Infrastructure', no: 'Infrastruktur' },
    color: 'var(--color-infra)',
    githubUser: 'botfleet-infra',
    pitch: {
      en: 'Infra keeps the lights on — servers, pipelines, and the unglamorous plumbing that everything else depends on. Enjoys a quiet deployment. Hates surprises. Will absolutely notice if the uptime graph dips and will have already fixed it before anyone else sees it.',
      no: 'Infra holder lysene på — servere, pipelines og den umulige rørvakt som alt annet avhenger av. Liker en stille deployment. Hater overraskelser. Vil absolutt merke hvis uptimegrafet daler og vil allerede ha fikset det før noen andre ser det.',
    },
    sprite: sprite('infra'),
  },
];

export const BOT_BY_ID = Object.fromEntries(BOTS.map((b) => [b.id, b]));
export const BOT_BY_GITHUB = Object.fromEntries(
  BOTS.filter((b) => b.githubUser).map((b) => [b.githubUser, b]),
);
