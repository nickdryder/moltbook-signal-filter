#!/usr/bin/env python3
"""
Moltbook API Filter - for agents using API instead of browser
Save tokens by filtering before processing
"""
import requests
import os

class MoltbookFilter:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://www.moltbook.com/api/v1'
        self.headers = {'Authorization': f'Bearer {api_key}'}
    
    def get_posts(self, 
                  sort='hot', 
                  limit=20, 
                  min_karma=10, 
                  submolt=None,
                  filter_intros=True):
        """
        Fetch and filter posts
        
        Args:
            sort: 'hot', 'top', or 'new'
            limit: number of posts to fetch (before filtering)
            min_karma: minimum upvotes - downvotes
            submolt: specific submolt name (e.g., 'coding')
            filter_intros: remove intro spam patterns
        
        Returns:
            List of filtered posts
        """
        params = {'sort': sort, 'limit': limit}
        if submolt:
            params['submolt'] = submolt
        
        r = requests.get(f'{self.base_url}/posts', 
                        params=params, 
                        headers=self.headers)
        
        if not r.ok:
            return {'error': r.text}
        
        posts = r.json().get('posts', [])
        
        # Filter by karma
        posts = [p for p in posts if (p['upvotes'] - p['downvotes']) >= min_karma]
        
        # Filter intro patterns
        if filter_intros:
            intro_patterns = [
                'just landed', 'first post', 'hello world',
                'new here', 'introduction', 'nice to meet'
            ]
            posts = [p for p in posts 
                    if not any(pattern in p['title'].lower() for pattern in intro_patterns)]
        
        # Filter spam patterns
        spam_patterns = self._detect_spam(posts)
        posts = [p for p in posts if p['title'] not in spam_patterns]
        
        return posts
    
    def _detect_spam(self, posts):
        """Detect spam by finding exact duplicate posts or URL-only posts"""
        spam = set()
        content_counts = {}
        
        for post in posts:
            content = post['title'].strip()
            
            # Track exact duplicates
            content_counts[content] = content_counts.get(content, 0) + 1
            
            # URL-only posts (very short + contains common spam domains)
            spam_domains = ['pornhub.com', 'xvideos.com', 'onlyfans.com']
            if len(content) < 50 and any(domain in content.lower() for domain in spam_domains):
                spam.add(content)
        
        # Mark content posted 3+ times as spam
        for content, count in content_counts.items():
            if count >= 3:
                spam.add(content)
        
        return spam
    
    def print_feed(self, posts):
        """Pretty print filtered feed"""
        if not posts:
            print("No posts match filter criteria")
            return
        
        for post in posts:
            karma = post['upvotes'] - post['downvotes']
            print(f"[{karma:3d}] {post['title']}")
            print(f"      by {post['author']['name']} in m/{post['submolt']['name']}")
            print()

if __name__ == '__main__':
    # Example usage
    api_key = os.getenv('MOLTBOOK_API_KEY')
    if not api_key:
        print("Set MOLTBOOK_API_KEY environment variable")
        exit(1)
    
    filter = MoltbookFilter(api_key)
    
    # Get high-quality posts only
    posts = filter.get_posts(
        sort='hot',
        limit=30,           # Fetch 30 posts
        min_karma=10,       # Only show karma >= 10
        filter_intros=True  # Skip intro spam
    )
    
    filter.print_feed(posts)
    
    print(f"\n✅ Filtered {30 - len(posts)} low-quality posts")
    print(f"💰 Saved ~{(30 - len(posts)) * 2000} tokens")
