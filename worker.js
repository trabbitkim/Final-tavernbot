/**
 * TavernBot — Cloudflare Worker edition
 *
 * Free forever on Cloudflare's Workers free plan. No card, no credits,
 * no spin-down. Paste this whole file into the Cloudflare dashboard
 * editor and hit Deploy.
 *
 * Secrets to set in the dashboard (Settings → Variables and Secrets):
 *   BOT_TOKEN       — from BotFather
 *   SECRET_TOKEN    — any random string you invent, e.g. "tavern-balestier-9931"
 *   PROMOS_LINK     — invite link to your promotions group
 *   INSTAGRAM_LINK  — https://instagram.com/taverngames.tcg
 */

// ======================================================= THE PULL TABLE
// Every new member gets pulled like a card. Weights are relative.

const RARITY_TABLE = [
  ["common", 50],
  ["rare", 30],
  ["secret", 15],
  ["god", 5],
];

const PULLS = {
  common: [
    "🃏 <b>COMMON PULL</b>\nIt's {name}. Bulk, but we love bulk.",
    "🃏 <b>COMMON PULL</b>\n{name} — playset material. Welcome!",
    "🃏 <b>COMMON PULL</b>\n{name} appeared. Straight into the sleeve.",
    "🃏 <b>COMMON PULL</b>\nPulled {name}. Not the hit, but a solid body.",
    "🃏 <b>COMMON PULL</b>\n{name} joined. Four-of in every deck we run.",
    "🃏 <b>COMMON PULL</b>\n{name}! Underrated. Sleeper pick. Trust us.",
  ],
  rare: [
    "✨ <b>RARE PULL</b>\n{name} has entered the Tavern!",
    "✨ <b>RARE PULL</b>\nIt's {name} — and they're holding a foil.",
    "✨ <b>RARE PULL</b>\n{name} appeared! Somebody check the ratio.",
    "✨ <b>RARE PULL</b>\n{name} joined. Immediately maindecked.",
    "✨ <b>RARE PULL</b>\nCracked the pack, got {name}. We'll take it.",
    "✨ <b>RARE PULL</b>\n{name} walked in from Balestier and sat down.",
  ],
  secret: [
    "🌈 <b>SECRET RARE</b>\n{name}?! In THIS group? Unreal.",
    "🌈 <b>SECRET RARE</b>\n{name} pulled from the back of the box. Mint.",
    "🌈 <b>SECRET RARE</b>\nAlt art {name} just joined. Somebody sleeve them.",
    "🌈 <b>SECRET RARE</b>\n{name} arrived and the whole shop went quiet.",
    "🌈 <b>SECRET RARE</b>\nIt's {name}. Grading this one. PSA 10 incoming.",
  ],
  god: [
    "🔥🔥 <b>GOD PACK</b> 🔥🔥\n{name} JOINED THE GROUP.\nEverybody stop what you're doing.",
    "🔥🔥 <b>GOD PACK</b> 🔥🔥\nOne in a case. And it's {name}.",
    "🔥🔥 <b>GOD PACK</b> 🔥🔥\n{name} appeared. We are not financially recovered from this.",
    "🔥🔥 <b>GOD PACK</b> 🔥🔥\nRipped 30 boxes for this. Worth it. Welcome {name}!",
  ],
};

// ===================================================== THE QUOTE BOARD
// Real quotes from real people, redeployed as pack-opening wisdom.
// The joke is the caption, not the quote — nobody is being misquoted.

const QUOTES = [
  '💬 <i>"You miss 100% of the shots you don\'t take."</i>\n— Wayne Gretzky, justifying the second case',
  '💬 <i>"I have not failed. I\'ve just found 10,000 ways that won\'t work."</i>\n— Thomas Edison, on box thirty-one',
  '💬 <i>"The die is cast."</i>\n— Julius Caesar, cracking the last pack',
  '💬 <i>"It always seems impossible until it\'s done."</i>\n— Nelson Mandela, on completing the master set',
  '💬 <i>"Fortune favours the bold."</i>\n— Virgil, at the counter at 8.55pm',
  '💬 <i>"Never give in, never, never, never."</i>\n— Winston Churchill, forty packs deep',
  '💬 <i>"A journey of a thousand miles begins with a single step."</i>\n— Lao Tzu, opening pack one of thirty-six',
  '💬 <i>"Houston, we\'ve had a problem."</i>\n— Jack Swigert, seeing the credit card statement',
  '💬 <i>"I came, I saw, I conquered."</i>\n— Julius Caesar, one (1) hit in',
  '💬 <i>"Float like a butterfly, sting like a bee."</i>\n— Muhammad Ali, on sleeving technique',
  '💬 <i>"That\'s one small step for man."</i>\n— Neil Armstrong, pulling his first holo',
  '💬 <i>"Elementary."</i>\n— Sherlock Holmes, calling the pack weight',
];

const FOOTER =
  "\n\n<i>Deals, restocks and event announcements drop in our Promotions &amp; Events group</i> 👇";

const FAKE_PULLS = [
  "a crimped reverse holo. Ouch. 😬",
  "a god pack. Post proof or it didn't happen. 🔥",
  "three energy cards and a code card. Classic. 🔋",
  "the box topper. Respectable. 📦",
  "an alt art. The whole group is now jealous. 🌈",
  "a bent corner. Sending it to grading anyway. 📮",
  "a full art. Sleeve it before you breathe on it. ✨",
  "absolutely nothing. The pack was empty. 📞",
  "your own reflection. Deep. 🪞",
  "a serialised hit. Do NOT sell it to the first person who DMs you. 💎",
  "bulk. Beautiful, honest bulk. 🗃️",
  "the same card you already have four of. 🔁",
];

const EIGHT_BALL = [
  "Yes, but you'll regret it. 🎱",
  "No. Save your money for the box. 💸",
  "Buy it. You've already decided anyway. 🛒",
  "Ask again after payday. 📅",
  "The market says no. Your heart says yes. Follow the market. 📉",
  "Absolutely. Tell them Tavern sent you. ⚔️",
  "Signs point to you opening it in the car park. 🚗",
  "Sell. Sell now. 📈",
];

const SHOP_LINE = "Tavern Games · Balestier Rd · open daily 2–9pm";

// ============================================================ HELPERS

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function rollPull(name) {
  const total = RARITY_TABLE.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  let tier = "common";
  for (const [t, w] of RARITY_TABLE) {
    if (roll < w) {
      tier = t;
      break;
    }
    roll -= w;
  }
  return (
    pick(PULLS[tier]).replace("{name}", escapeHtml(name)) +
    "\n\n" +
    pick(QUOTES) +
    FOOTER
  );
}

function escapeHtml(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function keyboard(env) {
  return {
    inline_keyboard: [
      [{ text: "🔥 Promotions & Events", url: env.PROMOS_LINK }],
      [{ text: "📸 Instagram", url: env.INSTAGRAM_LINK }],
    ],
  };
}

async function send(env, chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_notification: true,
      ...extra,
    }),
  });
}

// ============================================================= ROUTER

async function handleUpdate(update, env) {
  // --- someone joined (small groups: service message)
  const joined = update.message?.new_chat_members;
  if (joined) {
    for (const member of joined) {
      if (member.is_bot) continue;
      await send(env, update.message.chat.id, rollPull(member.first_name), {
        reply_markup: keyboard(env),
      });
    }
    return;
  }

  // --- someone joined (large groups: chat_member update)
  const cm = update.chat_member;
  if (cm) {
    const wasOut = ["left", "kicked"].includes(cm.old_chat_member.status);
    const isIn = cm.new_chat_member.status === "member";
    if (wasOut && isIn && !cm.new_chat_member.user.is_bot) {
      await send(env, cm.chat.id, rollPull(cm.new_chat_member.user.first_name), {
        reply_markup: keyboard(env),
      });
    }
    return;
  }

  // --- commands
  const msg = update.message;
  if (!msg?.text) return;

  const cmd = msg.text.split(/[@\s]/)[0].toLowerCase();
  const who = escapeHtml(msg.from?.first_name || "Someone");

  switch (cmd) {
    case "/start":
    case "/help":
      await send(
        env,
        msg.chat.id,
        "TavernBot online. ⚔️\n\n" +
          "/promos — our deals and events group\n" +
          "/pull — rip a virtual pack\n" +
          "/shouldibuy — consult the oracle\n" +
          "/quote — wisdom from the greats\n" +
          "/hours — when we're open"
      );
      break;

    case "/promos":
      await send(env, msg.chat.id, "All our latest deals and events live here 👇", {
        reply_markup: keyboard(env),
      });
      break;

    case "/pull":
      await send(env, msg.chat.id, `${who} rips a pack…\n\n🎴 You pulled ${pick(FAKE_PULLS)}`);
      break;

    case "/shouldibuy":
      await send(env, msg.chat.id, pick(EIGHT_BALL));
      break;

    case "/quote":
      await send(env, msg.chat.id, pick(QUOTES));
      break;

    case "/hours":
      await send(env, msg.chat.id, `🕑 ${SHOP_LINE}`);
      break;
  }
}

// ============================================================== ENTRY

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("TavernBot is awake. ⚔️", { status: 200 });
    }

    // Reject anything that isn't Telegram talking to us
    if (
      request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.SECRET_TOKEN
    ) {
      return new Response("Nope.", { status: 403 });
    }

    const update = await request.json();
    ctx.waitUntil(handleUpdate(update, env));

    // Always 200 immediately, or Telegram retries the update
    return new Response("OK", { status: 200 });
  },
};
