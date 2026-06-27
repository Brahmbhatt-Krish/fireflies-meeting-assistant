"""
Seed script — populates DB with 5 realistic meetings if empty.
Run: python -m seed.seed  OR called automatically on app startup.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models.models import Meeting, Participant, TranscriptLine, Summary, Topic, ActionItem

Base.metadata.create_all(bind=engine)

NOW = datetime.utcnow()

MEETINGS = [
    {
        "title": "Q3 Sprint 14 Planning",
        "date": NOW - timedelta(days=18),
        "duration_sec": 2700,
        "status": "processed",
        "participants": ["Alice Johnson", "Bob Chen", "Carol Williams", "David Park"],
        "transcript": [
            ("Alice Johnson", "Alright everyone, let's get started with Sprint 14 planning. We have a lot to cover today."),
            ("Bob Chen", "Thanks Alice. I've reviewed the backlog and I think we have a solid set of stories."),
            ("Carol Williams", "I'm a bit concerned about the authentication refactor. It's been sitting too long."),
            ("David Park", "From QA, the auth refactor will need at least 3 days of testing. Let's account for that."),
            ("Alice Johnson", "Good point David. Bob, what's your estimate on the auth refactor backend?"),
            ("Bob Chen", "About 5 story points for the backend changes. Carol, what about the frontend?"),
            ("Carol Williams", "Frontend is probably 3 points. The tricky part is the token refresh logic."),
            ("Alice Johnson", "So 8 points total for auth. Let's move on to the analytics dashboard feature."),
            ("Bob Chen", "The analytics feature is more complex than it looks. I'd say 13 points total."),
            ("Carol Williams", "Can we split it? Data aggregation backend separate from the charting frontend?"),
            ("Bob Chen", "Good idea. Backend aggregation is 5 points, charting frontend is 8 points."),
            ("Alice Johnson", "Let's keep them as separate stories. David, testing concerns for analytics?"),
            ("David Park", "I'll need a data generator script for testing. Can we add that to the backend story?"),
            ("Bob Chen", "Sure, I'll include the data generator in the backend analytics story."),
            ("Carol Williams", "What about the mobile responsiveness bugs from last sprint? Two are critical."),
            ("Alice Johnson", "Those critical bugs take priority — let's fix them in the first week."),
            ("Bob Chen", "I can take one critical bug. Carol, can you handle the tablet layout one?"),
            ("Carol Williams", "Yes, that one's related to my flexbox work anyway."),
            ("David Park", "I'd also like to flag the CI/CD pipeline — it's blocking my automated test runs."),
            ("Bob Chen", "I can add 3 points of pipeline work. Should fit within velocity."),
            ("Alice Johnson", "So we're at roughly 28 points. Within our average of 30. Great planning everyone."),
            ("Carol Williams", "One more thing — PR reviews are sitting too long. Can we commit to 24-hour turnaround?"),
            ("Bob Chen", "Agreed. I'll add that to the team charter."),
            ("Alice Johnson", "Consider it official. Daily standups stay at 9:30 AM. Let's wrap up — great session team."),
        ],
        "summary": "The team conducted Sprint 14 planning for Q3, estimating approximately 28 story points within their average velocity of 30. Key items included the authentication refactor (8 points split between backend and frontend), analytics dashboard feature (13 points, split into backend aggregation and frontend charting), two critical mobile responsiveness bugs prioritized for week one, and CI/CD pipeline improvements (3 points). The team agreed to a 24-hour PR review turnaround commitment and maintained their 9:30 AM standup schedule.",
        "topics": [
            ("Sprint Goals & Velocity", 0.0),
            ("Authentication Refactor", 168.75),
            ("Analytics Dashboard", 506.25),
            ("Bug Fixes & Pipeline", 1181.25),
            ("Team Process Improvements", 2362.5),
        ],
        "action_items": [
            ("Bob Chen complete backend analytics story with data generator script", "Bob Chen", True),
            ("Carol Williams fix tablet layout critical bug by end of week 1", "Carol Williams", False),
            ("Bob Chen improve CI/CD pipeline for automated test support", "Bob Chen", False),
            ("Alice Johnson update team charter with 24-hour PR review commitment", "Alice Johnson", True),
            ("David Park set up test data for analytics QA", "David Park", False),
        ],
    },
    {
        "title": "Sales Discovery Call — Innovate Corp",
        "date": NOW - timedelta(days=11),
        "duration_sec": 1800,
        "status": "processed",
        "participants": ["Emma Davis", "Frank Miller", "Grace Lee"],
        "transcript": [
            ("Emma Davis", "Hi Frank, hi Grace, thanks for joining. I'm Emma from TechBridge Solutions."),
            ("Frank Miller", "Thanks for setting this up Emma. We've heard great things about your platform."),
            ("Grace Lee", "We're excited to learn more. Our current meeting workflow is a real pain point."),
            ("Emma Davis", "Tell me more about what you're currently using for meeting management."),
            ("Frank Miller", "We use Zoom for video and then manually type notes afterward. It's incredibly time-consuming."),
            ("Grace Lee", "Our team spends 2-3 hours per week just on meeting documentation. It's a bottleneck."),
            ("Emma Davis", "How many meetings does your team have per week on average?"),
            ("Frank Miller", "About 15-20 meetings company-wide. Probably 40-50 hours of meeting time per week total."),
            ("Emma Davis", "And what happens to those notes afterwards?"),
            ("Grace Lee", "They go into a shared Google Doc folder that honestly nobody reads after creation."),
            ("Frank Miller", "We lose action items constantly. Things fall through the cracks all the time."),
            ("Emma Davis", "I completely understand. Our platform automatically captures meetings and generates structured summaries."),
            ("Frank Miller", "What video platforms do you integrate with?"),
            ("Emma Davis", "We integrate with Zoom, Google Meet, Microsoft Teams, and Webex out of the box."),
            ("Grace Lee", "We're primarily on Google Meet. What about transcription accuracy?"),
            ("Emma Davis", "Typically 95%+ accuracy in good audio conditions with automatic speaker identification."),
            ("Frank Miller", "What about pricing for a team of 50 people?"),
            ("Emma Davis", "For 50 seats on the Business tier, you'd have 8,000 minutes of storage per seat per month."),
            ("Grace Lee", "That should be more than enough. What are the next steps?"),
            ("Emma Davis", "I'd suggest a 2-week free trial using your actual meetings to see the real value."),
            ("Frank Miller", "Can we start the trial this week?"),
            ("Emma Davis", "Absolutely. I'll send setup instructions today and we can do a kickoff call Thursday."),
            ("Frank Miller", "Perfect. This has been very informative. We'll definitely move forward."),
        ],
        "summary": "Emma Davis conducted a discovery call with Frank Miller (CEO) and Grace Lee (Head of Operations) from Innovate Corp. The prospects currently manage 15-20 weekly meetings manually, spending 2-3 hours per week on documentation with notes rarely consulted afterwards. Key pain points are lost action items and time spent on manual transcription. Emma demonstrated the platform's Google Meet integration, 95%+ transcription accuracy, and Business tier pricing for 50 seats. The call ended with agreement to start a 2-week free trial, with setup instructions to be sent same day.",
        "topics": [
            ("Current Pain Points", 0.0),
            ("Meeting Volume & Workflow", 391.3),
            ("Product Demo & Integrations", 782.6),
            ("Pricing & Storage", 1304.3),
            ("Trial & Next Steps", 1565.2),
        ],
        "action_items": [
            ("Emma Davis send trial setup instructions to Frank and Grace today", "Emma Davis", True),
            ("Schedule kickoff call for Thursday with Innovate Corp", "Emma Davis", False),
            ("Prepare 50-seat Business tier pricing proposal for Innovate Corp", "Emma Davis", False),
            ("Frank Miller confirm internal stakeholders for trial evaluation", "Frank Miller", False),
        ],
    },
    {
        "title": "1:1 Check-in — James Wilson",
        "date": NOW - timedelta(days=6),
        "duration_sec": 1800,
        "status": "processed",
        "participants": ["Sarah Connor", "James Wilson"],
        "transcript": [
            ("Sarah Connor", "Hey James, thanks for making time. How are you doing this week?"),
            ("James Wilson", "Pretty good Sarah. Busy but feeling productive."),
            ("Sarah Connor", "Let's start with what you've been working on. Walk me through your last two weeks."),
            ("James Wilson", "Sure. I finished the API rate limiting feature — that was a big one, took about a week."),
            ("Sarah Connor", "I saw that merged. The code review feedback from the team was very positive."),
            ("James Wilson", "Thanks. I spent a lot of time on test coverage to make sure edge cases were handled."),
            ("Sarah Connor", "And the second week?"),
            ("James Wilson", "Working on database query optimization. We had serious N+1 query issues in the meetings endpoint."),
            ("Sarah Connor", "How much improvement did you see?"),
            ("James Wilson", "The endpoint went from 800ms average down to about 120ms. Roughly 6x faster."),
            ("Sarah Connor", "That's a significant improvement. How did you identify those queries?"),
            ("James Wilson", "I set up Django Debug Toolbar in development and profiled the endpoint. Found 47 duplicate queries."),
            ("Sarah Connor", "Great debugging approach. How are you feeling about your workload overall?"),
            ("James Wilson", "Honestly, a bit heavy. I'm context-switching too much between features and bug fixes."),
            ("Sarah Connor", "That's useful feedback. What would help?"),
            ("James Wilson", "Maybe dedicated bug-fix days, or grouping similar work together in the sprint planning."),
            ("Sarah Connor", "I'll raise that in our next planning session. What about career goals?"),
            ("James Wilson", "I'd love to lead the upcoming authentication refactor. I have ideas on how to structure it."),
            ("Sarah Connor", "That's great initiative. You'll be the tech lead for the auth refactor starting next sprint."),
            ("James Wilson", "That would be great. I'd want to run a design review before we start coding."),
            ("Sarah Connor", "Absolutely. Schedule a design review and include Bob and Carol."),
            ("James Wilson", "Will do. One more thing — I'm getting Slack messages from product outside work hours."),
            ("Sarah Connor", "I'll address that with the team. Everyone needs to respect work-life boundaries."),
            ("James Wilson", "Thanks Sarah. I really appreciate it."),
            ("Sarah Connor", "Of course. You're doing excellent work. Let's sync again in two weeks."),
        ],
        "summary": "Sarah Connor conducted a bi-weekly 1:1 with James Wilson. James reported completing the API rate limiting feature (well-received by the team) and a significant database query optimization that reduced the meetings endpoint response time from 800ms to 120ms by eliminating 47 N+1 queries. James expressed concerns about excessive context-switching and requested more focused sprint planning. A key outcome was formally assigning James as tech lead for the upcoming authentication refactor. Sarah committed to addressing out-of-hours Slack communication with the broader team.",
        "topics": [
            ("Recent Work & Accomplishments", 0.0),
            ("Database Performance Optimization", 360.0),
            ("Workload & Context Switching", 720.0),
            ("Career Growth & Auth Refactor Lead", 1080.0),
            ("Work-Life Balance Concerns", 1440.0),
        ],
        "action_items": [
            ("James Wilson schedule design review for auth refactor with Bob and Carol", "James Wilson", False),
            ("Sarah Connor raise sprint focus grouping in next planning session", "Sarah Connor", False),
            ("Sarah Connor address after-hours Slack messaging with product team", "Sarah Connor", True),
            ("James Wilson officially take over auth refactor tech lead role next sprint", "James Wilson", False),
        ],
    },
    {
        "title": "Daily Standup — Engineering",
        "date": NOW - timedelta(days=2),
        "duration_sec": 900,
        "status": "processed",
        "participants": ["Alice Johnson", "Bob Chen", "Carol Williams", "David Park", "Emma Davis"],
        "transcript": [
            ("Alice Johnson", "Good morning everyone. Let's keep it quick. I'll go first."),
            ("Alice Johnson", "Yesterday I finished reviewing the Q3 roadmap with stakeholders and synced with design. Today focusing on sprint planning prep. No blockers."),
            ("Bob Chen", "Yesterday I fixed the auth token refresh bug and opened a PR. Today continuing with analytics backend. Blocked on schema review from David."),
            ("David Park", "I'll review that schema PR right after standup Bob. Yesterday I wrote automated tests for the payment flow, hit 85% coverage. Today starting analytics test suite. No blockers."),
            ("Carol Williams", "Morning. Yesterday completed the mobile responsiveness fix for main dashboard — PR is up. Today starting on the tablet layout bug. No blockers."),
            ("Emma Davis", "Hi team. Yesterday had discovery calls with three enterprise prospects, went really well. Today sending follow-up proposals to two of them. No blockers."),
            ("Alice Johnson", "Great updates. Bob, schema review will happen before noon. Quick announcement — leadership approved the Q3 performance initiative."),
            ("Bob Chen", "Great news. Will that affect our current sprint scope?"),
            ("Alice Johnson", "Shouldn't affect this sprint. We'll discuss in planning on Friday."),
            ("David Park", "Heads up — staging environment was down briefly this morning. IT is working on it."),
            ("Carol Williams", "That explains my failed tests earlier. Thanks David."),
            ("Alice Johnson", "IT expects resolution by mid-morning. Alright team, productive day everyone. See you tomorrow."),
        ],
        "summary": "Quick daily standup covering all team members. Bob Chen is blocked on a schema review needed from David Park, who committed to reviewing immediately after the call. Carol Williams completed the mobile responsiveness fix. Emma Davis reported successful discovery calls with three enterprise prospects. Alice Johnson announced the Q3 performance initiative received leadership approval. A staging environment outage was flagged by David Park with IT resolution expected by mid-morning.",
        "topics": [
            ("Team Updates", 0.0),
            ("Blockers & Dependencies", 337.5),
            ("Announcements", 562.5),
            ("Infrastructure Issues", 750.0),
        ],
        "action_items": [
            ("David Park review Bob's schema PR before noon", "David Park", True),
            ("Alice Johnson discuss Q3 performance initiative scope in Friday planning", "Alice Johnson", False),
        ],
    },
    {
        "title": "Client Kickoff — TechBridge x Innovate Corp",
        "date": NOW - timedelta(days=1),
        "duration_sec": 3600,
        "status": "processed",
        "participants": ["Emma Davis", "Sarah Connor", "Michael Brown", "Lisa Chen"],
        "transcript": [
            ("Emma Davis", "Welcome everyone to the project kickoff. I'm Emma Davis, your account manager at TechBridge Solutions."),
            ("Sarah Connor", "And I'm Sarah Connor, technical lead overseeing the implementation. Great to meet you both."),
            ("Michael Brown", "I'm Michael Brown, CEO of Innovate Corp. This partnership is very important to us strategically."),
            ("Lisa Chen", "Lisa Chen, CTO. I'll be your primary technical contact on our side."),
            ("Emma Davis", "Perfect. Let's start with the project overview. The goal is integrating our analytics platform with Innovate Corp's infrastructure by end of Q3."),
            ("Michael Brown", "That Q3 timeline is critical — we have a board presentation in October to demonstrate this integration."),
            ("Sarah Connor", "Understood. Lisa, can you walk us through your current tech stack?"),
            ("Lisa Chen", "Sure. We're on AWS, React frontend, Node.js backends, PostgreSQL databases. We also have some legacy Java services that are still critical."),
            ("Sarah Connor", "Good to know about the Java services — that will need a specific adapter layer. I'll flag it for architecture review."),
            ("Emma Davis", "Let's talk timeline. We're proposing 12 weeks in three phases: weeks 1-4 discovery and architecture, weeks 5-8 core development, weeks 9-12 testing and deployment."),
            ("Michael Brown", "What milestones should we expect to see along the way?"),
            ("Sarah Connor", "At week 4 you'll have a technical design document and working proof of concept. At week 8, a functional beta environment."),
            ("Lisa Chen", "Who should be involved in the week 4 review from our side?"),
            ("Sarah Connor", "Engineering team plus business stakeholders. Roughly 5-6 people from Innovate Corp."),
            ("Michael Brown", "Lisa, put together a review committee. Include Maria and the data analytics team."),
            ("Lisa Chen", "Will do. Should we include the data science team as well?"),
            ("Michael Brown", "Yes, they'll be primary users so definitely include them."),
            ("Emma Davis", "For communication, I'm proposing weekly status calls every Tuesday at 2 PM."),
            ("Lisa Chen", "Tuesdays work for us. Should those be 30 minutes or an hour?"),
            ("Sarah Connor", "Let's start with 30 minutes and expand if needed."),
            ("Emma Davis", "Perfect. We'll also create a shared Slack channel for day-to-day communication."),
            ("Michael Brown", "We're already on Slack so that's seamless."),
            ("Lisa Chen", "What's the escalation path if we hit technical blockers?"),
            ("Sarah Connor", "Technical issues come to me directly. Commercial or timeline concerns go to Emma."),
            ("Emma Davis", "And above us, I can connect you to our VP of Customer Success within 24 hours if needed."),
            ("Michael Brown", "Excellent. I'm feeling very confident about this partnership. Looking forward to working together."),
            ("Sarah Connor", "Likewise. I'll send the technical questionnaire today to kick off discovery immediately."),
            ("Emma Davis", "And I'll follow up with contract paperwork by end of day. Thank you all for your time."),
        ],
        "summary": "Project kickoff meeting between TechBridge Solutions (Emma Davis - Account Manager, Sarah Connor - Technical Lead) and Innovate Corp (Michael Brown - CEO, Lisa Chen - CTO). The project goal is integrating TechBridge's analytics platform with Innovate Corp's AWS-based infrastructure (React, Node.js, PostgreSQL, legacy Java services) by end of Q3. A 12-week phased timeline was established: weeks 1-4 discovery and architecture, weeks 5-8 core development, weeks 9-12 testing and deployment. Weekly Tuesday 2 PM status calls were agreed upon, along with a shared Slack channel. Escalation paths were defined clearly. The legacy Java services were identified as requiring a special adapter layer.",
        "topics": [
            ("Introductions & Project Overview", 0.0),
            ("Tech Stack & Architecture Discussion", 750.0),
            ("12-Week Timeline & Milestones", 1200.0),
            ("Review Committee & Stakeholders", 1875.0),
            ("Communication Plan & Escalation", 2625.0),
            ("Next Steps & Contract", 3300.0),
        ],
        "action_items": [
            ("Sarah Connor send technical questionnaire to Lisa Chen today", "Sarah Connor", True),
            ("Emma Davis send contract paperwork to Innovate Corp by end of day", "Emma Davis", True),
            ("Lisa Chen assemble week-4 review committee including data analytics and science teams", "Lisa Chen", False),
            ("Emma Davis create shared Slack channel and invite all participants", "Emma Davis", True),
            ("Sarah Connor schedule architecture review for Java adapter layer", "Sarah Connor", False),
            ("Michael Brown confirm board presentation date for Q3 milestone planning", "Michael Brown", False),
        ],
    },
]


def seed_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Meeting).count()
        if count > 0:
            print(f"DB already has {count} meetings — skipping seed.")
            return
        print("Seeding database with 5 sample meetings...")
        _do_seed(db)
        print("Seed complete.")
    finally:
        db.close()


def _do_seed(db):
    for m in MEETINGS:
        meeting = Meeting(
            title=m["title"],
            date=m["date"],
            duration_sec=m["duration_sec"],
            status=m["status"],
        )
        db.add(meeting)
        db.flush()

        for name in m["participants"]:
            db.add(Participant(meeting_id=meeting.id, name=name))

        step = m["duration_sec"] / len(m["transcript"])
        for i, (speaker, text) in enumerate(m["transcript"]):
            start = round(i * step, 2)
            end = round((i + 1) * step, 2)
            db.add(TranscriptLine(
                meeting_id=meeting.id, speaker=speaker, text=text,
                start_sec=start, end_sec=end, order_index=i,
            ))

        db.add(Summary(
            meeting_id=meeting.id,
            overview_text=m["summary"],
            generated_at=m["date"],
        ))

        for i, (title, start_sec) in enumerate(m["topics"]):
            db.add(Topic(meeting_id=meeting.id, title=title, start_sec=start_sec, order_index=i))

        for text, assignee, completed in m["action_items"]:
            db.add(ActionItem(
                meeting_id=meeting.id, text=text,
                assignee=assignee, completed=completed,
            ))

    db.commit()


if __name__ == "__main__":
    seed_if_empty()
