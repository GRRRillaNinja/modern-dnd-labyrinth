# Delve & Dash — Promotion Plan

**Game:** Delve & Dash
**URL:** https://delvedash.com
**GitHub:** https://github.com/GRRRillaNinja/modern-dnd-labyrinth
**Stack:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Howler.js
**Elevator pitch:** Free browser dungeon crawler. Navigate an 8x8 maze, avoid a dragon, find the treasure, and get back alive. Solo, 2-player, or vs CPU. No install, no account, no ads.

---

## How to Use This Document

Each section contains:
- Platform notes (rules, tone, what to avoid)
- Copy ready to post — paste as-is or lightly personalize

Do NOT post to all platforms at once. Space them out by at least a few days each.
Build a little presence on Reddit before posting there (comment on a few threads first).

---

---

# 2. r/indiegaming

**About:** 390k+ members, general indie game community. More casual than r/gamedev. Works well for completed games.

**Rules to follow:**
- Self-promotion is allowed but the community responds better to "here's what I built and why" framing than pure marketing
- Spend a few days commenting on other posts before dropping your own
- Don't post more than once every few weeks

**Post title:**
```
I finished my browser dungeon crawler after several months of work — Delve & Dash
```

**Post body:**
```
I've been building Delve & Dash for the past several months and it's finally in a
state I'm happy with. It's a free browser game — no install, no account required.

The core loop: navigate an 8x8 dungeon maze, find the dragon's treasure, and return
it to your starting chamber before the dragon catches you. The dragon starts asleep
and wakes up when you get too close, so early game is about quiet exploration and
late game is about surviving the hunt.

Modes: solo, local 2-player (hot seat), and vs CPU with a pathfinding AI opponent.
Level 2 adds a locking door mechanic that forces you to think about routing.

It was inspired by a classic 1980s handheld game that I discovered through Bob
Whitley's web recreation — I wanted to rebuild it from scratch with modern tooling
and add features the original never had.

Play it here: https://delvedash.com

Would love to hear what people think, especially about the difficulty balance.
```

---

---

# 3. r/gamedev — Showoff Saturday Thread

**About:** r/gamedev is 1.9 million members. They run a weekly "Showoff Saturday" sticky thread specifically for sharing completed or near-complete projects. Do NOT make a standalone post — find the current Showoff Saturday thread and comment in it.

**Rules to follow:**
- Only post in the Showoff Saturday sticky thread, not as a standalone post
- The audience here is developers, so technical detail is appreciated
- Be specific about what was interesting or hard to build
- Engage with other people's showoffs in the same thread

**Comment to post in the Showoff Saturday thread:**
```
Delve & Dash — browser dungeon crawler built in React/TypeScript

https://delvedash.com

An 8x8 procedurally generated maze, a dragon with sleep/wake/hunt AI states,
turn-based movement, and a locking door system on the harder difficulty. Solo,
2-player hot seat, and vs CPU modes with a BFS pathfinding AI opponent.

A few things I found interesting to implement:

The dragon moves diagonally (both axes simultaneously via Math.sign), which gives
it a genuinely threatening feel compared to cardinal-only movement. It only attacks
when it reaches the same tile as the player, so the tension comes from watching it
close the distance.

The vs CPU mode was the most complex — the AI uses BFS on its known-passable edges
(it "discovers" walls by bumping into them, same as the player), with a state machine
cycling through Explore, SeekTreasure, ReturnToBase, and EvadeDragon phases. A 15%
random move chance keeps it from playing perfectly.

The locking door mechanic in Level 2 required some careful state management — doors
lock behind you after you pass through, which means every routing decision has
permanent consequences for that run.

Source is on GitHub if anyone wants to dig into the implementation.
```

---

---

# 4. r/roguelikes

**About:** Passionate, knowledgeable community that defines "roguelike" strictly: turn-based, grid-based, dungeon crawling. Delve & Dash fits the definition well. Treat this audience as equals — they know their genre.

**Rules to follow:**
- Don't call it a roguelike unless you're confident it qualifies (it does: grid-based, turn-based, procedural maze, permadeath-adjacent with lives system)
- Technical and mechanical discussion is valued over hype
- Don't lead with "it's free" — lead with what's mechanically interesting

**Post title:**
```
Delve & Dash — grid-based browser dungeon crawler with dragon AI and procedural mazes
```

**Post body:**
```
I've been working on Delve & Dash, a turn-based grid dungeon crawler that runs in
the browser. Here's what it is mechanically:

- 8x8 grid maze, procedurally generated each run
- Dragon enemy with state machine AI: Asleep → Awake → Hunting
  The dragon wakes when you enter its proximity range, then moves diagonally toward
  you on its turn. It only attacks when it reaches your tile.
- Turn-based movement with a limited move budget per turn (2 base + 2 per remaining
  life, or 4 when carrying the treasure)
- 3 lives — when you die you respawn at your starting chamber (Waystone), but the
  dragon stays awake
- Win condition: find the hidden treasure, carry it back to your Waystone
- Level 2 adds locking doors — 35% of doors start locked, unlocked doors lock
  behind you after passage

The walls are hidden until you discover them by attempting to move through them, so
there's a fog-of-war element to mapping the maze.

Solo, 2-player hot seat, and vs CPU modes. The CPU opponent runs BFS on its known
map (it discovers walls the same way the player does) and cycles through behavior
phases.

https://delvedash.com — free, browser, no account needed.

Happy to discuss the AI implementation or design decisions.
```

---

---

# 5. r/retrogaming

**About:** Large community focused on classic and vintage games. The nostalgia angle is strong here — Delve & Dash's inspiration is exactly what this crowd loves.

**Rules to follow:**
- Frame it as a modern tribute to a classic, not as self-promotion
- Lead with the nostalgic inspiration, not the tech stack
- Don't over-explain the modern implementation
- Check the sidebar — some retro subs restrict posts about modern games

**Post title:**
```
I built a modern browser version of a classic 1980s handheld dungeon game
```

**Post body:**
```
Growing up I missed out on the 1980s handheld dungeon crawlers — the kind where you
navigated a grid maze, avoided a dragon, and tried to get the treasure back to your
base. I discovered them through a web recreation and fell a bit in love with the
concept.

So I spent several months rebuilding the core experience from scratch as a browser
game: 8x8 dungeon, dragon AI, treasure hunt, turn-based movement. I tried to stay
faithful to the feel of the original while adding modern touches — procedurally
generated mazes, a locking door system, a vs CPU mode, and leaderboards.

If you have any nostalgia for that era of handheld gaming, I think you'll recognize
the vibe immediately. It plays like something from that period but without the
hardware limitations.

https://delvedash.com — free, no account needed.
```

---

---

# 6. itch.io — Game Page Description

**About:** itch.io is the primary indie game platform. You should list Delve & Dash here with a proper game page. This also makes the game more discoverable and gives you a platform-native presence for future community posts.

**Rules to follow:**
- HTML5 games can be embedded directly (ZIP with index.html at root)
- Use the Release Announcements board for your initial post
- Don't spam the community boards

**Game page description (for the itch.io listing):**
```
Delve & Dash

Navigate an 8x8 dungeon labyrinth. Find the dragon's treasure. Get back alive.

The maze is dark and the walls are hidden — you discover them by walking into them.
Somewhere in the labyrinth, a dragon sleeps atop its hoard. Get too close and it
wakes up. Once awake, it hunts.

Your goal: find the treasure, pick it up, and return it to your Waystone (your
starting chamber) before the dragon catches you. You have 3 lives. The dragon does
not go back to sleep.

MODES
- Solo: explore at your own pace until the dragon wakes, then it's a race
- Two Warriors: local 2-player hot seat — fight each other for treasure possession
- vs CPU: face an AI opponent with its own map memory and behavior phases

DIFFICULTY
- Level 1: open passages, no doors
- Level 2: locking doors — 35% of doors start locked, and unlocked doors lock
  behind you after you pass through. Plan your route carefully.

FEATURES
- Procedurally generated maze every game
- Turn-based movement with limited moves per turn
- Dragon AI with sleep, wake, and hunt states
- Leaderboards
- 13 original sound effects
- No install, no account, runs in any modern browser

Free to play.
```

**itch.io Release Announcements board post:**
```
Delve & Dash — free browser dungeon crawler

I've just released Delve & Dash, a turn-based dungeon crawler that runs in the
browser. 8x8 procedural maze, dragon AI, treasure hunt, solo/2-player/vs CPU modes.
Level 2 adds a locking door system that makes routing decisions permanent.

Built with React and TypeScript. No install or account required.

[link to your itch.io page]
```

---

---

# 7. Hacker News — Show HN

**About:** Tech-savvy community. Game posts do well here when the technical angle is interesting. The React/TypeScript implementation and the AI components are genuinely worth discussing. Post on a weekday morning (US Eastern time) for best visibility.

**Rules to follow:**
- Title must start with "Show HN:"
- Keep the title factual, not a pitch
- Post a comment right after submission with more context (the "top comment" strategy)
- Respond thoughtfully to every reply, including critical ones
- Don't ask for upvotes — ever

**Post title:**
```
Show HN: Delve & Dash – browser dungeon crawler with dragon AI and procedural mazes
```

**First comment to post immediately after submitting (this is your context comment):**
```
I've been building this on evenings and weekends for several months. It's a
browser-based dungeon crawler inspired by a classic 1980s handheld game I discovered
through Bob Whitley's web recreation (dndlabyrinth.com).

The core loop is simple: navigate an 8x8 grid maze, find hidden treasure, return it
to your starting chamber before the dragon catches you.

A few implementation notes that might be interesting:

Dragon AI: The dragon has three states — Asleep, Awake, Hunting. It moves diagonally
(both axes via Math.sign each turn), which feels more threatening than cardinal-only
movement. It only attacks when it occupies the same tile as the player, so the
tension comes from watching it close distance.

vs CPU mode: The AI opponent uses BFS on a "known map" that it builds by discovering
walls the same way the human player does — by attempting to move through them. It
cycles through behavior phases: Explore (BFS toward unknown territory), SeekTreasure,
ReturnToBase, EvadeDragon. A 15% random move chance prevents perfect play.

State management: Built with Zustand. One gotcha I ran into: the game engine mutates
state in-place, so setting Zustand state with the same object reference caused React
to skip re-renders. Fixed by always spreading { ...state } on updates.

Maze generation uses a recursive backtracker algorithm seeded fresh each game.

Stack: React 18, TypeScript, Vite, Tailwind, Framer Motion, Howler.js, Zustand.

The source is on GitHub: https://github.com/GRRRillaNinja/modern-dnd-labyrinth

Play it at https://delvedash.com — no account, no install.

Happy to go into more detail on any of the design or implementation decisions.
```

---

---

# 8. Product Hunt

**About:** Product Hunt is a launch platform for new products. You get one "launch day" — the day you submit is the day you compete. Launches that get engagement early in the day (US Pacific time, midnight launch recommended) do best.

**Rules to follow:**
- NEVER ask for upvotes. Ask for visits, feedback, or comments instead.
- Votes must be organic — no coordinating with friends to upvote at launch
- Engage with every comment on your listing
- Prepare your listing page fully before submitting

**Product Hunt listing:**

*Name:* Delve & Dash

*Tagline:* Free browser dungeon crawler — maze, dragon, treasure, no install needed

*Description:*
```
Delve & Dash is a turn-based dungeon crawler that runs entirely in your browser.

Navigate an 8x8 procedurally generated maze. Find the hidden treasure. Return it to
your starting chamber (your Waystone) before the dragon catches you.

The dragon starts asleep. Walk too close and it wakes up. Once awake, it hunts you
until the game ends.

Three modes: Solo, local 2-player (hot seat), and vs CPU with a pathfinding AI
opponent. Two difficulty levels — Level 2 adds a locking door system where doors
lock behind you after you pass through.

Free. No account. No ads. Runs in any modern browser.
```

*First comment to post on your own listing:*
```
Hey Product Hunt! Built this over several months of evenings and weekends.

I was inspired by a classic 1980s handheld dungeon game I found through a web
recreation — the kind where you navigate a grid maze, avoid a dragon, and hunt for
treasure. I wanted to rebuild that experience from scratch with modern tech and add
things the original couldn't do: procedural mazes, a CPU opponent, locking doors,
leaderboards.

Would love to hear what people think about the difficulty balance — particularly
Level 2 with the locking doors. Happy to answer questions about the design or the
implementation.
```

---

---

# 9. Newgrounds

**About:** Newgrounds has been around since the 90s and still has an active games community. It accepts HTML5 game submissions. The community votes on whether submissions survive ("Blam and Protect" system) — quality matters. A high-voted game can land on the front page.

**Rules to follow:**
- Submit as a ZIP with index.html at the root (standard HTML5 game format)
- Max 2 submissions per day
- Write a genuine description — the community rewards effort
- Be present in the comments when you launch

**Submission description:**
```
Navigate a dark dungeon labyrinth. Find the dragon's treasure. Get back alive.

Delve & Dash is a turn-based dungeon crawler with an 8x8 procedurally generated
maze. The walls are hidden until you discover them. Somewhere in the maze a dragon
is sleeping — wake it and it hunts you until the run ends.

Pick up the treasure and return it to your Waystone to win. You have 3 lives.

Modes: Solo, local 2-player, vs CPU.
Level 2 difficulty adds locking doors that lock behind you after you pass through.

Keyboard or mouse. No account needed.
```

---

---

# 10. Twitter / X

**About:** Twitter/X still works for indie game visibility, especially through the weekly #ScreenshotSaturday tag. The key is showing gameplay visually (GIF or screenshot) rather than describing it.

**Rules to follow:**
- Post on Saturdays for #ScreenshotSaturday participation
- 1-2 hashtags max per tweet — don't keyword-stuff
- Attach a gameplay GIF or screenshot to every tweet
- Reply to other #ScreenshotSaturday posts to be part of the conversation

**Tweet 1 — Launch announcement:**
```
Delve & Dash is live — a free browser dungeon crawler I've been building for months.

8x8 maze. Dragon AI. Treasure hunt. No install, no account.

Solo, 2-player, or vs a CPU opponent with its own pathfinding AI.

https://delvedash.com

[attach gameplay GIF or screenshot]
```

**Tweet 2 — #ScreenshotSaturday:**
```
#ScreenshotSaturday — working on the dragon's hunt behavior in Delve & Dash.

Once it wakes up it moves diagonally toward you every turn. The tension of watching
it close the gap is what makes the endgame feel dangerous.

Free browser game: https://delvedash.com

[attach screenshot of dragon chasing player]
```

**Tweet 3 — Dev detail (engagement-focused):**
```
The hardest part of building Delve & Dash's CPU opponent wasn't the pathfinding —
it was giving it a "known map."

The AI discovers walls the same way the human player does: by bumping into them. So
early game it's genuinely exploring blind, same as you.

#gamedev #indiegame

[attach screenshot or GIF of vs CPU mode]
```

---

---

# 11. Discord — Indie Game Servers

**About:** Several large Discord servers have #showcase or #releases channels specifically for sharing finished projects. Join, read the rules, participate in a few conversations first, then post in the designated channel.

**Servers to join:**
- Indie Games Community (look for it on Discord Discovery)
- Game Dev Network
- Brackeys Community
- Funsmith Club (good for playtest feedback)

**Rules to follow:**
- Always read the server rules before posting
- Only post in the channel designated for showcasing (usually #showcase, #releases, or #game-dev-showcase)
- Don't cross-post the same message to multiple channels in the same server
- Engage with others who post in the same channel

**Generic showcase channel post:**
```
Hey everyone — I just released Delve & Dash, a free browser dungeon crawler I've
been building for a while.

8x8 procedural maze, dragon AI, turn-based movement. Solo, 2-player hot seat, or
vs a CPU opponent. Level 2 adds locking doors that lock behind you.

No install or account needed — runs in the browser.

https://delvedash.com

Happy to chat about the design or implementation if anyone's curious.
```

---

---

# 12. Facebook Groups

**About:** Facebook groups for gaming communities are still active, especially for retro gaming and nostalgia-focused topics. The tone here is more casual and conversational than Reddit.

**Groups to look for (search Facebook for these):**
- "Retro Video Games" (large groups, 500k+ members in some)
- "Classic Video Games" groups
- "Browser Games" groups
- "Indie Game Developers" groups
- "Dungeon Crawler Games" groups

**Rules to follow:**
- Check each group's rules before posting — many have pinned posts about promotion
- Some groups require moderator approval for links — message the admin first if unsure
- Facebook audiences respond to personal story and nostalgia, not tech specs

**Post for retro gaming groups:**
```
I spent several months rebuilding a classic 1980s handheld dungeon game as a free
browser game — and I'm pretty happy with how it turned out.

The original was one of those grid-based handheld games from the early 80s: navigate
a maze, avoid a dragon, find the treasure, get back to your base. Simple concept but
genuinely tense once the dragon wakes up.

My version keeps the same core loop but adds procedurally generated mazes, a vs CPU
mode, locking doors on the harder difficulty, and leaderboards.

If you have any nostalgia for that era of gaming, give it a try. It's free and runs
in any browser.

https://delvedash.com
```

**Post for indie/browser game groups:**
```
Just released a free browser dungeon crawler I've been building for months — Delve
& Dash.

You pick a starting chamber, navigate an 8x8 labyrinth to find hidden treasure, and
try to get back before the dragon catches you. The dragon starts asleep — get too
close and it wakes up and hunts you for the rest of the game.

Solo, 2-player, or vs a CPU opponent. Works in any browser, no account needed.

https://delvedash.com

Would love to hear what people think!
```

---

---

# Summary — Posting Order (Suggested)

Space these out to avoid looking like spam and to let each post breathe.

| Day      | Platform                        | Note                              |
|----------|---------------------------------|-----------------------------------|
| Day 1    | itch.io — game page live        | Get the listing up first          |
| Day 1    | itch.io — Release Announcements | Post to the board same day        |
| Day 2    | r/WebGames                      | Direct audience, low friction     |
| Day 4    | Hacker News Show HN             | Weekday morning, US Eastern       |
| Day 7    | r/roguelikes                    | Strong genre fit                  |
| Day 9    | r/indiegaming                   | Broader casual audience           |
| Day 11   | gamedev Showoff Saturday        | Must be a Saturday                |
| Day 14   | r/retrogaming                   | Nostalgia angle                   |
| Day 16   | Product Hunt                    | One-shot launch, prepare in adv.  |
| Day 18   | Newgrounds                      | Upload HTML5 build                |
| Day 20   | Discord servers                 | Join first, post after            |
| Ongoing  | Twitter/X #ScreenshotSaturday   | Every Saturday, vary the content  |
| Ongoing  | Facebook groups                 | One or two relevant groups        |

---

*Last updated: 2026-02-17*
