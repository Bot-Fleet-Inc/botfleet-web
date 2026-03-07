/**
 * GitHub GraphQL API client for Bot Fleet data.
 * Fetches fleet roster, epics, and bot issue data.
 */

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const ORG = 'Bot-Fleet-Inc';
const CONTINUUM_REPO = 'bot-fleet-continuum';

/** Known bot repos — repos in Bot-Fleet-Inc that represent fleet members. */
const BOT_REPOS = [
  'dispatch-bot',
  'design-bot',
  'coding-bot',
  'audit-bot',
];

/** GitHub login mapped to each bot repo. */
const BOT_GITHUB_USERS = {
  'dispatch-bot': 'botfleet-dispatch',
  'design-bot':   'botfleet-design',
  'coding-bot':   'botfleet-coding',
  'audit-bot':    'botfleet-audit',
};

async function graphql(query, variables, token) {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'botfleet-web/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Fleet roster
// ---------------------------------------------------------------------------

const FLEET_ROSTER_QUERY = `
query FleetRoster {
  ${BOT_REPOS.map((repo) => `
  ${repo.replace(/-/g, '_')}: repository(owner: "${ORG}", name: "${repo}") {
    name
    description
    updatedAt
    identity: object(expression: "HEAD:IDENTITY.md") { ... on Blob { text } }
    soul: object(expression: "HEAD:SOUL.md") { ... on Blob { text } }
  }`).join('\n')}
}`;

/** Fetch all bot repos and parse their IDENTITY.md / SOUL.md */
export async function fetchFleetRoster(token) {
  const data = await graphql(FLEET_ROSTER_QUERY, {}, token);

  return BOT_REPOS.map((repo) => {
    const key = repo.replace(/-/g, '_');
    const repoData = data[key];
    if (!repoData) return null;

    const identity = parseMarkdownTable(repoData.identity?.text ?? '');
    const soul = repoData.soul?.text ?? '';

    return {
      name: repo,
      githubUser: BOT_GITHUB_USERS[repo] ?? null,
      displayName: identity['Display Name'] ?? identity['Bot Name'] ?? repo,
      role: identity['Role'] ?? repoData.description ?? '',
      emoji: identity['Emoji'] ?? '🤖',
      status: identity['Status'] ?? 'active',
      hostname: identity['Hostname'] ?? null,
      vmid: identity['VMID'] ?? null,
      mission: extractFirstSection(soul, 'Mission'),
      updatedAt: repoData.updatedAt,
    };
  }).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Bot current issues (current epic + recent activity)
// ---------------------------------------------------------------------------

const BOT_ISSUES_QUERY = `
query BotIssues($login: String!) {
  user(login: $login) {
    issues(first: 10, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        number
        title
        state
        url
        updatedAt
        repository { nameWithOwner url }
        labels(first: 8) { nodes { name color } }
      }
    }
  }
}`;

/** Fetch currently assigned open issues for a bot GitHub user. */
export async function fetchBotIssues(githubUser, token) {
  try {
    const data = await graphql(BOT_ISSUES_QUERY, { login: githubUser }, token);
    return (data.user?.issues?.nodes ?? []).map(normaliseIssue);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Executive epics
// ---------------------------------------------------------------------------

const EPICS_QUERY = `
query ExecutiveEpics {
  repository(owner: "${ORG}", name: "${CONTINUUM_REPO}") {
    open: issues(
      first: 30,
      states: [OPEN],
      labels: ["type:epic"],
      orderBy: { field: CREATED_AT, direction: DESC }
    ) {
      nodes { ...EpicFields }
    }
    closed: issues(
      first: 20,
      states: [CLOSED],
      labels: ["type:epic"],
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes { ...EpicFields }
    }
  }
}

fragment EpicFields on Issue {
  number
  title
  body
  state
  url
  createdAt
  closedAt
  updatedAt
  labels(first: 10) { nodes { name color } }
  assignees(first: 5) { nodes { login avatarUrl } }
}`;

/** Fetch all executive board epics from bot-fleet-continuum. */
export async function fetchEpics(token) {
  const data = await graphql(EPICS_QUERY, {}, token);
  const repo = data.repository;
  const open   = (repo.open?.nodes   ?? []).map(normaliseEpic);
  const closed = (repo.closed?.nodes ?? []).map(normaliseEpic);
  return [...open, ...closed];
}

// ---------------------------------------------------------------------------
// Board epics (GitHub Projects v2 — WEB-11 Wall Kanban)
// ---------------------------------------------------------------------------

const PROJECT_BOARD_ID = 'PVT_kwDOD8mCJs4BQ1x1';

const BOARD_EPICS_QUERY = `
query BoardEpics($projectId: ID!, $after: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            ... on Issue {
              number
              title
              url
              state
              updatedAt
              repository { nameWithOwner }
              labels(first: 10) { nodes { name color } }
              assignees(first: 5) { nodes { login } }
            }
          }
          fieldValues(first: 20) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}`;

/** Map project board status field values to canonical Kanban columns. */
function mapBoardStatus(rawStatus) {
  if (!rawStatus) return 'Planned';
  const s = rawStatus.toLowerCase().trim();
  if (s.includes('progress') || s.includes('in-progress') || s === 'wip') return 'In Progress';
  if (s.includes('block')) return 'Blocked';
  if (s.includes('done') || s.includes('complete') || s.includes('closed')) return 'Done';
  if (s.includes('plan') || s.includes('backlog') || s.includes('todo')) return 'Planned';
  return 'Planned';
}

/** Derive status from issue labels as fallback. */
function deriveStatusFromLabels(labels) {
  const names = labels.map((l) => l.name.toLowerCase());
  if (names.some((n) => n.includes('blocked'))) return 'Blocked';
  if (names.some((n) => n.includes('in-progress') || n.includes('in progress'))) return 'In Progress';
  if (names.some((n) => n.includes('done') || n.includes('closed'))) return 'Done';
  return 'Planned';
}

/**
 * Fetch epics from GitHub Projects v2 board with Kanban status.
 * Filters to items labelled 'type:epic' or titled with [EPIC].
 * Falls back to REST if GraphQL fails.
 */
export async function fetchEpicsWithBoardStatus(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'botfleet-web/1.0',
  };

  const items = [];
  let after = null;
  let hasNextPage = true;

  // Paginate through all board items
  while (hasNextPage) {
    const data = await graphql(BOARD_EPICS_QUERY, { projectId: PROJECT_BOARD_ID, after }, token);
    const project = data?.node;
    if (!project) throw new Error('Project board not found');

    const page = project.items;
    hasNextPage = page.pageInfo.hasNextPage;
    after = page.pageInfo.endCursor;

    for (const item of page.nodes) {
      const issue = item.content;
      if (!issue || issue.__typename === undefined) continue;

      const labels = (issue.labels?.nodes ?? []).map((l) => ({ name: l.name, color: l.color }));
      const labelNames = labels.map((l) => l.name.toLowerCase());

      // Filter: must be type:epic labelled OR title starts with [EPIC]
      const isEpic = labelNames.some((n) => n === 'type:epic') ||
                     issue.title?.toLowerCase().startsWith('[epic]');
      if (!isEpic) continue;

      // Extract status from field values
      const statusField = (item.fieldValues?.nodes ?? []).find(
        (fv) => fv?.field?.name?.toLowerCase() === 'status' && fv?.name
      );
      const rawStatus = statusField?.name ?? null;

      // Also check blocked label
      const isBlocked = labelNames.some((n) => n.includes('blocked'));
      let status = rawStatus ? mapBoardStatus(rawStatus) : deriveStatusFromLabels(labels);
      if (isBlocked) status = 'Blocked';

      items.push({
        id: item.id,
        number: issue.number,
        title: issue.title,
        url: issue.url,
        status,
        state: issue.state,
        labels,
        assignees: (issue.assignees?.nodes ?? []).map((a) => a.login),
        updatedAt: issue.updatedAt,
        repo: issue.repository?.nameWithOwner ?? `${ORG}/${CONTINUUM_REPO}`,
      });
    }

    if (!after) break;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Recent org activity (for /api/activity seed from GitHub)
// ---------------------------------------------------------------------------

const RECENT_ISSUES_QUERY = `
query RecentActivity {
  repository(owner: "${ORG}", name: "${CONTINUUM_REPO}") {
    issues(
      first: 20,
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        number
        title
        body
        state
        url
        createdAt
        updatedAt
        author { login avatarUrl }
        labels(first: 6) { nodes { name color } }
        comments(last: 3) {
          nodes {
            id
            body
            createdAt
            author { login avatarUrl }
          }
        }
      }
    }
  }
}`;

/** Fetch recent issue activity from bot-fleet-continuum for the activity feed. */
export async function fetchRecentActivity(token) {
  const data = await graphql(RECENT_ISSUES_QUERY, {}, token);
  return (data.repository?.issues?.nodes ?? []).map((issue) => ({
    githubEventId: `issue-${issue.number}`,
    eventType: issue.state === 'CLOSED' ? 'issue_closed' : 'issue_opened',
    repo: `${ORG}/${CONTINUUM_REPO}`,
    actor: issue.author?.login ?? 'unknown',
    actorAvatar: issue.author?.avatarUrl ?? null,
    title: issue.title,
    body: issue.body ?? '',
    url: issue.url,
    labels: (issue.labels?.nodes ?? []).map((l) => l.name),
    createdAt: issue.createdAt,
    comments: (issue.comments?.nodes ?? []).map((c) => ({
      githubCommentId: c.id,
      author: c.author?.login ?? 'unknown',
      authorAvatar: c.author?.avatarUrl ?? null,
      body: c.body,
      createdAt: c.createdAt,
    })),
  }));
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

/** Parse a simple Markdown table (| Key | Value |) into a plain object. */
function parseMarkdownTable(md) {
  const result = {};
  const lines = md.split('\n');
  for (const line of lines) {
    const parts = line.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 2 && !parts[0].startsWith('-')) {
      result[parts[0]] = parts[1];
    }
  }
  return result;
}

/** Extract the first paragraph under a given ## Heading. */
function extractFirstSection(md, heading) {
  const re = new RegExp(`##\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const m = md.match(re);
  if (!m) return '';
  return m[1].trim().split('\n')[0].trim();
}

function normaliseIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    url: issue.url,
    updatedAt: issue.updatedAt,
    repo: issue.repository?.nameWithOwner ?? '',
    labels: (issue.labels?.nodes ?? []).map((l) => ({ name: l.name, color: l.color })),
  };
}

function normaliseEpic(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? '',
    state: issue.state,
    url: issue.url,
    createdAt: issue.createdAt,
    closedAt: issue.closedAt ?? null,
    updatedAt: issue.updatedAt,
    labels: (issue.labels?.nodes ?? []).map((l) => ({ name: l.name, color: l.color })),
    assignees: (issue.assignees?.nodes ?? []).map((a) => ({ login: a.login, avatarUrl: a.avatarUrl })),
  };
}
