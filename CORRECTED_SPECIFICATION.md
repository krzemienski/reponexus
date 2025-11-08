# Repo Nexus - CORRECTED Specification

**Application Type:** Topic-Centric GitHub Discovery Tool
**Focus:** Help users discover repositories within topics based on their interests

---

## Core Concept

Users discover GitHub repositories through **topics**, not general browsing. The app:
1. Analyzes their starred repos to suggest relevant topics
2. Shows repos within topics they follow
3. Provides trending/sorting within each topic
4. Suggests new topics based on patterns in their stars

---

## User Flow

### 1. First Launch
```
Sign in with GitHub OAuth
↓
App syncs starred repositories
↓
Analyzes topics from starred repos
↓
Suggests topics to follow
↓
User selects topics
↓
Home screen shows followed topics
```

### 2. Daily Usage
```
Open app → Topics screen (Home)
↓
Browse followed topics
↓
Click topic → See repos (sorted by stars/recency/trending)
↓
Click repo → View details + code
↓
Star/Unstar repos
```

### 3. Discovery
```
Explore Tab
↓
Shows trending repos from YOUR followed topics
↓
Suggests new topics based on starred repo patterns
↓
Example: "You star lots of AI repos but don't follow 'machine-learning' topic"
```

---

## Screen Specifications

### Screen 1: Topics (HOME)
**Purpose:** Main screen showing followed topics

**Layout:**
- Header: "My Topics" + Sync button
- Grid/List of topic cards
- Each card shows:
  - Topic name
  - Icon/avatar
  - Repo count in this topic
  - Last updated time
  - Unfollow button

**Actions:**
- Click topic → Topic Detail screen
- Pull to refresh
- Search topics
- Sync GitHub (re-analyze starred repos)

---

### Screen 2: Topic Detail
**Purpose:** Show all repos within a topic

**Header:**
- Topic name
- Follow/Unfollow button
- Repo count
- Search within topic

**Sorting Options:**
- Most starred (default)
- Recently updated
- Trending (custom algorithm)
- Most forks
- Most issues

**Content:**
- List of repositories in this topic
- Each repo card shows:
  - Name, description
  - Stars, forks, language
  - Last updated
  - Star/Unstar button
  - Topics (chips)

**Footer:**
- Related topics (horizontal scroll)

---

### Screen 3: Explore
**Purpose:** Discover trending repos from followed topics + topic suggestions

**Two Sections:**

**A. Trending Repos (from your topics)**
- Shows "hot" repos from topics you follow
- Custom trending algorithm
- Sorted by trend score
- Filter by time: Today, This Week, This Month

**B. Suggested Topics**
- Topics you don't follow
- Based on your starred repo analysis
- Shows:
  - Topic name
  - "X of your starred repos have this topic"
  - Preview: 3 example repos
  - Follow button

---

### Screen 4: Repository Detail
**Purpose:** Full repository view with code browsing

**Tabs:**
1. **Overview**
   - README (markdown)
   - Stats (stars, forks, issues, watchers)
   - Language breakdown
   - Contributors (top 5)
   - Topics (chips)
   - License

2. **Code**
   - File tree browser
   - Click file → View code
   - Syntax highlighting
   - Download/Share file

3. **Activity**
   - Recent commits (last 10)
   - Recent issues (last 10)
   - Recent PRs (last 10)

**Header:**
- Repository name
- Owner avatar + name
- Star/Unstar button (prominent)
- Share button
- Open in GitHub button

---

### Screen 5: Profile
**Purpose:** User settings and data

**Sections:**
1. **User Info**
   - Avatar, name, username
   - Bio
   - Stats: Starred repos, Following, Followers

2. **Starred Repositories**
   - List of all starred repos
   - Same as repository cards elsewhere
   - Search starred repos

3. **Sync Settings**
   - Last sync time
   - Auto-sync toggle
   - Manual sync button
   - Sync frequency (daily/weekly)

4. **App Settings**
   - Theme (light/dark/auto)
   - Notifications
   - Sign out

---

## Backend Requirements

### Algorithms

#### 1. Topic Suggestion Algorithm
```python
def suggest_topics(user_id):
    # Get user's starred repos
    starred_repos = get_user_starred_repos(user_id)

    # Extract all topics from starred repos
    topic_counts = {}
    for repo in starred_repos:
        for topic in repo.topics:
            if topic not in user.followed_topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

    # Rank by frequency
    ranked = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)

    # Return top 10 with example repos
    suggestions = []
    for topic, count in ranked[:10]:
        example_repos = [r for r in starred_repos if topic in r.topics][:3]
        suggestions.append({
            "topic": topic,
            "starred_count": count,
            "example_repos": example_repos
        })

    return suggestions
```

#### 2. Trending Algorithm (Within Topic)
```python
def calculate_trending_score(repo, days=7):
    # Activity in last N days
    recent_stars = repo.stars_gained_last_n_days(days)
    recent_commits = repo.commits_last_n_days(days)
    recent_issues_closed = repo.issues_closed_last_n_days(days)
    recent_prs_merged = repo.prs_merged_last_n_days(days)

    # Weighted score
    score = (
        recent_stars * 3.0 +
        recent_commits * 1.5 +
        recent_prs_merged * 2.0 +
        recent_issues_closed * 1.0
    )

    # Normalize by repo age (newer repos get slight boost)
    age_in_days = (datetime.now() - repo.created_at).days
    age_factor = 1.0 if age_in_days > 365 else 1.0 + (365 - age_in_days) / 365 * 0.2

    return score * age_factor

def get_trending_repos_in_topic(topic_name, user_id, days=7, limit=20):
    # Get repos in this topic that user follows
    repos = get_repos_in_topic(topic_name)

    # Calculate trending score for each
    scored = [(repo, calculate_trending_score(repo, days)) for repo in repos]

    # Sort by score
    sorted_repos = sorted(scored, key=lambda x: x[1], reverse=True)

    return [repo for repo, score in sorted_repos[:limit]]
```

---

## API Endpoints

### Topics
- `GET /api/v1/topics/followed` - User's followed topics
- `GET /api/v1/topics/suggested` - Suggested topics based on stars
- `POST /api/v1/topics/follow` - Follow a topic
- `DELETE /api/v1/topics/unfollow` - Unfollow a topic
- `GET /api/v1/topics/{name}/repositories` - Repos in topic (with sort param)

### Repositories
- `GET /api/v1/repositories/trending` - Trending from followed topics
- `GET /api/v1/repositories/{owner}/{repo}` - Repo details
- `GET /api/v1/repositories/{owner}/{repo}/files` - File tree
- `GET /api/v1/repositories/{owner}/{repo}/file/{path}` - File content
- `POST /api/v1/repositories/star` - Star repo
- `DELETE /api/v1/repositories/unstar` - Unstar repo

### User
- `GET /api/v1/users/me` - User profile
- `GET /api/v1/users/me/starred` - User's starred repos
- `POST /api/v1/users/me/sync` - Trigger GitHub sync
- `GET /api/v1/users/me/sync-status` - Check sync progress

### Search
- `GET /api/v1/search/within-topic` - Search repos within a topic

---

## Database Changes Needed

### New Models
```python
class UserStarredRepo(Base):
    """Tracks user's starred repositories from GitHub"""
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey('users.id'))
    repository_id = Column(UUID, ForeignKey('repositories.id'))
    starred_at = Column(DateTime)
    synced_at = Column(DateTime)

class TopicSuggestion(Base):
    """Generated topic suggestions for user"""
    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey('users.id'))
    topic_id = Column(UUID, ForeignKey('topics.id'))
    score = Column(Integer)  # How many starred repos have this topic
    suggested_at = Column(DateTime)
    dismissed = Column(Boolean, default=False)

class RepositoryTrendingScore(Base):
    """Cached trending scores"""
    id = Column(UUID, primary_key=True)
    repository_id = Column(UUID, ForeignKey('repositories.id'))
    topic_id = Column(UUID, ForeignKey('topics.id'))
    score = Column(Float)
    calculated_at = Column(DateTime)
    period = Column(String)  # 'daily', 'weekly', 'monthly'
```

---

## Celery Tasks

### Background Jobs
```python
# Daily sync of user starred repos
@celery.task
def sync_user_starred_repos(user_id):
    """Fetch all starred repos from GitHub, update DB"""

# Daily calculation of trending scores
@celery.task
def calculate_trending_scores():
    """Calculate trending scores for all repos in followed topics"""

# Daily generation of topic suggestions
@celery.task
def generate_topic_suggestions(user_id):
    """Analyze starred repos and suggest topics"""
```

---

## Changes to Current Implementation

### Remove:
- ❌ Trending tab (as global feature)
- ❌ Explore screen as general repository browser

### Refactor:
- 🔄 Rename "Topics" tab to be the HOME tab
- 🔄 Change "Explore" to show trending from followed topics
- 🔄 Remove mock global trending data

### Add:
- ✅ Topic suggestion algorithm
- ✅ GitHub starred repo sync
- ✅ Trending algorithm within topics
- ✅ Code file browser
- ✅ Sort options in topic detail
- ✅ Search within topic

---

## Priority Implementation Order

### Phase 1: Core Refactor (Week 1)
1. Update navigation (Topics as home)
2. Add GitHub starred repos sync
3. Implement topic suggestion algorithm
4. Update Explore screen (trending from followed topics)

### Phase 2: Topic Features (Week 1-2)
1. Add sorting to topic repos (stars, recency, trending)
2. Implement trending algorithm
3. Add search within topic
4. Add related topics

### Phase 3: Repository Enhancement (Week 2)
1. Add code file browser
2. Add syntax highlighting
3. Add file tree navigation
4. Enhance repository detail screen

### Phase 4: Polish (Week 3)
1. Optimize performance
2. Add caching
3. Improve UI/UX
4. Add analytics

---

## Success Metrics

### User Engagement
- Topics followed per user: Target 5-10
- Repos starred per session: Target 2-5
- Daily active usage: Target 60%+
- Topic suggestion acceptance: Target 40%+

### Technical
- Sync speed: < 30 seconds for 1000 starred repos
- Trending calculation: < 5 seconds per topic
- Repository load time: < 2 seconds

---

**This is the CORRECT specification based on user requirements.**
