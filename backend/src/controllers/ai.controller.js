const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: process.env.NVIDIA_API_BASE,
});

const SYSTEM_PROMPTS = {
  'trip-planner': `You are Wanderly, TravelSphere's expert AI travel planning assistant specializing in Indian domestic travel. You are enthusiastic, knowledgeable, and write like a well-traveled friend who is detail-oriented and practical. Your goal is to inspire travel AND help users find and book the right package.

CURRENCY: Always use ₹ (Indian Rupee). Never use $.

CRITICAL FORMATTING RULES — NON-NEGOTIABLE:
- ALWAYS use markdown. Never plain text walls.
- Use ## for main sections, ### for subsections (Day 1, Day 2), #### for small divisions (Activities, Food)
- Use - for bullet lists. Never use * for lists.
- **Bold** for destinations, prices, must-dos. *Italic* for tips and warnings.
- Use --- to separate each day
- Max 2-3 emojis per section for visual hierarchy
- Use proper markdown tables with | syntax for budgets

FOR TRIP PLANNING QUERIES, follow this EXACT structure:

[2-3 sentence intro about what makes this destination/season special]

## 🗺️ Ideal Route
**City A → City B → City C → City A**
[One line on route logic]

### 🗓️ Best Time to Visit
- **Month-Month:** Description and temperature
- **Month-Month:** Description

---

### Day 1 — Location Name

**Stay:** Accommodation type/area *(recommendation in italic)*

#### 🎯 Things to Do:
- **Main attraction** — Why it's worth it (timing if relevant)
- **Activity** — Brief description
- **Sightseeing spot** — What makes it special

#### 🍽️ Food to Try:
- **Dish name** at Restaurant name
- **Local specialty** — where to find it

💡 *Tip: One sharp, practical tip for this day*

---

[Repeat for each day]

---

## 💰 Budget Breakdown

| **Category** | **Budget** | **Mid-Range** | **Luxury** |
|--------------|------------|---------------|------------|
| **Per Person** | ₹X-Y | ₹X-Y | ₹X+ |
| Accommodation | Basic hotels | 3-4 star | 5-star/resort |
| Food | Local dhabas | Restaurants | Fine dining |
| Transport | Shared cabs | Private sedan | SUV+driver |
| Activities | Basic | All included | Premium+guide |

### 📦 What's Typically Included in Packages:
✅ Accommodation (hotel/resort as per category)
✅ Daily breakfast + dinner
✅ All intercity transfers
✅ Sightseeing as per itinerary
✅ Dedicated trip manager

❌ Lunch & personal expenses
❌ Adventure activities & entry tickets
❌ Airfare / train tickets (unless mentioned)

---

## 🎒 Packing & Practical Tips
- **Network:** BSNL and postpaid Airtel/Jio work best in remote areas
- [4-5 more sharp, destination-specific tips on packing, transport, safety, booking timing]

---

> 🎒 **TravelSphere has curated packages for this destination** — verified itineraries with real pricing shown below. Click **Book Now** on any package to reserve your spot directly from this chat!

Would you like me to:
- Customize this itinerary for your group size or budget
- Compare budget vs luxury options for this trip
- Help you plan for a specific travel date

PACKAGE DISPLAY ACTION — CRITICAL:
When user wants to SEE or BROWSE packages (NOT asking for a full day-by-day itinerary):
Trigger words: "show me packages", "packages for X", "what packages", "book X", "I want to go to X", "deals for X", "trips to X", destination name alone (e.g. just "Goa" or "Kashmir").

For these queries, DO NOT write a long itinerary. Instead:
1. Write ONE enthusiastic sentence about the destination.
2. Output this EXACT tag on its own line (no extra text on the same line):
[SHOW_PACKAGES:{"destination":"DESTINATION","duration":null,"minBudget":null,"maxBudget":null}]
3. Write ONE short follow-up question (ask about group size, dates, or trip style).

Example — user says "goa packages":
Goa is perfect for beaches, seafood, and vibrant nightlife — we have curated options for every budget!
[SHOW_PACKAGES:{"destination":"Goa","duration":null,"minBudget":null,"maxBudget":null}]
Are you planning a romantic escape, a family trip, or a fun group outing?

Example — user says "7 day kashmir":
Kashmir in 7 days is absolutely stunning — Dal Lake, Gulmarg, Pahalgam, and snow-capped peaks await!
[SHOW_PACKAGES:{"destination":"Kashmir","duration":7,"minBudget":null,"maxBudget":null}]
How many travelers will be joining you?

Example — user says "budget Kerala trip under 20000":
Kerala has wonderful budget-friendly options — backwaters, hill stations, and Ayurvedic wellness await!
[SHOW_PACKAGES:{"destination":"Kerala","duration":null,"minBudget":null,"maxBudget":20000}]
Are you looking for a backwater houseboat experience, hill stations like Munnar, or the beaches?

TAG RULES:
- "destination" must exactly match what the user said (proper cased)
- "duration" = number of days if user mentioned it, else null
- "minBudget" / "maxBudget" in ₹ if user mentioned budget, else null
- For DETAILED itinerary requests ("plan my trip day by day", "full itinerary", "complete guide", "what to do each day"), write the FULL ITINERARY FORMAT instead — packages appear automatically below itineraries

IMPORTANT PACKAGE RULE: NEVER invent, guess, or make up package names, prices, or ratings. NEVER write a list or table of fake packages. Real packages are fetched from the database and shown as cards. Use the tag above or the blockquote CTA — never invent package details.

BOOKING ENCOURAGEMENT: After any itinerary, mention that users can click "Book Now" on any package card shown below, or use the "✨ Request Custom Trip" button to get a personalized quote.

REFUSAL RULE — ONLY for completely unrelated topics (coding, math, news, politics, celebrity gossip, sports scores):
Output ONLY: "[WANDERLY-REFUSAL] I'm Wanderly, your trip planning assistant! I can only help you plan your travels 🌏 Tell me where you'd like to go!"

For greetings (hi, hello, hey): Reply warmly in 1 line and ask where they want to travel.

When in doubt about relevance, answer as a travel expert.`,

  'homepage-widget': `You are Wanderly, TravelSphere's friendly AI assistant for Indian travellers. Keep replies SHORT (2-4 sentences max). Always use ₹ (Indian Rupee) for prices — never use $.

You help with TWO types of questions:

1. TRAVELSPHERE PLATFORM (booking, payments, cancellations, packages, refunds, why choose us):
   - For payment/booking issues: empathize briefly, then include this exact markdown: "Please visit our [Support page](/support) or [My Bookings](/dashboard/bookings) for help."
   - For general platform questions: short helpful answer. Mention that users can book packages directly on TravelSphere.

2. TRAVEL & TRIP PLANNING (destinations, itineraries, things to do, adventure, hotels, food, visa, budget):
   Short helpful answer in ₹ where relevant, then suggest: "For a full itinerary and to book directly, try our [Trip Planner](/trip-planner)!" End with a question.

GREETINGS (hi, hello, hey, etc.): 1 warm line, ask how you can help with their travel plans.

COMPLETELY UNRELATED (coding, math, news, politics, celebrity gossip, sports scores):
Output ONLY: "[WANDERLY-REFUSAL] I'm Wanderly, TravelSphere's travel assistant! I can only help you plan your trips 😊 Where would you like to travel?"

When in doubt, answer helpfully.`,
};


function getSystemPrompt(type) {
  return SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS['homepage-widget'];
}

// Remove category label the model sometimes outputs (plain, heading, or bold)
function stripCategoryLabel(text) {
  return text
    .replace(/^[#*\s]*CATEGORY\s+[A-C][^\n]*\n+/i, '')
    .trimStart();
}

// Strip [SHOW_PACKAGES:...] tags before persisting to DB so they never appear as raw text on reload
function stripShowPackagesTag(text) {
  return text.replace(/\[SHOW_PACKAGES:\s*\{[\s\S]*?\}\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

// Extract package query from AI response (used to re-fetch packages on conversation reload)
function extractPackageQuery(text) {
  const match = text.match(/\[SHOW_PACKAGES:\s*(\{[\s\S]*?\})\]/);
  if (match) {
    try { return JSON.parse(match[1]); } catch {}
  }
  return null;
}

// Detect if content is a day-by-day itinerary (used to flag messages for package re-fetch)
function hasItineraryContent(text) {
  return /##\s*Day\s*\d/i.test(text) || /Day\s*\d\s*[—\-]/i.test(text);
}

// ─── SSE Chat (streaming) ─────────────────────────────────────────────────────
async function streamChat(req, res) {
  const { message, sessionId, type = 'trip-planner', history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const sid = sessionId || uuidv4();
  const userId = req.user?.id || null;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const messages = [
      { role: 'system', content: getSystemPrompt(type) },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const stream = await client.chat.completions.create({
      model: process.env.AI_MODEL || 'meta/llama-3.3-70b-instruct',
      messages,
      stream: true,
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 4096,
    });

    // The model prefixes refusals with [WANDERLY-REFUSAL] — intercept and replace with clean text
    const REFUSAL_TAG = '[WANDERLY-REFUSAL]';
    const FULL_REFUSAL_PLANNER = "I'm Wanderly, your trip planning assistant! I can only help you plan your travels 🌏 Tell me where you'd like to go!";
    const FULL_REFUSAL_WIDGET  = "I'm Wanderly, TravelSphere's travel assistant! I can only help you plan your trips 😊 Where would you like to travel?";
    const fullRefusal = type === 'trip-planner' ? FULL_REFUSAL_PLANNER : FULL_REFUSAL_WIDGET;

    let fullContent = '';
    let checkedForRefusal = false;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (!delta) continue;
      fullContent += delta;

      // Buffer 50 chars — enough to detect [WANDERLY-REFUSAL] and strip CATEGORY label
      if (!checkedForRefusal && fullContent.length >= 50) {
        checkedForRefusal = true;
        if (fullContent.includes(REFUSAL_TAG)) {
          send({ type: 'delta', content: fullRefusal });
          fullContent = fullRefusal;
          break;
        } else {
          // Strip category label prefix then flush
          const cleaned = stripCategoryLabel(fullContent);
          fullContent = cleaned;
          send({ type: 'delta', content: cleaned });
        }
      } else if (checkedForRefusal) {
        send({ type: 'delta', content: delta });
      }
    }

    // Short response that ended before our buffer threshold
    if (!checkedForRefusal) {
      if (fullContent.includes(REFUSAL_TAG)) {
        send({ type: 'delta', content: fullRefusal });
        fullContent = fullRefusal;
      } else {
        const cleaned = stripCategoryLabel(fullContent);
        send({ type: 'delta', content: cleaned });
        fullContent = cleaned;
      }
    }

    send({ type: 'done', sessionId: sid });
    res.write('data: [DONE]\n\n');
    res.end();

    // Persist conversation asynchronously
    setImmediate(async () => {
      try {
        const existing = await prisma.aIChatConversation.findUnique({ where: { sessionId: sid } });
        const packageQuery = extractPackageQuery(fullContent);
        const persistedContent = stripShowPackagesTag(fullContent);
        const assistantMeta = {
          role: 'assistant',
          content: persistedContent,
          timestamp: new Date().toISOString(),
        };
        if (packageQuery?.destination) assistantMeta.packageQuery = packageQuery;
        if (hasItineraryContent(persistedContent)) assistantMeta.isItinerary = true;

        const updatedMessages = [
          ...(existing?.messages || []),
          { role: 'user', content: message.trim(), timestamp: new Date().toISOString() },
          assistantMeta,
        ];

        if (existing) {
          await prisma.aIChatConversation.update({
            where: { sessionId: sid },
            data: {
              messages: updatedMessages,
              messageCount: updatedMessages.length,
              lastMessageAt: new Date(),
            },
          });
        } else {
          await prisma.aIChatConversation.create({
            data: {
              sessionId: sid,
              userId,
              type,
              messages: updatedMessages,
              messageCount: 2,
              title: message.trim().slice(0, 80),
            },
          });
        }
      } catch (e) {
        console.error('[ai:persist]', e.message);
      }
    });
  } catch (e) {
    console.error('[streamChat]', e.message);
    send({ type: 'error', message: 'AI service unavailable. Please try again.' });
    res.end();
  }
}

// ─── Get conversation history ─────────────────────────────────────────────────
async function getConversation(req, res) {
  const { sessionId } = req.params;
  try {
    const conv = await prisma.aIChatConversation.findUnique({ where: { sessionId } });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });
    return res.json({ success: true, data: { conversation: conv } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
}

// ─── Get user's conversations (sidebar history) ───────────────────────────────
async function getMyConversations(req, res) {
  if (!req.user?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const conversations = await prisma.aIChatConversation.findMany({
      where: { userId: req.user.id, type: 'trip-planner' },
      orderBy: { lastMessageAt: 'desc' },
      take: 30,
      select: {
        id: true,
        sessionId: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });
    return res.json({ success: true, data: { conversations } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
}

// ─── Admin analytics ──────────────────────────────────────────────────────────
async function getAIAnalytics(req, res) {
  try {
    const [total, tripPlanner, widget, leadToBooking] = await Promise.all([
      prisma.aIChatConversation.count(),
      prisma.aIChatConversation.count({ where: { type: 'trip-planner' } }),
      prisma.aIChatConversation.count({ where: { type: 'homepage-widget' } }),
      prisma.aIChatConversation.count({ where: { leadToBooking: true } }),
    ]);

    const recent = await prisma.aIChatConversation.findMany({
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
      select: {
        id: true,
        sessionId: true,
        type: true,
        title: true,
        messageCount: true,
        leadToBooking: true,
        lastMessageAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    return res.json({
      success: true,
      data: { stats: { total, tripPlanner, widget, leadToBooking }, recent },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
}

// ─── Message feedback ─────────────────────────────────────────────────────────
async function submitFeedback(req, res) {
  const { sessionId } = req.params;
  const { messageIndex, feedback } = req.body; // feedback: 'up' | 'down'

  try {
    const conv = await prisma.aIChatConversation.findUnique({ where: { sessionId } });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const messages = Array.isArray(conv.messages) ? conv.messages : [];
    if (messages[messageIndex]) {
      messages[messageIndex].feedback = feedback;
    }

    await prisma.aIChatConversation.update({
      where: { sessionId },
      data: { messages },
    });

    return res.json({ success: true, message: 'Feedback recorded' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
}

module.exports = { streamChat, getConversation, getMyConversations, getAIAnalytics, submitFeedback };
