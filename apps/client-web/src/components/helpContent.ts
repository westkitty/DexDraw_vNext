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
    summary: "Quick orientation before you enter the workspace.",
    sections: [
      {
        heading: "What this screen does",
        body: "The gateway is a one-time intro layer. Once you enter, the workspace opens directly on later visits in the same browser profile.",
      },
      {
        heading: "What gets stored",
        body: "Only the entered flag is stored locally. It is there to skip the intro, not to hold board data.",
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
        body: "Create starts a fresh board and gives you the owner token. Join uses an existing board identifier and share code.",
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
        body: "Use a name people can recognize in a tab list. You can rename it later from the board header.",
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
        body: "The share code grants access for that board. Paste it exactly as given if you want less avoidable suffering.",
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
    ],
  },
  tools: {
    title: "Tools FAQ",
    summary:
      "Drawing, selection, checkpoints, and exports all live in the toolbar.",
    sections: [
      {
        heading: "Drawing tools",
        body: "Pen, rectangle, ellipse, text, note, and laser cover the core object types. Switch back to Select when you need to move or resize existing objects.",
      },
      {
        heading: "Selection controls",
        body: "Duplicate, arrange, and keyboard nudge only act on the current selection.",
        bullets: [
          "Use Shift while selecting to build a multi-selection.",
          "Undo and redo operate on your local action history.",
        ],
      },
      {
        heading: "Checkpoints and exports",
        body: "Save checkpoints before risky edits. Exports stay disabled until the board actually contains content.",
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
    ],
  },
};
