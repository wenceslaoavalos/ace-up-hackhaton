"""
Seed data and startup seeding logic for Maya Fernandez's coaching journey.

21 events interleaved (individual coaching, team sessions, ally chats)
progressing from June 1, 2025 through March 1, 2026.
"""

import logging
import os
from datetime import date, timedelta

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Raw event data
# ---------------------------------------------------------------------------

TRANSCRIPTS: list[str] = [
    """Coach: What feels most important to work on today?
Maya Fernandez: I am overwhelmed by meetings and I keep losing time for strategic work.
Coach: What is happening in practice?
Maya Fernandez: My calendar fills with status checks, ad hoc problem solving, and Slack escalations. By the end of the day I have done a lot, but not the highest-value work.
Coach: What is the cost?
Maya Fernandez: I stay reactive, my team waits on me for prioritization, and I am not planning ahead well.
Coach: What would better look like?
Maya Fernandez: I want to prioritize more clearly, protect focus blocks, and help my team understand what matters most without me constantly rescuing them.
Coach: Where do you get pulled off track?
Maya Fernandez: I jump in because it feels faster to solve things myself.
Coach: That sounds like the subject matter expert pattern.
Maya Fernandez: Exactly. I know the answers, so I become the bottleneck.
Coach: What shift do you want to make?
Maya Fernandez: Spend less time on tasks, more on strategy, and delegate more effectively.
Coach: What would that look like this week?
Maya Fernandez: I will audit my calendar, cancel two low-value meetings, block time for planning, and ask my leads to bring recommendations instead of just problems.
Coach: How will you recharge?
Maya Fernandez: I will protect a lunch break, stop working late twice this week, and take a short reset between meetings.
Coach: What belief makes this hard?
Maya Fernandez: That if I am not constantly available, I am failing the team.
Coach: What if availability is not the same as leadership?
Maya Fernandez: Then leadership would mean creating clarity, not being on call for everything.
Coach: What is one sentence you want to remember?
Maya Fernandez: My job is to direct energy toward the most important targets, not personally touch every task.
Coach: Good. What is your first step after this session?
Maya Fernandez: Rebuild next week around priorities, focus time, and delegation points.""",
    """Coach: What challenge is on your mind?
Maya Fernandez: I need stronger leadership presence. In senior meetings I know my point, but I hedge when the room gets tense.
Coach: What does that look like?
Maya Fernandez: I soften my language, overexplain, and lose the room. Then later I think of the clear version I should have said.
Coach: When does it happen most?
Maya Fernandez: During uncertainty, especially when there is pressure to move fast.
Coach: What do you want instead?
Maya Fernandez: I want to lead assertively, adapt to the room, and address stakeholder concerns without sounding defensive.
Coach: What does your audience need from you?
Maya Fernandez: Confidence, clarity, and a reason to believe the recommendation serves the business.
Coach: How can storytelling help?
Maya Fernandez: If I anchor the message in a concrete customer example, people pay attention and the tradeoffs feel real.
Coach: Give me an example.
Maya Fernandez: Instead of saying adoption risk is rising, I can tell the story of one rollout where confusion created rework and damaged trust.
Coach: What makes that effective?
Maya Fernandez: It motivates action and persuades without overwhelming people with abstract detail.
Coach: What will you practice?
Maya Fernandez: A tighter opening: the recommendation, the why, the concern I know they have, and the decision needed.
Coach: How will you handle pushback?
Maya Fernandez: Pause, answer the underlying concern, and avoid talking faster just because the room gets sharper.
Coach: What is the growth edge here?
Maya Fernandez: Trusting that I do not need to sound like the loudest person to be credible.
Coach: What is your commitment?
Maya Fernandez: Before my next leadership meeting, I will prepare one story, one key ask, and one direct response to the biggest objection.""",
    """Coach: What kind of conversation do you need help with?
Maya Fernandez: I need to influence stakeholders around a change that people are resisting.
Coach: What change?
Maya Fernandez: We are shifting how work gets prioritized across teams, and people hear loss of control instead of better alignment.
Coach: What is your concern?
Maya Fernandez: I keep explaining the process, but not the shared why. So the message lands as administrative rather than meaningful.
Coach: What do stakeholders care about?
Maya Fernandez: Speed, clarity, and whether their team will still have a voice.
Coach: How have you engaged them so far?
Maya Fernandez: Mostly in the main meeting, which is too late. I need more communication before and after.
Coach: What would better stakeholder engagement look like?
Maya Fernandez: I would talk with key partners before the meeting, surface concerns early, then follow up after with decisions and open questions.
Coach: How does that support change management?
Maya Fernandez: It increases transparency, encourages people to share concerns, and makes the rollout feel collaborative instead of imposed.
Coach: Where do you get stuck?
Maya Fernandez: I want buy-in quickly, so I rush past the emotional side.
Coach: What does the emotional side require?
Maya Fernandez: Naming uncertainty, listening for what people fear losing, and showing how this connects to organizational goals.
Coach: What is your next move?
Maya Fernandez: I will meet with three key stakeholders before the rollout, ask what concerns they want addressed, and use their language in the presentation.
Coach: And after the meeting?
Maya Fernandez: I will send a recap with decisions, rationale, next steps, and a place for continued feedback.""",
    """Coach: What is the hardest people challenge right now?
Maya Fernandez: Two team members are in conflict, and I have been avoiding a direct conversation because I do not want to escalate it.
Coach: What is happening between them?
Maya Fernandez: One feels steamrolled in meetings, the other thinks disagreement is being interpreted as disrespect. The tension is spreading to the rest of the team.
Coach: What has been your pattern?
Maya Fernandez: I try to smooth it over instead of helping them work through the disagreement constructively.
Coach: What does effective leadership require here?
Maya Fernandez: Getting myself in the right state first, then creating a conversation where both can be heard without drifting into blame.
Coach: What state do you need to be in?
Maya Fernandez: Calm, curious, and clear about the purpose.
Coach: What would you say to open?
Maya Fernandez: We are here to understand the impact on the team, hear the disagreement fully, and work toward a better way of collaborating.
Coach: What do you need to listen for?
Maya Fernandez: Emotional cues, assumptions, and what each person is trying to protect.
Coach: What if they disagree sharply?
Maya Fernandez: I want to slow them down and help them express disagreement with the goal of deeper understanding, not winning.
Coach: What role does inclusion play?
Maya Fernandez: A big one. If only the most forceful voice gets heard, the team stops bringing real issues forward.
Coach: What is your commitment?
Maya Fernandez: I will hold the conversation this week, name the team impact, and set expectations for how disagreement should work going forward.""",
    """Coach: What are you noticing about your stress lately?
Maya Fernandez: I have been carrying pressure in my body all day and then reacting too quickly when something goes wrong.
Coach: What triggers it?
Maya Fernandez: Last-minute changes, ambiguous requests, and the feeling that I have to get everything perfect.
Coach: How does that show up?
Maya Fernandez: I tense up, rush, and become less patient. I can hear it in my tone.
Coach: What do you want instead?
Maya Fernandez: Better resilience. I want to regain balance faster and respond with clear thinking under pressure.
Coach: What belief is feeding the stress?
Maya Fernandez: If I make a visible mistake, people will stop trusting me.
Coach: Is that fully true?
Maya Fernandez: No. It is a limiting belief, but it still drives me.
Coach: How can you interrupt the trigger?
Maya Fernandez: Pause, label what is happening, breathe, and decide what actually matters before I reply.
Coach: What would help you regulate in the moment?
Maya Fernandez: A short reset between meetings and a reminder that urgency is not the same as importance.
Coach: How can you help others with stress too?
Maya Fernandez: By modeling steadiness, clarifying priorities, and not passing my anxiety down the chain.
Coach: What experiment will you run?
Maya Fernandez: When I feel activated, I will wait two minutes before responding, rewrite my first draft if needed, and ask what outcome matters most.
Coach: How will you measure progress?
Maya Fernandez: Fewer reactive messages, better sleep, and a sense that I stayed aligned with my values even on hard days.""",
    """Coach: What leadership shift are you trying to make?
Maya Fernandez: I need to move from being the person with answers to being the leader who develops others.
Coach: Where is that most visible?
Maya Fernandez: In one-on-ones. People bring me problems and I solve them too quickly.
Coach: What is the downside?
Maya Fernandez: They leave with my solution, not their own thinking. I get overloaded, and they do not grow as fast.
Coach: What do you want instead?
Maya Fernandez: A coaching approach. More questions, more ownership, and clearer expectations.
Coach: What questions could you ask?
Maya Fernandez: What options do you see, what tradeoffs matter, what have you already tried, and what support do you need from me?
Coach: How does that relate to delegation?
Maya Fernandez: If I delegate outcomes instead of just tasks, people can step up and I stop doing everything myself.
Coach: What makes that hard?
Maya Fernandez: I worry they will not do it the way I would.
Coach: Is exact replication the goal?
Maya Fernandez: No. The goal is capable leaders on the team, not clones of me.
Coach: How can feedback support that?
Maya Fernandez: I need to give more frequent, growth-focused feedback and be clearer about roles and decision rights.
Coach: What will you practice this week?
Maya Fernandez: In my next three one-on-ones, I will resist solving immediately, ask coaching questions first, and delegate one meaningful decision to each person.""",
    """Coach: What are you trying to improve with your team as a whole?
Maya Fernandez: I want the team to collaborate better across functions and feel more connected to the larger organization.
Coach: What is getting in the way?
Maya Fernandez: People are working hard, but they are optimizing for their own lane. There is not enough line of sight to shared goals.
Coach: What does that create?
Maya Fernandez: Duplication, defensiveness, and less willingness to ask peers for input.
Coach: What would success look like?
Maya Fernandez: More cross-functional collaboration, clearer understanding of how each role contributes, and less competition between peers.
Coach: How can you lead that?
Maya Fernandez: By actively seeking input earlier, connecting work to company priorities, and recognizing collaboration publicly.
Coach: What about inclusion?
Maya Fernandez: I also want more voices heard. A few people dominate while others hold back valuable perspectives.
Coach: How will you change that dynamic?
Maya Fernandez: I will structure meetings so quieter voices speak first sometimes, and I will hold people accountable when behavior shuts others down.
Coach: What is the leadership message underneath this?
Maya Fernandez: Diverse perspectives make the work better, but only if I create conditions where people can use them.
Coach: What is your next action?
Maya Fernandez: I will redesign our weekly team meeting around shared goals, cross-functional blockers, and explicit input from everyone in the room.""",
    """Coach: What conversation are you preparing for?
Maya Fernandez: I need to lead my team through a disappointing outcome without slipping into blame or perfectionism.
Coach: What happened?
Maya Fernandez: We missed a major target. My first instinct was frustration, but I know this is a chance to shape the culture.
Coach: What culture do you want to build?
Maya Fernandez: One with a growth mindset. I want people focused on progress, learning, and appropriate risk-taking, not fear of failure.
Coach: What makes that difficult?
Maya Fernandez: I still have my own perfectionist streak. When results are poor, I want to tighten control.
Coach: What would a better response sound like?
Maya Fernandez: We missed the mark, we need accountability, and we are going to treat this as a learning opportunity instead of a reason to shut down experimentation.
Coach: How do you avoid making that sound soft?
Maya Fernandez: By being direct about what failed, what we learned, and what changes next.
Coach: How can you involve the team?
Maya Fernandez: Ask them what signals we missed, what they would test differently, and what support they need to improve.
Coach: What does that shift in you?
Maya Fernandez: From transmitting knowledge to fostering curiosity.
Coach: What does success look like after the meeting?
Maya Fernandez: The team feels honest about the setback, clear on next steps, and still motivated to keep improving.
Coach: What is your commitment?
Maya Fernandez: I will frame the discussion around learning, accountability, and progress rather than perfection.""",
]

COMPLEX_TEAM_TRANSCRIPTS: list[str] = [
    """Morgan: Welcome everyone. Maya, what is the main team tension right now?
Maya Fernandez: We are overloaded, priorities keep shifting, and the team feels like everything is urgent.
Jordan: I do not know what to work on first anymore.
Leah: We keep changing direction midweek.
Samir: I am in meetings all day and then doing real work at night.
Morgan: What is the impact of that pattern?
Maya Fernandez: We are busy but not effective. High-value work slips, and people do not have time to recharge.
Morgan: What do you need to solve together?
Maya Fernandez: A clearer way to prioritize, protect focus time, and help the team understand what gets paused when new work comes in.
Jordan: I need to hear what is truly top priority, not just what is loudest.
Leah: I need fewer last-minute requests.
Samir: I need permission to block time without feeling unavailable.
Morgan: What agreement could help?
Maya Fernandez: We will set weekly top-three priorities, create protected focus blocks, and require tradeoff decisions before adding work.
Jordan: That would reduce the guessing.
Leah: And if priorities shift, we should say what drops.
Morgan: What will each of you do this week?
Maya Fernandez: I will publish the top three priorities, cancel one low-value recurring meeting, and model taking a real lunch break.
Jordan: I will ask for tradeoffs instead of silently absorbing more work.
Leah: I will flag when scope changes threaten the weekly plan.
Samir: I will protect two focus blocks and communicate them clearly.
Morgan: How are you leaving this session?
Maya Fernandez: Clearer that productivity is not about constant motion, it is about directing energy toward the most important targets.""",
    """Morgan: Maya, what conversation does your team need today?
Maya Fernandez: We need to improve how we show up with stakeholders. The team has strong ideas, but we lose influence when communication gets too technical or defensive.
Nina: I feel like stakeholders tune out when we go deep into details.
Carlos: Then we get asked the same questions again because they did not follow the point.
Asha: I also notice we react to objections instead of anticipating them.
Morgan: What do stakeholders need from this team?
Maya Fernandez: A clear story, confidence, and direct acknowledgment of their concerns.
Morgan: How can the team build more leadership presence?
Maya Fernandez: By leading with the recommendation, using stories instead of too much detail, and adapting to the room without losing the core message.
Nina: We often start with background instead of the decision.
Carlos: I could frame technical risks in terms of customer impact instead.
Asha: I can prepare the top three likely objections before key meetings.
Morgan: What team norm do you want?
Maya Fernandez: Before major presentations, we will align on audience concerns, the decision we need, and one story that makes the case memorable.
Morgan: What will you each practice?
Maya Fernandez: I will open the next executive review with the recommendation and business impact.
Nina: I will cut two slides of detail and keep the message tighter.
Carlos: I will translate one technical issue into a customer story.
Asha: I will own a short pre-brief with stakeholders before the meeting.
Morgan: What is the shift you want people to feel?
Maya Fernandez: That this team is not just smart, it is credible, composed, and persuasive.""",
    """Morgan: Maya, what leadership challenge is affecting the team most?
Maya Fernandez: I am still too much in subject matter expert mode, and my team wants more ownership.
Devon: We bring Maya problems because she usually has the fastest answer.
Imani: But then we wait for approval on things we could probably decide.
Rafael: I want more room to lead pieces of work myself.
Morgan: Maya, what is hard about that shift?
Maya Fernandez: I trust the team, but I still jump in too fast. That keeps me on tasks and away from strategy.
Morgan: What does the team need from you instead?
Maya Fernandez: Clear expectations, more delegation, and coaching that helps people find solutions on their own.
Devon: I would benefit from being asked what I recommend before hearing the answer.
Imani: Same. It would help me grow judgment.
Rafael: And clearer decision rights would reduce back-and-forth.
Morgan: What agreement can you test?
Maya Fernandez: In our one-on-ones, I will ask coaching questions first. We will also delegate ownership of three strategic workstreams with explicit outcomes and boundaries.
Devon: I can own the customer readiness workstream.
Imani: I can lead the metrics review.
Rafael: I can run the cross-team planning draft.
Morgan: What will success look like?
Maya Fernandez: Less dependency on me for answers, more initiative from the team, and more time for me to focus on strategy and growth.""",
    """Morgan: What team issue needs attention today?
Maya Fernandez: Tension and misunderstanding are building across the team, and people are starting to avoid difficult conversations.
Elena: I feel like disagreement turns personal too quickly.
Ben: I hold back because I do not want to create conflict.
Tariq: Then issues stay buried until they become bigger.
Morgan: Maya, what is your role here?
Maya Fernandez: I need to help the team work through conflict constructively and create conditions where disagreement leads to better understanding.
Morgan: What is missing right now?
Maya Fernandez: Emotional awareness, listening, and a shared standard for how we challenge each other.
Elena: Sometimes I feel unheard when louder voices move on too fast.
Ben: I need more space to finish a thought without interruption.
Tariq: I need us to separate intent from impact.
Morgan: What norm do you want to establish?
Maya Fernandez: We will slow down conflict, name impact, ask clarifying questions before rebutting, and make room for quieter voices before closing a topic.
Elena: That would help me stay engaged instead of withdrawing.
Ben: I can commit to being more direct if I know the room is safer.
Tariq: I can help by reflecting back what I heard before disagreeing.
Morgan: Maya, what will you do specifically?
Maya Fernandez: I will intervene sooner, regulate my own tone, and coach the team to move toward understanding rather than quick resolution.
Morgan: What are you hoping changes?
Maya Fernandez: More honest dialogue, less resentment, and a team that can handle tension without losing trust.""",
    """Morgan: Maya, what is coming up for the team?
Maya Fernandez: We are in the middle of a major process change, and engagement is uneven. Some people understand the goal, others just feel disruption.
Priya: I know we are changing, but I am not clear on why this matters.
Owen: I worry we are rolling this out too fast.
Fatima: I have concerns, but I am not sure where to raise them.
Morgan: What does the team need from you?
Maya Fernandez: A shared why, more transparency, and a way to hear concerns before resistance hardens.
Morgan: How have you been communicating so far?
Maya Fernandez: Mostly updates. Not enough dialogue.
Priya: The updates explain what is changing, but not what problem it solves.
Owen: I would trust it more if we talked openly about risks.
Fatima: I also want to know how this connects to our goals.
Morgan: What will you do differently?
Maya Fernandez: I will communicate the purpose more clearly, invite questions earlier, and involve the team in improving the rollout.
Morgan: What agreement can the team make?
Maya Fernandez: We will run a weekly change checkpoint, collect concerns openly, and identify one adjustment each week based on team feedback.
Priya: That would make it feel more collaborative.
Owen: And more realistic.
Fatima: I would speak up more if I knew concerns would shape the plan.
Morgan: What outcome do you want?
Maya Fernandez: A team that sees change as something we shape together, not something done to us.""",
    """Morgan: Maya, what is the pressure point on the team right now?
Maya Fernandez: Stress is high, and I can see people narrowing under pressure. We need better resilience as a group.
Hector: I am finding it hard to reset once the day gets chaotic.
Bianca: I can tell I am more irritable than usual.
Leo: I worry we normalize operating in overdrive.
Morgan: What are the consequences if nothing changes?
Maya Fernandez: Lower judgment, less empathy, more reactive communication, and eventually burnout.
Morgan: What do you want the team to learn?
Maya Fernandez: How to recognize stress triggers, interrupt them earlier, and regain balance without pretending pressure is not real.
Hector: My trigger is surprise work late in the day.
Bianca: Mine is unclear expectations.
Leo: Mine is feeling like I cannot step away.
Morgan: How can the team support one another?
Maya Fernandez: By naming overload earlier, clarifying expectations fast, and not rewarding frantic behavior as if it were strong performance.
Hector: I would benefit from a quick reset norm before tense meetings.
Bianca: And from clearer escalation when priorities conflict.
Leo: I want explicit permission to log off and recharge.
Morgan: Maya, what commitment will you make?
Maya Fernandez: I will model steadier pacing, ask about stress signals in check-ins, and protect recovery time instead of praising constant availability.
Morgan: What is the team commitment?
Maya Fernandez: We will identify our triggers, use a short reset when tension spikes, and ask for help before stress turns into shutdown or conflict.""",
    """Morgan: Maya, what do you want this team session to accomplish?
Maya Fernandez: I want us to collaborate better across functions and use more of our different perspectives. Right now we are too siloed.
Jules: We optimize for our own lane and then discover conflicts late.
Carla: I do not always see how my work connects to the bigger picture.
Dante: Sometimes the same few voices shape the plan.
Morgan: What does that cost the team?
Maya Fernandez: We miss better ideas, duplicate effort, and leave people feeling disconnected from team goals.
Morgan: What do you want instead?
Maya Fernandez: Clearer line of sight between individual work and organizational goals, more cross-functional collaboration, and stronger inclusion in how decisions are made.
Jules: I want earlier input from peers before plans harden.
Carla: I want more context on why priorities matter.
Dante: I want meeting structures that do not always favor the fastest speaker.
Morgan: What concrete changes will you make?
Maya Fernandez: We will redesign the weekly team meeting around shared goals, rotate who speaks first, and ask each function to name how its work supports the larger outcome.
Jules: I can bring cross-functional dependencies to that meeting.
Carla: I can frame my updates in terms of team goals, not just task status.
Dante: I can help surface quieter perspectives before decisions close.
Morgan: How will you know this is working?
Maya Fernandez: When people collaborate earlier, understand how their work fits the larger mission, and feel that different perspectives actually improve our performance.""",
]

ALLY_CHAT_CONVERSATIONS: list[list[dict[str, str]]] = [
    [
        {"role": "maya", "content": "Ally, I am overwhelmed. My week is packed with meetings, and I am not making time for high-value work."},
        {"role": "ally", "content": "What work keeps getting squeezed out when your calendar fills up?"},
        {"role": "maya", "content": "Planning, strategic thinking, and coaching my leads. I keep defaulting to reacting."},
        {"role": "ally", "content": "If you had to name the top two priorities for this week, what would they be?"},
        {"role": "maya", "content": "Clarifying team priorities for the quarter and preparing for an executive review."},
        {"role": "ally", "content": "What meetings or tasks could be reduced, delegated, or moved so those priorities get protected time?"},
        {"role": "maya", "content": "I can cancel one status meeting, shorten two check-ins, and ask my leads to bring recommendations instead of open-ended problems."},
        {"role": "ally", "content": "That shows prioritization and delegation. What will help you recharge enough to stay effective rather than just available?"},
        {"role": "maya", "content": "I need to protect lunch, stop answering messages late at night, and block one focus period each morning."},
        {"role": "ally", "content": "Good. What is one concrete commitment you will make for tomorrow?"},
        {"role": "maya", "content": "I will send the team our top three priorities and block ninety minutes for strategy work before noon."},
    ],
    [
        {"role": "maya", "content": "Ally, I have a stakeholder presentation tomorrow and I am worried I will sound defensive."},
        {"role": "ally", "content": "What concern do you think your audience is carrying into the room?"},
        {"role": "maya", "content": "They think our team is slowing down delivery and overcomplicating things."},
        {"role": "ally", "content": "How can you address that concern directly before you explain your recommendation?"},
        {"role": "maya", "content": "I can start by acknowledging the pressure to move quickly, then explain the tradeoff and the business risk of rushing."},
        {"role": "ally", "content": "What story or example could make the message easier to absorb?"},
        {"role": "maya", "content": "I can use the recent rollout where unclear decisions caused rework and frustrated a key customer."},
        {"role": "ally", "content": "That builds leadership presence and influence. What sentence do you want to use when someone pushes back?"},
        {"role": "maya", "content": "I want to say, 'I am aligned on speed, and I need us to be explicit about which risk we are accepting.'"},
        {"role": "ally", "content": "Strong. How will you stay composed if the room gets sharp?"},
        {"role": "maya", "content": "Pause, slow my pace, answer the concern underneath the objection, and avoid overexplaining."},
    ],
    [
        {"role": "maya", "content": "I am noticing I still act like the expert with all the answers instead of a leader who develops others."},
        {"role": "ally", "content": "Where does that show up most clearly?"},
        {"role": "maya", "content": "In one-on-ones. People bring me problems and I solve them before they finish thinking out loud."},
        {"role": "ally", "content": "What might change if you led with curiosity instead of answers?"},
        {"role": "maya", "content": "My team would build more ownership, and I would spend less time on tasks that should belong to them."},
        {"role": "ally", "content": "What coaching questions could help them find their own solutions?"},
        {"role": "maya", "content": "I could ask what options they see, what tradeoffs matter, and what recommendation they would make if I were not in the room."},
        {"role": "ally", "content": "That supports a coaching approach. What can you delegate this week that you have been holding too tightly?"},
        {"role": "maya", "content": "The draft cross-functional plan. I can give the outcome, constraints, and review date without dictating every step."},
        {"role": "ally", "content": "What mindset do you need in order to let someone else lead it?"},
        {"role": "maya", "content": "That growth matters more than exact replication, and that my job is to create capability, not dependency."},
    ],
    [
        {"role": "maya", "content": "Two people on my team are in conflict, and I am avoiding the conversation because I do not want it to spiral."},
        {"role": "ally", "content": "What is happening between them beneath the surface issue?"},
        {"role": "maya", "content": "One feels dismissed in meetings, and the other thinks directness is being misread as disrespect."},
        {"role": "ally", "content": "What state of mind do you need before facilitating that conversation?"},
        {"role": "maya", "content": "Calm, curious, and steady. If I go in tense, they will feel it immediately."},
        {"role": "ally", "content": "What would help both people feel heard rather than managed?"},
        {"role": "maya", "content": "I can start by naming the impact on the team, invite each person to describe their experience, and ask the other to reflect back what they heard."},
        {"role": "ally", "content": "That supports empathy and deeper understanding. How will you handle disagreement if it sharpens?"},
        {"role": "maya", "content": "I will slow it down, ask clarifying questions, and redirect from intent versus blame toward impact and next steps."},
        {"role": "ally", "content": "What inclusive behavior do you want to reinforce for the whole team afterward?"},
        {"role": "maya", "content": "That disagreement is welcome when it expands understanding, and that quieter voices need room before fast conclusions are made."},
    ],
    [
        {"role": "maya", "content": "I am leading a process change, and I can feel resistance building even though the change itself makes sense."},
        {"role": "ally", "content": "What do you think people are resisting: the change, or the way it is being experienced?"},
        {"role": "maya", "content": "Probably the way it is being experienced. They hear a new process, but not the shared why behind it."},
        {"role": "ally", "content": "How can you make the purpose clearer and invite more ownership?"},
        {"role": "maya", "content": "I can explain the problem the change solves, connect it to team and organizational goals, and ask what concerns need to be addressed before rollout."},
        {"role": "ally", "content": "Who do you need to engage before the main announcement?"},
        {"role": "maya", "content": "A few informal influencers and the people most affected by the change. If they feel heard early, the rollout will be stronger."},
        {"role": "ally", "content": "What would transparent follow-through look like after the meeting?"},
        {"role": "maya", "content": "A summary of decisions, open questions, next steps, and one adjustment we are making based on team feedback."},
        {"role": "ally", "content": "That demonstrates change leadership and collaboration. What is the growth edge for you here?"},
        {"role": "maya", "content": "Not rushing to agreement. I need to treat concerns as useful input, not as resistance to shut down."},
    ],
    [
        {"role": "maya", "content": "I have been more reactive under stress lately, and I can tell it affects how the team experiences me."},
        {"role": "ally", "content": "What are the earliest signs that your stress response is taking over?"},
        {"role": "maya", "content": "My shoulders tighten, I start typing fast, and I assume everything is urgent."},
        {"role": "ally", "content": "What usually triggers that pattern?"},
        {"role": "maya", "content": "Ambiguity, last-minute changes, and the fear that I am dropping something important."},
        {"role": "ally", "content": "Which part of that feels like a limiting belief rather than a fact?"},
        {"role": "maya", "content": "The belief that one visible mistake will erase trust. Intellectually I know that is not true, but I still react to it."},
        {"role": "ally", "content": "How can you interrupt the pattern in the moment?"},
        {"role": "maya", "content": "Pause, name the trigger, take a breath, and ask what actually matters before I respond."},
        {"role": "ally", "content": "How can you help your team build resilience too, not just yourself?"},
        {"role": "maya", "content": "By clarifying priorities faster, normalizing short resets, and not passing my anxiety down through rushed messages."},
        {"role": "ally", "content": "What experiment will you run this week?"},
        {"role": "maya", "content": "I will wait two minutes before responding to triggering messages and ask one clarifying question before jumping to action."},
    ],
]


def format_chat(messages: list[dict[str, str]]) -> str:
    """Convert chat message list into plain text for the LLM prompt."""
    return "\n".join(f"{m['role']}: {m['content']}" for m in messages)


# ---------------------------------------------------------------------------
# Ordered seed sequence: intake first, then interleaved sessions
# ---------------------------------------------------------------------------

_SEED_ORDER: list[str] = [
    TRANSCRIPTS[0],                              # 1  intake: time mgmt / strategic work
    COMPLEX_TEAM_TRANSCRIPTS[0],                 # 2  team: priorities & productivity
    format_chat(ALLY_CHAT_CONVERSATIONS[0]),     # 3  ally: priorities
    TRANSCRIPTS[1],                              # 4  individual: leadership presence
    COMPLEX_TEAM_TRANSCRIPTS[1],                 # 5  team: stakeholder communication
    format_chat(ALLY_CHAT_CONVERSATIONS[1]),     # 6  ally: stakeholder presentation
    TRANSCRIPTS[2],                              # 7  individual: change management
    COMPLEX_TEAM_TRANSCRIPTS[2],                 # 8  team: SME to leader transition
    format_chat(ALLY_CHAT_CONVERSATIONS[2]),     # 9  ally: coaching approach
    TRANSCRIPTS[3],                              # 10 individual: conflict management
    COMPLEX_TEAM_TRANSCRIPTS[3],                 # 11 team: conflict & difficult convos
    format_chat(ALLY_CHAT_CONVERSATIONS[3]),     # 12 ally: conflict facilitation
    TRANSCRIPTS[4],                              # 13 individual: stress & resilience
    COMPLEX_TEAM_TRANSCRIPTS[4],                 # 14 team: change process
    format_chat(ALLY_CHAT_CONVERSATIONS[4]),     # 15 ally: change management
    TRANSCRIPTS[5],                              # 16 individual: coaching approach
    COMPLEX_TEAM_TRANSCRIPTS[5],                 # 17 team: team resilience
    format_chat(ALLY_CHAT_CONVERSATIONS[5]),     # 18 ally: stress resilience
    TRANSCRIPTS[6],                              # 19 individual: collaboration
    COMPLEX_TEAM_TRANSCRIPTS[6],                 # 20 team: cross-functional collab
    TRANSCRIPTS[7],                              # 21 individual: growth mindset
]

_START_DATE = date(2025, 6, 1)
_END_DATE = date(2026, 3, 1)
SEED_USER_ID = "maya-001"


def _seed_dates() -> list[date]:
    n = len(_SEED_ORDER) - 1
    total_days = (_END_DATE - _START_DATE).days
    return [
        _START_DATE + timedelta(days=round(i * total_days / n))
        for i in range(len(_SEED_ORDER))
    ]


async def seed_database(db: Session, get_llm_fn, signal_extraction_prompt: str) -> None:
    """
    Populate the database with Maya's full coaching journey if it is empty.

    Uses the same ingest logic as POST /api/events — calls the LLM for each
    event with its assigned historical processing date.

    Args:
        db: SQLAlchemy session
        get_llm_fn: callable returning a fresh AbstractLLM instance
        signal_extraction_prompt: the full prompt template from main.py
    """
    from app import models
    from app.schemas import LLMEventResponse

    if db.query(models.Event).first():
        logger.info("Database already seeded — skipping.")
        return

    if not os.environ.get("GEMINI_API_KEY"):
        logger.warning("GEMINI_API_KEY not set — skipping database seeding.")
        return

    dates = _seed_dates()
    logger.info(
        "Seeding database with %d events for user %s (%.0s → %s)…",
        len(_SEED_ORDER), SEED_USER_ID, _START_DATE, _END_DATE,
    )

    for i, (event_text, event_date) in enumerate(zip(_SEED_ORDER, dates), start=1):
        try:
            llm = get_llm_fn()
            async with llm:
                llm_result: LLMEventResponse = await llm.run_simple_completion(
                    system_prompt=signal_extraction_prompt,
                    dto_class=LLMEventResponse,
                    data={
                        "event_text": event_text,
                        "processing_date": str(event_date),
                    },
                )
            event = models.Event(user_id=SEED_USER_ID, **llm_result.model_dump())
            db.add(event)
            db.commit()
            logger.info("  [%d/%d] Seeded event dated %s", i, len(_SEED_ORDER), event_date)
        except Exception as exc:
            logger.error(
                "  [%d/%d] Failed to seed event dated %s: %s",
                i, len(_SEED_ORDER), event_date, exc,
            )
            db.rollback()

    logger.info("Seeding complete.")
