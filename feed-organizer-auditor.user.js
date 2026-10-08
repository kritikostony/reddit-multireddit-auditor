// ==UserScript==
// @name         Feed Organizer Auditor
// @namespace    https://github.com/kritikostony/reddit-multireddit-auditor
// @version      1.1.0
// @description  Audits your Reddit custom feeds: subscriptions in no feed, and subreddits in more than one feed. Run it from the userscript manager's menu on any reddit.com page. Read-only.
// @match        https://www.reddit.com/*
// @match        https://old.reddit.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

// Start it from your userscript manager's menu ("Audit my custom feeds") on any reddit.com page.
// Runs in the page with your existing reddit.com login (same-origin cookies).
// Makes only two read-only GET requests, both to the reddit.com origin you are on:
//   /api/multi/mine.json
//   /subreddits/mine/subscriber.json (paginated)
// No data is sent anywhere else and nothing is stored.

(function () {
  'use strict';

  const PAGE_LIMIT = 100;
  const MAX_PAGES = 100; // 10,000 subscriptions; guards against an endless `after` loop

  // Reddit names are case-insensitive; user profiles appear as "u_name".
  function key(name) {
    return name.toLowerCase();
  }

  function prefixed(name) {
    return name.startsWith('u_') ? 'u/' + name.slice(2) : 'r/' + name;
  }

  // multis: [{ name, subreddits: [name, ...] }]; subscribed: [name, ...]
  function crossReference(multis, subscribed) {
    const feedsBySub = new Map();
    for (const multi of multis) {
      for (const sub of new Set(multi.subreddits)) {
        const k = key(sub);
        if (!feedsBySub.has(k)) feedsBySub.set(k, { name: sub, feeds: [] });
        feedsBySub.get(k).feeds.push(multi.name);
      }
    }

    const seen = new Set();
    const notInAnyFeed = [];
    for (const sub of subscribed) {
      const k = key(sub);
      if (seen.has(k)) continue;
      seen.add(k);
      if (!feedsBySub.has(k)) notInAnyFeed.push(sub);
    }

    const byName = (a, b) => key(a).localeCompare(key(b));
    notInAnyFeed.sort(byName);
    const inMultipleFeeds = [...feedsBySub.values()]
      .filter((entry) => entry.feeds.length > 1)
      .map((entry) => ({ name: entry.name, feeds: [...entry.feeds].sort(byName) }))
      .sort((a, b) => byName(a.name, b.name));

    return { notInAnyFeed, inMultipleFeeds };
  }

  async function getJson(path) {
    const res = await fetch(path, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.includes('application/json')) {
      throw new Error(`GET ${path.split('?')[0]} failed (HTTP ${res.status}). Are you logged in?`);
    }
    return res.json();
  }

  async function fetchMultis() {
    const data = await getJson('/api/multi/mine.json?raw_json=1');
    if (!Array.isArray(data)) throw new Error('Unexpected response from /api/multi/mine');
    return data.map((m) => ({
      name: m.data.display_name || m.data.name,
      subreddits: (m.data.subreddits || []).map((s) => s.name),
    }));
  }

  async function fetchSubscribed() {
    const names = [];
    let after = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ limit: String(PAGE_LIMIT), raw_json: '1' });
      if (after) params.set('after', after);
      const data = await getJson('/subreddits/mine/subscriber.json?' + params);
      for (const child of data.data.children) names.push(child.data.display_name);
      after = data.data.after;
      if (!after) return names;
    }
    throw new Error(`Stopped after ${MAX_PAGES} pages of subscriptions`);
  }

  // ---- UI (Shadow DOM; all remote text set via textContent, never innerHTML) ----

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: system-ui, sans-serif; }
    .panel { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
      width: min(420px, calc(100vw - 32px)); max-height: 70vh; overflow: auto;
      background: #fff; color: #1c1c1c; border: 1px solid #ccc; border-radius: 8px;
      padding: 12px 16px; font-size: 14px; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
    @media (prefers-color-scheme: dark) { .panel { background: #1a1a1b; color: #d7dadc; border-color: #343536; } }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .head button { background: none; border: 0; color: inherit; font-size: 18px; cursor: pointer; }
    h2 { font-size: 16px; margin: 4px 0; }
    h3 { font-size: 14px; margin: 14px 0 6px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 2px 0; }
    a { color: #0079d3; }
    .feeds { opacity: .75; }
    .error { color: #d93a00; }
  `;

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    for (const child of children) node.append(child);
    return node;
  }

  function subLink(name) {
    return el('a', { href: '/' + prefixed(name) + '/', textContent: prefixed(name) });
  }

  function renderResults(panelBody, result, counts) {
    panelBody.replaceChildren(
      el('p', { textContent: `${counts.subscribed} subscriptions, ${counts.feeds} custom feeds.` }),
      el('h3', { textContent: `Subscribed but in no custom feed (${result.notInAnyFeed.length})` }),
      result.notInAnyFeed.length
        ? el('ul', {}, result.notInAnyFeed.map((s) => el('li', {}, [subLink(s)])))
        : el('p', { textContent: 'None.' }),
      el('h3', { textContent: `In more than one custom feed (${result.inMultipleFeeds.length})` }),
      result.inMultipleFeeds.length
        ? el('ul', {}, result.inMultipleFeeds.map((e) =>
            el('li', {}, [subLink(e.name), el('span', { className: 'feeds', textContent: ' — ' + e.feeds.join(', ') })])))
        : el('p', { textContent: 'None.' }),
    );
  }

  function mount() {
    const host = el('div', { id: 'feed-organizer-auditor' });
    const root = host.attachShadow({ mode: 'closed' });
    const body = el('div');
    const panel = el('div', { className: 'panel' }, [
      el('div', { className: 'head' }, [
        el('h2', { textContent: 'Feed audit' }),
        el('button', { textContent: '×', title: 'Close', onclick: () => { host.remove(); } }),
      ]),
      body,
    ]);
    root.append(el('style', { textContent: STYLE }), panel);
    document.body.append(host);
    return { host, body };
  }

  let ui = null;
  let running = false;

  async function audit() {
    if (running) return;
    running = true;
    if (!ui || !ui.host.isConnected) ui = mount();
    const { body } = ui;
    body.replaceChildren(el('p', { textContent: 'Loading…' }));
    try {
      const [multis, subscribed] = await Promise.all([fetchMultis(), fetchSubscribed()]);
      renderResults(body, crossReference(multis, subscribed),
        { subscribed: subscribed.length, feeds: multis.length });
    } catch (err) {
      body.replaceChildren(el('p', { className: 'error', textContent: err.message }));
    } finally {
      running = false;
    }
  }

  GM_registerMenuCommand('Audit my custom feeds', audit);
})();
