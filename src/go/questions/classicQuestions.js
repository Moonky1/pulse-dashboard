export const classicQuestions = [
  {
    "id": 1,
    "topic": "script",
    "language": "en",
    "question": "During a QA script review, the customer asks whether the call will lower their monthly payments and the agent transfers without answering. What should QA flag?",
    "options": [
      "Payment concern was never clarified.",
      "Mileage was reviewed too late.",
      "Transfer wait was slightly long.",
      "Dealer location was not confirmed."
    ],
    "correct": 0,
    "explanation": "The agent must answer or clarify important customer questions before moving to transfer."
  },
  {
    "id": 2,
    "topic": "script",
    "language": "en",
    "question": "In the opening, someone asks, “So this is from my bank?” Which reply keeps the call safest?",
    "options": [
      "Your bank asked us to call.",
      "Your lender approved coverage.",
      "We work with dealerships and vehicle registries.",
      "The finance company sent the file."
    ],
    "correct": 2,
    "explanation": "Agents should not say the bank or lender provided the file."
  },
  {
    "id": 3,
    "topic": "script",
    "language": "en",
    "question": "Before transfer setup, the agent says, “There is no cost at all; you only listen.” Why is this risky?",
    "options": [
      "It may sound like a free-service promise.",
      "It confirms vehicle condition too clearly.",
      "It gives the advisor too much context.",
      "It explains insurance too early."
    ],
    "correct": 0,
    "explanation": "Avoid wording that can be understood as free coverage or guaranteed no cost."
  },
  {
    "id": 4,
    "topic": "script",
    "language": "en",
    "question": "After the vehicle-runs question, the customer says “okay,” but never agrees to speak with the Service Advisor. What is missing?",
    "options": [
      "Exact make and model.",
      "Customer street address.",
      "Clear transfer approval.",
      "Final monthly payment quote."
    ],
    "correct": 2,
    "explanation": "Vehicle condition confirmation is not the same as consent to transfer."
  },
  {
    "id": 5,
    "topic": "script",
    "language": "en",
    "question": "A caller answers in English but sounds unsure and confused by basic questions. What should the agent do before pushing forward?",
    "options": [
      "Ask for the preferred language.",
      "Force an English XFER.",
      "Read the script faster.",
      "Mark NI immediately."
    ],
    "correct": 0,
    "explanation": "If understanding is unclear, language preference should be checked."
  },
  {
    "id": 6,
    "topic": "script",
    "language": "en",
    "question": "The agent changes small connector words while keeping the required meaning. When is that acceptable?",
    "options": [
      "The company name is skipped.",
      "Vehicle condition is ignored.",
      "Compliance points stay intact.",
      "Transfer approval is assumed."
    ],
    "correct": 2,
    "explanation": "Natural wording is fine only when required meaning and compliance points remain intact."
  },
  {
    "id": 7,
    "topic": "script",
    "language": "en",
    "question": "Before dialing, the customer asks, “What is this about?” Which response is safest?",
    "options": [
      "Your factory warranty is being renewed.",
      "The dealer already approved a plan.",
      "This keeps your vehicle legal.",
      "It is a review of possible coverage options."
    ],
    "correct": 3,
    "explanation": "The call should be framed as a coverage review, not a required or guaranteed renewal."
  },
  {
    "id": 8,
    "topic": "script",
    "language": "en",
    "question": "In a compliance check, the customer asks, “Who are you exactly?” What should the agent avoid?",
    "options": [
      "Explaining the call purpose calmly.",
      "Pretending to be the dealership.",
      "Identifying Vehicle Services Group.",
      "Continuing only after approval."
    ],
    "correct": 1,
    "explanation": "The agent must not claim to be the dealer, bank, manufacturer, or car brand."
  },
  {
    "id": 9,
    "topic": "script",
    "language": "en",
    "question": "During the intro, the agent says, “Your warranty expired and this is your final notice.” What is the issue?",
    "options": [
      "It checks language preference.",
      "It gives the right disposition.",
      "It creates unsupported urgency.",
      "It confirms the advisor first."
    ],
    "correct": 2,
    "explanation": "Unsupported urgency can create compliance and QA risk."
  },
  {
    "id": 10,
    "topic": "script",
    "language": "en",
    "question": "Before eligibility is verified, the customer asks for the price. What should the agent do?",
    "options": [
      "Skip condition and transfer fast.",
      "Bridge pricing to the Service Advisor after qualification.",
      "Say the quote is always free.",
      "Give the cheapest monthly amount."
    ],
    "correct": 1,
    "explanation": "The agent should not quote price; they should qualify and bridge to the Service Advisor."
  },
  {
    "id": 11,
    "topic": "script",
    "language": "en",
    "question": "A customer says, “Thanks, I’m good,” and the agent only says “yeah” before transferring. What was missed?",
    "options": [
      "Dealer location confirmation.",
      "Objection handling and consent.",
      "Mileage calculation only.",
      "A pause-code correction."
    ],
    "correct": 1,
    "explanation": "A casual acknowledgment is not a rebuttal and does not prove consent."
  },
  {
    "id": 12,
    "topic": "script",
    "language": "en",
    "question": "The vehicle information on file seems wrong. Which script direction is best?",
    "options": [
      "Say the file is never wrong.",
      "Mark DNC because data is wrong.",
      "Treat it as verification for the current vehicle.",
      "Transfer before asking anything."
    ],
    "correct": 2,
    "explanation": "Wrong or outdated data should be handled as a verification opportunity."
  },
  {
    "id": 13,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “The Service Advisor will lower your payment.” What is wrong?",
    "options": [
      "It makes the handoff too clean.",
      "It promises a result the agent cannot control.",
      "It asks too clearly for approval.",
      "It confirms eligibility too slowly."
    ],
    "correct": 1,
    "explanation": "Agents must not promise lower payments or guaranteed outcomes."
  },
  {
    "id": 14,
    "topic": "script",
    "language": "en",
    "question": "The agent says, “I’ll introduce you, okay?” and the customer asks, “To who?” What should happen?",
    "options": [
      "Mark XFER after the question.",
      "Dial first and explain later.",
      "Ignore it as small talk.",
      "Clarify the Service Advisor role."
    ],
    "correct": 3,
    "explanation": "If the customer does not understand the transfer, the agent should clarify before dialing."
  },
  {
    "id": 15,
    "topic": "script",
    "language": "en",
    "question": "The caller asks if they must buy something today. Which answer stays safest?",
    "options": [
      "The agent can approve the purchase.",
      "The bank already selected the plan.",
      "Yes, purchase is required today.",
      "The advisor reviews options; the customer decides."
    ],
    "correct": 3,
    "explanation": "The agent should not present the call as mandatory or force a purchase."
  },
  {
    "id": 16,
    "topic": "script",
    "language": "en",
    "question": "The customer asks what vehicle the call is about, but the agent only has finance information. What is safest?",
    "options": [
      "Reference finance info and verify the current vehicle.",
      "Invent the most likely make and model.",
      "Skip the vehicle check.",
      "Say the customer should know."
    ],
    "correct": 0,
    "explanation": "Be transparent about available information and verify the current vehicle."
  },
  {
    "id": 17,
    "topic": "script",
    "language": "en",
    "question": "Before the agent dials, the agent says the coverage is “from the manufacturer.” What should QA flag?",
    "options": [
      "Misrepresenting the coverage source.",
      "Using the customer name clearly.",
      "Waiting for the advisor to speak.",
      "Asking whether the vehicle runs."
    ],
    "correct": 0,
    "explanation": "Agents should not say they represent the manufacturer or car brand."
  },
  {
    "id": 18,
    "topic": "script",
    "language": "en",
    "question": "A direct customer question comes up during the opening. What is the best rule?",
    "options": [
      "Answer or clarify before pushing forward.",
      "Ignore questions until the advisor joins.",
      "Transfer faster to avoid objections.",
      "Repeat the script louder."
    ],
    "correct": 0,
    "explanation": "Unanswered questions can make the transfer misleading or invalid."
  },
  {
    "id": 19,
    "topic": "script",
    "language": "en",
    "question": "The agent gets approval but never introduces the customer by name to the Service Advisor. What is the issue?",
    "options": [
      "The call became voicemail.",
      "The customer asked for RR.",
      "The vehicle became electric.",
      "The handoff was incomplete."
    ],
    "correct": 3,
    "explanation": "The handoff should include a clean introduction, not just a connected line."
  },
  {
    "id": 20,
    "topic": "script",
    "language": "en",
    "question": "Right before transfer, the customer says, “I don’t understand what you mean.” What should the agent not do?",
    "options": [
      "Ask language preference if needed.",
      "Restate the purpose simply.",
      "Confirm understanding first.",
      "Push to transfer without clarifying."
    ],
    "correct": 3,
    "explanation": "Confusion must be clarified before transfer consent can be considered clean."
  },
  {
    "id": 21,
    "topic": "objections",
    "language": "en",
    "question": "During objection handling, the caller says “not interested” but gives no reason. What is the best first move?",
    "options": [
      "Transfer before they hang up.",
      "Ask a short reason to work with.",
      "Argue about repair costs.",
      "Mark DNC immediately."
    ],
    "correct": 1,
    "explanation": "The agent needs a reason before choosing the best rebuttal."
  },
  {
    "id": 22,
    "topic": "objections",
    "language": "en",
    "question": "A time objection comes up: “I’m busy.” The customer does not fully refuse. What should the agent avoid?",
    "options": [
      "Promising it will take under a minute.",
      "Respecting the time objection.",
      "Asking if later works better.",
      "Offering a better callback time."
    ],
    "correct": 0,
    "explanation": "The agent should not promise a specific or short wait time."
  },
  {
    "id": 23,
    "topic": "objections",
    "language": "en",
    "question": "A scam concern appears before the agent moves forward. What tone is safest?",
    "options": [
      "Calm, transparent, and controlled.",
      "Defensive and argumentative.",
      "Fast and dismissive.",
      "Silent until they stop talking."
    ],
    "correct": 0,
    "explanation": "Scam concerns require trust-building, not pressure."
  },
  {
    "id": 24,
    "topic": "objections",
    "language": "en",
    "question": "In an objection drill, the caller says they already have insurance. What distinction matters?",
    "options": [
      "Insurance pays every repair type.",
      "Coverage replaces legal insurance.",
      "Insurance and coverage are identical.",
      "Insurance covers accidents; coverage is mechanical."
    ],
    "correct": 3,
    "explanation": "Insurance and mechanical breakdown coverage must be separated clearly."
  },
  {
    "id": 25,
    "topic": "objections",
    "language": "en",
    "question": "A customer says, “I already have a warranty.” What is the safest positioning?",
    "options": [
      "Promise a cheaper replacement.",
      "Tell them to cancel the plan.",
      "Review updated or additional options.",
      "Say their current plan is useless."
    ],
    "correct": 2,
    "explanation": "Existing coverage should be handled as a review, not attacked."
  },
  {
    "id": 26,
    "topic": "objections",
    "language": "en",
    "question": "When asked, “Where did you get my information?” which answer should be avoided?",
    "options": [
      "The call is for eligibility review.",
      "We partner with dealerships.",
      "We work with vehicle registries.",
      "Your bank sent us your loan file."
    ],
    "correct": 3,
    "explanation": "Bank-source statements create compliance risk."
  },
  {
    "id": 27,
    "topic": "objections",
    "language": "en",
    "question": "Someone asks, “What vehicle?” and sounds suspicious. What helps most?",
    "options": [
      "Tell them the question is irrelevant.",
      "Invent details to sound confident.",
      "Transfer because suspicion is normal.",
      "Explain screen limits and verify the vehicle."
    ],
    "correct": 3,
    "explanation": "Transparency about limited finance information helps build trust."
  },
  {
    "id": 28,
    "topic": "objections",
    "language": "en",
    "question": "Before any transfer attempt, the caller asks, “How much?” before confirming vehicle condition. Which reply is safest?",
    "options": [
      "Pricing depends, and the advisor reviews it.",
      "It is always free today.",
      "The agent can approve a discount.",
      "The bank sets the lowest payment."
    ],
    "correct": 0,
    "explanation": "The agent can bridge pricing to the advisor but should not quote or promise."
  },
  {
    "id": 29,
    "topic": "objections",
    "language": "en",
    "question": "The customer says, “Send me an email first.” What should the agent avoid?",
    "options": [
      "Explaining the advisor can review details.",
      "Promising to send policy documents.",
      "Asking if the vehicle still runs.",
      "Confirming vehicle condition first."
    ],
    "correct": 1,
    "explanation": "The agent should not promise emails or documents they cannot provide."
  },
  {
    "id": 30,
    "topic": "objections",
    "language": "en",
    "question": "A totaled vehicle objection comes up. What should the agent do next?",
    "options": [
      "Mark XFER if they listen.",
      "Promise coverage on the loss.",
      "Transfer for the totaled vehicle.",
      "Ask about a current drivable vehicle."
    ],
    "correct": 3,
    "explanation": "A totaled vehicle should not move forward; verify a current vehicle if there is one."
  },
  {
    "id": 31,
    "topic": "objections",
    "language": "en",
    "question": "The caller says, “That’s not my car.” What is the best response path?",
    "options": [
      "End the call as DNC.",
      "Say the file is always accurate.",
      "Transfer without correcting.",
      "Verify the current vehicle instead."
    ],
    "correct": 3,
    "explanation": "Wrong vehicle information should lead to verification, not a forced transfer."
  },
  {
    "id": 32,
    "topic": "objections",
    "language": "en",
    "question": "A caller has multiple vehicles. What must be confirmed before transfer?",
    "options": [
      "At least one current vehicle runs and may qualify.",
      "Every vehicle has the same mileage.",
      "All vehicles were bought together.",
      "The customer knows each VIN."
    ],
    "correct": 0,
    "explanation": "At least one current vehicle must fit the basic qualification path."
  },
  {
    "id": 33,
    "topic": "objections",
    "language": "en",
    "question": "Before the advisor reviews anything, the caller says, “That’s too expensive.” What should the agent do?",
    "options": [
      "Reframe cost versus major repairs.",
      "Tell them price is fixed.",
      "Promise the cheapest plan.",
      "Agree and end the call at once."
    ],
    "correct": 0,
    "explanation": "The agent can reframe value without promising a specific price."
  },
  {
    "id": 34,
    "topic": "objections",
    "language": "en",
    "question": "A repeat-contact objection comes up: “You called before and I said no.” What is the safer angle?",
    "options": [
      "A claim that refusal expired.",
      "A direct transfer without consent.",
      "A threat of losing legal driving rights.",
      "Updated options as the reason."
    ],
    "correct": 3,
    "explanation": "Updated options create curiosity without pressure or false claims."
  },
  {
    "id": 35,
    "topic": "objections",
    "language": "en",
    "question": "The caller is rude and asks to stop being called. What is the professional path?",
    "options": [
      "Keep rebutting aggressively.",
      "Mirror the customer’s tone.",
      "Stay calm and process removal.",
      "Transfer to avoid conflict."
    ],
    "correct": 2,
    "explanation": "Stop-calling language should be handled professionally, often as DNC."
  },
  {
    "id": 36,
    "topic": "objections",
    "language": "en",
    "question": "A co-signer says they are not the owner. What should the agent check?",
    "options": [
      "Whether they know the advisor’s name.",
      "Whether they can make decisions.",
      "Whether the vehicle has a radio.",
      "Whether they want a free quote."
    ],
    "correct": 1,
    "explanation": "Co-signer status does not automatically mean decision-maker authority."
  },
  {
    "id": 37,
    "topic": "objections",
    "language": "en",
    "question": "The caller gives polite “sure” answers but sounds distracted and disconnected. What is the risk?",
    "options": [
      "The advisor cannot speak first.",
      "The vehicle becomes modified.",
      "The mileage becomes unknown.",
      "Consent may not be meaningful."
    ],
    "correct": 3,
    "explanation": "The agent should confirm understanding instead of relying on weak agreement."
  },
  {
    "id": 38,
    "topic": "objections",
    "language": "en",
    "question": "Before transfer, the customer asks, “Can you just tell me the plan details?” What is the best bridge?",
    "options": [
      "The customer must buy before details.",
      "The agent should invent plan terms.",
      "Plan details are never explained.",
      "The Service Advisor reviews details after verification."
    ],
    "correct": 3,
    "explanation": "The agent should not invent details; they should bridge to the Service Advisor."
  },
  {
    "id": 39,
    "topic": "objections",
    "language": "en",
    "question": "After struggling through the English script, the customer says, “I need Spanish.” What should the agent do?",
    "options": [
      "Ignore it until the advisor joins.",
      "Mark XFER as English transfer.",
      "Use the proper Spanish handling path.",
      "Continue the English script anyway."
    ],
    "correct": 2,
    "explanation": "Language preference should be respected and routed correctly."
  },
  {
    "id": 40,
    "topic": "objections",
    "language": "en",
    "question": "The caller asks if the Service Advisor will take “just a few seconds.” What should the agent avoid?",
    "options": [
      "Saying the advisor reviews details.",
      "Asking vehicle waiting questions.",
      "Guaranteeing a short wait time.",
      "Keeping the customer engaged."
    ],
    "correct": 2,
    "explanation": "The agent does not control advisor timing and should not promise it."
  },
  {
    "id": 41,
    "topic": "product",
    "language": "en",
    "question": "Which case is safest to continue toward transfer?",
    "options": [
      "2010 Toyota RAV4, 80,000 miles, runs well.",
      "2022 Tesla Model 3, 30,000 miles, runs well.",
      "2016 Honda Accord, 110,000 miles, runs well.",
      "2019 Ford F-150, 181,000 miles, runs well."
    ],
    "correct": 2,
    "explanation": "The 2016 gas sedan fits year, mileage, vehicle type, and running-condition rules."
  },
  {
    "id": 42,
    "topic": "product",
    "language": "en",
    "question": "A 2020 Tesla Model Y has 30,000 miles and runs well. What matters most?",
    "options": [
      "Running condition overrides type.",
      "The Service Advisor must approve it.",
      "Electric vehicles are excluded.",
      "Low mileage makes it eligible."
    ],
    "correct": 2,
    "explanation": "Electric vehicles are excluded even with low mileage."
  },
  {
    "id": 43,
    "topic": "product",
    "language": "en",
    "question": "A 2011 Chevrolet Malibu has 176,200 miles and runs well. What should the agent understand?",
    "options": [
      "It is over the mileage limit.",
      "It qualifies if financed recently.",
      "The year alone makes it safe.",
      "Running well removes the limit."
    ],
    "correct": 0,
    "explanation": "The basic mileage limit is up to 175,000 miles."
  },
  {
    "id": 44,
    "topic": "product",
    "language": "en",
    "question": "A 2010 Nissan Altima has 92,000 miles and no issues. What is the concern?",
    "options": [
      "Model year is before 2011.",
      "No issues makes it suspicious.",
      "Insurance is missing.",
      "Mileage is too high."
    ],
    "correct": 0,
    "explanation": "Vehicles before 2011 are outside the basic eligibility rule."
  },
  {
    "id": 45,
    "topic": "product",
    "language": "en",
    "question": "A 2018 Toyota Camry runs, but the customer says it is missing a tire. What is best?",
    "options": [
      "Ignore it because the engine runs.",
      "Treat it as good running condition.",
      "Promise tire replacement coverage.",
      "Clarify if it is safely drivable now."
    ],
    "correct": 3,
    "explanation": "A missing tire creates a current condition concern that must be clarified."
  },
  {
    "id": 46,
    "topic": "product",
    "language": "en",
    "question": "A 2017 Ford Escape has 125,000 miles, but the check engine light is on today. What should the agent avoid?",
    "options": [
      "Treating it as clearly qualified.",
      "Asking what issue is happening.",
      "Clarifying whether it still drives.",
      "Noting there is a warning light."
    ],
    "correct": 0,
    "explanation": "Current warning lights or issues must be clarified before transfer."
  },
  {
    "id": 47,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Kia Optima starts but cannot shift into gear. What does that suggest?",
    "options": [
      "The issue is cosmetic only.",
      "The vehicle is automatically eligible.",
      "Mileage becomes the only rule.",
      "Good running condition is not confirmed."
    ],
    "correct": 3,
    "explanation": "A vehicle that cannot shift may not be in good running condition."
  },
  {
    "id": 48,
    "topic": "product",
    "language": "en",
    "question": "A 2019 Dodge Charger has accident body damage. What is safest to say?",
    "options": [
      "The agent can approve bodywork.",
      "Accident and bodywork damage are excluded.",
      "All collision repairs are covered.",
      "Insurance and coverage are the same."
    ],
    "correct": 1,
    "explanation": "The product focuses on mechanical breakdown, not collision or cosmetic repair."
  },
  {
    "id": 49,
    "topic": "product",
    "language": "en",
    "question": "A 2015 Hyundai Sonata runs well but needs worn brake pads. What should the agent know?",
    "options": [
      "Worn pads always qualify the car.",
      "The advisor must cover brake pads.",
      "Wear items are not the coverage focus.",
      "Wear items replace insurance."
    ],
    "correct": 2,
    "explanation": "Normal wear items should not be promised as covered."
  },
  {
    "id": 50,
    "topic": "product",
    "language": "en",
    "question": "A 2014 Jeep Wrangler has modified suspension. Which statement is safest?",
    "options": [
      "Modified parts themselves are excluded.",
      "All modified vehicles are fully covered.",
      "The bank decides modified repairs.",
      "All modifications improve eligibility."
    ],
    "correct": 0,
    "explanation": "Modified parts are excluded, though other parts may still be reviewed."
  },
  {
    "id": 51,
    "topic": "product",
    "language": "en",
    "question": "Where can approved repairs generally be handled?",
    "options": [
      "Only the original dealership.",
      "Only the finance company garage.",
      "Only repair shops in Texas.",
      "Authorized repair facilities nationwide."
    ],
    "correct": 3,
    "explanation": "Approved repairs are not limited to the original dealership."
  },
  {
    "id": 52,
    "topic": "product",
    "language": "en",
    "question": "A customer has a 2019 motorcycle with 12,000 miles. What should the agent remember?",
    "options": [
      "It qualifies if the advisor agrees.",
      "Motorcycles are excluded vehicle types.",
      "Coverage is automatic with insurance.",
      "Low mileage overrides vehicle type."
    ],
    "correct": 1,
    "explanation": "Motorcycles are listed among vehicles not covered."
  },
  {
    "id": 53,
    "topic": "product",
    "language": "en",
    "question": "The caller has a 2009 SUV, a 2018 sedan, and a 2022 EV. What should be checked before transfer?",
    "options": [
      "Whether the current qualifying vehicle is the 2018 sedan.",
      "Whether every vehicle has the same VIN.",
      "Whether the 2022 EV has low mileage only.",
      "Whether the oldest vehicle decides the file."
    ],
    "correct": 0,
    "explanation": "The agent should focus on a current vehicle that can meet year, type, mileage, and running rules."
  },
  {
    "id": 54,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Ford Fusion has a current engine problem. What should the agent avoid promising?",
    "options": [
      "That the advisor reviews options.",
      "That mechanical coverage is different.",
      "That running condition matters.",
      "That the existing issue will be fixed."
    ],
    "correct": 3,
    "explanation": "Agents must not promise coverage for existing or current issues."
  },
  {
    "id": 55,
    "topic": "product",
    "language": "en",
    "question": "How should factory warranty be compared with extended coverage?",
    "options": [
      "Factory warranty starts after coverage.",
      "They are the exact same product.",
      "Insurance renews factory warranty.",
      "Factory warranty is limited; extended coverage is separate."
    ],
    "correct": 3,
    "explanation": "Factory warranty and extended coverage are different concepts."
  },
  {
    "id": 56,
    "topic": "product",
    "language": "en",
    "question": "What is the key insurance distinction?",
    "options": [
      "Coverage is required like insurance.",
      "Insurance covers every mechanical issue.",
      "Insurance and coverage are identical.",
      "Insurance covers accidents, not breakdown focus."
    ],
    "correct": 3,
    "explanation": "Agents must separate accident insurance from mechanical breakdown coverage."
  },
  {
    "id": 57,
    "topic": "product",
    "language": "en",
    "question": "A customer asks if the plan can add coverage after factory coverage ends. What is accurate?",
    "options": [
      "It may provide additional miles after factory coverage.",
      "It only covers accident liability.",
      "It removes the need for insurance.",
      "It always renews the factory warranty."
    ],
    "correct": 0,
    "explanation": "Extended coverage is separate and can add mechanical protection after factory coverage."
  },
  {
    "id": 58,
    "topic": "product",
    "language": "en",
    "question": "A financed electric vehicle is under 175,000 miles. What should the agent do?",
    "options": [
      "Treat financing as the main rule.",
      "Do not treat it as eligible.",
      "Transfer because mileage is fine.",
      "Ignore the electric vehicle rule."
    ],
    "correct": 1,
    "explanation": "Financing does not override an electric-vehicle exclusion."
  },
  {
    "id": 59,
    "topic": "product",
    "language": "en",
    "question": "The caller does not know exact mileage but thinks it is around 170,000. What is best?",
    "options": [
      "Assume it is under the limit.",
      "Mark XFER because it is close.",
      "Say mileage does not matter.",
      "Clarify carefully before treating it as qualified."
    ],
    "correct": 3,
    "explanation": "When near the limit, the agent should not assume eligibility."
  },
  {
    "id": 60,
    "topic": "product",
    "language": "en",
    "question": "Which case should raise the strongest eligibility concern?",
    "options": [
      "2012 Mazda 3 with 90,000 miles.",
      "2018 Toyota Corolla with 120,000 miles.",
      "2019 Chevrolet Traverse with 182,000 miles.",
      "2015 Honda Civic with 75,000 miles."
    ],
    "correct": 2,
    "explanation": "Over 175,000 miles is outside the stated mileage rule."
  },
  {
    "id": 61,
    "topic": "product",
    "language": "en",
    "question": "A 2011 Subaru Outback has exactly 175,000 miles and runs normally. What is the best reading of the rule?",
    "options": [
      "It may still be within the mileage limit.",
      "It is automatically excluded by mileage.",
      "The year makes it impossible.",
      "It only qualifies if electric."
    ],
    "correct": 0,
    "explanation": "The rule says up to 175,000 miles; over that limit is the concern."
  },
  {
    "id": 62,
    "topic": "product",
    "language": "en",
    "question": "A 2012 Toyota Corolla has 175,001 miles and runs well. What should the agent do?",
    "options": [
      "Treat it as under the limit.",
      "Do not treat it as eligible by mileage.",
      "Ignore the extra mile.",
      "Transfer because it is a Toyota."
    ],
    "correct": 1,
    "explanation": "Even one mile over the limit is outside the basic guideline."
  },
  {
    "id": 63,
    "topic": "product",
    "language": "en",
    "question": "A 2023 Rivian truck has 20,000 miles and no issues. Which rule matters most?",
    "options": [
      "The low mileage clears the file.",
      "Electric vehicle status blocks eligibility.",
      "The truck body style is enough.",
      "Newer vehicles always qualify."
    ],
    "correct": 1,
    "explanation": "Electric vehicles remain excluded regardless of mileage."
  },
  {
    "id": 64,
    "topic": "product",
    "language": "en",
    "question": "A 2018 Lamborghini has 22,000 miles and runs well. What should the agent remember?",
    "options": [
      "Exotic exceptions can be excluded.",
      "Low mileage overrides all rules.",
      "The bank decides the vehicle type.",
      "It qualifies because it is newer than 2011."
    ],
    "correct": 0,
    "explanation": "The training material lists exotic exceptions such as Lamborghinis as not covered."
  },
  {
    "id": 65,
    "topic": "product",
    "language": "en",
    "question": "A 2017 cargo trailer is attached to the customer’s truck. What should be treated carefully?",
    "options": [
      "Trailers are excluded vehicle types.",
      "Trailers qualify if the truck runs.",
      "Trailers qualify with low mileage.",
      "The advisor must cover trailers."
    ],
    "correct": 0,
    "explanation": "Trailers are listed as excluded vehicle types."
  },
  {
    "id": 66,
    "topic": "product",
    "language": "en",
    "question": "A 2016 Honda CR-V has 140,000 miles but is currently in the shop and not drivable. What is the issue?",
    "options": [
      "Mileage is the only factor.",
      "Good running condition is not confirmed.",
      "The model is before 2011.",
      "SUVs are always excluded."
    ],
    "correct": 1,
    "explanation": "The vehicle must still run; current non-drivable status is a concern."
  },
  {
    "id": 67,
    "topic": "product",
    "language": "en",
    "question": "A 2015 Nissan Sentra has 135,000 miles and only needs an oil change. What is the safest view?",
    "options": [
      "Routine maintenance is not the coverage focus.",
      "Oil changes make it ineligible.",
      "The advisor covers all maintenance.",
      "The vehicle is electric by default."
    ],
    "correct": 0,
    "explanation": "Normal maintenance should not be promised as covered."
  },
  {
    "id": 68,
    "topic": "product",
    "language": "en",
    "question": "A 2020 Chevy Bolt has 60,000 miles. What is the main qualification problem?",
    "options": [
      "It is an electric vehicle.",
      "It is above the mileage limit.",
      "It is older than 2011.",
      "It has no finance history."
    ],
    "correct": 0,
    "explanation": "Electric vehicles are excluded."
  },
  {
    "id": 69,
    "topic": "product",
    "language": "en",
    "question": "A 2013 Ford Focus has 172,000 miles and a transmission slipping today. What should happen before transfer?",
    "options": [
      "Clarify the current mechanical issue.",
      "Treat mileage as enough.",
      "Promise transmission repair.",
      "Skip because it is after 2011."
    ],
    "correct": 0,
    "explanation": "Current mechanical issues must be clarified and not promised as covered."
  },
  {
    "id": 70,
    "topic": "product",
    "language": "en",
    "question": "A 2021 Toyota Corolla has 40,000 miles, runs well, and is not electric. What is the safest conclusion?",
    "options": [
      "It appears basically eligible to continue.",
      "It is excluded because it is too new.",
      "It is excluded because mileage is low.",
      "It must be marked wrong vehicle."
    ],
    "correct": 0,
    "explanation": "This case meets the basic year, mileage, type, and running-condition rules."
  },
  {
    "id": 71,
    "topic": "callflow",
    "language": "en",
    "question": "During the 3-way process, the customer hangs up before speaking to the Service Advisor. What should the agent do?",
    "options": [
      "Mark Dead Air for the advisor.",
      "Use Hung Up Both Lines and Call Back.",
      "Use Leave 3-Way Call and XFER.",
      "Keep the advisor ringing alone."
    ],
    "correct": 1,
    "explanation": "This prevents a dead-air transfer to the Service Advisor."
  },
  {
    "id": 72,
    "topic": "callflow",
    "language": "en",
    "question": "Why is “Leave 3-Way Call” dangerous after the customer hangs up?",
    "options": [
      "It changes vehicle mileage.",
      "It sends an automatic Spanish route.",
      "It removes the callback option.",
      "The advisor may receive a ringing call with no customer."
    ],
    "correct": 3,
    "explanation": "Leaving the 3-way can create a dead-air call for the Service Advisor."
  },
  {
    "id": 73,
    "topic": "callflow",
    "language": "en",
    "question": "The Service Advisor joins but stays silent for several seconds. What should the agent do?",
    "options": [
      "Stay silent until someone hangs up.",
      "Tell the customer to call back.",
      "Prompt the advisor and control the handoff.",
      "Disconnect and mark XFER."
    ],
    "correct": 2,
    "explanation": "The agent should prevent silence by getting the advisor’s attention."
  },
  {
    "id": 74,
    "topic": "callflow",
    "language": "en",
    "question": "Who should speak first when the Service Advisor joins?",
    "options": [
      "No one until 15 seconds pass.",
      "The Service Advisor.",
      "The customer without introduction.",
      "The agent before anyone else."
    ],
    "correct": 1,
    "explanation": "The agent should wait for the Service Advisor to answer before introducing the customer."
  },
  {
    "id": 75,
    "topic": "callflow",
    "language": "en",
    "question": "What confirms a real handoff?",
    "options": [
      "The advisor line only rang once.",
      "The customer said hello before transfer.",
      "The agent pressed transfer.",
      "Advisor and customer are actively talking."
    ],
    "correct": 3,
    "explanation": "A valid handoff requires active communication, not just dialing."
  },
  {
    "id": 76,
    "topic": "callflow",
    "language": "en",
    "question": "The customer asks the Service Advisor for a callback. How should it be handled?",
    "options": [
      "Call Back, not clean XFER.",
      "XFER because the advisor joined.",
      "DAIR because the call changed.",
      "SPANIS because callback was requested."
    ],
    "correct": 0,
    "explanation": "A callback request with the advisor should not count as a clean XFER."
  },
  {
    "id": 77,
    "topic": "callflow",
    "language": "en",
    "question": "The customer immediately asks the advisor for Spanish before any English conversation. What is the issue?",
    "options": [
      "The vehicle becomes wrong number.",
      "It should be Answering Machine.",
      "The transfer is valid because lines connected.",
      "No meaningful English SA conversation occurred."
    ],
    "correct": 3,
    "explanation": "An English XFER needs meaningful English communication with the Service Advisor."
  },
  {
    "id": 78,
    "topic": "callflow",
    "language": "en",
    "question": "The customer speaks English with the Service Advisor for 18 seconds, then asks for Spanish. How should QA view it?",
    "options": [
      "Automatic SPANIS with no review.",
      "The English handoff requirement was likely met.",
      "Invalid only because Spanish was mentioned.",
      "Dead Air because language changed."
    ],
    "correct": 1,
    "explanation": "If meaningful English conversation happened long enough first, the handoff can still be valid."
  },
  {
    "id": 79,
    "topic": "callflow",
    "language": "en",
    "question": "A child answers and agrees to “hear options” for the household vehicle. What should the agent do?",
    "options": [
      "Transfer because someone agreed.",
      "Ask for an adult decision maker.",
      "Mark XFER after the yes.",
      "Ask the child for mileage only."
    ],
    "correct": 1,
    "explanation": "A child cannot provide valid decision-making approval."
  },
  {
    "id": 80,
    "topic": "callflow",
    "language": "en",
    "question": "A co-signer says they do not make vehicle decisions. What is the best path?",
    "options": [
      "Transfer because they are on file.",
      "Ask for the decision maker or callback.",
      "Treat it as completed XFER.",
      "Push until they agree."
    ],
    "correct": 1,
    "explanation": "The call should not be forced if the person cannot decide."
  },
  {
    "id": 81,
    "topic": "callflow",
    "language": "en",
    "question": "The customer answers “yes” to everything but gives unrelated replies. What should the agent verify?",
    "options": [
      "That the customer likes the vehicle color.",
      "That the file has the street address.",
      "That the advisor can close faster.",
      "That they truly understand the call."
    ],
    "correct": 3,
    "explanation": "Polite agreement is not enough if comprehension is doubtful."
  },
  {
    "id": 82,
    "topic": "callflow",
    "language": "en",
    "question": "While waiting for the advisor, silence lasts too long. What helps protect the call?",
    "options": [
      "Ask for card information.",
      "Ask light vehicle-related questions.",
      "Promise the advisor is ready now.",
      "Mute until the advisor joins."
    ],
    "correct": 1,
    "explanation": "Waiting questions reduce dead air and keep the customer engaged."
  },
  {
    "id": 83,
    "topic": "callflow",
    "language": "en",
    "question": "After qualifying, the customer says no to being transferred. What should the agent avoid?",
    "options": [
      "Respecting the refusal.",
      "Dialing the advisor anyway.",
      "Using the correct disposition.",
      "Documenting the outcome."
    ],
    "correct": 1,
    "explanation": "Qualification alone does not allow transfer without consent."
  },
  {
    "id": 84,
    "topic": "callflow",
    "language": "en",
    "question": "The advisor line rings but no advisor answers. What should the agent avoid?",
    "options": [
      "Following callback handling if needed.",
      "Counting it as valid XFER.",
      "Protecting the customer experience.",
      "Avoiding dead-air transfer."
    ],
    "correct": 1,
    "explanation": "A valid XFER requires a Service Advisor and customer handoff."
  },
  {
    "id": 85,
    "topic": "callflow",
    "language": "en",
    "question": "On a live transfer audit, the agent introduces the customer before the advisor speaks. What is the risk?",
    "options": [
      "Mileage is reset.",
      "The call becomes voicemail.",
      "The handoff may not be controlled.",
      "The customer becomes co-signer."
    ],
    "correct": 2,
    "explanation": "The advisor should speak first so the introduction lands cleanly."
  },
  {
    "id": 86,
    "topic": "callflow",
    "language": "en",
    "question": "The customer hangs up after the agent introduction but before any advisor conversation. What should happen?",
    "options": [
      "Count it because intro happened.",
      "Use Answering Machine.",
      "Do not count it as clean XFER.",
      "Mark SPXFER automatically."
    ],
    "correct": 2,
    "explanation": "Introduction alone does not prove an active advisor/customer conversation."
  },
  {
    "id": 87,
    "topic": "callflow",
    "language": "en",
    "question": "During an English transfer wait, the customer starts speaking Spanish. What should the agent consider?",
    "options": [
      "The vehicle is automatically invalid.",
      "English transfer must be forced.",
      "DNC is required immediately.",
      "Preferred language may need confirmation."
    ],
    "correct": 3,
    "explanation": "A language switch can indicate the customer needs Spanish handling."
  },
  {
    "id": 88,
    "topic": "callflow",
    "language": "en",
    "question": "The agent stays on the line for a long time after both parties are already talking. What is the coaching point?",
    "options": [
      "Stay until the full sale closes.",
      "Leave before the advisor speaks.",
      "Mute and count extra time.",
      "Stay enough, not longer than necessary."
    ],
    "correct": 3,
    "explanation": "The 15-second rule protects the handoff; it is not a reason to stay unnecessarily."
  },
  {
    "id": 89,
    "topic": "callflow",
    "language": "en",
    "question": "Before transfer, the customer says, “I don’t want to talk to anyone else.” What should the agent avoid?",
    "options": [
      "Clarifying the concern.",
      "Offering callback if needed.",
      "Transferring without renewed consent.",
      "Respecting the refusal."
    ],
    "correct": 2,
    "explanation": "A clear refusal means consent is not present."
  },
  {
    "id": 90,
    "topic": "callflow",
    "language": "en",
    "question": "The advisor says hello, the customer says hello, then both stop. What should the agent do before leaving?",
    "options": [
      "Confirm they are actively talking.",
      "Leave immediately after two hellos.",
      "Mark XFER and mute forever.",
      "Ask for payment details."
    ],
    "correct": 0,
    "explanation": "Two greetings may not be enough to confirm an active handoff."
  },
  {
    "id": 91,
    "topic": "dosdonts",
    "language": "en",
    "question": "When is DAIR the best disposition?",
    "options": [
      "The customer asks for callback.",
      "No real person ever responds on the line.",
      "The customer says not interested.",
      "The customer requests Spanish."
    ],
    "correct": 1,
    "explanation": "DAIR is for complete dead air, not a normal refusal or callback."
  },
  {
    "id": 92,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer hears the script and hangs up. Which disposition usually fits better than DAIR?",
    "options": [
      "Manage",
      "NI",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "If there was contact and the customer drops after the pitch, NI usually fits better than DAIR."
  },
  {
    "id": 93,
    "topic": "dosdonts",
    "language": "en",
    "question": "The caller says, “Stop calling me or I’ll report this.” Which disposition fits?",
    "options": [
      "DNC",
      "XFER",
      "SPANIS",
      "CALLBK"
    ],
    "correct": 0,
    "explanation": "Removal requests, threats, or stop-calling language should be handled as DNC."
  },
  {
    "id": 94,
    "topic": "dosdonts",
    "language": "en",
    "question": "The call reaches a voicemail greeting. Which disposition fits?",
    "options": [
      "WRNGVE",
      "NI",
      "XFER",
      "A"
    ],
    "correct": 3,
    "explanation": "Answering Machine is used for voicemail or automated answering systems."
  },
  {
    "id": 95,
    "topic": "dosdonts",
    "language": "en",
    "question": "The customer is busy and still refuses after the callback rebuttal. What disposition fits?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "A clear later-time request or callback outcome should be CALLBK."
  },
  {
    "id": 96,
    "topic": "dosdonts",
    "language": "en",
    "question": "A customer needs Spanish, and the agent routes blindly without a Spanish Service Advisor handoff. Which disposition fits?",
    "options": [
      "SPANIS",
      "XFER",
      "SPXFER",
      "DAIR"
    ],
    "correct": 0,
    "explanation": "SPANIS is for blind Spanish routing, not a direct Spanish transfer."
  },
  {
    "id": 97,
    "topic": "dosdonts",
    "language": "en",
    "question": "The agent directly connects a Spanish-speaking customer to a Spanish Service Advisor. Which disposition fits?",
    "options": [
      "CALLBK",
      "A",
      "SPXFER",
      "SPANIS"
    ],
    "correct": 2,
    "explanation": "SPXFER is for direct Spanish transfers."
  },
  {
    "id": 98,
    "topic": "dosdonts",
    "language": "en",
    "question": "A person says this is the wrong number. Which disposition area matters?",
    "options": [
      "Wrong Number handling.",
      "Clean English XFER.",
      "Answering Machine handling.",
      "Restroom pause handling."
    ],
    "correct": 0,
    "explanation": "Wrong number should not be forced into a transfer outcome."
  },
  {
    "id": 99,
    "topic": "dosdonts",
    "language": "en",
    "question": "What makes XFER valid?",
    "options": [
      "English transfer with real advisor/customer handoff.",
      "Agent dials without customer approval.",
      "Advisor only receives a ringing call.",
      "Customer hangs up before advisor speaks."
    ],
    "correct": 0,
    "explanation": "XFER should reflect a successful English transfer, not just a dial attempt."
  },
  {
    "id": 100,
    "topic": "dosdonts",
    "language": "en",
    "question": "Which case belongs in Needs Practice coaching?",
    "options": [
      "Agent confirms condition and gets consent.",
      "Agent clarifies language preference.",
      "Agent waits while both parties talk.",
      "Agent skips purpose and transfers confused customer."
    ],
    "correct": 3,
    "explanation": "Skipping the purpose and transferring a confused customer creates invalid/QA risk."
  },
  {
    "id": 101,
    "topic": "script",
    "language": "es",
    "question": "Durante una revisión de script, el cliente pregunta si la llamada bajará sus pagos mensuales y el agente transfiere sin responder. ¿Qué debería marcar QA?",
    "options": [
      "No se aclaró la duda sobre pagos.",
      "El millaje se revisó demasiado tarde.",
      "La espera del transfer fue algo larga.",
      "No se confirmó la ubicación del dealer."
    ],
    "correct": 0,
    "explanation": "El agente debe responder o aclarar preguntas importantes del cliente antes de transferir."
  },
  {
    "id": 102,
    "topic": "script",
    "language": "es",
    "question": "En la apertura, alguien pregunta: “¿Entonces esto viene de mi banco?” ¿Qué respuesta mantiene la llamada más segura?",
    "options": [
      "Su banco pidió que llamáramos.",
      "Su lender aprobó la cobertura.",
      "Trabajamos con dealers y registros vehiculares.",
      "La financiera envió el archivo."
    ],
    "correct": 2,
    "explanation": "El agente no debe decir que el banco o lender entregó el archivo."
  },
  {
    "id": 103,
    "topic": "script",
    "language": "es",
    "question": "Antes de preparar el transfer, el agente dice: “No tiene ningún costo; solo escuche.” ¿Por qué es riesgoso?",
    "options": [
      "Puede sonar como promesa de servicio gratis.",
      "Confirma la condición del vehículo con claridad.",
      "Le da demasiado contexto al Service Advisor.",
      "Explica el seguro demasiado temprano."
    ],
    "correct": 0,
    "explanation": "Evita frases que puedan entenderse como cobertura gratis o costo garantizado en cero."
  },
  {
    "id": 104,
    "topic": "script",
    "language": "es",
    "question": "Después de preguntar si el vehículo funciona, el cliente dice “okay”, pero nunca acepta hablar con el Service Advisor. ¿Qué falta?",
    "options": [
      "Marca y modelo exactos.",
      "Dirección completa del cliente.",
      "Aprobación clara para transferir.",
      "Cotización mensual final."
    ],
    "correct": 2,
    "explanation": "Confirmar que el vehículo funciona no es lo mismo que aceptar la transferencia."
  },
  {
    "id": 105,
    "topic": "script",
    "language": "es",
    "question": "Un cliente responde en inglés, pero parece inseguro y confundido con preguntas básicas. ¿Qué debe hacer el agente antes de avanzar?",
    "options": [
      "Preguntar el idioma de preferencia.",
      "Forzar un English XFER.",
      "Leer el script más rápido.",
      "Marcar NI inmediatamente."
    ],
    "correct": 0,
    "explanation": "Si no está claro que entiende, debe verificarse el idioma de preferencia."
  },
  {
    "id": 106,
    "topic": "script",
    "language": "es",
    "question": "El agente cambia palabras pequeñas de conexión, pero mantiene el sentido requerido. ¿Cuándo es aceptable?",
    "options": [
      "Cuando omite el nombre de la compañía.",
      "Cuando ignora la condición del vehículo.",
      "Cuando mantiene los puntos de compliance.",
      "Cuando asume aprobación para transferir."
    ],
    "correct": 2,
    "explanation": "Puede sonar natural solo si conserva el significado requerido y los puntos de compliance."
  },
  {
    "id": 107,
    "topic": "script",
    "language": "es",
    "question": "Antes de marcar, el cliente pregunta: “¿De qué se trata?” ¿Qué respuesta es más segura?",
    "options": [
      "Se está renovando su garantía de fábrica.",
      "El dealer ya aprobó un plan.",
      "Esto mantiene legal su vehículo.",
      "Es una revisión de posibles opciones de cobertura."
    ],
    "correct": 3,
    "explanation": "La llamada debe presentarse como revisión de cobertura, no como renovación obligatoria o garantizada."
  },
  {
    "id": 108,
    "topic": "script",
    "language": "es",
    "question": "En una revisión de compliance, el cliente pregunta: “¿Quiénes son exactamente?” ¿Qué debe evitar el agente?",
    "options": [
      "Explicar con calma el propósito.",
      "Hacerse pasar por el dealer.",
      "Identificarse como Vehicle Services Group.",
      "Continuar solo después de aprobación."
    ],
    "correct": 1,
    "explanation": "El agente no debe decir que es del dealer, banco, fabricante o marca del vehículo."
  },
  {
    "id": 109,
    "topic": "script",
    "language": "es",
    "question": "Durante la introducción, el agente dice: “Su garantía expiró y este es su aviso final.” ¿Cuál es el problema?",
    "options": [
      "Verifica el idioma de preferencia.",
      "Da la disposición correcta.",
      "Crea urgencia no respaldada.",
      "Confirma primero al Service Advisor."
    ],
    "correct": 2,
    "explanation": "Crear urgencia no respaldada puede generar riesgo de compliance y QA."
  },
  {
    "id": 110,
    "topic": "script",
    "language": "es",
    "question": "Antes de verificar elegibilidad, el cliente pregunta el precio. ¿Qué debe hacer el agente?",
    "options": [
      "Saltar condición y transferir rápido.",
      "Llevar el tema de precio al Service Advisor después de calificar.",
      "Decir que la cotización siempre es gratis.",
      "Dar el pago mensual más barato."
    ],
    "correct": 1,
    "explanation": "El agente no cotiza precio; debe calificar y hacer puente al Service Advisor."
  },
  {
    "id": 111,
    "topic": "script",
    "language": "es",
    "question": "Un cliente dice: “Gracias, estoy bien”, y el agente solo responde “sí” antes de transferir. ¿Qué faltó?",
    "options": [
      "Confirmar ubicación del dealer.",
      "Manejo de objeción y consentimiento.",
      "Solo cálculo de millaje.",
      "Corrección de pause code."
    ],
    "correct": 1,
    "explanation": "Una respuesta casual no reemplaza un rebuttal ni prueba consentimiento."
  },
  {
    "id": 112,
    "topic": "script",
    "language": "es",
    "question": "La información del vehículo en el archivo parece incorrecta. ¿Qué dirección del script es mejor?",
    "options": [
      "Decir que el archivo nunca falla.",
      "Marcar DNC porque el dato está mal.",
      "Tratarlo como verificación del vehículo actual.",
      "Transferir antes de preguntar."
    ],
    "correct": 2,
    "explanation": "La información incorrecta o desactualizada debe usarse para verificar el vehículo actual."
  },
  {
    "id": 113,
    "topic": "script",
    "language": "es",
    "question": "El agente dice: “El Service Advisor le va a bajar el pago.” ¿Qué está mal?",
    "options": [
      "Hace el handoff demasiado limpio.",
      "Promete un resultado que el agente no controla.",
      "Pide aprobación demasiado clara.",
      "Confirma elegibilidad muy lento."
    ],
    "correct": 1,
    "explanation": "El agente no debe prometer pagos más bajos ni resultados garantizados."
  },
  {
    "id": 114,
    "topic": "script",
    "language": "es",
    "question": "El agente dice: “Se lo presento, okay?” y el cliente pregunta: “¿A quién?” ¿Qué debe pasar?",
    "options": [
      "Marcar XFER después de la pregunta.",
      "Marcar primero y explicar después.",
      "Ignorarlo como comentario pequeño.",
      "Aclarar el rol del Service Advisor."
    ],
    "correct": 3,
    "explanation": "Si el cliente no entiende la transferencia, el agente debe aclarar antes de marcar."
  },
  {
    "id": 115,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta si debe comprar algo hoy. ¿Qué respuesta es más segura?",
    "options": [
      "El agente puede aprobar la compra.",
      "El banco ya eligió el plan.",
      "Sí, la compra es obligatoria hoy.",
      "El Service Advisor revisa opciones; el cliente decide."
    ],
    "correct": 3,
    "explanation": "El agente no debe presentar la llamada como obligatoria ni forzar una compra."
  },
  {
    "id": 116,
    "topic": "script",
    "language": "es",
    "question": "El cliente pregunta de qué vehículo hablan, pero el agente solo tiene información financiera. ¿Qué es más seguro?",
    "options": [
      "Usar la info financiera y verificar el vehículo actual.",
      "Inventar la marca y modelo más probable.",
      "Saltar la verificación del vehículo.",
      "Decir que el cliente debería saber."
    ],
    "correct": 0,
    "explanation": "Sé transparente sobre la información disponible y verifica el vehículo actual."
  },
  {
    "id": 117,
    "topic": "script",
    "language": "es",
    "question": "Antes de marcar, el agente dice que la cobertura viene “del fabricante.” ¿Qué debería marcar QA?",
    "options": [
      "Representar mal el origen de la cobertura.",
      "Usar claramente el nombre del cliente.",
      "Esperar a que hable el Service Advisor.",
      "Preguntar si el vehículo funciona."
    ],
    "correct": 0,
    "explanation": "El agente no debe decir que representa al fabricante o marca del vehículo."
  },
  {
    "id": 118,
    "topic": "script",
    "language": "es",
    "question": "El cliente hace una pregunta directa durante la apertura. ¿Cuál es la mejor regla?",
    "options": [
      "Responder o aclarar antes de avanzar.",
      "Ignorar preguntas hasta que entre el Service Advisor.",
      "Transferir más rápido para evitar objeciones.",
      "Repetir el script más fuerte."
    ],
    "correct": 0,
    "explanation": "Preguntas sin responder pueden hacer que la transferencia sea confusa o inválida."
  },
  {
    "id": 119,
    "topic": "script",
    "language": "es",
    "question": "El agente obtiene aprobación, pero nunca presenta al cliente por nombre al Service Advisor. ¿Cuál es el problema?",
    "options": [
      "La llamada se volvió voicemail.",
      "El cliente pidió RR.",
      "El vehículo se volvió eléctrico.",
      "El handoff quedó incompleto."
    ],
    "correct": 3,
    "explanation": "El handoff debe incluir una presentación clara, no solo conectar líneas."
  },
  {
    "id": 120,
    "topic": "script",
    "language": "es",
    "question": "Justo antes del transfer, el cliente dice: “No entiendo qué quiere decir.” ¿Qué no debe hacer el agente?",
    "options": [
      "Preguntar idioma de preferencia si aplica.",
      "Repetir el propósito de forma simple.",
      "Confirmar comprensión primero.",
      "Forzar el transfer sin aclarar."
    ],
    "correct": 3,
    "explanation": "La confusión debe aclararse antes de considerar limpio el consentimiento para transferir."
  },
  {
    "id": 121,
    "topic": "objections",
    "language": "es",
    "question": "Durante manejo de objeciones, el cliente dice “no me interesa” pero no da razón. ¿Cuál es el mejor primer paso?",
    "options": [
      "Transferir antes de que cuelgue.",
      "Preguntar una razón breve para trabajarla.",
      "Discutir sobre costos de reparación.",
      "Marcar DNC inmediatamente."
    ],
    "correct": 1,
    "explanation": "El agente necesita entender la razón antes de elegir el mejor rebuttal."
  },
  {
    "id": 122,
    "topic": "objections",
    "language": "es",
    "question": "Aparece una objeción de tiempo: “Estoy ocupado.” El cliente no rechaza totalmente. ¿Qué debe evitar el agente?",
    "options": [
      "Prometer que tomará menos de un minuto.",
      "Respetar la objeción de tiempo.",
      "Preguntar si más tarde funciona.",
      "Ofrecer una mejor hora de callback."
    ],
    "correct": 0,
    "explanation": "El agente no debe prometer un tiempo exacto o corto que no controla."
  },
  {
    "id": 123,
    "topic": "objections",
    "language": "es",
    "question": "Surge una duda de scam antes de avanzar. ¿Qué tono es más seguro?",
    "options": [
      "Calmado, transparente y controlado.",
      "Defensivo y discutidor.",
      "Rápido y despectivo.",
      "Callado hasta que deje de hablar."
    ],
    "correct": 0,
    "explanation": "Las dudas de scam se manejan con confianza y transparencia, no presión."
  },
  {
    "id": 124,
    "topic": "objections",
    "language": "es",
    "question": "En práctica de objeciones, el cliente dice que ya tiene seguro. ¿Qué diferencia importa?",
    "options": [
      "El seguro paga todo tipo de reparación.",
      "La cobertura reemplaza el seguro legal.",
      "Seguro y cobertura son iguales.",
      "El seguro cubre accidentes; la cobertura es mecánica."
    ],
    "correct": 3,
    "explanation": "Seguro y cobertura por fallas mecánicas deben separarse con claridad."
  },
  {
    "id": 125,
    "topic": "objections",
    "language": "es",
    "question": "Un cliente dice: “Ya tengo garantía.” ¿Cuál es el posicionamiento más seguro?",
    "options": [
      "Prometer un reemplazo más barato.",
      "Decirle que cancele el plan.",
      "Revisar opciones actualizadas o adicionales.",
      "Decir que su plan actual no sirve."
    ],
    "correct": 2,
    "explanation": "La cobertura existente se maneja como revisión, no como ataque."
  },
  {
    "id": 126,
    "topic": "objections",
    "language": "es",
    "question": "Cuando preguntan “¿De dónde sacaron mi información?”, ¿qué respuesta debe evitarse?",
    "options": [
      "La llamada es revisión de elegibilidad.",
      "Trabajamos con dealers.",
      "Trabajamos con registros vehiculares.",
      "Su banco nos envió el archivo del préstamo."
    ],
    "correct": 3,
    "explanation": "Decir que el banco dio el archivo crea riesgo de compliance."
  },
  {
    "id": 127,
    "topic": "objections",
    "language": "es",
    "question": "Alguien pregunta: “¿Qué vehículo?” y suena desconfiado. ¿Qué ayuda más?",
    "options": [
      "Decir que la pregunta no importa.",
      "Inventar detalles para sonar seguro.",
      "Transferir porque la sospecha es normal.",
      "Explicar el límite de pantalla y verificar el vehículo."
    ],
    "correct": 3,
    "explanation": "La transparencia sobre la información disponible ayuda a crear confianza."
  },
  {
    "id": 128,
    "topic": "objections",
    "language": "es",
    "question": "Antes de cualquier intento de transfer, el cliente pregunta: “¿Cuánto cuesta?” antes de confirmar condición. ¿Qué respuesta es más segura?",
    "options": [
      "El precio depende y el Service Advisor lo revisa.",
      "Siempre es gratis hoy.",
      "El agente puede aprobar un descuento.",
      "El banco fija el pago más bajo."
    ],
    "correct": 0,
    "explanation": "El agente puede llevar el precio al Service Advisor, pero no debe cotizar ni prometer."
  },
  {
    "id": 129,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Mándeme un email primero.” ¿Qué debe evitar el agente?",
    "options": [
      "Explicar que el Service Advisor revisa detalles.",
      "Prometer enviar documentos de póliza.",
      "Preguntar si el vehículo funciona.",
      "Confirmar primero la condición del vehículo."
    ],
    "correct": 1,
    "explanation": "El agente no debe prometer emails o documentos que no puede enviar."
  },
  {
    "id": 130,
    "topic": "objections",
    "language": "es",
    "question": "Aparece la objeción de vehículo totalizado. ¿Qué debe hacer después el agente?",
    "options": [
      "Marcar XFER si escucha.",
      "Prometer cobertura sobre la pérdida.",
      "Transferir por el vehículo totalizado.",
      "Preguntar por un vehículo actual manejable."
    ],
    "correct": 3,
    "explanation": "Un vehículo totalizado no debe avanzar; verifica si existe un vehículo actual."
  },
  {
    "id": 131,
    "topic": "objections",
    "language": "es",
    "question": "El cliente dice: “Ese no es mi carro.” ¿Cuál es la mejor ruta?",
    "options": [
      "Cerrar la llamada como DNC.",
      "Decir que el archivo siempre está correcto.",
      "Transferir sin corregir.",
      "Verificar el vehículo actual."
    ],
    "correct": 3,
    "explanation": "La información de vehículo incorrecta debe llevar a verificación, no a transfer forzado."
  },
  {
    "id": 132,
    "topic": "objections",
    "language": "es",
    "question": "El cliente tiene varios vehículos. ¿Qué debe confirmarse antes de transferir?",
    "options": [
      "Al menos un vehículo actual funciona y podría calificar.",
      "Todos tienen el mismo millaje.",
      "Todos fueron comprados juntos.",
      "El cliente sabe cada VIN."
    ],
    "correct": 0,
    "explanation": "Al menos un vehículo actual debe cumplir con la ruta básica de calificación."
  },
  {
    "id": 133,
    "topic": "objections",
    "language": "es",
    "question": "Antes de que el Service Advisor revise algo, el cliente dice: “Eso es muy caro.” ¿Qué debe hacer el agente?",
    "options": [
      "Replantear costo frente a reparaciones grandes.",
      "Decir que el precio es fijo.",
      "Prometer el plan más barato.",
      "Aceptar y cerrar de inmediato."
    ],
    "correct": 0,
    "explanation": "El agente puede replantear valor, pero no prometer un precio específico."
  },
  {
    "id": 134,
    "topic": "objections",
    "language": "es",
    "question": "Aparece objeción de contacto repetido: “Ya llamaron y dije que no.” ¿Cuál es el ángulo más seguro?",
    "options": [
      "Decir que el rechazo expiró.",
      "Transferir directo sin consentimiento.",
      "Amenazar con perder derechos para manejar.",
      "Mencionar opciones actualizadas."
    ],
    "correct": 3,
    "explanation": "Las opciones actualizadas crean curiosidad sin presión ni afirmaciones falsas."
  },
  {
    "id": 135,
    "topic": "objections",
    "language": "es",
    "question": "El cliente es grosero y pide que no lo llamen más. ¿Cuál es el camino profesional?",
    "options": [
      "Seguir rebatiendo agresivamente.",
      "Responder con el mismo tono.",
      "Mantener la calma y procesar remoción.",
      "Transferir para evitar conflicto."
    ],
    "correct": 2,
    "explanation": "Pedir que no llamen más debe manejarse profesionalmente, normalmente como DNC."
  },
  {
    "id": 136,
    "topic": "objections",
    "language": "es",
    "question": "Un co-signer dice que no es el dueño. ¿Qué debe verificar el agente?",
    "options": [
      "Si conoce el nombre del Service Advisor.",
      "Si puede tomar decisiones.",
      "Si el vehículo tiene radio.",
      "Si quiere una cotización gratis."
    ],
    "correct": 1,
    "explanation": "Ser co-signer no significa automáticamente tener autoridad de decisión."
  },
  {
    "id": 137,
    "topic": "objections",
    "language": "es",
    "question": "El cliente responde “sure” con educación, pero suena distraído y desconectado. ¿Cuál es el riesgo?",
    "options": [
      "El Service Advisor no puede hablar primero.",
      "El vehículo queda modificado.",
      "El millaje queda desconocido.",
      "El consentimiento puede no ser significativo."
    ],
    "correct": 3,
    "explanation": "El agente debe confirmar comprensión en vez de confiar en una aceptación débil."
  },
  {
    "id": 138,
    "topic": "objections",
    "language": "es",
    "question": "Antes del transfer, el cliente pregunta: “¿Puede decirme los detalles del plan?” ¿Cuál es el mejor puente?",
    "options": [
      "El cliente debe comprar antes de conocer detalles.",
      "El agente debe inventar términos del plan.",
      "Los detalles nunca se explican.",
      "El Service Advisor revisa detalles después de verificar."
    ],
    "correct": 3,
    "explanation": "El agente no debe inventar detalles; debe hacer puente al Service Advisor."
  },
  {
    "id": 139,
    "topic": "objections",
    "language": "es",
    "question": "Después de batallar con el script en inglés, el cliente dice: “Necesito español.” ¿Qué debe hacer el agente?",
    "options": [
      "Ignorarlo hasta que entre el Service Advisor.",
      "Marcar XFER como transferencia en inglés.",
      "Usar el manejo correcto en español.",
      "Continuar el script en inglés."
    ],
    "correct": 2,
    "explanation": "El idioma de preferencia debe respetarse y rutearse correctamente."
  },
  {
    "id": 140,
    "topic": "objections",
    "language": "es",
    "question": "El cliente pregunta si el Service Advisor tomará “solo unos segundos.” ¿Qué debe evitar el agente?",
    "options": [
      "Decir que el Service Advisor revisa detalles.",
      "Hacer preguntas de espera sobre el vehículo.",
      "Garantizar una espera corta.",
      "Mantener al cliente conectado."
    ],
    "correct": 2,
    "explanation": "El agente no controla el tiempo del Service Advisor y no debe prometerlo."
  },
  {
    "id": 141,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso es más seguro para continuar hacia transfer?",
    "options": [
      "Toyota RAV4 2010, 80,000 millas, funciona bien.",
      "Tesla Model 3 2022, 30,000 millas, funciona bien.",
      "Honda Accord 2016, 110,000 millas, funciona bien.",
      "Ford F-150 2019, 181,000 millas, funciona bien."
    ],
    "correct": 2,
    "explanation": "El sedán de gasolina 2016 cumple mejor con año, millaje, tipo de vehículo y condición."
  },
  {
    "id": 142,
    "topic": "product",
    "language": "es",
    "question": "Un Tesla Model Y 2020 tiene 30,000 millas y funciona bien. ¿Qué pesa más?",
    "options": [
      "Que funciona bien anula el tipo.",
      "El Service Advisor debe aprobarlo.",
      "Los vehículos eléctricos están excluidos.",
      "El bajo millaje lo hace elegible."
    ],
    "correct": 2,
    "explanation": "Los vehículos eléctricos están excluidos aunque tengan bajo millaje."
  },
  {
    "id": 143,
    "topic": "product",
    "language": "es",
    "question": "Un Chevrolet Malibu 2011 tiene 176,200 millas y funciona bien. ¿Qué debe entender el agente?",
    "options": [
      "Está sobre el límite de millaje.",
      "Califica si fue financiado recientemente.",
      "El año por sí solo lo hace seguro.",
      "Funcionar bien elimina el límite."
    ],
    "correct": 0,
    "explanation": "El límite básico es hasta 175,000 millas."
  },
  {
    "id": 144,
    "topic": "product",
    "language": "es",
    "question": "Un Nissan Altima 2010 tiene 92,000 millas y no tiene problemas. ¿Cuál es la preocupación?",
    "options": [
      "El modelo es anterior a 2011.",
      "No tener problemas es sospechoso.",
      "Falta seguro.",
      "El millaje es demasiado alto."
    ],
    "correct": 0,
    "explanation": "Los vehículos anteriores a 2011 quedan fuera de la regla básica de elegibilidad."
  },
  {
    "id": 145,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Camry 2018 enciende, pero el cliente dice que le falta una llanta. ¿Qué es mejor?",
    "options": [
      "Ignorarlo porque el motor prende.",
      "Tratarlo como buen funcionamiento.",
      "Prometer reemplazo de llanta.",
      "Aclarar si se puede manejar seguro ahora."
    ],
    "correct": 3,
    "explanation": "Una llanta faltante crea duda de condición actual y debe aclararse."
  },
  {
    "id": 146,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Escape 2017 tiene 125,000 millas, pero tiene check engine hoy. ¿Qué debe evitar el agente?",
    "options": [
      "Tratarlo como claramente calificado.",
      "Preguntar qué problema tiene.",
      "Aclarar si todavía se maneja.",
      "Anotar que hay una luz de advertencia."
    ],
    "correct": 0,
    "explanation": "Las luces o problemas actuales deben aclararse antes del transfer."
  },
  {
    "id": 147,
    "topic": "product",
    "language": "es",
    "question": "Un Kia Optima 2016 prende, pero no cambia de marcha. ¿Qué sugiere eso?",
    "options": [
      "El problema es solo cosmético.",
      "El vehículo califica automáticamente.",
      "El millaje es la única regla.",
      "No se confirmó buen funcionamiento."
    ],
    "correct": 3,
    "explanation": "Un vehículo que no cambia de marcha puede no estar en buenas condiciones de funcionamiento."
  },
  {
    "id": 148,
    "topic": "product",
    "language": "es",
    "question": "Un Dodge Charger 2019 tiene daño de carrocería por accidente. ¿Qué es más seguro decir?",
    "options": [
      "El agente puede aprobar carrocería.",
      "Daños de accidente y carrocería están excluidos.",
      "Todo choque está cubierto.",
      "Seguro y cobertura son iguales."
    ],
    "correct": 1,
    "explanation": "La cobertura se enfoca en fallas mecánicas, no en choques o reparaciones cosméticas."
  },
  {
    "id": 149,
    "topic": "product",
    "language": "es",
    "question": "Un Hyundai Sonata 2015 funciona bien, pero necesita pastillas de freno gastadas. ¿Qué debe saber el agente?",
    "options": [
      "Las pastillas gastadas siempre califican el carro.",
      "El Service Advisor debe cubrir las pastillas.",
      "Wear items no son el foco de cobertura.",
      "Wear items reemplazan el seguro."
    ],
    "correct": 2,
    "explanation": "No se debe prometer cobertura sobre desgaste normal."
  },
  {
    "id": 150,
    "topic": "product",
    "language": "es",
    "question": "Un Jeep Wrangler 2014 tiene suspensión modificada. ¿Qué frase es más segura?",
    "options": [
      "Las partes modificadas están excluidas.",
      "Todo vehículo modificado está totalmente cubierto.",
      "El banco decide reparaciones modificadas.",
      "Toda modificación mejora elegibilidad."
    ],
    "correct": 0,
    "explanation": "Las partes modificadas están excluidas, aunque otras partes podrían revisarse."
  },
  {
    "id": 151,
    "topic": "product",
    "language": "es",
    "question": "¿Dónde se manejan normalmente las reparaciones aprobadas?",
    "options": [
      "Solo en el dealer original.",
      "Solo en el taller de la financiera.",
      "Solo en talleres de Texas.",
      "Talleres autorizados a nivel nacional."
    ],
    "correct": 3,
    "explanation": "Las reparaciones aprobadas no se limitan al dealer original."
  },
  {
    "id": 152,
    "topic": "product",
    "language": "es",
    "question": "Un cliente tiene una motocicleta 2019 con 12,000 millas. ¿Qué debe recordar el agente?",
    "options": [
      "Califica si el Service Advisor acepta.",
      "Las motocicletas están excluidas.",
      "La cobertura es automática con seguro.",
      "El bajo millaje anula el tipo de vehículo."
    ],
    "correct": 1,
    "explanation": "Las motocicletas están entre los tipos de vehículo no cubiertos."
  },
  {
    "id": 153,
    "topic": "product",
    "language": "es",
    "question": "El cliente tiene una SUV 2009, un sedán 2018 y un EV 2022. ¿Qué debe revisar el agente antes de transferir?",
    "options": [
      "Si el vehículo actual que podría calificar es el sedán 2018.",
      "Si todos tienen el mismo VIN.",
      "Si el EV 2022 solo tiene bajo millaje.",
      "Si el vehículo más viejo decide el archivo."
    ],
    "correct": 0,
    "explanation": "El agente debe enfocarse en un vehículo actual que cumpla año, tipo, millaje y condición."
  },
  {
    "id": 154,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Fusion 2016 tiene un problema actual de motor. ¿Qué debe evitar prometer el agente?",
    "options": [
      "Que el Service Advisor revisa opciones.",
      "Que cobertura mecánica es diferente.",
      "Que la condición del vehículo importa.",
      "Que el problema existente será arreglado."
    ],
    "correct": 3,
    "explanation": "El agente no debe prometer cobertura para problemas existentes o actuales."
  },
  {
    "id": 155,
    "topic": "product",
    "language": "es",
    "question": "¿Cómo se debe comparar factory warranty con extended coverage?",
    "options": [
      "Factory warranty empieza después de coverage.",
      "Son exactamente el mismo producto.",
      "El seguro renueva factory warranty.",
      "Factory warranty es limitada; extended coverage es separada."
    ],
    "correct": 3,
    "explanation": "Factory warranty y extended coverage son conceptos diferentes."
  },
  {
    "id": 156,
    "topic": "product",
    "language": "es",
    "question": "¿Cuál es la diferencia clave con el seguro?",
    "options": [
      "Coverage es obligatorio como seguro.",
      "El seguro cubre toda falla mecánica.",
      "Seguro y coverage son idénticos.",
      "El seguro cubre accidentes, no fallas mecánicas."
    ],
    "correct": 3,
    "explanation": "El agente debe separar seguro de accidentes y cobertura de fallas mecánicas."
  },
  {
    "id": 157,
    "topic": "product",
    "language": "es",
    "question": "El cliente pregunta si el plan puede agregar cobertura después de factory coverage. ¿Qué es correcto?",
    "options": [
      "Puede agregar millas después de factory coverage.",
      "Solo cubre responsabilidad por accidente.",
      "Elimina la necesidad de seguro.",
      "Siempre renueva factory warranty."
    ],
    "correct": 0,
    "explanation": "Extended coverage es separada y puede agregar protección mecánica después de factory coverage."
  },
  {
    "id": 158,
    "topic": "product",
    "language": "es",
    "question": "Un vehículo eléctrico financiado está bajo 175,000 millas. ¿Qué debe hacer el agente?",
    "options": [
      "Tomar el financiamiento como regla principal.",
      "No tratarlo como elegible.",
      "Transferir porque el millaje sirve.",
      "Ignorar la regla de vehículo eléctrico."
    ],
    "correct": 1,
    "explanation": "El financiamiento no elimina la exclusión de vehículos eléctricos."
  },
  {
    "id": 159,
    "topic": "product",
    "language": "es",
    "question": "El cliente no sabe el millaje exacto, pero cree que está cerca de 170,000. ¿Qué es mejor?",
    "options": [
      "Asumir que está bajo el límite.",
      "Marcar XFER porque está cerca.",
      "Decir que el millaje no importa.",
      "Aclarar bien antes de tratarlo como calificado."
    ],
    "correct": 3,
    "explanation": "Cuando está cerca del límite, el agente no debe asumir elegibilidad."
  },
  {
    "id": 160,
    "topic": "product",
    "language": "es",
    "question": "¿Qué caso levanta la mayor preocupación de elegibilidad?",
    "options": [
      "Mazda 3 2012 con 90,000 millas.",
      "Toyota Corolla 2018 con 120,000 millas.",
      "Chevrolet Traverse 2019 con 182,000 millas.",
      "Honda Civic 2015 con 75,000 millas."
    ],
    "correct": 2,
    "explanation": "Más de 175,000 millas está fuera de la regla indicada."
  },
  {
    "id": 161,
    "topic": "product",
    "language": "es",
    "question": "Un Subaru Outback 2011 tiene exactamente 175,000 millas y funciona normal. ¿Cuál es la mejor lectura de la regla?",
    "options": [
      "Todavía podría estar dentro del límite.",
      "Queda excluido automáticamente por millaje.",
      "El año lo hace imposible.",
      "Solo califica si es eléctrico."
    ],
    "correct": 0,
    "explanation": "La regla dice hasta 175,000 millas; el problema es estar por encima."
  },
  {
    "id": 162,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Corolla 2012 tiene 175,001 millas y funciona bien. ¿Qué debe hacer el agente?",
    "options": [
      "Tratarlo como bajo el límite.",
      "No tratarlo como elegible por millaje.",
      "Ignorar esa milla extra.",
      "Transferir porque es Toyota."
    ],
    "correct": 1,
    "explanation": "Incluso una milla por encima queda fuera de la guía básica."
  },
  {
    "id": 163,
    "topic": "product",
    "language": "es",
    "question": "Una Rivian truck 2023 tiene 20,000 millas y no presenta fallas. ¿Qué regla pesa más?",
    "options": [
      "El bajo millaje limpia el archivo.",
      "Ser vehículo eléctrico bloquea elegibilidad.",
      "Ser truck es suficiente.",
      "Los vehículos nuevos siempre califican."
    ],
    "correct": 1,
    "explanation": "Los vehículos eléctricos siguen excluidos sin importar millaje."
  },
  {
    "id": 164,
    "topic": "product",
    "language": "es",
    "question": "Un Lamborghini 2018 tiene 22,000 millas y funciona bien. ¿Qué debe recordar el agente?",
    "options": [
      "Las excepciones exóticas pueden excluirse.",
      "El bajo millaje anula todo.",
      "El banco decide el tipo de vehículo.",
      "Califica por ser más nuevo que 2011."
    ],
    "correct": 0,
    "explanation": "El material de entrenamiento menciona excepciones exóticas como Lamborghinis."
  },
  {
    "id": 165,
    "topic": "product",
    "language": "es",
    "question": "Un trailer de carga 2017 está conectado al truck del cliente. ¿Qué debe tratarse con cuidado?",
    "options": [
      "Los trailers son tipos excluidos.",
      "Los trailers califican si el truck funciona.",
      "Los trailers califican con bajo millaje.",
      "El Service Advisor debe cubrir trailers."
    ],
    "correct": 0,
    "explanation": "Los trailers aparecen como tipos de vehículo excluidos."
  },
  {
    "id": 166,
    "topic": "product",
    "language": "es",
    "question": "Un Honda CR-V 2016 tiene 140,000 millas, pero está en el taller y no se puede manejar. ¿Cuál es el problema?",
    "options": [
      "El millaje es el único factor.",
      "No se confirmó buen funcionamiento.",
      "El modelo es anterior a 2011.",
      "Las SUV siempre están excluidas."
    ],
    "correct": 1,
    "explanation": "El vehículo debe funcionar; estar no manejable actualmente crea duda."
  },
  {
    "id": 167,
    "topic": "product",
    "language": "es",
    "question": "Un Nissan Sentra 2015 tiene 135,000 millas y solo necesita cambio de aceite. ¿Cuál es la vista más segura?",
    "options": [
      "Mantenimiento rutinario no es el foco de cobertura.",
      "El cambio de aceite lo hace inelegible.",
      "El Service Advisor cubre todo mantenimiento.",
      "El vehículo es eléctrico por defecto."
    ],
    "correct": 0,
    "explanation": "No se debe prometer cobertura sobre mantenimiento normal."
  },
  {
    "id": 168,
    "topic": "product",
    "language": "es",
    "question": "Un Chevy Bolt 2020 tiene 60,000 millas. ¿Cuál es el principal problema de calificación?",
    "options": [
      "Es un vehículo eléctrico.",
      "Está sobre el límite de millaje.",
      "Es anterior a 2011.",
      "No tiene historial financiero."
    ],
    "correct": 0,
    "explanation": "Los vehículos eléctricos están excluidos."
  },
  {
    "id": 169,
    "topic": "product",
    "language": "es",
    "question": "Un Ford Focus 2013 tiene 172,000 millas y la transmisión patina hoy. ¿Qué debe pasar antes del transfer?",
    "options": [
      "Aclarar el problema mecánico actual.",
      "Tomar el millaje como suficiente.",
      "Prometer reparación de transmisión.",
      "Saltar porque es después de 2011."
    ],
    "correct": 0,
    "explanation": "Los problemas mecánicos actuales deben aclararse y no prometerse como cubiertos."
  },
  {
    "id": 170,
    "topic": "product",
    "language": "es",
    "question": "Un Toyota Corolla 2021 tiene 40,000 millas, funciona bien y no es eléctrico. ¿Cuál es la conclusión más segura?",
    "options": [
      "Parece básicamente elegible para continuar.",
      "Está excluido por ser muy nuevo.",
      "Está excluido porque el millaje es bajo.",
      "Debe marcarse como wrong vehicle."
    ],
    "correct": 0,
    "explanation": "Este caso cumple año, millaje, tipo y condición básica."
  },
  {
    "id": 171,
    "topic": "callflow",
    "language": "es",
    "question": "Durante el proceso de 3-way, el cliente cuelga antes de hablar con el Service Advisor. ¿Qué debe hacer el agente?",
    "options": [
      "Marcar Dead Air para el Advisor.",
      "Usar Hung Up Both Lines y Call Back.",
      "Usar Leave 3-Way Call y XFER.",
      "Dejar al Advisor timbrando solo."
    ],
    "correct": 1,
    "explanation": "Esto evita un dead-air transfer hacia el Service Advisor."
  },
  {
    "id": 172,
    "topic": "callflow",
    "language": "es",
    "question": "¿Por qué es peligroso usar “Leave 3-Way Call” después de que el cliente cuelga?",
    "options": [
      "Cambia el millaje del vehículo.",
      "Envía una ruta española automática.",
      "Elimina la opción de callback.",
      "El Advisor puede recibir una llamada timbrando sin cliente."
    ],
    "correct": 3,
    "explanation": "Salir del 3-way puede crear una llamada sin cliente para el Service Advisor."
  },
  {
    "id": 173,
    "topic": "callflow",
    "language": "es",
    "question": "El Service Advisor entra, pero se queda callado varios segundos. ¿Qué debe hacer el agente?",
    "options": [
      "Quedarse callado hasta que alguien cuelgue.",
      "Decirle al cliente que llame después.",
      "Llamar la atención del Advisor y controlar el handoff.",
      "Colgar y marcar XFER."
    ],
    "correct": 2,
    "explanation": "El agente debe evitar silencio llamando la atención del Advisor."
  },
  {
    "id": 174,
    "topic": "callflow",
    "language": "es",
    "question": "¿Quién debe hablar primero cuando entra el Service Advisor?",
    "options": [
      "Nadie hasta que pasen 15 segundos.",
      "El Service Advisor.",
      "El cliente sin introducción.",
      "El agente antes que todos."
    ],
    "correct": 1,
    "explanation": "El agente debe esperar a que el Service Advisor conteste antes de presentar al cliente."
  },
  {
    "id": 175,
    "topic": "callflow",
    "language": "es",
    "question": "¿Qué confirma un handoff real?",
    "options": [
      "La línea del Advisor timbró una vez.",
      "El cliente dijo hello antes del transfer.",
      "El agente presionó transfer.",
      "Advisor y cliente hablan activamente."
    ],
    "correct": 3,
    "explanation": "Un handoff válido requiere comunicación activa, no solo marcar."
  },
  {
    "id": 176,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente le pide callback al Service Advisor. ¿Cómo debe manejarse?",
    "options": [
      "Call Back, no XFER limpio.",
      "XFER porque entró el Advisor.",
      "DAIR porque cambió la llamada.",
      "SPANIS porque pidió callback."
    ],
    "correct": 0,
    "explanation": "Una solicitud de callback con el Advisor no debe contarse como XFER limpio."
  },
  {
    "id": 177,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente le pide español al Advisor de inmediato, antes de cualquier conversación en inglés. ¿Cuál es el problema?",
    "options": [
      "El vehículo se vuelve wrong number.",
      "Debe ser Answering Machine.",
      "El transfer es válido porque conectaron líneas.",
      "No hubo conversación significativa en inglés con SA."
    ],
    "correct": 3,
    "explanation": "Un English XFER necesita comunicación significativa en inglés con el Service Advisor."
  },
  {
    "id": 178,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente habla en inglés con el Service Advisor por 18 segundos y luego pide español. ¿Cómo debería verlo QA?",
    "options": [
      "SPANIS automático sin revisar.",
      "Probablemente se cumplió el handoff en inglés.",
      "Inválido solo por mencionar español.",
      "Dead Air porque cambió idioma."
    ],
    "correct": 1,
    "explanation": "Si hubo conversación significativa en inglés el tiempo suficiente, el handoff puede seguir siendo válido."
  },
  {
    "id": 179,
    "topic": "callflow",
    "language": "es",
    "question": "Un niño contesta y acepta “escuchar opciones” para el vehículo de la casa. ¿Qué debe hacer el agente?",
    "options": [
      "Transferir porque alguien aceptó.",
      "Pedir un adulto que tome decisiones.",
      "Marcar XFER después del sí.",
      "Preguntar millaje solo al niño."
    ],
    "correct": 1,
    "explanation": "Un niño no puede dar aprobación válida para una decisión del vehículo."
  },
  {
    "id": 180,
    "topic": "callflow",
    "language": "es",
    "question": "Un co-signer dice que no toma decisiones del vehículo. ¿Cuál es el mejor camino?",
    "options": [
      "Transferir porque aparece en el archivo.",
      "Pedir al decision maker o agendar callback.",
      "Tratarlo como XFER completo.",
      "Presionar hasta que acepte."
    ],
    "correct": 1,
    "explanation": "La llamada no debe forzarse si la persona no puede decidir."
  },
  {
    "id": 181,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente responde “sí” a todo, pero contesta cosas fuera de contexto. ¿Qué debe verificar el agente?",
    "options": [
      "Que le gusta el color del vehículo.",
      "Que el archivo tiene dirección.",
      "Que el Advisor puede cerrar más rápido.",
      "Que realmente entiende la llamada."
    ],
    "correct": 3,
    "explanation": "Aceptar por educación no basta si la comprensión es dudosa."
  },
  {
    "id": 182,
    "topic": "callflow",
    "language": "es",
    "question": "Mientras espera al Advisor, hay demasiado silencio. ¿Qué ayuda a proteger la llamada?",
    "options": [
      "Pedir información de tarjeta.",
      "Hacer preguntas ligeras sobre el vehículo.",
      "Prometer que el Advisor ya está listo.",
      "Mutear hasta que entre el Advisor."
    ],
    "correct": 1,
    "explanation": "Las preguntas de espera reducen dead air y mantienen al cliente conectado."
  },
  {
    "id": 183,
    "topic": "callflow",
    "language": "es",
    "question": "Después de calificar, el cliente dice que no quiere ser transferido. ¿Qué debe evitar el agente?",
    "options": [
      "Respetar el rechazo.",
      "Marcar al Advisor de todas formas.",
      "Usar la disposición correcta.",
      "Documentar el resultado."
    ],
    "correct": 1,
    "explanation": "Calificar no autoriza transferir sin consentimiento."
  },
  {
    "id": 184,
    "topic": "callflow",
    "language": "es",
    "question": "La línea del Advisor timbra, pero nadie contesta. ¿Qué debe evitar el agente?",
    "options": [
      "Manejar callback si aplica.",
      "Contarlo como XFER válido.",
      "Proteger la experiencia del cliente.",
      "Evitar dead-air transfer."
    ],
    "correct": 1,
    "explanation": "Un XFER válido requiere handoff entre Service Advisor y cliente."
  },
  {
    "id": 185,
    "topic": "callflow",
    "language": "es",
    "question": "En una auditoría de transfer, el agente presenta al cliente antes de que hable el Advisor. ¿Cuál es el riesgo?",
    "options": [
      "El millaje se reinicia.",
      "La llamada se vuelve voicemail.",
      "El handoff puede quedar sin control.",
      "El cliente se vuelve co-signer."
    ],
    "correct": 2,
    "explanation": "El Advisor debe hablar primero para que la presentación sea limpia."
  },
  {
    "id": 186,
    "topic": "callflow",
    "language": "es",
    "question": "El cliente cuelga después de la presentación del agente, pero antes de cualquier conversación con el Advisor. ¿Qué debe pasar?",
    "options": [
      "Contarlo porque hubo introducción.",
      "Usar Answering Machine.",
      "No contarlo como XFER limpio.",
      "Marcar SPXFER automático."
    ],
    "correct": 2,
    "explanation": "La introducción sola no prueba conversación activa entre Advisor y cliente."
  },
  {
    "id": 187,
    "topic": "callflow",
    "language": "es",
    "question": "Durante la espera de un transfer en inglés, el cliente empieza a hablar español. ¿Qué debe considerar el agente?",
    "options": [
      "El vehículo queda inválido automáticamente.",
      "Debe forzarse el English transfer.",
      "DNC es obligatorio inmediatamente.",
      "Puede necesitar confirmar idioma de preferencia."
    ],
    "correct": 3,
    "explanation": "Cambiar de idioma puede indicar que el cliente necesita manejo en español."
  },
  {
    "id": 188,
    "topic": "callflow",
    "language": "es",
    "question": "El agente se queda mucho tiempo en línea después de que ambas partes ya están hablando. ¿Cuál es el coaching?",
    "options": [
      "Quedarse hasta que cierre la venta.",
      "Salir antes de que hable el Advisor.",
      "Mutear y contar tiempo extra.",
      "Esperar suficiente, no más de lo necesario."
    ],
    "correct": 3,
    "explanation": "La regla de 15 segundos protege el handoff, pero no exige quedarse innecesariamente."
  },
  {
    "id": 189,
    "topic": "callflow",
    "language": "es",
    "question": "Antes del transfer, el cliente dice: “No quiero hablar con nadie más.” ¿Qué debe evitar el agente?",
    "options": [
      "Aclarar la preocupación.",
      "Ofrecer callback si aplica.",
      "Transferir sin consentimiento renovado.",
      "Respetar el rechazo."
    ],
    "correct": 2,
    "explanation": "Un rechazo claro significa que no hay consentimiento."
  },
  {
    "id": 190,
    "topic": "callflow",
    "language": "es",
    "question": "El Advisor dice hello, el cliente dice hello y luego ambos se quedan callados. ¿Qué debe hacer el agente antes de salir?",
    "options": [
      "Confirmar que hablan activamente.",
      "Salir justo después de los dos hellos.",
      "Marcar XFER y mutear para siempre.",
      "Pedir datos de pago."
    ],
    "correct": 0,
    "explanation": "Dos saludos pueden no ser suficiente para confirmar un handoff activo."
  },
  {
    "id": 191,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Cuándo DAIR es la mejor disposición?",
    "options": [
      "El cliente pide callback.",
      "Ninguna persona real responde en la línea.",
      "El cliente dice no me interesa.",
      "El cliente pide español."
    ],
    "correct": 1,
    "explanation": "DAIR es para dead air completo, no para un rechazo o callback normal."
  },
  {
    "id": 192,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente escucha el script y cuelga. ¿Qué disposición suele encajar mejor que DAIR?",
    "options": [
      "Manage",
      "NI",
      "SPXFER",
      "A"
    ],
    "correct": 1,
    "explanation": "Si hubo contacto y el cliente cuelga después del pitch, NI suele encajar mejor que DAIR."
  },
  {
    "id": 193,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente dice: “Dejen de llamarme o los reporto.” ¿Qué disposición encaja?",
    "options": [
      "DNC",
      "XFER",
      "SPANIS",
      "CALLBK"
    ],
    "correct": 0,
    "explanation": "Peticiones de remoción, amenazas o lenguaje de no llamar deben manejarse como DNC."
  },
  {
    "id": 194,
    "topic": "dosdonts",
    "language": "es",
    "question": "La llamada cae en buzón de voz. ¿Qué disposición encaja?",
    "options": [
      "WRNGVE",
      "NI",
      "XFER",
      "A"
    ],
    "correct": 3,
    "explanation": "Answering Machine se usa para voicemail o sistemas automáticos."
  },
  {
    "id": 195,
    "topic": "dosdonts",
    "language": "es",
    "question": "El cliente está ocupado y sigue sin continuar después del rebuttal de callback. ¿Qué disposición encaja?",
    "options": [
      "XFER",
      "CALLBK",
      "A",
      "DAIR"
    ],
    "correct": 1,
    "explanation": "Una solicitud clara de otro horario o callback debe manejarse como CALLBK."
  },
  {
    "id": 196,
    "topic": "dosdonts",
    "language": "es",
    "question": "Un cliente necesita español y el agente usa ruta ciega sin handoff con un Service Advisor en español. ¿Qué disposición encaja?",
    "options": [
      "SPANIS",
      "XFER",
      "SPXFER",
      "DAIR"
    ],
    "correct": 0,
    "explanation": "SPANIS es para ruta ciega en español, no para transferencia directa en español."
  },
  {
    "id": 197,
    "topic": "dosdonts",
    "language": "es",
    "question": "El agente conecta directamente a un cliente que habla español con un Service Advisor en español. ¿Qué disposición encaja?",
    "options": [
      "CALLBK",
      "A",
      "SPXFER",
      "SPANIS"
    ],
    "correct": 2,
    "explanation": "SPXFER es para transferencias directas en español."
  },
  {
    "id": 198,
    "topic": "dosdonts",
    "language": "es",
    "question": "Una persona dice que es número equivocado. ¿Qué área de disposición importa?",
    "options": [
      "Manejo de Wrong Number.",
      "English XFER limpio.",
      "Answering Machine.",
      "Pause de restroom."
    ],
    "correct": 0,
    "explanation": "Wrong number no debe forzarse a resultado de transfer."
  },
  {
    "id": 199,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué hace válido un XFER?",
    "options": [
      "Transferencia en inglés con handoff real entre Advisor y cliente.",
      "El agente marca sin aprobación.",
      "El Advisor solo recibe una llamada timbrando.",
      "El cliente cuelga antes de hablar con el Advisor."
    ],
    "correct": 0,
    "explanation": "XFER debe reflejar una transferencia exitosa, no solo un intento de marcar."
  },
  {
    "id": 200,
    "topic": "dosdonts",
    "language": "es",
    "question": "¿Qué caso pertenece a coaching de Needs Practice?",
    "options": [
      "Agente confirma condición y obtiene consentimiento.",
      "Agente aclara idioma de preferencia.",
      "Agente espera mientras ambas partes hablan.",
      "Agente salta el propósito y transfiere a un cliente confundido."
    ],
    "correct": 3,
    "explanation": "Saltar el propósito y transferir a un cliente confundido crea riesgo de invalid/QA."
  }
,
  // ─────────────────────────────────────────────
  // MIXED QUESTION STYLE — 2-option questions
  // These only appear when qstyle=mixed.
  // Multiple Choice Only mode keeps using 3+ option questions.
  // ─────────────────────────────────────────────
{
  "id": 201,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2016 Toyota Camry, 114,000 miles, gas engine, runs normally. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 0,
  "explanation": "This vehicle fits the basic year, type, mileage, and running-condition rules."
},
{
  "id": 202,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2020 Tesla Model 3, 40,000 miles, runs well. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "Electric vehicles are excluded even when mileage and condition look good."
},
{
  "id": 203,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2011 Honda Accord, exactly 175,000 miles, running fine. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 0,
  "explanation": "The rule is up to 175,000 miles; over the limit is the issue."
},
{
  "id": 204,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2012 Nissan Altima, 175,001 miles, running fine. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "175,001 is over the stated mileage guideline."
},
{
  "id": 205,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2010 Ford Escape, 91,000 miles, no mechanical issues. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "Vehicles before 2011 are outside the basic eligibility rule."
},
{
  "id": 206,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2018 Chevy Malibu, 132,000 miles, check-engine light active today. Best action:",
  "options": [
    "Clarify before treating as qualified",
    "Treat as clean qualified"
  ],
  "correct": 0,
  "explanation": "A current warning light must be clarified before moving toward transfer."
},
{
  "id": 207,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2017 Kia Optima starts but cannot shift into gear. Eligibility check:",
  "options": [
    "Good running condition confirmed",
    "Good running condition not confirmed"
  ],
  "correct": 1,
  "explanation": "A vehicle that cannot shift is not clearly in good running condition."
},
{
  "id": 208,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2019 Ford F-150, 169,000 miles, runs well, not electric. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 0,
  "explanation": "This stays within the basic year, mileage, vehicle type, and running-condition rules."
},
{
  "id": 209,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2021 Chevy Bolt, 25,000 miles, running fine. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "The Chevy Bolt is electric, so the exclusion still applies."
},
{
  "id": 210,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2014 Jeep Wrangler with modified suspension. What can the agent say safely?",
  "options": [
    "Modified parts are excluded",
    "Modified parts are guaranteed covered"
  ],
  "correct": 0,
  "explanation": "Modified parts themselves are not covered."
},
{
  "id": 211,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2018 Lamborghini Huracán, 22,000 miles, runs well. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "Training material lists exotic exceptions such as Lamborghinis as not covered."
},
{
  "id": 212,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2015 Hyundai Sonata with worn brake pads only. What should the agent avoid?",
  "options": [
    "Promising wear items are covered",
    "Explaining coverage is mechanical"
  ],
  "correct": 0,
  "explanation": "Normal wear items should not be promised as covered."
},
{
  "id": 213,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2016 Honda CR-V, 142,000 miles, currently not drivable in a shop. Eligibility check:",
  "options": [
    "Good running condition confirmed",
    "Good running condition not confirmed"
  ],
  "correct": 1,
  "explanation": "A current non-drivable vehicle is not cleanly qualified."
},
{
  "id": 214,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2019 Dodge Charger with collision body damage. Coverage focus:",
  "options": [
    "Mechanical breakdown",
    "Collision bodywork"
  ],
  "correct": 0,
  "explanation": "This coverage focuses on mechanical breakdown, not accident/cosmetic repairs."
},
{
  "id": 215,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2017 motorcycle, 12,000 miles. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 1,
  "explanation": "Motorcycles are excluded vehicle types."
},
{
  "id": 216,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2023 Rivian truck, 18,000 miles. Main rule:",
  "options": [
    "Electric vehicle exclusion",
    "Mileage approval"
  ],
  "correct": 0,
  "explanation": "Electric status blocks eligibility regardless of low mileage."
},
{
  "id": 217,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2013 Ford Focus, 172,000 miles, transmission slipping today. Best action:",
  "options": [
    "Clarify the current issue",
    "Promise transmission repair"
  ],
  "correct": 0,
  "explanation": "The agent must clarify current mechanical issues and avoid promises."
},
{
  "id": 218,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "2021 Toyota Corolla, 40,000 miles, runs well, gas vehicle. Eligibility check:",
  "options": [
    "Qualifies to continue",
    "Does not qualify"
  ],
  "correct": 0,
  "explanation": "This case matches the basic eligibility path."
},
{
  "id": 219,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "Customer says the car runs, but it is missing a tire. Best action:",
  "options": [
    "Clarify if safely drivable",
    "Ignore because engine starts"
  ],
  "correct": 0,
  "explanation": "A missing tire creates a running-condition concern."
},
{
  "id": 220,
  "question_type": "binary",
  "topic": "product",
  "language": "en",
  "question": "Customer has a 2009 SUV and a 2018 sedan that runs well. Best focus:",
  "options": [
    "Verify the current 2018 sedan",
    "Use the 2009 SUV as eligible"
  ],
  "correct": 0,
  "explanation": "The agent should focus on a current vehicle that may meet the rules."
},
{
  "id": 221,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "Customer agrees to vehicle condition but never agrees to speak with the Service Advisor. Transfer status:",
  "options": [
    "Valid XFER",
    "Invalid / not clean"
  ],
  "correct": 1,
  "explanation": "Vehicle condition confirmation is not transfer consent."
},
{
  "id": 222,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "The Service Advisor joins and the customer speaks with them in English for 18 seconds. Then the customer asks for Spanish. Transfer status:",
  "options": [
    "English handoff likely met",
    "Automatically invalid"
  ],
  "correct": 0,
  "explanation": "Meaningful English conversation with the Service Advisor happened before the language switch."
},
{
  "id": 223,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "Customer asks the Service Advisor for Spanish immediately, before any English conversation. Transfer status:",
  "options": [
    "Clean English XFER",
    "Not a clean English XFER"
  ],
  "correct": 1,
  "explanation": "A clean English transfer needs meaningful English communication with the Service Advisor."
},
{
  "id": 224,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "During 3-way, the customer hangs up before the advisor speaks. Correct button/path:",
  "options": [
    "Hung Up Both Lines / Call Back",
    "Leave 3-Way Call / XFER"
  ],
  "correct": 0,
  "explanation": "This prevents ringing the advisor with no customer on the line."
},
{
  "id": 225,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "Advisor says hello, customer says hello, then silence. Before leaving, agent should:",
  "options": [
    "Confirm active conversation",
    "Leave immediately"
  ],
  "correct": 0,
  "explanation": "Two greetings alone may not prove a real handoff."
},
{
  "id": 226,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "A child answers and agrees to hear options for the household vehicle. Best action:",
  "options": [
    "Ask for an adult decision maker",
    "Transfer because someone agreed"
  ],
  "correct": 0,
  "explanation": "A child cannot give decision-maker approval."
},
{
  "id": 227,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "Co-signer says they do not make vehicle decisions. Best action:",
  "options": [
    "Ask for decision maker or callback",
    "Force the transfer"
  ],
  "correct": 0,
  "explanation": "A co-signer is not always the decision maker."
},
{
  "id": 228,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "The advisor joins but stays silent. Best action:",
  "options": [
    "Prompt the advisor",
    "Disconnect and count XFER"
  ],
  "correct": 0,
  "explanation": "The agent should control the handoff and avoid dead air."
},
{
  "id": 229,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "After qualifying, the customer clearly says no to being transferred. Transfer status:",
  "options": [
    "Valid XFER",
    "No consent to transfer"
  ],
  "correct": 1,
  "explanation": "Qualification alone does not replace consent."
},
{
  "id": 230,
  "question_type": "binary",
  "topic": "callflow",
  "language": "en",
  "question": "Customer requests a callback while speaking with the Service Advisor. Disposition logic:",
  "options": [
    "CALLBK, not clean XFER",
    "XFER because advisor joined"
  ],
  "correct": 0,
  "explanation": "A callback request with the advisor is not a clean transfer."
},
{
  "id": 231,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Customer asks if the call will lower payments; agent ignores the question and transfers. QA result:",
  "options": [
    "Flag it",
    "No issue"
  ],
  "correct": 0,
  "explanation": "Customer questions must be answered or clarified before transfer."
},
{
  "id": 232,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Agent says the bank gave the customer’s information. Script safety:",
  "options": [
    "Safe wording",
    "Unsafe wording"
  ],
  "correct": 1,
  "explanation": "Agents should not say the bank provided the file."
},
{
  "id": 233,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Agent says, “There is no cost at all.” Script safety:",
  "options": [
    "Safe wording",
    "Risky wording"
  ],
  "correct": 1,
  "explanation": "This can sound like free coverage or guaranteed no cost."
},
{
  "id": 234,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Caller sounds confused in English. Best first check:",
  "options": [
    "Preferred language",
    "Payment method"
  ],
  "correct": 0,
  "explanation": "Language understanding should be verified before pushing forward."
},
{
  "id": 235,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Customer asks, “To who?” after transfer setup. Best action:",
  "options": [
    "Clarify Service Advisor role",
    "Dial first and explain later"
  ],
  "correct": 0,
  "explanation": "The customer should understand who they are being transferred to."
},
{
  "id": 236,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Agent says the coverage is from the manufacturer. QA result:",
  "options": [
    "Flag it",
    "No issue"
  ],
  "correct": 0,
  "explanation": "Agents should not misrepresent the source of coverage."
},
{
  "id": 237,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Agent changes tiny connector words but keeps every compliance point. QA result:",
  "options": [
    "Acceptable",
    "Always invalid"
  ],
  "correct": 0,
  "explanation": "Natural wording is acceptable if required meaning remains intact."
},
{
  "id": 238,
  "question_type": "binary",
  "topic": "script",
  "language": "en",
  "question": "Customer asks if purchase is required today. Best answer:",
  "options": [
    "Advisor reviews options; customer decides",
    "Yes, purchase is required today"
  ],
  "correct": 0,
  "explanation": "The call should not be framed as mandatory."
},
{
  "id": 239,
  "question_type": "binary",
  "topic": "objections",
  "language": "en",
  "question": "Customer says “I’m busy” and refuses after callback rebuttal. Disposition:",
  "options": [
    "CALLBK",
    "XFER"
  ],
  "correct": 0,
  "explanation": "If they will not continue and callback handling applies, CALLBK is the better path."
},
{
  "id": 240,
  "question_type": "binary",
  "topic": "objections",
  "language": "en",
  "question": "Customer says “I already have insurance.” Best distinction:",
  "options": [
    "Insurance is accidents; coverage is mechanical",
    "Insurance and coverage are the same"
  ],
  "correct": 0,
  "explanation": "Insurance and mechanical coverage must be separated clearly."
},
{
  "id": 241,
  "question_type": "binary",
  "topic": "objections",
  "language": "en",
  "question": "Customer asks for an email first. Agent promises policy documents by email. QA result:",
  "options": [
    "Safe",
    "Risky"
  ],
  "correct": 1,
  "explanation": "The agent should not promise documents they cannot provide."
},
{
  "id": 242,
  "question_type": "binary",
  "topic": "objections",
  "language": "en",
  "question": "Customer says “wrong number, stop calling.” Best handling:",
  "options": [
    "Wrong number plus removal care",
    "Force rebuttal and transfer"
  ],
  "correct": 0,
  "explanation": "Wrong number and stop-calling language require careful handling."
},
{
  "id": 243,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Voicemail greeting plays. Disposition:",
  "options": [
    "A",
    "XFER"
  ],
  "correct": 0,
  "explanation": "A is for Answering Machine / voicemail."
},
{
  "id": 244,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Customer hears script and hangs up. Better than DAIR:",
  "options": [
    "NI",
    "DAIR"
  ],
  "correct": 0,
  "explanation": "There was contact; DAIR is for no real response on the line."
},
{
  "id": 245,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Spanish-speaking customer is routed blindly without a Spanish Service Advisor handoff. Disposition:",
  "options": [
    "SPANIS",
    "SPXFER"
  ],
  "correct": 0,
  "explanation": "SPANIS is the blind Spanish route."
},
{
  "id": 246,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Spanish-speaking customer is directly connected to a Spanish Service Advisor. Disposition:",
  "options": [
    "SPANIS",
    "SPXFER"
  ],
  "correct": 1,
  "explanation": "SPXFER is for direct Spanish transfers."
},
{
  "id": 247,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Customer says “stop calling or I’ll report this.” Disposition:",
  "options": [
    "DNC",
    "NI"
  ],
  "correct": 0,
  "explanation": "Stop-calling language and threats should be handled as DNC."
},
{
  "id": 248,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "No real person ever responds on the line. Disposition:",
  "options": [
    "DAIR",
    "CALLBK"
  ],
  "correct": 0,
  "explanation": "DAIR is for true dead air."
},
{
  "id": 249,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Agent dials the advisor without clear customer approval. XFER status:",
  "options": [
    "Clean XFER",
    "Invalid / not clean"
  ],
  "correct": 1,
  "explanation": "Clear consent is required before transfer."
},
{
  "id": 250,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "en",
  "question": "Advisor receives a ringing call but customer already hung up. XFER status:",
  "options": [
    "Clean XFER",
    "Dead-air risk / not clean"
  ],
  "correct": 1,
  "explanation": "This is the kind of dead-air transfer the process is meant to prevent."
},
{
  "id": 251,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Toyota Camry 2016, 114,000 millas, motor de gasolina y funciona normal. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 0,
  "explanation": "Este vehículo cumple con año, tipo, millaje y condición de funcionamiento."
},
{
  "id": 252,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Tesla Model 3 2020, 40,000 millas y funciona bien. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "Los vehículos eléctricos están excluidos aunque tengan bajo millaje y funcionen bien."
},
{
  "id": 253,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Honda Accord 2011, exactamente 175,000 millas y funcionando bien. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 0,
  "explanation": "La regla indica hasta 175,000 millas; el problema es estar por encima del límite."
},
{
  "id": 254,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Nissan Altima 2012, 175,001 millas y funcionando bien. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "175,001 millas está por encima de la guía de millaje."
},
{
  "id": 255,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Ford Escape 2010, 91,000 millas y sin problemas mecánicos. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "Los vehículos anteriores a 2011 están fuera de la regla básica."
},
{
  "id": 256,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Chevy Malibu 2018, 132,000 millas y luz de check engine activa hoy. Mejor acción:",
  "options": [
    "Aclarar antes de tratarlo como calificado",
    "Tratarlo como calificado limpio"
  ],
  "correct": 0,
  "explanation": "Una luz de advertencia actual debe aclararse antes de avanzar al transfer."
},
{
  "id": 257,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Kia Optima 2017 enciende, pero no cambia de marcha. Revisión:",
  "options": [
    "Buen funcionamiento confirmado",
    "Buen funcionamiento no confirmado"
  ],
  "correct": 1,
  "explanation": "Un vehículo que no cambia de marcha no está claramente en buenas condiciones de funcionamiento."
},
{
  "id": 258,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Ford F-150 2019, 169,000 millas, funciona bien y no es eléctrico. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 0,
  "explanation": "Está dentro de las reglas básicas de año, millaje, tipo de vehículo y condición."
},
{
  "id": 259,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Chevy Bolt 2021, 25,000 millas y funcionando bien. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "El Chevy Bolt es eléctrico, por eso aplica la exclusión."
},
{
  "id": 260,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Jeep Wrangler 2014 con suspensión modificada. ¿Qué puede decir el agente con seguridad?",
  "options": [
    "Las partes modificadas están excluidas",
    "Las partes modificadas están garantizadas"
  ],
  "correct": 0,
  "explanation": "Las partes modificadas no están cubiertas."
},
{
  "id": 261,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Lamborghini Huracán 2018, 22,000 millas y funciona bien. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "El material de training lista excepciones exóticas como Lamborghinis."
},
{
  "id": 262,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Hyundai Sonata 2015 con pastillas de freno gastadas solamente. ¿Qué debe evitar el agente?",
  "options": [
    "Prometer que wear items están cubiertos",
    "Explicar que la cobertura es mecánica"
  ],
  "correct": 0,
  "explanation": "Los wear items normales no deben prometerse como cubiertos."
},
{
  "id": 263,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Honda CR-V 2016, 142,000 millas, actualmente en taller y no manejable. Revisión:",
  "options": [
    "Buen funcionamiento confirmado",
    "Buen funcionamiento no confirmado"
  ],
  "correct": 1,
  "explanation": "Un vehículo que no se puede manejar actualmente no está limpiamente calificado."
},
{
  "id": 264,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Dodge Charger 2019 con daño de carrocería por accidente. Enfoque de cobertura:",
  "options": [
    "Falla mecánica",
    "Carrocería por choque"
  ],
  "correct": 0,
  "explanation": "La cobertura se enfoca en fallas mecánicas, no en accidentes o reparaciones cosméticas."
},
{
  "id": 265,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Motocicleta 2017 con 12,000 millas. Revisión de elegibilidad:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 1,
  "explanation": "Las motocicletas son tipos de vehículo excluidos."
},
{
  "id": 266,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Rivian truck 2023, 18,000 millas. Regla principal:",
  "options": [
    "Exclusión por vehículo eléctrico",
    "Aprobación por millaje"
  ],
  "correct": 0,
  "explanation": "Ser eléctrico bloquea la elegibilidad aunque el millaje sea bajo."
},
{
  "id": 267,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Ford Focus 2013, 172,000 millas, transmisión patinando hoy. Mejor acción:",
  "options": [
    "Aclarar el problema actual",
    "Prometer reparación de transmisión"
  ],
  "correct": 0,
  "explanation": "El agente debe aclarar problemas mecánicos actuales y evitar promesas."
},
{
  "id": 268,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "Toyota Corolla 2021, 40,000 millas, funciona bien y es de gasolina. Revisión:",
  "options": [
    "Califica para continuar",
    "No califica"
  ],
  "correct": 0,
  "explanation": "Este caso cumple con el camino básico de elegibilidad."
},
{
  "id": 269,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "El cliente dice que el carro funciona, pero le falta una llanta. Mejor acción:",
  "options": [
    "Aclarar si se puede manejar con seguridad",
    "Ignorarlo porque el motor enciende"
  ],
  "correct": 0,
  "explanation": "Una llanta faltante crea duda sobre la condición de funcionamiento."
},
{
  "id": 270,
  "question_type": "binary",
  "topic": "product",
  "language": "es",
  "question": "El cliente tiene una SUV 2009 y un sedán 2018 que funciona bien. Mejor enfoque:",
  "options": [
    "Verificar el sedán 2018 actual",
    "Usar la SUV 2009 como elegible"
  ],
  "correct": 0,
  "explanation": "El agente debe enfocarse en un vehículo actual que pueda cumplir las reglas."
},
{
  "id": 271,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El cliente acepta que el vehículo funciona, pero nunca acepta hablar con el Service Advisor. Estado del transfer:",
  "options": [
    "XFER válido",
    "Inválido / no limpio"
  ],
  "correct": 1,
  "explanation": "Confirmar condición del vehículo no es consentimiento para transferir."
},
{
  "id": 272,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El Service Advisor entra y el cliente habla con él en inglés por 18 segundos. Luego pide español. Estado:",
  "options": [
    "El handoff en inglés probablemente se cumplió",
    "Automáticamente inválido"
  ],
  "correct": 0,
  "explanation": "Hubo comunicación significativa en inglés con el Service Advisor antes del cambio de idioma."
},
{
  "id": 273,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El cliente pide español apenas entra el Service Advisor, antes de cualquier conversación en inglés. Estado:",
  "options": [
    "English XFER limpio",
    "No es English XFER limpio"
  ],
  "correct": 1,
  "explanation": "Un English transfer necesita comunicación significativa en inglés con el Service Advisor."
},
{
  "id": 274,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "Durante el 3-way, el cliente cuelga antes de que el advisor hable. Ruta correcta:",
  "options": [
    "Hung Up Both Lines / Call Back",
    "Leave 3-Way Call / XFER"
  ],
  "correct": 0,
  "explanation": "Esto evita que el advisor reciba una llamada timbrando sin cliente."
},
{
  "id": 275,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El advisor dice hello, el cliente dice hello y luego quedan en silencio. Antes de salir, el agente debe:",
  "options": [
    "Confirmar conversación activa",
    "Salir inmediatamente"
  ],
  "correct": 0,
  "explanation": "Dos saludos no siempre prueban un handoff real."
},
{
  "id": 276,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "Un niño contesta y acepta escuchar opciones del vehículo familiar. Mejor acción:",
  "options": [
    "Pedir un adulto decision maker",
    "Transferir porque alguien aceptó"
  ],
  "correct": 0,
  "explanation": "Un menor no puede dar aprobación válida como decision maker."
},
{
  "id": 277,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El co-signer dice que no toma decisiones del vehículo. Mejor acción:",
  "options": [
    "Pedir al decision maker o callback",
    "Forzar el transfer"
  ],
  "correct": 0,
  "explanation": "Ser co-signer no siempre significa tener autoridad para decidir."
},
{
  "id": 278,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El advisor entra, pero se queda en silencio. Mejor acción:",
  "options": [
    "Llamar la atención del advisor",
    "Desconectarse y contar XFER"
  ],
  "correct": 0,
  "explanation": "El agente debe controlar el handoff y evitar dead air."
},
{
  "id": 279,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "Después de calificar, el cliente dice claramente que no quiere ser transferido. Estado:",
  "options": [
    "XFER válido",
    "No hay consentimiento para transferir"
  ],
  "correct": 1,
  "explanation": "La calificación no reemplaza el consentimiento."
},
{
  "id": 280,
  "question_type": "binary",
  "topic": "callflow",
  "language": "es",
  "question": "El cliente pide callback mientras habla con el Service Advisor. Lógica de disposición:",
  "options": [
    "CALLBK, no XFER limpio",
    "XFER porque entró el advisor"
  ],
  "correct": 0,
  "explanation": "Una solicitud de callback con el advisor no es transferencia limpia."
},
{
  "id": 281,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El cliente pregunta si la llamada bajará pagos; el agente ignora la pregunta y transfiere. Resultado QA:",
  "options": [
    "Marcarlo",
    "Sin problema"
  ],
  "correct": 0,
  "explanation": "Las preguntas del cliente deben responderse o aclararse antes del transfer."
},
{
  "id": 282,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El agente dice que el banco dio la información del cliente. Seguridad del script:",
  "options": [
    "Wording seguro",
    "Wording inseguro"
  ],
  "correct": 1,
  "explanation": "El agente no debe decir que el banco entregó el archivo."
},
{
  "id": 283,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El agente dice: “No tiene ningún costo.” Seguridad del script:",
  "options": [
    "Wording seguro",
    "Wording riesgoso"
  ],
  "correct": 1,
  "explanation": "Puede sonar como cobertura gratis o costo garantizado en cero."
},
{
  "id": 284,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "La persona suena confundida en inglés. Primera verificación:",
  "options": [
    "Idioma de preferencia",
    "Método de pago"
  ],
  "correct": 0,
  "explanation": "Se debe verificar comprensión e idioma antes de avanzar."
},
{
  "id": 285,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "Después del setup de transfer, el cliente pregunta: “¿Con quién?” Mejor acción:",
  "options": [
    "Aclarar el rol del Service Advisor",
    "Marcar primero y explicar después"
  ],
  "correct": 0,
  "explanation": "El cliente debe entender con quién será transferido."
},
{
  "id": 286,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El agente dice que la cobertura viene del fabricante. Resultado QA:",
  "options": [
    "Marcarlo",
    "Sin problema"
  ],
  "correct": 0,
  "explanation": "El agente no debe representar falsamente el origen de la cobertura."
},
{
  "id": 287,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El agente cambia conectores pequeños, pero mantiene todos los puntos de compliance. Resultado QA:",
  "options": [
    "Aceptable",
    "Siempre inválido"
  ],
  "correct": 0,
  "explanation": "El wording natural es aceptable si el significado requerido se mantiene."
},
{
  "id": 288,
  "question_type": "binary",
  "topic": "script",
  "language": "es",
  "question": "El cliente pregunta si debe comprar algo hoy. Mejor respuesta:",
  "options": [
    "El advisor revisa opciones; el cliente decide",
    "Sí, la compra es obligatoria hoy"
  ],
  "correct": 0,
  "explanation": "La llamada no debe presentarse como obligatoria."
},
{
  "id": 289,
  "question_type": "binary",
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice “estoy ocupado” y se niega después del callback rebuttal. Disposición:",
  "options": [
    "CALLBK",
    "XFER"
  ],
  "correct": 0,
  "explanation": "Si no continúa y aplica callback, CALLBK es el camino correcto."
},
{
  "id": 290,
  "question_type": "binary",
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice “ya tengo seguro”. Mejor diferencia:",
  "options": [
    "Seguro es accidentes; cobertura es mecánica",
    "Seguro y cobertura son lo mismo"
  ],
  "correct": 0,
  "explanation": "El seguro y la cobertura mecánica deben separarse claramente."
},
{
  "id": 291,
  "question_type": "binary",
  "topic": "objections",
  "language": "es",
  "question": "El cliente pide un email primero. El agente promete documentos de póliza por email. Resultado QA:",
  "options": [
    "Seguro",
    "Riesgoso"
  ],
  "correct": 1,
  "explanation": "El agente no debe prometer documentos que no puede enviar."
},
{
  "id": 292,
  "question_type": "binary",
  "topic": "objections",
  "language": "es",
  "question": "El cliente dice “número equivocado, dejen de llamar”. Mejor manejo:",
  "options": [
    "Wrong number con cuidado de remoción",
    "Forzar rebuttal y transfer"
  ],
  "correct": 0,
  "explanation": "Wrong number y stop-calling language requieren manejo cuidadoso."
},
{
  "id": 293,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "Suena un voicemail. Disposición:",
  "options": [
    "A",
    "XFER"
  ],
  "correct": 0,
  "explanation": "A corresponde a Answering Machine / voicemail."
},
{
  "id": 294,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "El cliente escucha el script y cuelga. Mejor que DAIR:",
  "options": [
    "NI",
    "DAIR"
  ],
  "correct": 0,
  "explanation": "Hubo contacto; DAIR es para cuando no hay respuesta real en la línea."
},
{
  "id": 295,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "Cliente que necesita español es enviado por ruta ciega sin handoff con Service Advisor en español. Disposición:",
  "options": [
    "SPANIS",
    "SPXFER"
  ],
  "correct": 0,
  "explanation": "SPANIS corresponde a ruta ciega en español."
},
{
  "id": 296,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "Cliente en español es conectado directamente con un Service Advisor en español. Disposición:",
  "options": [
    "SPANIS",
    "SPXFER"
  ],
  "correct": 1,
  "explanation": "SPXFER es para transferencias directas en español."
},
{
  "id": 297,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "El cliente dice “dejen de llamar o los reporto”. Disposición:",
  "options": [
    "DNC",
    "NI"
  ],
  "correct": 0,
  "explanation": "Peticiones de no llamar y amenazas deben manejarse como DNC."
},
{
  "id": 298,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "Nadie responde realmente en la línea. Disposición:",
  "options": [
    "DAIR",
    "CALLBK"
  ],
  "correct": 0,
  "explanation": "DAIR es para dead air real."
},
{
  "id": 299,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "El agente marca al advisor sin aprobación clara del cliente. Estado de XFER:",
  "options": [
    "XFER limpio",
    "Inválido / no limpio"
  ],
  "correct": 1,
  "explanation": "Se requiere consentimiento claro antes de transferir."
},
{
  "id": 300,
  "question_type": "binary",
  "topic": "dosdonts",
  "language": "es",
  "question": "El advisor recibe una llamada timbrando, pero el cliente ya colgó. Estado de XFER:",
  "options": [
    "XFER limpio",
    "Riesgo de dead air / no limpio"
  ],
  "correct": 1,
  "explanation": "Este es el tipo de dead-air transfer que el proceso busca evitar."
}
]