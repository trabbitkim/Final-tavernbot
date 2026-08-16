/**
 * TavernBot — Cloudflare Worker edition
 *
 * Free forever on Cloudflare's Workers free plan. No card, no credits,
 * no spin-down. Paste this whole file into the Cloudflare dashboard
 * editor and hit Deploy.
 *
 * Secrets to set in the dashboard (Settings → Variables and Secrets):
 *   BOT_TOKEN    — from BotFather
 *   PROMOS_LINK  — invite link to your promotions group
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
  '💬 <i>"Whether you think you can or you think you can\'t, you\'re right."</i>\n— Henry Ford, on calling the god pack',
  '💬 <i>"Genius is 1% inspiration and 99% perspiration."</i>\n— Thomas Edison, describing pull rates',
  '💬 <i>"Insanity is doing the same thing over and over and expecting different results."</i>\n— attributed to Einstein, by every degen mid-box',
  '💬 <i>"Ask not what your country can do for you."</i>\n— JFK, on buying singles instead',
  '💬 <i>"We choose to go to the moon not because it is easy, but because it is hard."</i>\n— JFK, opening case number two',
  '💬 <i>"The only thing we have to fear is fear itself."</i>\n— FDR, weighing packs at the counter',
  '💬 <i>"Knowing yourself is the beginning of all wisdom."</i>\n— Aristotle, admitting he is a collector, not an investor',
  '💬 <i>"An investment in knowledge pays the best interest."</i>\n— Benjamin Franklin, who clearly never bought sealed product',
  '💬 <i>"Everyone has a plan until they get punched in the mouth."</i>\n— Mike Tyson, on your box breakdown spreadsheet',
  '💬 <i>"To be, or not to be."</i>\n— Hamlet, hovering over the buy button at 2am',
];

// Footer removed — the welcome is now just the pull and the quote.
// To bring back a sign-off, put text here (HTML tags allowed).
const FOOTER = "";

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
  "the exact card you sold last week for half its current price. 📉",
  "a hit so good the shop owner offers to buy it back on the spot. 🤝",
  "two cards stuck together. One of them is good. You'll never know which. 🫠",
  "an error card. Either worthless or your retirement plan. 🎰",
  "pack fresh dexterity. Straight to the binder, no touching. 🧤",
  "a rare, but it's the one nobody plays. 🪦",
  "the energy card. Singular. The pack was all energy. ⚡",
  "something so mid you check the pack for a second layer. 🔍",
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
  "You've already opened the Telegram to ask. It's over. 🪦",
  "Only if you skip lunch this week. Which you will. 🍜",
  "The correct answer is singles. You will buy sealed. 📦",
  "Your collection says no. Your heart says yes. Your wallet has left the chat. 💳",
  "99% of degens quit before their big hit. Do the math. 🎰",
  "Buy two. One to open, one to regret not opening. 🎁",
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
  // No buttons on welcomes. Telegram rejects the WHOLE message if a button
  // URL is missing or malformed, so this stays undefined unless you set
  // PROMOS_LINK to a full https:// link later.
  const link = (env.PROMOS_LINK || "").trim();
  if (!link.startsWith("http")) return undefined;
  return {
    inline_keyboard: [[{ text: "🔥 Promotions & Events", url: link }]],
  };
}

async function send(env, chatId, text, extra = {}) {
  // Strip undefined values (e.g. reply_markup when there is no valid link)
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_notification: true,
  };
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined) payload[k] = v;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  // Surface failures in the Cloudflare log stream instead of failing silently
  if (!res.ok) {
    console.log("sendMessage failed:", res.status, await res.text());
  }
  return res;
}

// ============================================================= ROUTER

async function handleUpdate(update, env) {
  // --- someone joined (service message)
  //
  // Telegram sends TWO updates for a single join: this service message AND
  // a chat_member update. Welcoming on both = double message. We ignore this
  // one and treat chat_member as the single source of truth, because it is
  // the one that fires reliably for invite-link joins in supergroups.
  if (update.message?.new_chat_members) {
    console.log("join service message ignored (handled via chat_member)");
    return;
  }

  // --- someone joined (chat_member update) — THE one that greets
  const cm = update.chat_member;
  if (cm) {
    const wasOut = ["left", "kicked"].includes(cm.old_chat_member.status);
    const isIn = cm.new_chat_member.status === "member";
    console.log(
      "chat_member:",
      cm.old_chat_member.status,
      "->",
      cm.new_chat_member.status,
      cm.new_chat_member.user.first_name
    );
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

    case "/promos": {
      const kb = keyboard(env);
      await send(
        env,
        msg.chat.id,
        kb
          ? "All our latest deals and events live here 👇"
          : "Deals and restocks drop right here in the group. Keep an eye out 🔥",
        { reply_markup: kb }
      );
      break;
    }

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

    // NOTE: the secret-token check is currently OFF. To turn it back on,
    // uncomment the block below, set SECRET_TOKEN in Cloudflare, and re-run
    // setWebhook with a matching &secret_token= value.
    //
    // if (
    //   request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.SECRET_TOKEN
    // ) {
    //   return new Response("Nope.", { status: 403 });
    // }

    const update = await request.json();
    ctx.waitUntil(handleUpdate(update, env));

    // Always 200 immediately, or Telegram retries the update
    return new Response("OK", { status: 200 });
  },
};
