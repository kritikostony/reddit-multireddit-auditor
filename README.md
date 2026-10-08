# reddit-multireddit-auditor

Audits your Reddit custom feeds (multireddits):

- Lists subreddits you are subscribed to but haven't added to any custom feed
- Lists subreddits that appear in more than one custom feed

A browser userscript. It adds an **Audit my custom feeds** command to your userscript manager's menu on reddit.com. Running it shows both lists for whoever is logged in.

## Install

1. Install a userscript manager. Tested target: [Violentmonkey](https://violentmonkey.github.io/) (FOSS, MIT).
2. Open [`feed-organizer-auditor.user.js`](feed-organizer-auditor.user.js) via its **Raw** link on GitHub; the manager will offer to install it.
3. Log in to reddit.com (www.reddit.com or old.reddit.com) and open any page.
4. Click the Violentmonkey toolbar icon, then **Audit my custom feeds**. Results appear in a panel at the bottom right; close it with **×**.

## Privacy

- Runs in your browser, using your existing reddit.com login. No OAuth app, no server, no third-party requests.
- Read-only. Makes only these GET requests to the reddit.com origin you are on:
  - `/api/multi/mine.json`
  - `/subreddits/mine/subscriber.json` (100 per page, until done)
- Stores nothing. Results are discarded when you close or leave the page.

## Why not a Devvit app?

Devvit (as of `@devvit/reddit` 0.14.7) has no multireddit API, runs the subscription listing as the app account rather than the user, and only allows user-scoped submit post, submit comment, and subscribe actions.

## Support

If this is useful to you, you can buy me a coffee on [Ko-fi](https://ko-fi.com/antoniskritikos).
