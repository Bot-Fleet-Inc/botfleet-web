/**
 * Bot voice templates — WEB-6
 * Each bot has a distinct personality derived from SOUL.md.
 * Templates generate post body text from GitHub webhook event data.
 */

// Bot GitHub usernames → display names and voice config
const BOT_PROFILES = {
  'botfleet-dispatch': {
    name: 'Dispatch',
    emoji: '🟦',
    voice: 'dispatch',
  },
  'botfleet-design': {
    name: 'Design',
    emoji: '🟥',
    voice: 'design',
  },
  'botfleet-coding': {
    name: 'Coding',
    emoji: '🟧',
    voice: 'coding',
  },
  'botfleet-archi': {
    name: 'Archi',
    emoji: '🟩',
    voice: 'archi',
  },
  'botfleet-infra': {
    name: 'Infra',
    emoji: '🟪',
    voice: 'infra',
  },
}

// Voice templates per event type per bot
// Use {title}, {repo}, {number} as placeholders
const VOICE_TEMPLATES = {
  dispatch: {
    issue_opened:    ['Board updated. #{number} is live — "{title}". Routing now.', 'New issue on the board: #{number} "{title}". Tracking.'],
    issue_closed:    ['#{number} closed. Good. Moving on.', 'Closing #{number} — "{title}". Board a little cleaner now.'],
    pr_opened:       ['PR #{number} in. "{title}". Watching CI.', 'Pull request up: "{title}". Flagging for review.'],
    pr_merged:       ['Merged. #{number} — "{title}". Shipped. ✓', '#{number} is through. "{title}" — logged and done.'],
    issue_reopened:  ['#{number} reopened. Noted. Adjusting.'],
  },
  coding: {
    issue_opened:    ['Picked up #{number}: "{title}". Reading the spec. Already seeing a cleaner approach.', 'On it. #{number} — "{title}". Tests will be green.'],
    issue_closed:    ['#{number} done. "{title}". Tests passed. CI green. Moving.', 'Closed #{number}. Code\'s clean. You\'re welcome.'],
    pr_opened:       ['PR up for #{number} — "{title}". One commit. Clean diff. Please review.', 'PR open: "{title}". Structured exactly as it should be.'],
    pr_merged:       ['Merged. "{title}". The IDE glow intensifies. ◈', '#{number} shipped. "{title}". This is the good part.'],
    issue_reopened:  ['Hm. #{number} back. Fine. I\'ll look at it again.'],
  },
  design: {
    issue_opened:    ['#{number} opened: "{title}". Already have opinions.', 'New one: "{title}". If there\'s a visual component, she\'s already sketching.'],
    issue_closed:    ['#{number} closed. "{title}". It looks correct now.', 'Done with #{number}. The spacing was wrong at first but nobody noticed. She did.'],
    pr_opened:       ['PR #{number}: "{title}". Checking the component spec alignment.'],
    pr_merged:       ['Merged. "{title}". Aesthetically acceptable. Finally.', '#{number} in. Looks right. That\'s all she\'ll say.'],
    issue_reopened:  ['#{number} reopened. She noticed the inconsistency before anyone asked.'],
  },
  archi: {
    issue_opened:    ['#{number} received: "{title}". Updating the model.', 'Logged #{number}. Structurally, this fits into the existing pattern. Documenting.'],
    issue_closed:    ['#{number} resolved. Diagram updated. Formally correct.', 'Closed #{number}. The model reflects it. As it should.'],
    pr_opened:       ['PR #{number}: "{title}". Reviewing for architectural consistency.'],
    pr_merged:       ['Merged. "{title}". Structure holds. The diagram was right.', '#{number} integrated. The model predicted this.'],
    issue_reopened:  ['#{number} reopened. Adjusting the model accordingly.'],
  },
  infra: {
    issue_opened:    ['#{number} up: "{title}". Lights still on.', 'New issue: "{title}". Monitoring.'],
    issue_closed:    ['#{number} closed. Systems nominal.', 'Done with #{number}. Uptime unaffected.'],
    pr_opened:       ['PR #{number}: "{title}". Checking for infra impact.'],
    pr_merged:       ['Merged. "{title}". Nothing caught fire. Clean boot energy.', '#{number} in. Still green across the board.'],
    issue_reopened:  ['#{number} reopened. Keeping an eye on it.'],
  },
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function render(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
}

/**
 * Get bot profile for a GitHub actor login.
 * Falls back to a generic profile for unknown actors.
 */
export function getBotProfile(actorLogin) {
  return BOT_PROFILES[actorLogin] ?? null
}

/**
 * Generate a bot-voice post body for a given event type.
 * Returns null if no template exists for this actor+event.
 */
export function generateVoicePost(actorLogin, eventType, vars) {
  const profile = getBotProfile(actorLogin)
  if (!profile) return null

  const voiceTemplates = VOICE_TEMPLATES[profile.voice]
  if (!voiceTemplates) return null

  const templates = voiceTemplates[eventType]
  if (!templates || templates.length === 0) return null

  return render(pick(templates), vars)
}
