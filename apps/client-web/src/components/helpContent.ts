export type HelpTopicId =
  | "gateway"
  | "home-overview"
  | "home-create"
  | "home-join"
  | "board"
  | "tools"
  | "presence"
  | "status";

export type HelpTopic = {
  title: string;
  summary?: string;
  sections: Array<{
    heading?: string;
    body: string;
    bullets?: string[];
  }>;
};

export const HELP_TOPICS: Record<HelpTopicId, HelpTopic> = {
  gateway: {
    title: "Gateway FAQ",
    summary: "The opening sequence is part of the product, not decoration.",
    sections: [
      {
        heading: "What this screen does",
        body: "Every fresh DexDraw load starts with the local opening video. After the sequence, the entry barrier appears and lets you intentionally open the workspace.",
      },
      {
        heading: "Why there is a barrier",
        body: "The barrier separates the atmospheric opening from the working canvas. It prevents accidental entry and makes the transition deliberate.",
      },
      {
        heading: "What gets stored",
        body: "The intro does not store board data. Board access details are handled separately from the gateway animation.",
      },
    ],
  },
  "home-overview": {
    title: "Home FAQ",
    summary:
      "Use this screen to create a board or rejoin one you already know.",
    sections: [
      {
        heading: "Create vs join",
        body: "Create starts a fresh board and gives you owner access. Join uses an existing board identifier and share code.",
      },
      {
        heading: "The basic flow",
        body: "Enter through the gateway, create or join a board, then draw, checkpoint, collaborate, and export.",
      },
      {
        heading: "What you need later",
        body: "Keep the board identifier and share code somewhere sensible if other people need to reconnect later.",
      },
    ],
  },
  "home-create": {
    title: "Create FAQ",
    summary: "Start a board with a clear name and the right starter layout.",
    sections: [
      {
        heading: "Board name",
        body: "Use a name people can recognize in a tab list, export, or demo. You can rename it later from the board header.",
      },
      {
        heading: "Your name",
        body: "This is the label collaborators see on your cursor, edits, and presence. Use something recognizable. The machine is not psychic.",
      },
      {
        heading: "Template choice",
        body: "Blank is safest for free drawing. Meeting Grid is better when you want quick structure without extra setup.",
      },
    ],
  },
  "home-join": {
    title: "Join FAQ",
    summary: "You need both the board identifier and the share code.",
    sections: [
      {
        heading: "Board identifier",
        body: "This identifies the board itself. If it is wrong, the join request points at nothing useful.",
      },
      {
        heading: "Share code",
        body: "The share code grants access for that board. DexDraw normalizes it to uppercase while you type.",
      },
      {
        heading: "Display name",
        body: "Pick a label other collaborators can identify quickly. Collaboration is already chaotic enough.",
      },
    ],
  },
  board: {
    title: "Board Details FAQ",
    summary:
      "The header keeps the board identity, access code, and connection state in one place.",
    sections: [
      {
        heading: "Board title",
        body: "Owners can click the title to rename it. Guests see the live title but cannot rewrite it.",
      },
      {
        heading: "Share code",
        body: "Use the share code with the board identifier when another client needs to join the same board.",
      },
      {
        heading: "Connection state",
        body: "If the connection drops, DexDraw attempts to reconnect and replay missed operations from the server sequence.",
      },
    ],
  },
  tools: {
    title: "Tools FAQ",
    summary:
      "The toolbar now explains the active tool, selection state, checkpoints, and export readiness.",
    sections: [
      {
        heading: "Drawing tools",
        body: "Pen, rectangle, ellipse, text, note, and laser cover the core object types. The canvas hint changes based on the active tool when the board is empty.",
      },
      {
        heading: "Selection controls",
        body: "Duplicate, arrange, and keyboard nudge only act on the current selection.",
        bullets: [
          "Use Shift while selecting to build a multi-selection.",
          "Switch back to Select when you need to move or resize existing objects.",
          "Undo and redo operate on your local action history.",
        ],
      },
      {
        heading: "Checkpoints and exports",
        body: "Save checkpoints before risky edits. Restore is intentionally styled as a dangerous action because it rewinds the board. Exports stay disabled until the board actually contains content.",
      },
    ],
  },
  presence: {
    title: "Collaboration FAQ",
    summary:
      "Presence shows who is here now, not what should be stored forever.",
    sections: [
      {
        heading: "Participant chips",
        body: "The count includes you plus currently visible remote peers. Remote labels update as other clients send cursor or laser activity.",
      },
      {
        heading: "Ephemeral signals",
        body: "Cursors and lasers are live collaboration hints. They do not become saved board objects.",
      },
    ],
  },
  status: {
    title: "Status FAQ",
    summary:
      "The metrics strip is the quick health readout for the current session.",
    sections: [
      {
        heading: "Connection and counts",
        body: "The strip reports connection state, participant count, object count, current selection size, and checkpoint count.",
      },
      {
        heading: "Undo and redo counts",
        body: "Those counters show how much local history is currently available in each direction.",
      },
      {
        heading: "When something looks stale",
        body: "A reconnect clears stale presence and replays missed board operations where possible. If state still looks wrong, reload and re-enter through the gateway.",
      },
    ],
  },
};
