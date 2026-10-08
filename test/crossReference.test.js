const test = require('node:test');
const assert = require('node:assert/strict');
const { crossReference, prefixed } = require('../feed-organizer-auditor.user.js');

test('finds subscriptions in no feed and subreddits in several feeds', () => {
  const multis = [
    { name: 'News', subreddits: ['worldnews', 'europe'] },
    { name: 'Tech', subreddits: ['programming', 'Europe'] },
    { name: 'Misc', subreddits: ['europe', 'pics'] },
  ];
  const subscribed = ['WorldNews', 'Europe', 'linux', 'aww', 'programming'];

  assert.deepEqual(crossReference(multis, subscribed), {
    notInAnyFeed: ['aww', 'linux'],
    inMultipleFeeds: [{ name: 'europe', feeds: ['Misc', 'News', 'Tech'] }],
  });
});

test('handles no feeds and no subscriptions', () => {
  assert.deepEqual(crossReference([], []), { notInAnyFeed: [], inMultipleFeeds: [] });
  assert.deepEqual(crossReference([], ['a']), { notInAnyFeed: ['a'], inMultipleFeeds: [] });
});

test('a subreddit listed twice in one feed counts once', () => {
  const result = crossReference([{ name: 'A', subreddits: ['x', 'x'] }], []);
  assert.deepEqual(result.inMultipleFeeds, []);
});

test('user profiles are shown as u/', () => {
  assert.equal(prefixed('u_spez'), 'u/spez');
  assert.equal(prefixed('pics'), 'r/pics');
});
