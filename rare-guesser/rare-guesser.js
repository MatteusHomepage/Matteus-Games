const $ = (id) => document.getElementById(id);
      const SUPABASE_URL = "https://mrrixocnhsfulglipvek.supabase.co";
      const SUPABASE_ANON_KEY = "sb_publishable_fIFvv3lqR66EOuclo_bscg_Qv8OKNt1";
      const LEVELS = ["easy", "medium", "hard", "expert", "impossible"];
      const MAX_PLAYERS = 40;
      let ME = null;
      const TOKEN_KEY = "sg_token";
      const LEVEL_NAMES = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert", impossible: "Impossible" };
      const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
      const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
      let toastTimer;
      function showToast(m) {
        const el = $("toast");
        el.textContent = m; el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
      }
      const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      const norm = (s) => String(s || "").toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/\s-\s.*$/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      const tk = (t) => norm(t.title) + "|" + norm(t.artist);
      const sameSong = (t, track) => t.id === track.id || tk(t) === tk(track);
      function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
      const vol = () => Number(lsGet("sg_music", 0.8));
      const sfxVol = () => Number(lsGet("sg_sfx", 0.35));
      const currentName = () => (ME && ME.username) || lsGet("sg_name", "") || "Player";
      const NAME_RE = /^[A-Za-z0-9ÅÄÖåäö _.,!?'\-]{3,20}$/;
      function checkUsername(v) {
        if (!NAME_RE.test(v)) return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
        if (v !== v.trim() || /\s{2,}/.test(v)) return "No extra spaces in usernames.";
        return "";
      }
      const CROWN_I = '<svg viewBox="2 3.5 20 16.5" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
      const MEDAL_I = '<svg viewBox="4.8 1 14.4 21" fill="currentColor"><path d="M6.5 2h4.2l1.6 6.2-3.4 1.6zM17.5 2h-4.2l-1.6 6.2 3.4 1.6z" fill-opacity="0.65"/><circle cx="12" cy="15.2" r="6.6"/><circle cx="12" cy="15.2" r="4" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="1.5"/></svg>';
      const HEART_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
      let RANK_SRC = {};
      const MAIN_BOARDS = ["score"];
      const BOARD_LABEL = { score: "Score", routes: "Routes solved", countries: "Countries found", accuracy: "Accuracy", streak: "Best streak", duels: "Duels played", wins: "Duels won" };
      const RANK_WORD = { 1: "1st", 2: "2nd", 3: "3rd" };
      function rankTip(name) {
        const src = RANK_SRC[String(name || "").toLowerCase()];
        if (!src || !src.length) return "";
        const by = {};
        src.forEach((x) => { (by[x.rank] = by[x.rank] || []).push(BOARD_LABEL[x.key] || x.key); });
        return Object.keys(by).sort().map((r) => "#" + r + " in " + by[r].join(", ")).join("\n");
      }
      function trophyList(name) {
        const src = RANK_SRC[String(name || "").toLowerCase()] || [];
        const byRank = (x, y) => x.rank - y.rank;
        return [...src.filter((x) => MAIN_BOARDS.includes(x.key)).sort(byRank).map((x) => ({ ...x, kind: "crown" })),
                ...src.filter((x) => !MAIN_BOARDS.includes(x.key)).sort(byRank).map((x) => ({ ...x, kind: "medal" }))];
      }
      function nameHTML(name) {
        const n0 = String(name ?? "");
        const nm = `<span class="nm-t" title="${esc(n0)}">${esc(n0)}</span>`;
        const list = trophyList(n0);
        if (!list.length) return `<span class="nm-rk">${nm}</span>`;
        const size = list.length <= 2 ? 1.35 : list.length <= 4 ? 1.22 : 1.1;
        const icons = list.map((x, i) => `<i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:${i}">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i>`).join("");
        return `<span class="nm-rk"><button type="button" class="trophies" data-name="${esc(n0)}" style="--s:${size}em" aria-label="${esc(n0)} has ${list.length} trophies. Show details">${icons}</button>${nm}</span>`;
      }
      function showTrophies(name) {
        const list = trophyList(name);
        $("trWho").textContent = name;
        $("trList").innerHTML = list.length ? list.map((x) => `<div class="tr-item"><i class="tr ${x.kind === "crown" ? "cr" : "md"} rk${x.rank}" style="--i:0">${x.kind === "crown" ? CROWN_I : MEDAL_I}</i><div><b>${RANK_WORD[x.rank]} place &middot; ${x.kind === "crown" ? "Crown" : "Medal"}</b><span class="d">${esc(BOARD_LABEL[x.key] || x.key)} leaderboard</span></div></div>`).join("")
          : '<div class="lb-note">No trophies right now.</div>';
        $("trModal").classList.add("open");
      }
      function closeTrophies() { $("trModal").classList.remove("open"); }
      document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".trophies"); if (b) { e.preventDefault(); showTrophies(b.dataset.name); } });
      const BLANK = () => ({ high: 0, matches: 0, answers: 0, best: 0, rarest: 0, duels: 0, wins: 0 });
      let stats = BLANK();
      let resetArm = 0;
      function resetStats() {
        const b = document.querySelector(".reset-btn");
        if (!resetArm) {
          resetArm = setTimeout(() => { resetArm = 0; b.textContent = "Reset statistics"; }, 3500);
          b.textContent = "Tap again to confirm";
          return;
        }
        clearTimeout(resetArm); resetArm = 0; b.textContent = "Reset statistics";
        srv("rg_reset").then((st) => showToast(st ? "Your high score and statistics were reset." : "Couldn't reset right now."));
      }
      function statTiles() {
        return [
          [stats.high.toLocaleString(), "High score"], [stats.matches.toLocaleString(), "Matches played"], [stats.best.toLocaleString(), "Best round"],
          [stats.rarest ? stats.rarest + "%" : "–", "Rarest find"], [stats.duels.toLocaleString(), "Duels played"], [stats.wins.toLocaleString(), "Duels won"],
        ].map(([v, l]) => `<div class="stat-tile"><b>${v}</b><span>${l}</span></div>`).join("");
      }
      let actx = null;
      function ctx() { actx ||= new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; }
      function sfx(kind) {
        try {
          const c = ctx(), o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.frequency.value = { correct: 660, wrong: 170, win: 880, lose: 140, advance: 420 }[kind] || 440;
          o.type = kind === "wrong" || kind === "lose" ? "triangle" : "sine";
          g.gain.setValueAtTime(Math.max(0.0001, sfxVol() * 0.12), c.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (kind === "wrong" || kind === "lose" ? 0.35 : 0.22));
          o.start(); o.stop(c.currentTime + 0.37);
        } catch (e) {}
      }
      function buildUp(ms) {
        try {
          const c = ctx(), t0 = c.currentTime, d = ms / 1000, v = sfxVol() * 0.3;
          if (v <= 0) return;
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sawtooth";
          o.frequency.setValueAtTime(90, t0); o.frequency.exponentialRampToValueAtTime(560, t0 + d);
          g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.35), t0 + d);
          o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05);
          const len = Math.floor(c.sampleRate * 0.07), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
          for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
          let t = 0, gap = 0.2;
          while (t < d - 0.1) {
            const s = c.createBufferSource(), gg = c.createGain();
            s.buffer = buf; gg.gain.value = v * (0.25 + 0.75 * (t / d));
            s.connect(gg); gg.connect(c.destination); s.start(t0 + t);
            t += gap; gap = Math.max(0.04, gap * 0.9);
          }
        } catch (e) {}
      }
      function fanfare() {
        try {
          const c = ctx(), t0 = c.currentTime, v = sfxVol() * 0.22;
          [523, 659, 784, 1046, 1318].forEach((f, i) => {
            const o = c.createOscillator(), g = c.createGain();
            o.type = "triangle"; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t0 + i * 0.08);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + i * 0.08 + 0.03);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
            o.connect(g); g.connect(c.destination); o.start(t0 + i * 0.08); o.stop(t0 + 1.7);
          });
        } catch (e) {}
      }
      const VIEWS = ["homeView", "setupView", "gameView", "matchView", "multiplayerView", "lobbyView", "duelView", "resultView"];
      function showView(id) {
        document.body.classList.remove("noscroll");
        VIEWS.forEach((v) => $(v).classList.remove("active"));
        void $(id).offsetWidth;
        $(id).classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (id === "gameView" || id === "duelView") armBack(); else disarmBack();
      }
      function goHome() {
        S.token++;
        stopRoundTimer("solo"); M = null;
        closeSoloResult();
        stopConfetti();
        if (D.channel) disconnectDuel("homeView"); else { clearTimeout(D.podTimer); showView("homeView"); }
      }
      const cf = { raf: 0 };
      function stopConfetti() {
        cancelAnimationFrame(cf.raf);
        const cv = $("confetti");
        cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
      }
      function confetti(big) {
        stopConfetti();
        const cv = $("confetti"), x = cv.getContext("2d");
        cv.width = innerWidth; cv.height = innerHeight;
        const cols = ["#19d77b", "#0ecb70", "#55efa0", "#0b8f52", "#9aa6a0", "#d6ded9"];
        const parts = Array.from({ length: big ? 260 : 150 }, () => ({
          x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.7, w: 5 + Math.random() * 7, h: 3 + Math.random() * 6,
          vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3.5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.25,
          c: cols[(Math.random() * cols.length) | 0], round: Math.random() < 0.25,
        }));
        const frame = () => {
          x.clearRect(0, 0, cv.width, cv.height);
          let alive = false;
          parts.forEach((p) => {
            p.x += p.vx + Math.sin(p.y / 40 + p.r) * 0.6; p.y += p.vy; p.r += p.vr;
            if (p.y < cv.height + 20) {
              alive = true;
              x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
              if (p.round) { x.beginPath(); x.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 6.28); x.fill(); } else x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
              x.restore();
            }
          });
          if (alive) cf.raf = requestAnimationFrame(frame); else x.clearRect(0, 0, cv.width, cv.height);
        };
        cf.raf = requestAnimationFrame(frame);
      }
      function runCooldown(ms, el, onTick, onDone) {
        let acc = 0, last = performance.now(), wasPlaying = false;
        const id = setInterval(() => {
          const now = performance.now(), dt = now - last; last = now;
          const paused = $("settingsModal").classList.contains("open") || document.hidden;
          if (paused) { if (el && !el.paused) { el.pause(); wasPlaying = true; } return; }
          if (wasPlaying) { wasPlaying = false; el?.play().catch(() => {}); }
          acc += dt;
          onTick(Math.min(1, acc / ms));
          if (acc >= ms) { clearInterval(id); onDone(); }
        }, 80);
        return () => clearInterval(id);
      }
      const BANK = (() => { const raw = window.RG_BANK || {}, out = {}; for (const c in raw) { out[c] = {}; for (const d in raw[c]) out[c][d] = raw[c][d].map((x) => ({ q: x[0], a: x[1] })); } return out; })();
      const IC = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
      const CATS = [
        { k: "general", n: "General", s: "Everyday questions & general knowledge", h: 150, ic: IC('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/>') },
        { k: "words", n: "Words & Language", s: "Grammar, spelling & oddities", h: 272, ic: IC('<path d="M3 18 8.5 5 14 18M5 14h7"/><path d="M15.5 18v-5.2a2.8 2.8 0 0 1 5.5 0V18M15.5 15.6h5.5"/>') },
        { k: "movies", n: "At the Movies", s: "Popular & great films", h: 350, ic: IC('<rect x="3" y="9" width="18" height="11" rx="2"/><path d="m3 9 2.6-5 3.2.7L6 9.5M9.8 9l2.6-5 3.2.7L12.8 9.5M16.6 9l2.6-4.6 2 .5"/>') },
        { k: "music", n: "Music", s: "Artists, songs & sound", h: 178, ic: IC('<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/>') },
        { k: "sport", n: "Sport", s: "Games, stars & records", h: 32, ic: IC('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>') },
        { k: "science", n: "Science & Tech", s: "Physics, chemistry & technology", h: 214, ic: IC('<circle cx="12" cy="12" r="1.7" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>') },
        { k: "mix", n: "Surprise me", s: "A new topic every round", h: 46, ic: IC('<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/>') },
      ];
      const CAT = Object.fromEntries(CATS.map((c) => [c.k, c]));
      const REAL_CATS = CATS.filter((c) => c.k !== "mix").map((c) => c.k);
      const HEARTS = { easy: 4, medium: 5, hard: 6, expert: 8, impossible: 10 };
      const TIME = { easy: 40, medium: 45, hard: 50, expert: 60, impossible: 75 };
      const DIFF_MULT = { easy: 1, medium: 1.25, hard: 1.5, expert: 1.9, impossible: 2.4 };
      const MATCH_ROUNDS = 7;
      const TIERS = [[0.2, "Common", "#9aa6b0"], [0.4, "Uncommon", "#5ee08a"], [0.6, "Rare", "#4fa3ff"], [0.8, "Epic", "#b66bff"], [0.98, "Legendary", "#ffb02e"], [1.01, "Once in a Matteus", "#ff4fa3"]];
      const tierOf = (r) => TIERS.find((t) => r < t[0]) || TIERS[TIERS.length - 1];
      const TIER_PTS = [10, 40, 100, 220, 450, 800];
      const RP_R = [0, 0.2, 0.4, 0.6, 0.8, 0.93, 1], RP_V = [10, 40, 100, 220, 450, 800, 1000];
      function rarityPts(r) {
        r = Math.max(0, Math.min(1, r));
        for (let i = 1; i < RP_R.length; i++) if (r <= RP_R[i]) return RP_V[i - 1] + (RP_V[i] - RP_V[i - 1]) * ((r - RP_R[i - 1]) / (RP_R[i] - RP_R[i - 1]));
        return 1000;
      }
      const speedBonus = (secs) => 0.2 * Math.max(0, Math.min(1, (20 - Math.max(3, secs)) / 17));
      const missF = (wrongs) => Math.max(0.6, 1 - 0.07 * wrongs);
      function ptsFor(diff, r, wrongs, secs) {
        return Math.min(3000, Math.round(rarityPts(r) * (1 + speedBonus(secs)) * missF(wrongs) * DIFF_MULT[diff]));
      }
      const depthOf = (r) => Math.round((100 + r * 900) / 10) * 10;
      const ICONS = [
        '<circle cx="8" cy="8" r="5"/>',
        '<path d="M8 2.5 14 13H2Z"/>',
        '<path d="M8 2 13.5 5v6L8 14 2.5 11V5Z"/>',
        '<path d="M8 1.5 13.5 8 8 14.5 2.5 8Z"/>',
        '<path d="m8 1.5 1.9 4.2 4.6.5-3.4 3.1 1 4.5L8 11.5l-4.1 2.3 1-4.5L1.5 6.2l4.6-.5Z"/>',
        '<path d="M8 1v14M1 8h14M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6"/><circle cx="8" cy="8" r="2.2"/>',
      ];
      const tierIcon = (i, s, color) => `<svg class="ti" viewBox="0 0 16 16" width="${s * 8}" height="${s * 8}" fill="none" stroke="${color || TIERS[i][2]}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[i]}</svg>`;
      const QUOTES = [
        ["The answer everyone blurts out.", "First thing that comes to mind for pretty much everyone.", "Safe. Very safe.", "You and about half the internet said that.", "Anyone could have said that one.", "Barely left the ground, that one.", "Easy points, but small ones.", "That's what most people write first."],
        ["Pretty familiar, but not the first thing people say.", "Solid answer. A lot of people get there.", "You went a little past the obvious.", "A common one, just not the most common.", "That one has a lot of company.", "Past the crowd, but only just."],
        ["Now we're getting somewhere.", "That took a second thought, didn't it?", "Not many people reach for that one.", "A decent find.", "Most people would have skipped right past it.", "Getting off the ground now."],
        ["That's a deep cut.", "Most people wouldn't think of that.", "Now that's a proper find.", "Not a lot of people know that one.", "You really reached for that one.", "Good luck getting anyone else to say that."],
        ["Hardly anyone says that.", "Okay, where did you get that from?", "That's way up there.", "Very few people would come up with that.", "You must have been saving that one.", "That one barely ever shows up."],
        ["Nobody says that. Nobody.", "That's a once in a Matteus kind of answer.", "That's from the very end of the list.", "You found something almost nobody knows.", "That's about as high as it gets.", "Honestly impressive.", "Almost no one gets that one."],
      ];
      let lastQuote = "";
      function pickQuote(ti, ans, secs, wrongs) {
        const pool = QUOTES[ti].filter((q) => q !== lastQuote);
        let q = pool[Math.floor(Math.random() * pool.length)];
        const roll = Math.random();
        if (roll < 0.22) {
          const own = ti === 0 ? [`"${ans}" is exactly what most people would say.`, `Everybody and their dog says "${ans}".`] : ti >= 3 ? [`Didn't expect "${ans}" to come up.`, `"${ans}" was a bold choice.`] : [];
          if (own.length) q = own[Math.floor(Math.random() * own.length)];
        } else if (roll < 0.42) {
          if (wrongs >= 2) q += " Took a few tries, though.";
          else if (secs < 5) q += " Quick, too.";
        }
        lastQuote = q;
        return q;
      }
      const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
      const sq = (s) => fold(s).replace(/ /g, "");
      const stripArt = (s) => fold(s).replace(/^(the|a|an) /, "").replace(/ /g, "");
      const STOP = new Set(["the", "and", "of", "for", "with", "from", "that", "this"]);
      function prep(it) {
        if (it.map) return it;
        it.map = new Map(); it.kl = []; it.tok = new Map();
        it.a.forEach((al, i) => al.forEach((nm) => {
          [sq(nm), stripArt(nm)].forEach((k) => { if (k && !it.map.has(k)) { it.map.set(k, i); it.kl.push([k, i]); } });
          fold(nm).split(" ").forEach((w) => { if (w.length >= 4 && !STOP.has(w)) { let s = it.tok.get(w); if (!s) it.tok.set(w, (s = new Set())); s.add(i); } });
        }));
        return it;
      }
      function lev(a, b, max) {
        if (Math.abs(a.length - b.length) > max) return max + 1;
        let p2 = null, p1 = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
          const cur = [i]; let low = i;
          for (let j = 1; j <= b.length; j++) {
            let v = Math.min(p1[j] + 1, cur[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
            cur[j] = v; if (v < low) low = v;
          }
          if (low > max) return max + 1;
          p2 = p1; p1 = cur;
        }
        return p1[b.length];
      }
      const slack = (n) => (n < 6 ? 0 : n <= 12 ? 1 : 2);
      const NO_HELP = { expert: true, impossible: true };
      function findGuess(it, typed, help = true) {
        prep(it);
        const k1 = sq(typed), k2 = stripArt(typed);
        if (!k1) return { sugg: [] };
        if (it.map.has(k1)) return { hit: it.map.get(k1) };
        if (it.map.has(k2)) return { hit: it.map.get(k2) };
        if (!help) return { sugg: [] };
        const L = k1.length, mx = slack(L);
        if (!mx) return { sugg: [] };
        let bestI = -1, bestD = 99;
        it.kl.forEach(([k, i]) => {
          if (Math.abs(k.length - L) > mx) return;
          const swap = k.length > 1 && k[0] === k1[1] && k[1] === k1[0];
          if (k[0] !== k1[0] && !swap) return;
          const d = lev(k1, k, mx);
          if (d > mx || d * 4 > Math.max(L, k.length)) return;
          if (d < bestD || (d === bestD && i < bestI)) { bestD = d; bestI = i; }
        });
        return { sugg: bestI >= 0 ? [bestI] : [] };
      }
      const RARITY_EXP = { easy: 0.72, medium: 0.86, hard: 1, expert: 1.1, impossible: 1.22 };
      const LUCK = { easy: 0.3, medium: 0.25, hard: 0.2, expert: 0.15, impossible: 0.12 };
      const REF_N = 50;
      function baseRarity(i, n) {
        if (n < 2) return 0.5;
        const f = (k) => 0.5 * Math.log(1 + k) / Math.log(1 + Math.max(n - 1, REF_N)) + 0.5 * k / (n - 1);
        return Math.min(1, f(i) / f(n - 1));
      }
      const rarityOf = (it, i, diff) => Math.pow(baseRarity(i, it.a.length), RARITY_EXP[diff] || 1);
      function luckyBoost(diff, r) {
        if (Math.random() >= (LUCK[diff] || 0.15)) return { r, lucky: false };
        const nr = r + (1 - r) * (0.3 + Math.random() * 0.25);
        return tierIdx(nr) > tierIdx(r) ? { r: nr, lucky: true } : { r, lucky: false };
      }
      const SEEN = (() => { try { return new Set(JSON.parse(lsGet("rg_seen", "[]"))); } catch (e) { return new Set(); } })();
      const saveSeen = () => { try { lsSet("rg_seen", JSON.stringify([...SEEN].slice(-4000))); } catch (e) {} };
      const NEIGH = { easy: [["easy", 3], ["medium", 1]], medium: [["easy", 1], ["medium", 3], ["hard", 1]], hard: [["medium", 1], ["hard", 3], ["expert", 1]], expert: [["hard", 1], ["expert", 3], ["impossible", 1]], impossible: [["expert", 1], ["impossible", 3]] };
      function pickQuestion(cat, diff, used) {
        const cand = [];
        (NEIGH[diff] || [[diff, 1]]).forEach(([d, w]) => ((BANK[cat] && BANK[cat][d]) || []).forEach((_, i) => cand.push({ qd: d, qi: i, w, key: cat + "|" + d + "|" + i })));
        let free = cand.filter((c) => !SEEN.has(c.key) && !(used && used.has(c.key)));
        if (!free.length) { cand.forEach((c) => { SEEN.delete(c.key); if (used) used.delete(c.key); }); free = cand.filter((c) => !(used && used.has(c.key))); if (!free.length) free = cand; }
        let roll = Math.random() * free.reduce((s, c) => s + c.w, 0), pick = free[free.length - 1];
        for (const c of free) { roll -= c.w; if (roll <= 0) { pick = c; break; } }
        SEEN.add(pick.key); if (used) used.add(pick.key); saveSeen();
        return { qd: pick.qd, qi: pick.qi };
      }
      const randCat = () => REAL_CATS[Math.floor(Math.random() * REAL_CATS.length)];
      const catLabel = (k) => (CAT[k] ? CAT[k].n : "");
      const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>';
      function renderCats(id, current, onPick, opts = {}) {
        const box = $(id);
        const list = opts.noMix ? CATS.filter((c) => c.k !== "mix") : CATS;
        box.className = "cat-grid" + (opts.sm ? " sm" : "") + (opts.noMix ? " six" : "");
        box.innerHTML = list.map((c, i) => `<button type="button" class="cat-tile${c.k === current ? " sel" : ""}" data-k="${c.k}" style="--h:${c.h};--i:${i}" aria-pressed="${c.k === current}">
          <span class="ct-ic">${c.ic}</span><b>${c.n}</b>${opts.sm ? "" : `<small>${c.s}</small>`}<i class="ct-check">${CHECK_SVG}</i></button>`).join("");
        box.querySelectorAll(".cat-tile").forEach((b) => {
          b.onclick = () => { box.querySelectorAll(".cat-tile").forEach((x) => { x.classList.toggle("sel", x === b); x.setAttribute("aria-pressed", x === b); }); onPick(b.dataset.k); };
        });
      }
      function renderDiff(id, current, onPick) {
        const box = $(id);
        box.innerHTML = "";
        LEVELS.forEach((l) => {
          const b = document.createElement("button");
          b.className = "pill" + (l === current ? " sel" : "");
          b.dataset.level = l; b.textContent = LEVEL_NAMES[l];
          b.onclick = () => { box.querySelectorAll(".pill").forEach((x) => x.classList.toggle("sel", x === b)); onPick(l); };
          box.appendChild(b);
        });
      }
      const R = { solo: null, duel: null };
      const SEARCH_SVG = '<svg class="mag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
      const X_SVG = '<svg class="xm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      const BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
      const SKIP_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 5 8 7-8 7zM17 5v14"/></svg>';
      const CROWN_SVG = '<svg class="crown" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
      function gameHTML(p) {
        return `
          <div class="rg-card" id="${p}Panel">
            <div class="rg-qhead"><span class="rg-cat" id="${p}Cat"></span><span class="rg-dtag" id="${p}DiffTag"></span><span class="rg-cheat" id="${p}Cheat" hidden></span><span class="rg-time" id="${p}Time"></span></div>
            <div class="rg-tbar" id="${p}TbarBox"><i id="${p}Tbar"></i></div>
            <h2 class="rg-q" id="${p}Q">&nbsp;</h2>
            <p class="rg-sub">Type the <b>rarest</b> answer you know. Common answers score little.</p>
            <div class="rg-chips" id="${p}Chips"></div>
          </div>
          <div id="${p}Action">
            <div class="answer-row">
              <div class="search" id="${p}Search">${SEARCH_SVG}<input id="${p}Input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type an answer..." oninput="guessInput('${p}')" onkeydown="guessKey(event,'${p}')" />${X_SVG}<div class="hearts-in" id="${p}HeartsCard" title="Hearts left"><b id="${p}Hearts">4</b>${HEART_SVG}</div></div>
              <button class="gs-btn" id="${p}Btn" onclick="guessPress('${p}')"><span class="ico">${SKIP_SVG}</span><span class="lbl">Skip</span></button>
            </div>
            <div class="sugg" id="${p}Sugg"></div>
            <div class="msg" id="${p}Msg"></div>
            <div class="cheat-note" id="${p}CheatNote" hidden></div>
          </div>`;
      }
      const setMsg = (p, html, cls = "") => { const m = $(p + "Msg"); m.className = "msg " + cls; m.innerHTML = html; };
      function setHearts(p, n) { $(p + "Hearts").textContent = Math.max(0, n); }
      function hitHeart(p) { const c = $(p + "HeartsCard"); c.classList.remove("hit"); void c.offsetWidth; c.classList.add("hit"); }
      function wrongFx(p) {
        sfx("wrong");
        try { navigator.vibrate && navigator.vibrate(70); } catch (e) {}
        const s = $(p + "Search");
        s.classList.remove("bad"); void s.offsetWidth; s.classList.add("bad");
        clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("bad"), 900);
      }
      const pool = (p) => (p === "solo" ? M : D);
      const fmtTime = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
      const TM = { solo: 0, duel: 0 };
      function paintTimer(p) {
        const r = R[p]; if (!r) return;
        const left = Math.max(0, r.limit - r.elapsed), low = r.limit && left <= Math.min(10, r.limit * 0.25);
        $(p + "Time").textContent = r.limit ? fmtTime(Math.ceil(left)) : "";
        $(p + "TbarBox").style.visibility = r.limit ? "visible" : "hidden";
        $(p + "Tbar").style.width = (r.limit ? (left / r.limit) * 100 : 0) + "%";
        $(p + "TbarBox").classList.toggle("low", !!low); $(p + "Time").classList.toggle("low", !!low);
        if (p === "duel") { const t = $("duelTimer"); t.textContent = fmtTime(Math.ceil(left)); t.classList.toggle("on", !!r.limit); t.classList.toggle("low", !!low); }
      }
      function stopRoundTimer(p) { clearInterval(TM[p]); TM[p] = 0; if (p === "duel") $("duelTimer").classList.remove("on", "low"); }
      function startRoundTimer(p, limit, onEnd) {
        stopRoundTimer(p);
        const r = R[p]; r.limit = limit; r.elapsed = 0; paintTimer(p);
        let last = performance.now();
        TM[p] = setInterval(() => {
          const now = performance.now(), dt = now - last; last = now;
          if (!R[p] || R[p] !== r || r.locked) { stopRoundTimer(p); return; }
          const paused = p === "solo" && ($("settingsModal").classList.contains("open") || document.hidden);
          if (!paused) r.elapsed += dt / 1000;
          paintTimer(p);
          if (limit && r.elapsed >= limit) { stopRoundTimer(p); onEnd(); }
        }, 100);
      }
      function awayWho(id) { return id === D.myId ? "You" : ((D.players.find((x) => x.id === id) || {}).name || "A player"); }
      function renderAway() {
        const pill = $("duelCheat"), note = $("duelCheatNote"), ids = Object.keys(D.away || {});
        if (!ids.length) { pill.hidden = true; note.hidden = true; note.innerHTML = ""; return; }
        pill.hidden = false; pill.textContent = ids.map((id) => awayWho(id) + " changed tabs").join(" · ");
        note.hidden = false; note.innerHTML = ids.map((id) => esc(awayWho(id)) + " changed tabs, " + (id === D.myId ? "your" : "their") + " answer will be marked as cheating.").join("<br>");
      }
      function markAway() {
        if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs) return;
        const r = R.duel; if (!r || r.locked || r.cheat) return;
        r.cheat = true; D.away[D.myId] = true;
        send("away", { id: D.myId, round: D.round });
        renderAway();
      }
      function onAway(p) {
        if (!D.inMatch || D.locked || !D.settings || !D.settings.tabs || p.round !== D.round || !D.players.some((x) => x.id === p.id) || p.id === D.myId) return;
        D.away[p.id] = true; renderAway();
      }
      document.addEventListener("visibilitychange", () => { if (document.hidden) markAway(); });
      window.addEventListener("blur", () => { setTimeout(() => { if (!document.hasFocus()) markAway(); }, 1500); });
      function clampNum(el, fin) {
        const min = Number(el.min), max = Number(el.max);
        if (el.value === "") { if (fin) el.value = el.defaultValue; return; }
        const v = Math.floor(Number(el.value));
        if (!isFinite(v)) { el.value = el.defaultValue; return; }
        if (v > max) { el.value = max; showToast("The most you can set here is " + max + "."); }
        else if (fin && v < min) el.value = min;
        else if (String(v) !== el.value && fin) el.value = v;
      }
      function renderChips(p) {
        const r = R[p]; if (!r) { $(p + "Chips").innerHTML = ""; return; }
        $(p + "Chips").innerHTML = r.names.map((n) => `<span class="rg-chip">${CHIP_X}${esc(n)}</span>`).join("");
      }
      const CHIP_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      function setupRound(p, cat, diff, qi, limit, qd = diff) {
        const it = prep(BANK[cat][qd][qi]);
        R[p] = { cat, diff, qd, qi, it, tried: new Set(), names: [], wrongs: 0, sugKey: "", locked: false, elapsed: 0, limit };
        $(p + "Cheat").hidden = true; $(p + "CheatNote").hidden = true;
        $(p + "Cat").textContent = catLabel(cat);
        $(p + "Cat").style.setProperty("--h", CAT[cat].h);
        $(p + "DiffTag").textContent = LEVEL_NAMES[diff];
        $(p + "DiffTag").dataset.level = diff;
        $(p + "Q").textContent = it.q;
        setHearts(p, pool(p).hearts); renderChips(p); resetSearch(p); setMsg(p, "");
        $(p + "Action").style.display = "";
        const card = $(p + "Panel"); card.classList.remove("flip"); void card.offsetWidth; card.classList.add("flip");
        startRoundTimer(p, limit, () => { setMsg(p, "Time's up!"); sfx("wrong"); endRound(p, "time"); });
      }
      const endRound = (p, kind, info) => (p === "solo" ? soloEnd(kind, info) : finishDuel(kind, info));
      const SQ = { solo: { sel: -1, items: [] }, duel: { sel: -1, items: [] } };
      function hideSugg(p) { const b = $(p + "Sugg"); b.innerHTML = ""; b.classList.remove("open"); SQ[p].items = []; SQ[p].sel = -1; }
      function updateBtn(p) {
        const has = $(p + "Input").value.trim().length > 0, b = $(p + "Btn");
        b.classList.toggle("is-guess", has);
        b.querySelector(".lbl").textContent = has ? "Guess" : "Skip";
      }
      function resetSearch(p) { hideSugg(p); $(p + "Input").value = ""; updateBtn(p); }
      function guessInput(p) { hideSugg(p); updateBtn(p); }
      function showSuggest(p, list) {
        const r = R[p], box = $(p + "Sugg");
        SQ[p].items = list; SQ[p].sel = -1; box.innerHTML = "";
        list.forEach((i, n) => {
          const b = document.createElement("button");
          b.className = "sugg-row"; b.dataset.i = n;
          b.innerHTML = `<span class="dym">${IC('<path d="m5 13 4 4L19 7"/>')}</span><span class="t"><b>${esc(r.it.a[i][0])}</b><small>Did you mean this?</small></span>`;
          b.onclick = () => { $(p + "Input").value = ""; hideSugg(p); updateBtn(p); acceptAnswer(p, i); };
          box.appendChild(b);
        });
        box.classList.add("open");
      }
      function guessKey(e, p) {
        const st = SQ[p], rows = [...$(p + "Sugg").querySelectorAll(".sugg-row[data-i]")];
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && rows.length) {
          e.preventDefault();
          st.sel = e.key === "ArrowDown" ? (st.sel + 1) % rows.length : st.sel <= 0 ? rows.length - 1 : st.sel - 1;
          rows.forEach((x, i) => x.classList.toggle("active", i === st.sel));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (st.sel >= 0 && rows[st.sel]) rows[st.sel].click(); else submitGuess(p);
        } else if (e.key === "Escape") hideSugg(p);
      }
      function guessPress(p) { if ($(p + "Input").value.trim()) submitGuess(p); else giveUp(p); }
      function giveUp(p) { const r = R[p]; if (!r || r.locked) return; endRound(p, "skip"); }
      function submitGuess(p) {
        const r = R[p]; if (!r || r.locked || (p === "duel" && D.locked)) return;
        const raw = $(p + "Input").value.trim(); if (!raw) return;
        const res = findGuess(r.it, raw, !NO_HELP[r.diff]);
        if (res.hit !== undefined) { $(p + "Input").value = ""; hideSugg(p); updateBtn(p); acceptAnswer(p, res.hit); return; }
        const key = sq(raw);
        if (r.tried.has(key)) { setMsg(p, "You already tried that one."); $(p + "Input").value = ""; hideSugg(p); updateBtn(p); return; }
        if (res.sugg.length && r.sugKey !== key) {
          r.sugKey = key; showSuggest(p, res.sugg);
          setMsg(p, "Close! Tap it if that is what you meant, or press Guess again to count it as wrong.");
          return;
        }
        r.tried.add(key); r.names.push(raw.length > 26 ? raw.slice(0, 25) + "…" : raw); r.wrongs++;
        const pl = pool(p); pl.hearts--;
        $(p + "Input").value = ""; hideSugg(p); updateBtn(p);
        wrongFx(p); hitHeart(p); renderChips(p);
        if (pl.hearts <= 0) { setHearts(p, 0); pl.hearts = pl.maxHearts; setMsg(p, '<span class="bad">Out of hearts.</span> This one is skipped, and your hearts are restocked.'); endRound(p, "hearts"); return; }
        setHearts(p, pl.hearts);
        setMsg(p, '<span class="bad">Not on the list.</span> That cost a heart.');
      }
      function acceptAnswer(p, i) {
        const r = R[p]; if (!r || r.locked) return;
        let rar = rarityOf(r.it, i, r.diff), lucky = false;
        if (p === "solo") { const lk = luckyBoost(r.diff, rar); rar = lk.r; lucky = lk.lucky; }
        const secs = Math.max(0.5, r.elapsed);
        const pts = ptsFor(r.diff, rar, r.wrongs, secs);
        endRound(p, "correct", { idx: i, r: rar, secs, pts, name: r.it.a[i][0], lucky });
      }
      const SCENE = { cancel: null };
      function stopScene() { if (SCENE.cancel) { SCENE.cancel(); SCENE.cancel = null; } }
      const tierIdx = (r) => { const i = TIERS.findIndex((t) => r < t[0]); return i < 0 ? TIERS.length - 1 : i; };
      function sfxNote(freq, dur, type, vol, slide) {
        try {
          const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime, v = sfxVol();
          if (v <= 0) return;
          o.type = type; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(freq, t);
          if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
          g.gain.setValueAtTime(Math.max(0.0002, v * vol), t);
          g.gain.exponentialRampToValueAtTime(0.0002, t + dur);
          o.start(t); o.stop(t + dur + 0.03);
        } catch (e) {}
      }
      function fanSound() {
        try {
          const c = ctx(), v = sfxVol();
          if (v <= 0) return null;
          const t = c.currentTime, out = c.createGain();
          out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * 0.5), t + 1.4);
          out.connect(c.destination);
          const o = c.createOscillator(), o2 = c.createOscillator(), og = c.createGain();
          o.type = "sawtooth"; o2.type = "square"; og.gain.value = 0.11;
          o.frequency.setValueAtTime(28, t); o.frequency.exponentialRampToValueAtTime(92, t + 2.1);
          o2.frequency.setValueAtTime(56, t); o2.frequency.exponentialRampToValueAtTime(184, t + 2.1);
          o.connect(og); o2.connect(og); og.connect(out);
          const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
          const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.7;
          bp.frequency.setValueAtTime(180, t); bp.frequency.exponentialRampToValueAtTime(1250, t + 2.1);
          const ng = c.createGain(); ng.gain.value = 0.9;
          n.connect(bp); bp.connect(ng); ng.connect(out);
          o.start(t); o2.start(t); n.start(t);
          return {
            stop(rel) {
              try {
                const u = c.currentTime;
                out.gain.cancelScheduledValues(u); out.gain.setValueAtTime(Math.max(0.0002, out.gain.value), u); out.gain.exponentialRampToValueAtTime(0.0002, u + rel);
                o.frequency.exponentialRampToValueAtTime(24, u + rel); bp.frequency.exponentialRampToValueAtTime(120, u + rel);
                o.stop(u + rel + 0.05); o2.stop(u + rel + 0.05); n.stop(u + rel + 0.05);
              } catch (e) {}
            },
          };
        } catch (e) { return null; }
      }
      function fanSVG() {
        const blades = [0, 1, 2, 3, 4, 5].map((k) => `<path transform="rotate(${k * 60})" d="M0 0C28 -52 112 -74 152 -32C122 12 52 32 0 22Z" fill="${k % 2 ? "#97a8b8" : "#6f8191"}"/>`).join("");
        const rings = [52, 104, 154].map((r) => `<circle r="${r}" fill="none" stroke="#b4c0cb" stroke-opacity=".55" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`).join("");
        const spokes = Array.from({ length: 14 }, (_, k) => `<path d="M30 0H160" transform="rotate(${k * (360 / 14)})" stroke="#b4c0cb" stroke-opacity=".4" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`).join("");
        return `<svg viewBox="0 0 400 150" width="100%" height="100%" preserveAspectRatio="xMidYMax meet">
          <ellipse cx="200" cy="142" rx="168" ry="7" fill="#000" opacity=".5"/>
          <rect x="88" y="129" width="224" height="11" rx="4" fill="#212932"/><rect x="102" y="123" width="196" height="8" rx="3" fill="#2f3a45"/>
          <path d="M30 42 68 120Q200 140 332 120L370 42Z" fill="#171e25"/>
          <path d="M30 42 68 120Q100 126 132 129L98 42Z" fill="#26313b"/><path d="M302 42 272 129Q304 125 332 120L370 42Z" fill="#10161b"/>
          <g stroke="#0a0e12" stroke-width="3.2" stroke-linecap="round"><path d="M112 72H288"/><path d="M120 86H280"/><path d="M128 100H272"/></g>
          <circle cx="64" cy="108" r="3.2" fill="#43505c"/><circle cx="336" cy="108" r="3.2" fill="#43505c"/><circle cx="52" cy="80" r="3" fill="#43505c"/><circle cx="348" cy="80" r="3" fill="#43505c"/>
          <rect x="162" y="110" width="76" height="15" rx="3" fill="#0b0f13" stroke="#3b4753"/><text x="200" y="120.8" text-anchor="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="8" letter-spacing="1" fill="#9aa8b5">Matteus, Inc.</text>
          <ellipse cx="200" cy="42" rx="176" ry="36" fill="#27313b" stroke="#475562" stroke-width="2"/>
          <ellipse cx="200" cy="42" rx="167" ry="31.5" fill="#05080b"/>
          <g transform="translate(200 42) scale(1 .19)"><g class="fan-blades">${blades}</g><circle r="34" fill="#2a343e"/><circle r="15" fill="#a2afbb"/><circle class="blur" r="156" fill="#fff" opacity="0"/>${rings}${spokes}</g>
        </svg>`;
      }
      const skyHTML = () => "";
      const clamp01 = (v) => Math.max(0, Math.min(1, v));
      function playRise(mount, entries, opts = {}) {
        stopScene();
        const solo = !!opts.solo, info = opts.info || {}, n = Math.max(1, entries.length), T = TIERS.length;
        const SH = solo ? Math.max(450, Math.min(600, innerHeight - 200)) : Math.max(440, Math.min(660, innerHeight - 190));
        mount.innerHTML = `<div class="rise${solo ? " solo" : ""}" style="height:${SH}px"><div class="rs-view"><div class="rs-world"></div></div>${solo ? '<div class="cd-hud"><b class="cd-pts">+0</b><b class="cd-dep">0 m</b></div>' : ""}<div class="dv-result"></div></div>`;
        const st = mount.firstElementChild, W = Math.max(280, st.clientWidth), world = st.querySelector(".rs-world"), resEl = st.querySelector(".dv-result");
        const ptsEl = st.querySelector(".cd-pts"), depEl = st.querySelector(".cd-dep");
        const fanW = Math.min(W - 10, 420), fs = fanW / 400, fanH = 150 * fs;
        const BH = 190, TOPPAD = 130, GROUND = fanH + 14, worldH = TOPPAD + T * BH + GROUND;
        const grillY = worldH - fanH + 42 * fs, yBot = (i) => worldH - GROUND - i * BH, lineY = (i) => yBot(i) - BH;
        let html = "";
        html += TIERS.map((t, i) => `<div class="rc-line" style="--c:${t[2]};top:${lineY(i)}px"><span>${t[1]}</span></div>`).join("");
        let streaks = ""; for (let k = 0; k < 10; k++) streaks += `<i style="left:${(6 + Math.random() * 88).toFixed(1)}%;height:${30 + Math.random() * 50 | 0}px;animation-duration:${(0.9 + Math.random() * 0.9).toFixed(2)}s;animation-delay:-${(Math.random() * 1.6).toFixed(2)}s"></i>`;
        html += `<div class="rc-streaks" style="bottom:${GROUND - 6}px;height:${T * BH}px">${streaks}</div>`;
        html += `<div class="rc-fan" style="left:${(W - fanW) / 2}px;width:${fanW}px;height:${fanH}px">${fanSVG()}</div><div class="rc-fxw"></div>`;
        world.innerHTML = html; world.style.height = worldH + "px";
        const fanEl = world.querySelector(".rc-fan"), fxw = world.querySelector(".rc-fxw"), lines = [...world.querySelectorAll(".rc-line")];
        const pillH = solo ? 46 : 30, tabH = solo ? 0 : 17, totH = pillH + tabH, areaW = W - 24;
        const chipW = solo ? Math.min(260, W - 60) : Math.max(76, Math.min(150, Math.floor(areaW / n) - 6));
        const perRow = Math.max(1, Math.floor(areaW / chipW)), rows = Math.min(3, Math.ceil(n / perRow)), perStart = Math.ceil(n / rows);
        let order = 0;
        const S_ = entries.map((e, i) => {
          e.i = i; e.ti = e.ok ? tierIdx(e.r) : -1;
          const row = Math.floor(i / perStart), col = i % perStart, cnt = Math.min(perStart, n - row * perStart), sp = Math.min(chipW + 6, areaW / cnt);
          const x = Math.max(4, Math.min(W - chipW - 4, 12 + (areaW - cnt * sp) / 2 + col * sp + (sp - chipW) / 2 + (row % 2 && cnt > 1 ? sp / 2 : 0)));
          const b0 = grillY + 8 - row * (totH + 6), top0 = b0 - totH;
          const el = document.createElement("div");
          el.className = "rc-chip" + (solo ? " solo" : "") + (e.me ? " me" : "") + (e.ok ? "" : " fail");
          el.style.cssText = `width:${chipW}px;--zc:${TIERS[0][2]}`;
          el.innerHTML = (solo ? "" : `<small>${esc(e.name)}</small>`) + `<span><b>${esc(e.ok ? e.ans : e.fail)}</b></span>`;
          world.insertBefore(el, fxw);
          let tT = top0;
          if (e.ok) {
            const lo = e.ti ? TIERS[e.ti - 1][0] : 0, hi = Math.min(1, TIERS[e.ti][0]), f = clamp01((e.r - lo) / Math.max(0.0001, hi - lo));
            tT = yBot(e.ti) - 44 - f * (BH - 120) - totH;
          }
          el.style.transform = `translate(${x}px,${top0}px)`;
          return { e, el, x, top0, top: top0, tT, dist: top0 - tT, state: e.ok ? "idle" : "dead", passed: 0, delay: e.ok ? Math.min(420, order++ * 70) : 0, tc: null };
        });
        const okS = S_.filter((s) => s.e.ok);
        let remaining = okS.length;
        const best = okS.reduce((a, b) => (!a || b.tT < a.tT ? b : a), null);
        const rAtB = (b) => {
          const u = Math.max(0, worldH - GROUND - b - 44), i = Math.min(T - 1, Math.floor(u / BH));
          const lo = i ? TIERS[i - 1][0] : 0, hi = Math.min(1, TIERS[i][0]);
          return lo + (hi - lo) * clamp01((u - i * BH) / (BH - 120));
        };
        const INTRO = solo ? 900 : 1100, SPIN = 1250, HOVER = 420, VM = 0.78, ACC = 280;
        const t0 = performance.now();
        let raf = 0, done = false, skipped = false, p1 = false, p2 = false, finishAt = 0, lastT = t0, cam = worldH - SH, lastTop = Infinity, fan = null, cardOpen = false, lastTick = 0, spunDown = false;
        fanEl.className = "rc-fan spin0";
        world.style.transform = `translateY(${-cam}px)`;
        const shake = (ms) => { st.classList.remove("shake"); void st.offsetWidth; st.classList.add("shake"); setTimeout(() => st.classList.remove("shake"), ms); };
        function ring(x, y, color, big) {
          const r = document.createElement("div"); r.className = "ds-ring"; r.style.cssText = `left:${x}px;top:${y}px;--c:${color};--s:${big ? 9 : 5}`;
          fxw.appendChild(r); setTimeout(() => r.remove(), 800);
          const k = big ? 14 : 6;
          for (let i = 0; i < k; i++) {
            const a = (i / k) * Math.PI * 2 + Math.random() * 0.5, d = (big ? 60 : 36) + Math.random() * (big ? 80 : 34);
            const p = document.createElement("i"); p.className = "ds-sp";
            p.style.cssText = `left:${x}px;top:${y}px;--c:${color};--dx:${Math.cos(a) * d | 0}px;--dy:${Math.sin(a) * d | 0}px;width:${3 + Math.random() * 5 | 0}px;height:${3 + Math.random() * 5 | 0}px`;
            fxw.appendChild(p); setTimeout(() => p.remove(), 850);
          }
        }
        function pass(s, j) {
          const col = TIERS[j + 1][2];
          s.el.style.setProperty("--zc", col);
          lines[j].classList.add("flash"); setTimeout(() => lines[j] && lines[j].classList.remove("flash"), 420);
          if (solo) st.style.setProperty("--zc", col);
          const now = performance.now();
          if (!skipped && now - lastTick > 80) { lastTick = now; sfxNote(300 + j * 120, 0.12, "square", 0.05); sfxNote(620 + j * 240, 0.08, "sine", 0.05); }
        }
        function statCard(s) {
          const e = s.e, ti = e.ti, col = TIERS[ti][2], q = pickQuote(ti, e.ans, info.secs || 99, info.wrongs || 0);
          resEl.innerHTML = `<div class="cd-card" style="--c:${col}">
            <div class="rs-orb">${tierIcon(ti, 5, col)}</div>
            <div class="rs-tier">${TIERS[ti][1]}</div>
            ${info.lucky ? '<div class="rs-lucky">LUCKY BOOST</div>' : ""}
            <div class="rs-ans">“${esc(e.ans)}”</div>
            <div class="rs-pts"><span><small>POINTS</small><b>+${(e.pts || 0).toLocaleString()}</b></span><span><small>ROSE</small><b>${depthOf(e.r).toLocaleString()} m</b></span></div>
            <div class="rs-quote">${esc(q)}</div></div>`;
          resEl.style.transformOrigin = `50% ${Math.max(40, Math.min(SH - 40, s.top + totH / 2 - cam))}px`;
          st.classList.add("opened"); cardOpen = true;
          if (!skipped) {
            sfxNote(262, 0.5, "triangle", 0.09); if (ti >= 1) sfxNote(330, 0.55, "triangle", 0.07); if (ti >= 3) sfxNote(392, 0.6, "triangle", 0.07); if (ti >= 4) sfxNote(523, 0.7, "triangle", 0.07);
            if (ti === T - 1) { try { fanfare(); } catch (er) {} }
          }
          setTimeout(() => { done = true; opts.onDone && opts.onDone(); }, skipped ? 100 : 800);
        }
        function pop(s) {
          s.state = "gone"; remaining--;
          const e = s.e, ti = e.ti, col = TIERS[ti][2], cx = s.x + chipW / 2, cy = s.top + totH / 2;
          s.el.classList.add("pop"); setTimeout(() => s.el.remove(), 560);
          lines[ti].classList.add("hit");
          if (!skipped) {
            ring(cx, cy, col, true);
            if (ti >= 3) shake(260 + ti * 40);
            if (ti >= 4) { const fl = document.createElement("div"); fl.className = "ds-flash"; fl.style.setProperty("--c", col); st.appendChild(fl); setTimeout(() => fl.remove(), 700); }
            sfxNote(520 + ti * 70, 0.16, "sine", 0.12, 1100); setTimeout(() => sfxNote(780 + ti * 90, 0.1, "sine", 0.08, 1300), 90);
          }
          if (!solo) {
            const pl = document.createElement("div"); pl.className = "rc-plus"; pl.style.cssText = `left:${cx}px;top:${s.top}px;--c:${col}`;
            pl.innerHTML = `<small>${esc(e.name)}</small><b>+${(e.pts || 0).toLocaleString()}</b>`;
            fxw.appendChild(pl); setTimeout(() => pl.remove(), 1900);
          } else setTimeout(() => statCard(s), skipped ? 60 : 380);
        }
        function spinDown() {
          if (spunDown) return; spunDown = true;
          fanEl.className = "rc-fan spin0"; world.classList.remove("blowing");
          if (fan) { fan.stop(1.6); fan = null; }
        }
        function frame(now) {
          if (done) return;
          const dt = Math.max(1, Math.min(50, now - lastT)); lastT = now;
          const t = skipped ? 1e9 : now - t0;
          if (!p1 && t >= INTRO && S_.some((s) => s.e.ok)) { p1 = true; fanEl.className = "rc-fan spin1"; if (!skipped) { fan = fanSound(); sfxNote(80, 0.3, "square", 0.1, 45); } }
          if (!p2 && t >= INTRO + SPIN) { p2 = true; fanEl.className = "rc-fan spin2"; world.classList.add("blowing"); }
          const tl = t - INTRO - SPIN;
          let hiTop = Infinity;
          S_.forEach((s) => {
            if (s.state === "dead" || s.state === "gone") return;
            if (skipped && s.state !== "hover") { s.state = "hover"; s.top = s.tT; s.hoverAt = -1e9; }
            if (s.state === "idle") {
              s.top = s.top0 + (p1 ? (Math.random() - 0.5) * 2.4 : Math.sin(now / 260 + s.e.i) * 1.6);
              if (p2 && tl >= s.delay) { s.state = "rise"; s.x0 = tl; }
            }
            if (s.state === "rise") {
              const x = tl - s.x0, s0 = VM * (x - ACC * (1 - Math.exp(-x / ACC))), dec = Math.min(200, s.dist * 0.45);
              let trav;
              if (s.tc === null && s0 < s.dist - dec) trav = s0;
              else {
                if (s.tc === null) { s.tc = x; s.s0c = s0; s.v0 = VM * (1 - Math.exp(-x / ACC)); s.tau = 2 * (s.dist - s0) / Math.max(0.05, s.v0); }
                const xx = Math.min(s.tau, x - s.tc);
                trav = s.s0c + s.v0 * xx - (s.v0 * xx * xx) / (2 * s.tau);
                if (xx >= s.tau) { trav = s.dist; s.state = "hover"; s.hoverAt = now; }
              }
              s.top = s.top0 - trav;
              while (s.passed < s.e.ti && s.top + totH / 2 < lineY(s.passed)) { pass(s, s.passed); s.passed++; }
            }
            if (s.state === "hover") {
              s.top = s.tT + (skipped ? 0 : Math.sin(now / 170 + s.e.i) * 1.8);
              while (s.passed < s.e.ti) { pass(s, s.passed); s.passed++; }
              if (now - s.hoverAt > HOVER) { s.top = s.tT; pop(s); if (s.e.ok && s === best) spinDown(); }
            }
            if (s.state !== "gone") { s.el.style.transform = `translate(${s.x}px,${s.top.toFixed(1)}px)`; hiTop = Math.min(hiTop, s.top); }
            if (solo && s === best && s.state !== "gone" && !cardOpen) {
              const rr = Math.min(info.r === undefined ? s.e.r : info.r, rAtB(s.top + totH));
              ptsEl.textContent = "+" + Math.round(rarityPts(rr)).toLocaleString();
              depEl.textContent = (Math.max(0, Math.round(((s.top0 - s.top) / Math.max(1, s.dist)) * depthOf(s.e.r) / 10) * 10)).toLocaleString() + " m";
            }
          });
          if (hiTop === Infinity) hiTop = lastTop; else lastTop = hiTop;
          const want = lastTop === Infinity ? cam : Math.max(0, Math.min(worldH - SH, lastTop - SH * 0.4));
          cam = skipped ? want : cam + (want - cam) * (1 - Math.exp(-dt / 230));
          world.style.transform = `translateY(${-cam.toFixed(1)}px)`;
          if (!remaining && !cardOpen && !solo) {
            if (!p1 || !spunDown) spinDown();
            if (!finishAt) finishAt = now + (skipped ? 250 : 1900);
            if (now >= finishAt) { done = true; opts.onDone && opts.onDone(); return; }
          }
          if (!okS.length && !finishAt) finishAt = now + 1600;
          if (!okS.length && now >= finishAt) { done = true; opts.onDone && opts.onDone(); return; }
          raf = requestAnimationFrame(frame);
        }
        { const r = st.getBoundingClientRect(); if (r.top < 56 || r.bottom > innerHeight) window.scrollBy(0, r.top - 66); }
        st.onclick = () => { if (!cardOpen) skipped = true; };
        raf = requestAnimationFrame(frame);
        const cancel = () => { done = true; cancelAnimationFrame(raf); if (fan) { fan.stop(0.3); fan = null; } };
        SCENE.cancel = cancel;
        return cancel;
      }
      const playScene = (mount, entries, opts = {}) => playRise(mount, entries, opts);
      const playDive = (mount, info, opts = {}) => playRise(mount, [{ name: "", me: true, ok: true, r: info.r, ans: info.ans, pts: info.pts }], { ...opts, solo: true, info });
      function answerRevealHTML(it) {
        prep(it);
        const n = it.a.length, top = it.a.slice(0, 3).map((a) => a[0]), rare = it.a.slice(Math.max(3, n - 3)).reverse().map((a) => a[0]);
        return `<div class="rg-reveal"><div><small>MOST COMMON</small><p>${top.map(esc).join(" · ")}</p></div><div><small>RAREST ON THE LIST</small><p>${rare.map(esc).join(" · ")}</p></div></div>`;
      }
      const S = { token: 0, cancel: null, dive: null };
      let M = null;
      const SET = { diff: lsGet("rg_diff", "easy"), cat: lsGet("rg_cat2", "general") };
      if (!LEVELS.includes(SET.diff)) SET.diff = "easy";
      if (!CAT[SET.cat]) SET.cat = "general";
      function updateSetupInfo() {
        const d = SET.diff;
        $("setupInfo").innerHTML = `<div><b>${HEARTS[d]}</b><small>HEARTS</small></div><div><b>${TIME[d]}s</b><small>PER QUESTION</small></div><div><b>×${DIFF_MULT[d]}</b><small>SCORE</small></div><div><b>${MATCH_ROUNDS}</b><small>QUESTIONS</small></div>`;
        $("setupInfo").dataset.level = d;
      }
      function startSolo() {
        closeSoloResult(); stopRoundTimer("solo"); M = null;
        showView("setupView");
        renderDiff("setupDiff", SET.diff, (l) => { SET.diff = l; lsSet("rg_diff", l); updateSetupInfo(); });
        renderCats("setupCats", SET.cat, (k) => { SET.cat = k; lsSet("rg_cat2", k); });
        updateSetupInfo(); updateScoreChip();
      }
      function leaveGame() { S.token++; stopRoundTimer("solo"); closeSoloResult(); resetSearch("solo"); R.solo = null; M = null; startSolo(); }
      function beginMatch() {
        S.token++;
        closeSoloResult(); stopConfetti();
        M = { diff: SET.diff, cat: SET.cat, round: 0, score: 0, hearts: HEARTS[SET.diff], maxHearts: HEARTS[SET.diff], rounds: [], used: new Set() };
        showView("gameView");
        $("soloDiff").textContent = LEVEL_NAMES[M.diff]; $("soloDiff").dataset.level = M.diff;
        updateScoreChip();
        nextQuestion();
      }
      function renderDots() {
        $("soloDots").innerHTML = Array.from({ length: MATCH_ROUNDS }, (_, i) => {
          const rr = M.rounds[i], cls = rr ? (rr.kind === "correct" ? "good" : "bad") : i === M.round - 1 ? "now" : "";
          return `<i class="${cls}" ${rr && rr.kind === "correct" ? `style="--tc:${tierOf(rr.r)[2]}"` : ""}></i>`;
        }).join("");
      }
      function paintMatchScore() {
        $("soloMatch").textContent = M.score.toLocaleString();
        $("soloMatchBox").classList.toggle("beat", M.score > 0 && M.score > (stats.high || 0));
      }
      function nextQuestion() {
        M.round++;
        const cat = M.cat === "mix" ? randCat() : M.cat;
        const pq = pickQuestion(cat, M.diff, M.used);
        $("soloRound").textContent = `Question ${M.round} / ${MATCH_ROUNDS}`;
        closeSoloResult();
        setupRound("solo", cat, M.diff, pq.qi, TIME[M.diff], pq.qd);
        renderDots(); paintMatchScore();
      }
      function soloEnd(kind, info) {
        const r = R.solo; if (!r || r.locked) return;
        r.locked = true; stopRoundTimer("solo"); resetSearch("solo");
        const secs = Math.max(0.5, r.elapsed), ok = kind === "correct", pts = ok ? info.pts : 0;
        M.score += pts;
        M.rounds.push({ kind, r: ok ? info.r : 0, secs, wrongs: r.wrongs, pts, name: ok ? info.name : "" });
        sfx(ok ? "correct" : "lose");
        paintMatchScore(); renderDots();
        showSoloResult(kind, info, secs);
      }
      function showSoloResult(kind, info, secs) {
        const r = R.solo, tok = S.token, ok = kind === "correct", last = M.round >= MATCH_ROUNDS;
        const startCool = () => {
          const bar = $("soloCool"); if (!bar) return;
          if (lsGet("rg_autonext", "1") === "1") S.cancel = runCooldown(ok ? 8000 : 9000, null, (k) => { bar.style.width = k * 100 + "%"; }, () => { S.cancel = null; if (tok === S.token) nextSolo(); });
          else $("soloResult").querySelector(".cool").style.visibility = "hidden";
        };
        const label = last ? "See results" : "Next question";
        if (ok) {
          const t = tierOf(info.r);
          $("soloResult").classList.add("hold");
          $("soloResult").innerHTML = `<div class="dscene-wrap"><div id="soloScene"></div></div>
            <div class="rg-res dv-after">
            ${answerRevealHTML(r.it)}
            <div class="res-actions"><button class="res-next" onclick="nextSolo()">${label}</button></div><div class="cool"><i id="soloCool"></i></div></div>`;
          $("gameView").classList.add("diveon");
          $("soloAction").style.display = "none";
          $("soloResult").style.display = "block"; window.__resAt = Date.now();
          playDive($("soloScene"), { r: info.r, ans: info.name, pts: info.pts, secs, wrongs: r.wrongs, lucky: info.lucky }, { onDone: () => {
            SCENE.cancel = null;
            if (tok !== S.token) return;
            $("gameView").classList.replace("diveon", "ansd");
            $("soloResult").classList.remove("hold");
            startCool();
          } });
          return;
        } else {
          const why = kind === "hearts" ? "OUT OF HEARTS" : kind === "time" ? "TIME'S UP" : "SKIPPED";
          $("soloResult").innerHTML = `<div class="res bad strip rg-res">
            <div class="res-badges"><span class="stamp">${why}</span><span class="streak" style="color:#9aa6a0">No score${kind === "hearts" ? " · hearts restocked" : ""}</span></div>
            ${answerRevealHTML(r.it)}
            <div class="res-actions"><button class="res-next" onclick="nextSolo()">${label}</button></div><div class="cool"><i id="soloCool"></i></div></div>`;
        }
        $("soloAction").style.display = "none";
        $("soloResult").style.display = "block"; window.__resAt = Date.now();
        startCool();
      }
      function nextSolo() {
        if (!R.solo || !R.solo.locked || !M || $("soloResult").classList.contains("hold")) return;
        if (M.round >= MATCH_ROUNDS) { endMatch(); return; }
        nextQuestion();
      }
      function closeSoloResult() {
        stopScene(); $("gameView").classList.remove("diveon", "ansd"); $("soloResult").classList.remove("hold");
        if (S.cancel) { S.cancel(); S.cancel = null; }
        $("soloResult").style.display = "none"; $("soloResult").innerHTML = "";
        $("soloAction").style.display = "";
        stopConfetti();
      }
      function endMatch() {
        closeSoloResult();
        const m = M, tok = S.token;
        const answers = m.rounds.filter((x) => x.kind === "correct");
        const prevHigh = stats.high || 0, isHigh = m.score > prevHigh;
        localStats((x) => {
          x.matches++; x.answers += answers.length;
          x.high = Math.max(x.high, m.score);
          x.best = Math.max(x.best, ...m.rounds.map((y) => y.pts), 0);
          x.rarest = Math.max(x.rarest, ...answers.map((y) => Math.round(y.r * 100)), 0);
        });
        const pending = srv("rg_match", { diff: m.diff, rounds: m.rounds.map((x) => ({ r: Math.round(x.r * 10000) / 10000, secs: Math.round(x.secs * 100) / 100, wrongs: x.wrongs, skip: x.kind !== "correct" })) });
        const rows = m.rounds.map((x, i) => {
          const t = x.kind === "correct" ? tierOf(x.r) : null;
          return `<div class="mr-row" style="animation-delay:${i * 70}ms"><span class="n">${i + 1}</span><span class="a">${x.kind === "correct" ? esc(x.name) : '<em>' + (x.kind === "hearts" ? "Out of hearts" : x.kind === "time" ? "Time's up" : "Skipped") + "</em>"}</span>${t ? `<span class="t" style="color:${t[2]}">${t[1]}</span>` : '<span class="t"></span>'}<b>${x.pts.toLocaleString()}</b></div>`;
        }).join("");
        $("matchBox").innerHTML = `<div class="eyebrow">${LEVEL_NAMES[m.diff].toUpperCase()} · ${m.cat === "mix" ? "ALL TOPICS" : catLabel(m.cat).toUpperCase()}</div>
          <h1 class="mr-score" id="mrScore">0</h1>
          <div class="mr-high ${isHigh ? "new" : ""}" id="mrHigh">${isHigh ? "NEW HIGH SCORE" : "HIGH SCORE " + prevHigh.toLocaleString()}</div>
          <div class="mr-list">${rows}</div>
          <div class="mr-actions"><button class="primary" onclick="startSolo()">Play again</button><button class="skip-btn small" onclick="tryHome()">Home</button></div>`;
        showView("matchView");
        countUp($("mrScore"), 0, m.score, 1100);
        if (isHigh && m.score > 0) { setTimeout(() => { if ($("matchView").classList.contains("active")) { confetti(true); fanfare(); } }, 900); }
        const t0 = Date.now();
        pending.then((st) => {
          if (tok !== S.token || !st || st.points === undefined) return;
          setTimeout(() => {
            if (tok !== S.token || !$("mrScore")) return;
            if (st.rejected) { $("mrHigh").textContent = "Too quick to count. Wait a moment between matches."; $("mrHigh").classList.remove("new"); return; }
            if (Number(st.points) !== m.score) $("mrScore").textContent = Number(st.points).toLocaleString();
          }, Math.max(0, 1250 - (Date.now() - t0)));
        });
        M = null;
      }
      let leaveCb = null, leaveBypass = false;
      function matchActive() {
        if (leaveBypass) return false;
        if ($("gameView").classList.contains("active") && M) return true;
        if ($("duelView").classList.contains("active") && D.inMatch && !D.finished) return true;
        return false;
      }
      function leaveStats() {
        const box = $("leaveStats");
        if ($("duelView").classList.contains("active") && D.inMatch) {
          box.innerHTML = `<span><small>QUESTION</small><b>${D.round} / ${D.total}</b></span><span><small>POINTS</small><b>${(D.score && D.score[D.myId] || 0).toLocaleString()}</b></span><span><small>HEARTS</small><b>${D.hearts == null ? "–" : D.hearts}</b></span>`;
        } else if (M) {
          box.innerHTML = `<span><small>QUESTION</small><b>${M.round} / ${MATCH_ROUNDS}</b></span><span><small>POINTS</small><b>${M.score.toLocaleString()}</b></span><span><small>HEARTS</small><b>${M.hearts}</b></span>`;
        } else box.innerHTML = "";
      }
      function openLeave(fn) {
        if ($("leaveModal").classList.contains("open")) return;
        leaveCb = fn; leaveStats(); $("leaveModal").classList.add("open");
        setTimeout(() => { try { $("leaveStay").focus(); } catch (e) {} }, 60);
      }
      function closeLeave(go) { $("leaveModal").classList.remove("open"); const f = leaveCb; leaveCb = null; if (go && f) f(); }
      var backArmed = false, backIgnore = 0;
      function armBack() { if (backArmed) return; backArmed = true; try { history.pushState({ rg: 1 }, ""); } catch (e) {} }
      function disarmBack() { if (!backArmed) return; backArmed = false; try { if (history.state && history.state.rg) { backIgnore++; history.back(); } } catch (e) {} }
      window.addEventListener("popstate", () => {
        if (backIgnore) { backIgnore--; return; }
        if (matchActive()) {
          try { history.pushState({ rg: 1 }, ""); } catch (e) {}
          const duel = $("duelView").classList.contains("active");
          openLeave(duel ? () => disconnectDuel() : leaveGame);
        } else backArmed = false;
      });
      function guardLeave(fn) { if (matchActive()) openLeave(fn); else fn(); }
      const tryHome = () => guardLeave(goHome);
      window.addEventListener("beforeunload", (e) => { if (matchActive()) { e.preventDefault(); e.returnValue = "You will lose your progress for this match."; return e.returnValue; } });
      document.addEventListener("keydown", (e) => {
        if (!$("leaveModal").classList.contains("open")) return;
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLeave(false); }
        else if (e.key === "Enter") { e.stopPropagation(); }
      }, true);
      const D = {
        client: null, channel: null, code: "", host: false, hostId: "", players: [], settings: null, round: 0, total: 7, cat: "", diff: "easy", qi: 0, rid: 0,
        score: {}, answers: {}, away: {}, locked: true, resolved: false, hearts: 5, maxHearts: 5, used: new Set(), bestRound: 0, bestR: 0, finished: false,
        inMatch: false, started: false, joining: false, myId: crypto.randomUUID(), name: currentName(),
        helloTimer: null, nextTimer: null, podTimer: null,
      };
      let duelDiffSel = "easy", duelCatSel = lsGet("rg_dcat2", "general"), duelRandom = false, duelRandomCat = false;
      if (!CAT[duelCatSel] || duelCatSel === "mix") duelCatSel = "general";
      let SBC = null;
      function sb() {
        if (!SBC) {
          if (!window.supabase) throw new Error("Supabase library did not load. Reload the page.");
          SBC = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 10 } } });
        }
        return SBC;
      }
      const supabaseClient = sb;
      const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
      const send = (event, payload) => D.channel?.send({ type: "broadcast", event, payload });
      const settingsText = () => {
        const s = D.settings; if (!s) return "";
        return [s.random ? "Random difficulty" : LEVEL_NAMES[s.difficulty], s.randomTheme ? "Random topics" : catLabel(s.theme), s.hearts + (s.hearts === 1 ? " heart" : " hearts"), s.timer ? timerName(s.timer) + " timer" : "No timer", s.total + (s.total === 1 ? " question" : " questions")].concat(s.tabs ? ["Tab changes shown"] : []).join(" · ");
      };
      function toggleDD(e, id) {
        e?.stopPropagation();
        document.querySelectorAll(".dd.open").forEach((x) => { if (x.id !== id) x.classList.remove("open"); });
        $(id).classList.toggle("open");
      }
      const TIMERS = [[0, "Off"], [15, "15 seconds"], [30, "30 seconds"], [45, "45 seconds"], [60, "60 seconds"], [90, "1.5 minutes"], [120, "2 minutes"], [180, "3 minutes"], [240, "4 minutes"], [300, "5 minutes"]];
      let duelTimerSel = 0;
      const timerName = (v) => (TIMERS.find((t) => t[0] === v) || [0, ""])[1];
      function pickTimer(v) {
        duelTimerSel = v;
        $("timerLabel").textContent = timerName(v);
        document.querySelectorAll("#timerMenu .dd-item").forEach((i) => i.classList.toggle("sel", Number(i.dataset.v) === v));
        $("timerDD").classList.remove("open");
      }
      document.addEventListener("click", (e) => { document.querySelectorAll(".dd.open").forEach((x) => { if (!x.contains(e.target)) x.classList.remove("open"); }); });
      function setDuelRandom(v) { duelRandom = !!v; $("duelDiff").classList.toggle("off", duelRandom); }
      function setDuelRandomCat(v) { duelRandomCat = !!v; $("duelCats").classList.toggle("off", duelRandomCat); }
      function pickDuelDiff(l) { duelDiffSel = l; $("duelHeartsInput").value = HEARTS[l]; }
      async function createDuel() {
        const btn = $("createBtn");
        btn.disabled = true;
        try {
          const total = Math.max(1, Math.min(100, Math.floor(Number($("duelRounds").value) || 7)));
          const hearts = Math.max(1, Math.min(99, Math.floor(Number($("duelHeartsInput").value) || HEARTS[duelDiffSel])));
          $("duelRounds").value = total; $("duelHeartsInput").value = hearts;
          D.client = sb();
          D.name = currentName();
          D.code = makeCode(); D.host = true; D.hostId = D.myId; D.started = false;
          D.players = [{ id: D.myId, name: D.name }];
          D.settings = { difficulty: duelDiffSel, theme: duelCatSel, random: duelRandom, randomTheme: duelRandomCat, hearts, timer: duelTimerSel, total, tabs: !!$("duelTabs").checked };
          D.total = total; D.score = { [D.myId]: 0 };
          await connectDuel();
          showLobby();
        } catch (e) { showToast(e.message || "Could not create duel."); await disconnectDuel(null); }
        btn.disabled = false;
      }
      function onJoinInput() {
        const inp = $("joinCode");
        inp.value = inp.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        inp.classList.remove("err"); $("joinMsg").classList.remove("show");
        if (inp.value.length === 6) joinDuel(inp.value);
      }
      function joinFail(msg) {
        const inp = $("joinCode"), m = $("joinMsg");
        inp.value = ""; inp.disabled = false;
        inp.classList.add("err", "shake");
        m.textContent = msg; m.classList.remove("note"); m.classList.add("show");
        showToast(msg);
        setTimeout(() => inp.classList.remove("shake"), 450);
        clearTimeout(joinFail.t);
        joinFail.t = setTimeout(() => { m.classList.remove("show"); inp.classList.remove("err"); }, 9000);
        inp.focus();
      }
      function joinNote(msg) { const m = $("joinMsg"); m.textContent = msg; m.classList.add("show", "note"); }
      function failJoin(msg) {
        clearTimeout(joinFail.watch); clearInterval(joinFail.pres);
        try { disconnectDuel(null).catch(() => {}); } catch (e) {}
        joinFail(msg);
      }
      async function joinDuel(code) {
        if (D.joining) return;
        D.joining = true;
        $("joinCode").disabled = true;
        joinNote("Looking for that duel...");
        clearTimeout(joinFail.t); $("joinCode").classList.remove("err");
        clearTimeout(joinFail.watch); clearInterval(joinFail.pres);
        joinFail.watch = setTimeout(() => { if (D.joining && !D.settings) failJoin("That duel code doesn't exist. Check it and try again."); }, 7000);
        try {
          D.client = sb();
          D.name = currentName();
          D.code = code; D.host = false; D.hostId = ""; D.players = []; D.settings = null; D.started = false;
          await connectDuel();
          const t0 = Date.now();
          joinFail.pres = setInterval(() => {
            if (D.settings || !D.channel) { clearInterval(joinFail.pres); return; }
            let others = 1;
            try { others = Object.keys(D.channel.presenceState() || {}).filter((k) => k !== D.myId).length; } catch (e) {}
            if (!others && Date.now() - t0 > 2500) failJoin("That duel code doesn't exist. Check it and try again.");
          }, 300);
          let tries = 0;
          const hello = () => {
            if (D.settings || !D.channel) return;
            if (tries++ >= 5) { failJoin("That duel code doesn't exist. Check it and try again."); return; }
            send("hello", { id: D.myId, name: D.name });
            D.helloTimer = setTimeout(hello, 800);
          };
          hello();
        } catch (e) { failJoin(e.message || "Couldn't connect. Check your connection."); }
      }
      const broadcastRoster = () => send("roster", { players: D.players, hostId: D.myId, settings: D.settings });
      async function connectDuel() {
        D.channel = D.client.channel("rare-guesser-" + D.code, { config: { broadcast: { self: false }, presence: { key: D.myId } } });
        const on = (ev, fn) => D.channel.on("broadcast", { event: ev }, ({ payload }) => fn(payload || {}));
        on("hello", (p) => {
          if (!D.host || !p.id) return;
          const known = D.players.find((x) => x.id === p.id);
          if (!known) {
            if (D.started) { send("denied", { to: p.id, reason: "started" }); return; }
            if (D.players.length >= MAX_PLAYERS) { send("denied", { to: p.id, reason: "full" }); return; }
            D.players.push({ id: p.id, name: String(p.name || "Player").slice(0, 24) });
            D.score[p.id] = 0;
          } else known.name = String(p.name || known.name).slice(0, 24);
          broadcastRoster();
          updateLobby();
        });
        on("roster", (p) => {
          if (D.host || !Array.isArray(p.players) || !p.players.some((x) => x.id === D.myId)) return;
          const first = !D.settings;
          clearTimeout(D.helloTimer);
          D.settings = p.settings; D.total = p.settings.total; D.hostId = p.hostId; D.players = p.players;
          if (first) { D.score = {}; D.players.forEach((x) => { D.score[x.id] = 0; }); showLobby(); } else if (!D.inMatch) updateLobby();
        });
        on("denied", (p) => {
          if (D.host || p.to !== D.myId) return;
          failJoin(p.reason === "full" ? "That duel is full." : "That duel has already started, so you can't join anymore.");
        });
        on("kick", (p) => { if (!D.host && p.id === D.myId) { showToast("The host removed you from the duel."); disconnectDuel(); } });
        on("match-start", (p) => { if (!D.host) { D.settings = p.settings; beginRound(p); } });
        on("new-round", (p) => { if (!D.host) beginRound(p); });
        on("done", (p) => { if (D.host) handleDone(p); });
        on("away", (p) => onAway(p));
        on("round-result", (p) => { if (!D.host) showRoundResult(p); });
        on("match-end", (p) => { if (!D.host) showMatchResult(p); });
        D.channel.on("presence", { event: "leave" }, ({ key }) => { if (key !== D.myId && D.channel) playerLeft(key); });
        await new Promise((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Could not connect. Check your connection.")), 10000);
          D.channel.subscribe((s) => {
            if (s === "SUBSCRIBED") { clearTimeout(t); resolve(); }
            if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") { clearTimeout(t); reject(new Error("Could not connect to the duel channel.")); }
          });
        });
        await D.channel.track({ id: D.myId, name: D.name });
      }
      function playerLeft(id) {
        if (D.finished) return;
        if (D.host) {
          const i = D.players.findIndex((x) => x.id === id);
          if (i < 0) return;
          const gone = D.players.splice(i, 1)[0];
          delete D.answers[id]; delete D.score[id];
          if (!D.inMatch) { broadcastRoster(); updateLobby(); return; }
          showToast(gone.name + " left the duel.");
          if (D.players.length < 2) { showToast("Everyone else left the duel."); disconnectDuel(); return; }
          broadcastRoster();
          checkResolve();
        } else if (id === D.hostId) { showToast("The host left the duel."); disconnectDuel(); }
      }
      function kickPlayer(id) {
        if (!D.host || D.inMatch || id === D.myId) return;
        const i = D.players.findIndex((x) => x.id === id);
        if (i < 0) return;
        send("kick", { id });
        D.players.splice(i, 1); delete D.score[id];
        broadcastRoster();
        updateLobby();
      }
      function showLobby() { clearTimeout(joinFail.watch); clearInterval(joinFail.pres); $("joinMsg").classList.remove("show", "note"); D.joining = false; showView("lobbyView"); $("lobbyCode").textContent = D.code; updateLobby(); }
      const X_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      function updateLobby() {
        const n = D.players.length;
        $("lobbyCount").textContent = n + (n === 1 ? " player" : " players");
        $("playerList").innerHTML = D.players.map((pl) => {
          const isHost = pl.id === D.hostId || (D.host && pl.id === D.myId);
          const me = pl.id === D.myId;
          return `<div class="pl-row"><span class="pl-name">${nameHTML(pl.name)}${me ? " <small>(you)</small>" : ""}</span>${isHost ? '<span class="pl-tag">HOST</span>' : ""}${D.host && !isHost ? `<button class="kick" onclick="kickPlayer('${esc(pl.id)}')" aria-label="Remove player" title="Remove player">${X_SM}</button>` : ""}</div>`;
        }).join("");
        $("lobbySettings").textContent = settingsText();
        const b = $("startBtn");
        b.disabled = !D.host || n < 2;
        b.textContent = D.host ? (n < 2 ? "Waiting for players..." : "Start duel (" + n + " players)") : "Waiting for host to start...";
      }
      function copyCode() {
        if (!navigator.clipboard?.writeText) { showToast("Duel code: " + D.code); return; }
        navigator.clipboard.writeText(D.code).then(() => showToast("Duel code copied.")).catch(() => showToast("Duel code: " + D.code));
      }
      function startMatch() {
        if (!D.host || D.players.length < 2 || D.started) return;
        D.started = true;
        $("startBtn").disabled = true;
        D.score = {}; D.players.forEach((x) => { D.score[x.id] = 0; });
        D.round = 0; D.used = new Set();
        hostNextRound("match-start");
      }
      async function hostNextRound(event = "new-round") {
        D.round++;
        const st = D.settings;
        const diff = st.random ? LEVELS[Math.floor(Math.random() * LEVELS.length)] : st.difficulty;
        const cat = st.randomTheme ? randCat() : st.theme;
        const pq = pickQuestion(cat, diff, D.used), qi = pq.qi, qd = pq.qd;
        if (!D.channel) return;
        const payload = { settings: st, total: D.total, round: D.round, cat, diff, qd, qi, score: D.score, players: D.players };
        send(event, payload);
        beginRound(payload);
      }
      function beginRound(p) {
        clearTimeout(D.nextTimer); clearTimeout(D.podTimer);
        stopDuelScene();
        stopConfetti();
        const ok = BANK[p.cat] && BANK[p.cat][p.qd || p.diff] && BANK[p.cat][p.qd || p.diff][p.qi];
        if (!ok || !D.settings) return;
        D.inMatch = true; D.finished = false; D.started = true;
        if (p.players) D.players = p.players;
        D.round = p.round; D.total = p.total; D.cat = p.cat; D.diff = LEVELS.includes(p.diff) ? p.diff : "easy"; D.qd = LEVELS.includes(p.qd) ? p.qd : D.diff; D.qi = p.qi; D.score = p.score;
        if (p.round === 1) { D.maxHearts = D.settings.hearts; D.hearts = D.maxHearts; D.bestRound = 0; D.bestR = 0; }
        D.answers = {}; D.away = {}; D.locked = false; D.resolved = false; ++D.rid;
        $("lbOverlay").classList.remove("open");
        $("duelBody").classList.remove("waiting");
        $("duelWait").classList.remove("show");
        showView("duelView");
        $("duelRound").textContent = `Question ${p.round} / ${p.total}`;
        $("duelScore").textContent = (D.score[D.myId] || 0).toLocaleString();
        setupRound("duel", D.cat, D.diff, D.qi, D.settings.timer || 0, D.qd);
      }
      function finishDuel(kind, info) {
        if (D.locked) return;
        D.locked = true;
        const r = R.duel;
        if (r) r.locked = true;
        stopRoundTimer("duel"); resetSearch("duel");
        $("duelBody").classList.add("waiting");
        $("duelWait").classList.add("show");
        const ok = kind === "correct" && !!r, points = ok ? info.pts : 0;
        if (ok) { D.bestRound = Math.max(D.bestRound, points); D.bestR = Math.max(D.bestR, Math.round(info.r * 100)); sfx("correct"); } else sfx("lose");
        const payload = { id: D.myId, correct: ok, points, ans: ok ? info.name : "", r: ok ? info.r : 0, kind, cheat: !!(r && r.cheat) };
        if (D.host) handleDone(payload); else send("done", payload);
      }
      function handleDone(p) {
        if (!p?.id || D.answers[p.id] || D.resolved || !D.players.some((x) => x.id === p.id)) return;
        D.answers[p.id] = { id: p.id, correct: !!p.correct, points: Math.max(0, Math.min(3000, Number(p.points) || 0)), ans: String(p.ans || "").slice(0, 60), r: Math.max(0, Math.min(1, Number(p.r) || 0)), kind: String(p.kind || "").slice(0, 8), cheat: !!p.cheat };
        checkResolve();
      }
      function checkResolve() {
        if (D.resolved || !D.inMatch || !D.host) return;
        if (D.players.every((pl) => D.answers[pl.id])) resolveRound();
      }
      function resolveRound() {
        if (D.resolved) return;
        D.resolved = true;
        const prev = { ...D.score };
        Object.values(D.answers).forEach((a) => { D.score[a.id] = (D.score[a.id] || 0) + (a.correct ? a.points : 0); });
        const names = {}; D.players.forEach((pl) => { names[pl.id] = pl.name; });
        const payload = { score: D.score, prev, answers: D.answers, cat: D.cat, diff: D.diff, qd: D.qd, qi: D.qi, round: D.round, total: D.total, names };
        if (D.round >= D.total) {
          const res = { score: D.score, names, answers: D.answers, cat: D.cat, diff: D.diff, qd: D.qd, qi: D.qi, round: D.round, total: D.total };
          send("match-end", res);
          showMatchResult(res);
          return;
        }
        send("round-result", payload);
        showRoundResult(payload);
      }
      function roundRevealHTML(p) {
        const it = BANK[p.cat] && BANK[p.cat][p.qd || p.diff] && BANK[p.cat][p.qd || p.diff][p.qi];
        if (!it) return "";
        return `<div class="rg-reveal-q">${esc(it.q)}</div>` + answerRevealHTML(prep(it));
      }
      function stopDuelScene() { stopScene(); $("duelView").classList.remove("scening"); }
      function duelEntries(p) {
        return Object.keys(p.score).map((id) => {
          const a = p.answers[id];
          return { id, name: p.names?.[id] || "Player", me: id === D.myId, ok: !!(a && a.correct), r: a ? a.r : 0, pts: a ? a.points : 0, ans: a ? a.ans : "", fail: !a ? "Left" : a.kind === "time" ? "Time's up" : a.kind === "hearts" ? "Out of hearts" : "Skipped" };
        });
      }
      function playDuelScene(p, then) {
        stopDuelScene();
        const it = BANK[p.cat] && BANK[p.cat][p.qd || p.diff] && BANK[p.cat][p.qd || p.diff][p.qi];
        $("duelSceneQ").textContent = it ? it.q : "";
        $("duelView").classList.add("scening");
        playScene($("duelScene"), duelEntries(p), { onDone: () => { SCENE.cancel = null; $("duelView").classList.remove("scening"); then(); } });
      }
      function showRoundResult(p) {
        D.locked = true;
        playDuelScene(p, () => {
          renderRoundBoard(p);
          if (D.host) { clearTimeout(D.nextTimer); D.nextTimer = setTimeout(() => hostNextRound(), 8500); }
        });
      }
      function showMatchResult(p) {
        if (D.finished) return;
        D.finished = true;
        clearTimeout(D.nextTimer);
        playDuelScene(p, () => renderMatchBoard(p));
      }
      function ansLine(a) {
        if (!a) return "";
        const ch = a.cheat ? ' <i class="mr-cheat">CHEATING</i>' : "";
        if (!a.correct) return `<em class="ans no">${a.kind === "time" ? "Time's up" : a.kind === "hearts" ? "Out of hearts" : "Skipped"}</em>${ch}`;
        const t = tierOf(a.r || 0);
        return `<em class="ans"><span style="color:${t[2]}">${t[1]}</span> · ${esc(a.ans)}</em>${ch}`;
      }
      function countUp(el, from, to, ms = 800) {
        const t0 = performance.now();
        const f = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))).toLocaleString();
          if (k < 1) requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }
      function renderRoundBoard(p) {
        D.locked = true;
        D.score = p.score;
        $("duelScore").textContent = (p.score[D.myId] || 0).toLocaleString();
        const ids = Object.keys(p.score);
        const prevOrder = [...ids].sort((a, b) => (p.prev[b] || 0) - (p.prev[a] || 0) || ids.indexOf(a) - ids.indexOf(b));
        const newOrder = [...ids].sort((a, b) => (p.score[b] || 0) - (p.score[a] || 0) || prevOrder.indexOf(a) - prevOrder.indexOf(b));
        const last = p.round >= p.total;
        const rows = ids.map((id) => {
          const me = id === D.myId;
          return `<div class="lb-row ${prevOrder[0] === id ? "first" : ""}" data-id="${esc(id)}" style="--i:${prevOrder.indexOf(id)}">
            <span class="rank">${prevOrder.indexOf(id) + 1}</span>
            <span class="nm"><span class="nm-in">${nameHTML(p.names?.[id] || "Player")}${me ? " <small>(you)</small>" : ""}</span>${ansLine(p.answers[id])}</span>
            <span class="gain">+${p.answers[id]?.correct ? p.answers[id].points : 0}</span>
            <span class="pts">${(p.prev[id] || 0).toLocaleString()}</span></div>`;
        }).join("");
        const ov = $("lbOverlay");
        ov.innerHTML = `<div class="lb-inner">
          <div class="eyebrow">QUESTION ${p.round} / ${p.total}</div>
          <h2>Leaderboard</h2>
          ${roundRevealHTML(p)}
          <div class="lb" style="height:${ids.length * 72}px">${rows}</div>
          <div class="lb-foot">${last ? "Final results coming up..." : "Next question starting soon..."}</div></div>`;
        ov.classList.add("open");
        setTimeout(() => {
          ov.querySelectorAll(".lb-row").forEach((row) => {
            const id = row.dataset.id, idx = newOrder.indexOf(id);
            row.style.setProperty("--i", idx);
            row.classList.toggle("first", idx === 0);
            row.querySelector(".rank").textContent = idx + 1;
            row.querySelector(".gain").classList.add("show");
            countUp(row.querySelector(".pts"), p.prev[id] || 0, p.score[id] || 0);
          });
          if (newOrder.join() !== prevOrder.join()) sfx("advance");
        }, 1100);
      }
      function renderMatchBoard(p) {
        D.inMatch = false;
        $("lbOverlay").classList.remove("open");
        const rows = Object.keys(p.score).map((id) => ({ id, me: id === D.myId, score: p.score[id] || 0, name: p.names?.[id] || "Player" })).sort((a, b) => b.score - a.score);
        let pl = 0, prevS = null;
        rows.forEach((r, i) => { if (r.score !== prevS) pl = i + 1; r.place = pl; prevS = r.score; });
        const tie = rows.filter((r) => r.place === 1).length > 1;
        { const won = !tie && !!rows[0]?.me; localStats((x) => { x.duels++; if (won) x.wins++; }); srv("rg_duel", { won, best: D.bestRound, rare: D.bestR }); }
        const H = { 1: 200, 2: 150, 3: 110 };
        const col = (r) => `<div class="pd-col ${r.place === 1 ? "first" : ""}">
          <div class="pd-av">${r.place === 1 && !tie ? CROWN_SVG : ""}${esc((r.name || "?").trim().charAt(0).toUpperCase())}</div>
          <div class="pd-name">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</div>
          <div class="pd-score">${r.score.toLocaleString()}</div>
          <div class="pd-block" data-h="${H[r.place] || 110}">${r.place}</div></div>`;
        const order = rows.length >= 2 ? [rows[1], rows[0], rows[2]].filter(Boolean) : [rows[0]];
        const rest = rows.slice(3);
        $("podium").innerHTML = `
          <div class="pd-intro" id="pdIntro"><div class="eyebrow">THE RESULTS ARE IN</div><h2>And the winner is...</h2>
            <div class="pd-bars">${Array.from({ length: 13 }, (_, i) => `<i style="--k:${i}"></i>`).join("")}</div></div>
          <div class="pd-stage" id="pdStage">
            <h1 class="pd-title">${tie ? "It's a tie!" : nameHTML(rows[0].name) + " wins!"}</h1>
            <div class="pd-podium">${order.map(col).join("")}</div>
            ${rest.length ? `<div class="pd-rest">${rest.map((r) => `<div class="pd-rest-row"><span class="rn">${r.place}</span><span class="nm">${nameHTML(r.name)}${r.me ? " <small>(you)</small>" : ""}</span><b>${r.score.toLocaleString()}</b></div>`).join("")}</div>` : ""}
            <button class="primary" style="min-width:160px" onclick="tryHome()">Home</button></div>`;
        showView("resultView");
        buildUp(3200);
        clearTimeout(D.podTimer);
        D.podTimer = setTimeout(() => {
          if (!$("resultView").classList.contains("active")) return;
          $("pdIntro").style.display = "none";
          $("pdStage").classList.add("show");
          requestAnimationFrame(() => requestAnimationFrame(() => {
            document.querySelectorAll(".pd-block").forEach((b) => { b.style.height = b.dataset.h + "px"; });
          }));
          fanfare(); confetti(true);
        }, 3300);
      }
      async function disconnectDuel(view = "multiplayerView") {
        stopDuelScene();
        clearTimeout(D.helloTimer); clearTimeout(D.nextTimer); clearTimeout(D.podTimer);
        D.rid++;
        stopConfetti();
        $("lbOverlay").classList.remove("open");
        const ch = D.channel, cl = D.client;
        D.channel = null; D.players = []; D.hostId = ""; D.settings = null; D.inMatch = false; D.started = false; D.joining = false; D.resolved = true; D.finished = false;
        $("joinCode").disabled = false; $("joinCode").value = "";
        if (view) showView(view);
        if (ch) { try { await Promise.race([ch.unsubscribe(), delay(1500)]); } catch (e) {} try { cl?.removeChannel(ch); } catch (e) {} }
      }
      const BOARDS = {
        score: { val: (p) => Number(p.high_score), fmt: (v) => v.toLocaleString(), dir: -1 },
        matches: { label: "Matches played", val: (p) => Number(p.matches), fmt: (v) => v.toLocaleString(), dir: -1 },
        best_round: { label: "Best round", val: (p) => Number(p.best_round), fmt: (v) => v.toLocaleString(), dir: -1 },
        rarest: { label: "Rarest find", val: (p) => Number(p.rarest), fmt: (v) => v + "%", dir: -1 },
        duels: { label: "Duels played", val: (p) => Number(p.duels), fmt: (v) => v.toLocaleString(), dir: -1 },
        wins: { label: "Duels won", val: (p) => Number(p.wins), fmt: (v) => v.toLocaleString(), dir: -1 },
      };
      const STAT_KEYS = ["matches", "best_round", "rarest", "duels", "wins"];
      let PROFILES = [];
      const liveProfiles = () => PROFILES;
      function boardRows(key) {
        const b = BOARDS[key];
        const rows = liveProfiles().map((p) => ({ p, v: b.val(p) })).filter((r) => r.v !== null && Number.isFinite(r.v) && r.v > 0);
        rows.sort((a, z) => b.dir * (a.v - z.v) || String(a.p.username).localeCompare(String(z.p.username)));
        let rank = 0, prev = null;
        rows.forEach((r, i) => { if (prev === null || r.v !== prev) rank = i + 1; r.rank = rank; prev = r.v; });
        return rows;
      }
      function recomputeRanks() {
        const src = {};
        Object.keys(BOARDS).forEach((k) => boardRows(k).forEach((r) => {
          if (r.rank > 3) return;
          const n = String(r.p.username).toLowerCase();
          (src[n] = src[n] || []).push({ rank: r.rank, key: k });
        }));
        RANK_SRC = src;
      }
      let boardsT = 0;
      function boardsChanged() {
        clearTimeout(boardsT);
        boardsT = setTimeout(() => {
          recomputeRanks();
          updateUserCard(); updateScoreChip();
          if ($("lbModal").classList.contains("open")) renderLb();
          if (D.channel && $("lobbyView").classList.contains("active")) updateLobby();
        }, 60);
      }
      async function fetchProfiles() {
        try {
          const { data, error } = await sb().from("rare_stats").select("id,username,high_score,matches,answers,best_round,rarest,duels,wins").limit(5000);
          if (!error && Array.isArray(data)) { PROFILES = data; boardsChanged(); }
        } catch (e) {}
      }
      let boardSub = null;
      function subscribeBoards() {
        if (boardSub || !window.supabase) return;
        try {
          boardSub = sb().channel("rg-stats-live").on("postgres_changes", { event: "*", schema: "public", table: "rare_stats" }, (pl) => {
            if (pl.eventType === "DELETE") PROFILES = PROFILES.filter((p) => p.id !== pl.old?.id);
            else if (pl.new?.id) {
              const i = PROFILES.findIndex((p) => p.id === pl.new.id);
              if (i >= 0) PROFILES[i] = { ...PROFILES[i], ...pl.new }; else PROFILES.push(pl.new);
              if (ME && pl.new.id === ME.id && pl.new.username && pl.new.username !== ME.username) { ME.username = pl.new.username; refreshIdentity(); renderAccount(); }
            }
            boardsChanged();
          }).subscribe();
        } catch (e) {}
      }
      function updateScoreChip() {
        const el = $("soloScore");
        if (!el) return;
        const v = stats.high || 0;
        el.textContent = v.toLocaleString();
        let t = "";
        if (ME && ME.id && v > 0) {
          const r = boardRows("score").find((x) => x.p.id === ME.id);
          if (r) t = r.rank <= 10 ? "#" + r.rank : "10+";
        }
        $("soloRank").textContent = t;
      }
      const LB = { tab: "score", stat: "routes" };
      function openLb(tab) {
        closeMenu();
        if (tab === "score" || tab === "stats") LB.tab = tab;
        $("lbModal").classList.add("open");
        renderLb();
        fetchProfiles();
      }
      function closeLb() { $("lbModal").classList.remove("open"); }
      function lbRow(r, i) {
        const me = ME && r.p.id === ME.id;
        const key = LB.tab === "stats" ? LB.stat : LB.tab;
        return `<div class="lbr ${r.rank <= 3 ? "p" + r.rank : ""} ${me ? "me" : ""}" style="animation-delay:${i * 25}ms"><span class="lbr-rank">${r.rank}</span><span class="lbr-name">${nameHTML(r.p.username)}${me ? " <small>(you)</small>" : ""}</span><b>${BOARDS[key].fmt(r.v)}</b></div>`;
      }
      function renderLb() {
        const isStats = LB.tab === "stats";
        $("lbTabs").innerHTML = [["score", "Score"], ["stats", "Statistics"]].map(([k, l]) => `<button class="tab ${LB.tab === k ? "sel" : ""}" onclick="setLbTab('${k}')">${l}</button>`).join("");
        $("lbStats").hidden = !isStats;
        if (isStats) {
          $("lbTiles").innerHTML = statTiles();
          $("lbChips").innerHTML = STAT_KEYS.map((k) => `<button class="chip ${LB.stat === k ? "sel" : ""}" onclick="setLbStat('${k}')">${BOARDS[k].label}</button>`).join("");
        }
        const key = isStats ? LB.stat : LB.tab;
        const rows = boardRows(key);
        let html = rows.slice(0, 10).map(lbRow).join("");
        if (!rows.length) html = '<div class="lb-note">Nobody is on this leaderboard yet. Be the first!</div>';
        let mine = "";
        if (ME && ME.id) {
          const idx = rows.findIndex((r) => r.p.id === ME.id);
          if (idx >= 10) mine = '<div class="lb-dots">• • •</div>' + lbRow(rows[idx], 0);
          else if (idx < 0) mine = '<div class="lb-note">You\'re not on this leaderboard yet.' + (BOARDS[key].note ? " " + BOARDS[key].note : "") + "</div>";
        }
        if (isStats && BOARDS[key].note && ME && !mine.includes("not on")) mine += '<div class="lb-note" style="padding-top:8px">' + BOARDS[key].note + "</div>";
        $("lbList").innerHTML = html;
        $("lbMine").innerHTML = mine;
      }
      function setLbTab(t) { LB.tab = t; renderLb(); }
      function setLbStat(k) { LB.stat = k; renderLb(); }
      function toggleMenu(e) { e.stopPropagation(); $("menuPop").classList.toggle("open"); }
      function closeMenu() { $("menuPop").classList.remove("open"); }
      document.addEventListener("click", (e) => { if (!e.target.closest(".user-card")) closeMenu(); });
      const TOKEN_RE = /^[A-Za-z0-9]{20,128}$/;
      const api = async (name, args) => { const { data, error } = await sb().rpc(name, args); if (error) throw error; return data; };
      function apiMsg(e) {
        const m = String((e && e.message) || e || "") + " " + String((e && (e.code || e.details)) || "");
        if (/username_taken/.test(m)) return "That username is already taken.";
        if (/username_invalid/.test(m)) return "Usernames are 3–20 characters: letters (A–Z, Å, Ä, Ö), numbers and . , ! ? ' - _";
        if (/invalid_token/.test(m)) return "That data token doesn't match any account.";
        if (/could not find the function|schema cache|PGRST202|42883/i.test(m)) return "The server isn't set up yet. Run supabase-rare-setup.sql in Supabase first.";
        return "Couldn't reach the server. Check your connection and try again.";
      }
      let warnedAt = 0;
      let pendingOps = 0;
      let resyncing = false;
      let srvChain = Promise.resolve();
      function srv(name, args = {}) {
        if (!ME || !ME.token) return Promise.resolve(null);
        pendingOps++;
        const run = () => api(name, { t: ME.token, ...args }).then((st) => {
          pendingOps--;
          if (st && st.id) applyState(pendingOps > 0 ? { ...st, stats: null } : st);
          return st;
        }).catch((e) => {
          pendingOps--;
          if (Date.now() - warnedAt > 20000) { warnedAt = Date.now(); showToast("Couldn't save your progress. " + apiMsg(e)); }
          if (pendingOps === 0 && !resyncing && name !== "rg_get") { resyncing = true; srv("rg_get").finally(() => { resyncing = false; }); }
          return null;
        });
        const p = srvChain.then(run, run);
        srvChain = p.catch(() => {});
        return p;
      }
      function localStats(fn) {
        if (!ME || !ME.token) return;
        fn(stats);
        const r = PROFILES.find((p) => p.id === ME.id);
        if (r) Object.assign(r, { high_score: stats.high, matches: stats.matches, answers: stats.answers, best_round: stats.best, rarest: stats.rarest, duels: stats.duels, wins: stats.wins });
        boardsChanged();
      }
      const rowToStats = (r) => ({
        high: Number(r.high_score) || 0, matches: Number(r.matches) || 0, answers: Number(r.answers) || 0, best: Number(r.best_round) || 0,
        rarest: Number(r.rarest) || 0, duels: Number(r.duels) || 0, wins: Number(r.wins) || 0,
      });
      function applyState(st) {
        ME = { ...(ME || {}), id: st.id, username: st.username };
        if (st.token) ME.token = st.token;
        lsSet("sg_name", st.username);
        if (st.stats) {
          stats = rowToStats(st.stats);
          const row = { ...st.stats, id: st.id, username: st.username };
          const i = PROFILES.findIndex((p) => p.id === st.id);
          if (i >= 0) PROFILES[i] = row; else PROFILES.push(row);
        }
        refreshIdentity();
        renderAccount();
      }
      function refreshIdentity() {
        D.name = currentName();
        updateUserCard(); updateScoreChip();
        boardsChanged();
      }
      const wcMsg = (t) => { const m = $("wcMsg"); m.textContent = t || ""; m.className = "auth-msg" + (t ? " show" : ""); };
      function wcShow(which) { ["new", "token", "done"].forEach((k) => { $("wc_" + k).hidden = k !== which; }); wcMsg(""); }
      function maybeWelcome() { if (!lsGet(TOKEN_KEY, "")) { wcShow("new"); $("welcomeModal").classList.add("open"); } }
      async function createAccount() {
        const name = $("wcName").value.trim(), bad = checkUsername(name);
        if (bad) { wcMsg(bad); return; }
        const btn = $("wcCreate"); btn.disabled = true;
        try {
          const st = await api("rg_create", { u: name });
          lsSet(TOKEN_KEY, st.token);
          ME = { token: st.token };
          applyState(st);
          $("wcTokenOut").value = st.token;
          wcShow("done");
        } catch (e) { wcMsg(apiMsg(e)); }
        finally { btn.disabled = false; }
      }
      async function loadToken(raw) {
        const t = String(raw || "").replace(/\s/g, "");
        if (!TOKEN_RE.test(t)) throw new Error("invalid_token");
        const st = await api("rg_get", { t });
        if (!st || !st.id) throw new Error("invalid_token");
        lsSet(TOKEN_KEY, t);
        ME = { token: t };
        applyState(st);
      }
      async function wcLoad() {
        const btn = $("wcLoad"); btn.disabled = true;
        try { await loadToken($("wcToken").value); $("welcomeModal").classList.remove("open"); showToast("Welcome back, " + ME.username + "!"); }
        catch (e) { wcMsg(apiMsg(e)); }
        finally { btn.disabled = false; }
      }
      function wcDone() { $("welcomeModal").classList.remove("open"); }
      function copyText(v, inp) {
        const ok = () => showToast("Data token copied.");
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(v).then(ok).catch(() => fallbackCopy(inp, ok)); }
        else fallbackCopy(inp, ok);
      }
      function fallbackCopy(inp, ok) { try { inp.focus(); inp.select(); document.execCommand("copy") ? ok() : showToast("Select the token and copy it."); } catch (e) { showToast("Select the token and copy it."); } }
      const copyToken = () => copyText($("ac_token").value, $("ac_token"));
      const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
      const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5 9-11"/></svg>';
      const COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
      let EDIT = false;
      const authMsg = (t, good) => { const m = $("authMsg"); m.textContent = t || ""; m.className = "auth-msg" + (t ? " show" : "") + (good ? " good" : ""); };
      function setEditBtn(editing) {
        const b = $("ac_btn_username");
        b.innerHTML = editing ? CHECK : PEN;
        b.setAttribute("aria-label", editing ? "Confirm" : "Edit username");
        b.onclick = () => (editing ? commitEdit() : startEdit());
      }
      function resetField() { const i = $("ac_username"); i.readOnly = true; i.classList.remove("editing"); i.value = (ME && ME.username) || currentName(); setEditBtn(false); }
      function renderAccount() {
        if (!$("ac_username")) return;
        if (!EDIT) resetField();
        $("ac_token").value = (ME && ME.token) || "";
        $("ac_btn_copy").innerHTML = COPY;
        $("ac_btn_switch").innerHTML = CHECK;
      }
      function startEdit() { EDIT = true; authMsg(""); const i = $("ac_username"); i.readOnly = false; i.classList.add("editing"); setEditBtn(true); i.focus(); }
      function cancelEdit() { if (!EDIT) return; EDIT = false; resetField(); }
      async function commitEdit() {
        if (!EDIT) return;
        const v = $("ac_username").value.trim(), bad = checkUsername(v);
        if (bad) { authMsg(bad); return; }
        if (ME && v === ME.username) { cancelEdit(); return; }
        try {
          const st = await api("rg_set_username", { t: ME.token, u: v });
          EDIT = false; applyState(st); authMsg(""); showToast("Username updated.");
        } catch (e) { authMsg(apiMsg(e)); }
      }
      function toggleSwitch() { const b = $("tokenSwitch"); b.hidden = !b.hidden; if (!b.hidden) $("tokenIn").focus(); authMsg(""); }
      async function commitSwitch() {
        const v = $("tokenIn").value.replace(/\s/g, "");
        if (!v) { authMsg("Paste a data token first."); return; }
        if (ME && v === ME.token) { $("tokenSwitch").hidden = true; $("tokenIn").value = ""; return; }
        try { await loadToken(v); $("tokenIn").value = ""; $("tokenSwitch").hidden = true; authMsg(""); showToast("Switched to " + ME.username + "."); }
        catch (e) { authMsg(apiMsg(e)); }
      }
      async function initAccount() {
        if (!window.supabase) { showToast("Couldn't load the online library. Reload the page."); return; }
        try { subscribeBoards(); fetchProfiles(); } catch (e) {}
        const t = lsGet(TOKEN_KEY, "");
        if (!t) return;
        ME = { token: t, username: lsGet("sg_name", "") };
        try {
          const st = await api("rg_get", { t });
          if (st && st.id) applyState(st);
          else { ME = null; lsSet(TOKEN_KEY, ""); lsSet("sg_name", ""); refreshIdentity(); maybeWelcome(); showToast("That account wasn't found. Create a new one or enter another data token."); }
        } catch (e) {   }
      }
      const updateUserCard = () => { $("userName").innerHTML = nameHTML(currentName()); };
      function setRange(id, textId) {
        const r = $(id);
        r.style.setProperty("--v", r.value * 100 + "%");
        $(textId).textContent = Math.round(r.value * 100) + "%";
      }
      function openSettings() {
        closeMenu();
        $("tokenSwitch").hidden = true; authMsg("");
        $("sfxVol").value = sfxVol();
        $("autoNext").checked = lsGet("rg_autonext", "1") === "1";
        setRange("sfxVol", "sfxVolText");
        EDIT = false; renderAccount();
        $("settingsModal").classList.add("open");
      }
      function closeSettings() { cancelEdit(); $("tokenSwitch").hidden = true; $("settingsModal").classList.remove("open"); }
      async function saveSettings() {
        if (EDIT) { await commitEdit(); if (EDIT) return; }
        lsSet("sg_sfx", $("sfxVol").value);
        lsSet("rg_autonext", $("autoNext").checked ? "1" : "0");
        closeSettings();
      }
      $("autoNext").onchange = () => lsSet("rg_autonext", $("autoNext").checked ? "1" : "0");
      $("sfxVol").oninput = () => setRange("sfxVol", "sfxVolText");
      $("sfxVol").onchange = () => { lsSet("sg_sfx", $("sfxVol").value); sfx("correct"); };
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if ($("trModal").classList.contains("open")) { closeTrophies(); return; }
        if ($("lbModal").classList.contains("open")) closeLb();
        else if ($("settingsModal").classList.contains("open")) closeSettings();
        closeMenu();
      });
      document.addEventListener("keydown", (e) => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.key !== "Enter") return;
        const a = document.activeElement, tag = a ? a.tagName : "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (a && a.isContentEditable)) return;
        if (document.querySelector(".modal-back.open") || $("lbOverlay").classList.contains("open")) return;
        const p = $("gameView").classList.contains("active") ? "solo" : $("duelView").classList.contains("active") ? "duel" : null;
        if (!p) return;
        if (p === "solo" && R.solo && R.solo.locked && M) { e.preventDefault(); nextSolo(); return; }
        if (!R[p] || R[p].locked || (p === "duel" && D.locked)) return;
        e.preventDefault();
        if (tag === "BUTTON") a.blur();
        $(p + "Input").focus();
      });
      document.body.insertAdjacentHTML("beforeend", `<div class="modal-back" id="leaveModal" role="dialog" aria-modal="true" aria-labelledby="leaveT" onclick="if (event.target === this) closeLeave(false)"><div class="sheet leave"><div class="lv-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19Z"/><path d="M12 10v4.5M12 17.6v.1"/></svg></div><h2 id="leaveT">Leave this match?</h2><p>You will lose your progress for this match.</p><div class="lv-stats" id="leaveStats"></div><div class="lv-actions"><button class="primary" id="leaveStay" onclick="closeLeave(false)">Keep playing</button><button class="lv-go" onclick="closeLeave(true)">Leave match</button></div></div></div>`);
      document.querySelector(".hub-btn").addEventListener("click", (ev) => { if (matchActive()) { ev.preventDefault(); const href = ev.currentTarget.href; openLeave(() => { leaveBypass = true; location.href = href; }); } });
      $("soloStack").innerHTML = `<div class="rg-top"><button class="back" onclick="guardLeave(leaveGame)" aria-label="Back">${BACK_SVG}</button>
          <div class="rg-prog"><b id="soloRound">Question 1 / 7</b><div class="rg-dots" id="soloDots"></div></div>
          <div class="rg-chipbox"><button class="score-chip" onclick="openLb('score')" aria-label="High score. Open leaderboard" title="Your high score"><small>BEST</small><span id="soloScore">0</span><span class="rk" id="soloRank"></span></button><div class="mscore" id="soloMatchBox" title="This match"><small>NOW</small><span id="soloMatch">0</span></div></div></div>
        <div id="soloBody" class="game-body">${gameHTML("solo")}</div><div id="soloResult" style="display:none"></div><span id="soloDiff" hidden></span>`;
      $("duelStack").innerHTML = `<div class="duel-top"><button class="back" onclick="guardLeave(() => disconnectDuel())" aria-label="Back">${BACK_SVG}</button><span id="duelRound">Question 1 / 7</span><span class="duel-right"><span class="dtimer" id="duelTimer"></span><span class="score" id="duelScore">0</span></span></div>
        <div class="duel-wrap"><div id="duelBody" class="game-body">${gameHTML("duel")}</div><div id="duelWait" class="wait"><i></i>Waiting for the other players...</div></div>
        <div id="duelSceneBox" class="dscene-wrap"><div class="ds-q" id="duelSceneQ"></div><div id="duelScene"></div></div>`;
      $("tierLegend").innerHTML = TIERS.map((x, i) => `<span style="--c:${x[2]}">${tierIcon(i, 2)}${x[1]}<i></i></span>`).join("");
      renderDiff("duelDiff", duelDiffSel, pickDuelDiff);
      renderCats("duelCats", duelCatSel, (k) => { duelCatSel = k; lsSet("rg_dcat2", k); }, { sm: true, noMix: true });
      $("timerMenu").innerHTML = TIMERS.map(([v, l]) => `<button type="button" class="dd-item${v === 0 ? " sel" : ""}" data-v="${v}" onclick="pickTimer(${v})">${l}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg></button>`).join("");
      pickTimer(45);
      $("duelHeartsInput").value = HEARTS[duelDiffSel];
      recomputeRanks();
      updateUserCard();
      updateScoreChip();
      initAccount();
      document.addEventListener("keydown", (e) => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.key !== "Enter" && e.key !== " ")) return;
        const r = document.getElementById("soloResult"), b = r && r.style.display === "block" && r.querySelector(".res-next");
        if (!b || r.classList.contains("hold") || document.querySelector(".modal-back.open") || Date.now() - (window.__resAt || 0) < 450) return;
        e.preventDefault();
        b.click();
      });
      (function intro() {
  const el = document.getElementById("intro");
  setTimeout(() => el.classList.add("out"), 2800);
  setTimeout(() => el.remove(), 3300);
  maybeWelcome();
})();
