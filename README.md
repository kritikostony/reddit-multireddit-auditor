# reddit-multireddit-auditor

A personal account management script that audits your Reddit custom feeds (multireddits).

## What it does

- Lists subreddits you are subscribed to but haven't added to any custom feed
- Lists subreddits that appear in more than one custom feed

## Requirements

- Python 3.x
- praw (`pip install praw`)
- A Reddit script-type OAuth app (client ID + secret)

## Usage

1. Fill in your credentials in the script
2. Run: `python reddit_auditor.py`

## API usage

Read-only. Uses:
- `GET /api/multi/mine`
- `GET /subreddits/mine/subscriber`

No data is written to Reddit. Respects Reddit's rate limits.
