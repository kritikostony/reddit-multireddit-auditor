import praw
from collections import defaultdict

USERNAME = "your_username"
PASSWORD = "your_password"
CLIENT_ID = "your_client_id"
CLIENT_SECRET = "your_client_secret"

reddit = praw.Reddit(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    username=USERNAME,
    password=PASSWORD,
    user_agent=f"script:reddit-multireddit-auditor:v1.0 (by /u/{USERNAME})",
)

def get_multireddit_map():
    sub_to_feeds = defaultdict(list)
    for multi in reddit.user.multireddits():
        for sub in multi.subreddits:
            sub_to_feeds[sub.display_name].append(multi.display_name)
    return sub_to_feeds

def get_subscribed():
    return {sub.display_name for sub in reddit.user.subreddits(limit=None)}

def main():
    print("Fetching data...")
    sub_to_feeds = get_multireddit_map()
    subscribed = get_subscribed()

    print("\n=== Subscribed but in NO custom feed ===")
    for sub in sorted(subscribed):
        if sub not in sub_to_feeds:
            print(f"  r/{sub}")

    print("\n=== In MORE THAN ONE custom feed ===")
    for sub, feeds in sorted(sub_to_feeds.items()):
        if len(feeds) > 1:
            print(f"  r/{sub}: {', '.join(feeds)}")

if __name__ == "__main__":
    main()