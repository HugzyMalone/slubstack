import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const vocabPath = path.join(ROOT, "content/german/vocab.json");
const unitsPath = path.join(ROOT, "content/german/units.json");

const vocab = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
const units = JSON.parse(fs.readFileSync(unitsPath, "utf8"));

// Helper to make conjugation tables for regular -en verbs
function regENConj(stem, du = stem + "st", er = stem + "t") {
  return {
    ich: stem + "e",
    du,
    er,
    wir: stem + "en",
    ihr: stem + "t",
    sie: stem + "en",
  };
}

// === #8 vocab additions to existing units 3–7 ===

const colorAdds = [
  { id: "de-col-16", category: "de-colors", hanzi: "hellblau", pinyin: "HELL-blow", english: "light blue" },
  { id: "de-col-17", category: "de-colors", hanzi: "dunkelblau", pinyin: "DOON-kel-blow", english: "dark blue" },
  { id: "de-col-18", category: "de-colors", hanzi: "silbern", pinyin: "ZIL-bern", english: "silver" },
  { id: "de-col-19", category: "de-colors", hanzi: "golden", pinyin: "GOL-den", english: "golden" },
  { id: "de-col-20", category: "de-colors", hanzi: "türkis", pinyin: "TUR-kiss", english: "turquoise" },
];

const foodAdds = [
  { id: "de-food-19", category: "de-food", hanzi: "die Pasta", pinyin: "dee PAS-tah", english: "the pasta", gender: "die" },
  { id: "de-food-20", category: "de-food", hanzi: "die Pizza", pinyin: "dee PIT-sa", english: "the pizza", gender: "die", plural: "die Pizzen" },
  { id: "de-food-21", category: "de-food", hanzi: "der Salat", pinyin: "der ZA-laht", english: "the salad", gender: "der", plural: "die Salate" },
  { id: "de-food-22", category: "de-food", hanzi: "der Reis", pinyin: "der rice", english: "the rice", gender: "der" },
  { id: "de-food-23", category: "de-food", hanzi: "die Schokolade", pinyin: "dee shoh-koh-LAH-deh", english: "the chocolate", gender: "die", plural: "die Schokoladen" },
  { id: "de-food-24", category: "de-food", hanzi: "das Hähnchen", pinyin: "das HEN-khen", english: "the chicken (dish)", gender: "das", plural: "die Hähnchen" },
  { id: "de-food-25", category: "de-food", hanzi: "der Joghurt", pinyin: "der YOH-gurt", english: "the yoghurt", gender: "der" },
  { id: "de-food-26", category: "de-food", hanzi: "das Frühstück", pinyin: "das FRUH-shtuk", english: "the breakfast", gender: "das" },
  { id: "de-food-27", category: "de-food", hanzi: "das Mittagessen", pinyin: "das MIT-tahg-ess-en", english: "the lunch", gender: "das" },
  { id: "de-food-28", category: "de-food", hanzi: "das Abendessen", pinyin: "das AH-bent-ess-en", english: "the dinner", gender: "das" },
  { id: "de-food-29", category: "de-food", hanzi: "der Hunger", pinyin: "der HOON-ger", english: "the hunger", gender: "der" },
  { id: "de-food-30", category: "de-food", hanzi: "der Durst", pinyin: "der DOORST", english: "the thirst", gender: "der" },
  { id: "de-food-31", category: "de-food", hanzi: "lecker", pinyin: "LEK-er", english: "tasty / delicious" },
  { id: "de-food-32", category: "de-food", hanzi: "scharf", pinyin: "sharf", english: "spicy / sharp" },
  { id: "de-food-33", category: "de-food", hanzi: "süß", pinyin: "zoos", english: "sweet" },
];

const familyAdds = [
  { id: "de-fam-15", category: "de-family", hanzi: "der Partner", pinyin: "der PART-ner", english: "the partner", gender: "der", plural: "die Partner" },
  { id: "de-fam-16", category: "de-family", hanzi: "der Schatz", pinyin: "der shats", english: "the treasure / the love", gender: "der", plural: "die Schätze" },
  { id: "de-fam-17", category: "de-family", hanzi: "der Liebling", pinyin: "der LEEB-ling", english: "the darling / the favourite", gender: "der", plural: "die Lieblinge" },
  { id: "de-fam-18", category: "de-family", hanzi: "die Eltern", pinyin: "dee EL-tern", english: "the parents", gender: "die", plural: "die Eltern" },
  { id: "de-fam-19", category: "de-family", hanzi: "die Geschwister", pinyin: "dee geh-SHVIS-ter", english: "the siblings", gender: "die", plural: "die Geschwister" },
  { id: "de-fam-20", category: "de-family", hanzi: "der Cousin", pinyin: "der koo-ZAN", english: "the cousin (m.)", gender: "der", plural: "die Cousins" },
  { id: "de-fam-21", category: "de-family", hanzi: "die Cousine", pinyin: "dee koo-ZEE-neh", english: "the cousin (f.)", gender: "die", plural: "die Cousinen" },
  { id: "de-fam-22", category: "de-family", hanzi: "die Tante", pinyin: "dee TAN-teh", english: "the aunt", gender: "die", plural: "die Tanten" },
  { id: "de-fam-23", category: "de-family", hanzi: "der Onkel", pinyin: "der ON-kel", english: "the uncle", gender: "der", plural: "die Onkel" },
  { id: "de-fam-24", category: "de-family", hanzi: "der Enkel", pinyin: "der EN-kel", english: "the grandchild / the grandson", gender: "der", plural: "die Enkel" },
];

const verbAdds = [
  { id: "de-verb-19", category: "de-verbs", hanzi: "treffen", pinyin: "TREF-en", english: "to meet",
    conjugations: { ich: "treffe", du: "triffst", er: "trifft", wir: "treffen", ihr: "trefft", sie: "treffen" },
    example: { de: "Wir treffen uns morgen.", en: "We're meeting tomorrow." } },
  { id: "de-verb-20", category: "de-verbs", hanzi: "vermissen", pinyin: "fer-MIS-en", english: "to miss (someone)",
    conjugations: regENConj("vermiss"),
    example: { de: "Ich vermisse dich.", en: "I miss you." } },
  { id: "de-verb-21", category: "de-verbs", hanzi: "küssen", pinyin: "KUS-en", english: "to kiss",
    conjugations: regENConj("küss"),
    example: { de: "Ich küsse dich.", en: "I kiss you." } },
  { id: "de-verb-22", category: "de-verbs", hanzi: "umarmen", pinyin: "oom-AR-men", english: "to hug",
    conjugations: regENConj("umarm"),
    example: { de: "Ich umarme dich.", en: "I hug you." } },
  { id: "de-verb-23", category: "de-verbs", hanzi: "lachen", pinyin: "LAKH-en", english: "to laugh",
    conjugations: regENConj("lach"),
    example: { de: "Wir lachen viel.", en: "We laugh a lot." } },
  { id: "de-verb-24", category: "de-verbs", hanzi: "weinen", pinyin: "VINE-en", english: "to cry",
    conjugations: regENConj("wein"),
    example: { de: "Sie weint.", en: "She is crying." } },
  { id: "de-verb-25", category: "de-verbs", hanzi: "sich freuen", pinyin: "zikh FROY-en", english: "to be glad / look forward to",
    example: { de: "Ich freue mich auf dich.", en: "I'm looking forward to seeing you." } },
  { id: "de-verb-26", category: "de-verbs", hanzi: "denken", pinyin: "DENK-en", english: "to think",
    conjugations: regENConj("denk"),
    example: { de: "Ich denke an dich.", en: "I'm thinking of you." } },
  { id: "de-verb-27", category: "de-verbs", hanzi: "hoffen", pinyin: "HOF-en", english: "to hope",
    conjugations: regENConj("hoff"),
    example: { de: "Ich hoffe, du kommst.", en: "I hope you'll come." } },
  { id: "de-verb-28", category: "de-verbs", hanzi: "vergessen", pinyin: "fer-GES-en", english: "to forget",
    conjugations: { ich: "vergesse", du: "vergisst", er: "vergisst", wir: "vergessen", ihr: "vergesst", sie: "vergessen" },
    example: { de: "Ich vergesse dich nie.", en: "I'll never forget you." } },
  { id: "de-verb-29", category: "de-verbs", hanzi: "sich erinnern", pinyin: "zikh er-IN-ern", english: "to remember",
    example: { de: "Ich erinnere mich an dich.", en: "I remember you." } },
  { id: "de-verb-30", category: "de-verbs", hanzi: "erzählen", pinyin: "er-TSAY-len", english: "to tell / narrate",
    conjugations: regENConj("erzähl"),
    example: { de: "Erzähl mir mehr.", en: "Tell me more." } },
  { id: "de-verb-31", category: "de-verbs", hanzi: "träumen", pinyin: "TROY-men", english: "to dream",
    conjugations: regENConj("träum"),
    example: { de: "Ich träume von dir.", en: "I dream of you." } },
  { id: "de-verb-32", category: "de-verbs", hanzi: "planen", pinyin: "PLAH-nen", english: "to plan",
    conjugations: regENConj("plan"),
    example: { de: "Wir planen ein Wochenende.", en: "We're planning a weekend." } },
  { id: "de-verb-33", category: "de-verbs", hanzi: "fühlen", pinyin: "FUE-len", english: "to feel",
    conjugations: regENConj("fühl"),
    example: { de: "Wie fühlst du dich?", en: "How do you feel?" } },
];

const timeAdds = [
  { id: "de-time-16", category: "de-time", hanzi: "das Wochenende", pinyin: "das VOKH-en-en-deh", english: "the weekend", gender: "das", plural: "die Wochenenden" },
  { id: "de-time-17", category: "de-time", hanzi: "der Urlaub", pinyin: "der OOR-lowp", english: "the holiday / vacation", gender: "der", plural: "die Urlaube" },
  { id: "de-time-18", category: "de-time", hanzi: "der Geburtstag", pinyin: "der geh-BOORTS-tahg", english: "the birthday", gender: "der", plural: "die Geburtstage" },
  { id: "de-time-19", category: "de-time", hanzi: "gleich", pinyin: "glykh", english: "shortly / right away" },
  { id: "de-time-20", category: "de-time", hanzi: "früh", pinyin: "frue", english: "early" },
  { id: "de-time-21", category: "de-time", hanzi: "spät", pinyin: "shpate", english: "late" },
  { id: "de-time-22", category: "de-time", hanzi: "oft", pinyin: "oft", english: "often" },
  { id: "de-time-23", category: "de-time", hanzi: "manchmal", pinyin: "MANKH-mahl", english: "sometimes" },
  { id: "de-time-24", category: "de-time", hanzi: "immer", pinyin: "IM-er", english: "always" },
  { id: "de-time-25", category: "de-time", hanzi: "nie", pinyin: "nee", english: "never" },
  { id: "de-time-26", category: "de-time", hanzi: "bald", pinyin: "balt", english: "soon" },
  { id: "de-time-27", category: "de-time", hanzi: "vorgestern", pinyin: "FOR-ges-tern", english: "the day before yesterday" },
  { id: "de-time-28", category: "de-time", hanzi: "übermorgen", pinyin: "UE-ber-mor-gen", english: "the day after tomorrow" },
  { id: "de-time-29", category: "de-time", hanzi: "der Morgen", pinyin: "der MOR-gen", english: "the morning", gender: "der", plural: "die Morgen" },
  { id: "de-time-30", category: "de-time", hanzi: "der Abend", pinyin: "der AH-bent", english: "the evening", gender: "der", plural: "die Abende" },
];

// === #7 New units 13–17 ===

// Unit 13 — Modalverben: 3 new conjugate cards (dürfen, sollen, mögen) + 10 type sentences
const modalCards = [
  { id: "de-modal-01", category: "de-modals", hanzi: "dürfen", pinyin: "DUR-fen", english: "to be allowed to / may",
    conjugations: { ich: "darf", du: "darfst", er: "darf", wir: "dürfen", ihr: "dürft", sie: "dürfen" },
    example: { de: "Darf ich rein?", en: "May I come in?" } },
  { id: "de-modal-02", category: "de-modals", hanzi: "sollen", pinyin: "ZOL-en", english: "to be supposed to / should",
    conjugations: { ich: "soll", du: "sollst", er: "soll", wir: "sollen", ihr: "sollt", sie: "sollen" },
    example: { de: "Du sollst schlafen.", en: "You should sleep." } },
  { id: "de-modal-03", category: "de-modals", hanzi: "mögen", pinyin: "MEU-gen", english: "to like",
    conjugations: { ich: "mag", du: "magst", er: "mag", wir: "mögen", ihr: "mögt", sie: "mögen" },
    example: { de: "Ich mag dich.", en: "I like you." } },
  { id: "de-modal-04", category: "de-modals", hanzi: "Ich kann Deutsch sprechen.", pinyin: "", english: "I can speak German." },
  { id: "de-modal-05", category: "de-modals", hanzi: "Kannst du mir helfen?", pinyin: "", english: "Can you help me?" },
  { id: "de-modal-06", category: "de-modals", hanzi: "Ich muss jetzt gehen.", pinyin: "", english: "I have to go now." },
  { id: "de-modal-07", category: "de-modals", hanzi: "Was möchtest du essen?", pinyin: "", english: "What would you like to eat?" },
  { id: "de-modal-08", category: "de-modals", hanzi: "Ich will dich sehen.", pinyin: "", english: "I want to see you." },
  { id: "de-modal-09", category: "de-modals", hanzi: "Du solltest mehr schlafen.", pinyin: "", english: "You should sleep more." },
  { id: "de-modal-10", category: "de-modals", hanzi: "Wir können zusammen kochen.", pinyin: "", english: "We can cook together." },
  { id: "de-modal-11", category: "de-modals", hanzi: "Ich darf Wein trinken.", pinyin: "", english: "I'm allowed to drink wine." },
  { id: "de-modal-12", category: "de-modals", hanzi: "Magst du Schokolade?", pinyin: "", english: "Do you like chocolate?" },
  { id: "de-modal-13", category: "de-modals", hanzi: "Möchtest du Kaffee?", pinyin: "", english: "Would you like coffee?" },
];

// Unit 14 — Perfekt
const perfektCards = [
  { id: "de-perf-01", category: "de-perfekt", hanzi: "Ich habe gegessen.", pinyin: "", english: "I have eaten." },
  { id: "de-perf-02", category: "de-perfekt", hanzi: "Wir sind nach Berlin gefahren.", pinyin: "", english: "We went to Berlin." },
  { id: "de-perf-03", category: "de-perfekt", hanzi: "Hast du gut geschlafen?", pinyin: "", english: "Did you sleep well?" },
  { id: "de-perf-04", category: "de-perfekt", hanzi: "Ich habe dich vermisst.", pinyin: "", english: "I missed you." },
  { id: "de-perf-05", category: "de-perfekt", hanzi: "Was hast du gemacht?", pinyin: "", english: "What did you do?" },
  { id: "de-perf-06", category: "de-perfekt", hanzi: "Ich bin spät aufgestanden.", pinyin: "", english: "I got up late." },
  { id: "de-perf-07", category: "de-perfekt", hanzi: "Sie hat den Film gesehen.", pinyin: "", english: "She has seen the film." },
  { id: "de-perf-08", category: "de-perfekt", hanzi: "Ich habe Deutsch gelernt.", pinyin: "", english: "I have learnt German." },
  { id: "de-perf-09", category: "de-perfekt", hanzi: "Wir haben zusammen gekocht.", pinyin: "", english: "We cooked together." },
  { id: "de-perf-10", category: "de-perfekt", hanzi: "Bist du müde geworden?", pinyin: "", english: "Did you get tired?" },
  { id: "de-perf-11", category: "de-perfekt", hanzi: "Ich habe dich angerufen.", pinyin: "", english: "I called you." },
  { id: "de-perf-12", category: "de-perfekt", hanzi: "Hast du das Buch gelesen?", pinyin: "", english: "Have you read the book?" },
  { id: "de-perf-13", category: "de-perfekt", hanzi: "Wir sind ins Kino gegangen.", pinyin: "", english: "We went to the cinema." },
  { id: "de-perf-14", category: "de-perfekt", hanzi: "Ich habe Kaffee getrunken.", pinyin: "", english: "I drank coffee." },
  { id: "de-perf-15", category: "de-perfekt", hanzi: "Was hast du heute gemacht?", pinyin: "", english: "What did you do today?" },
  { id: "de-perf-16", category: "de-perfekt", hanzi: "Ich habe an dich gedacht.", pinyin: "", english: "I thought about you." },
];

// Unit 15 — Adjektivendungen
const adjCards = [
  { id: "de-adj-01", category: "de-adjektive", hanzi: "Die schöne Frau ist hier.", pinyin: "", english: "The beautiful woman is here." },
  { id: "de-adj-02", category: "de-adjektive", hanzi: "Der liebe Mann kommt.", pinyin: "", english: "The kind man is coming." },
  { id: "de-adj-03", category: "de-adjektive", hanzi: "Das kleine Kind schläft.", pinyin: "", english: "The little child is sleeping." },
  { id: "de-adj-04", category: "de-adjektive", hanzi: "Ich sehe die schöne Frau.", pinyin: "", english: "I see the beautiful woman." },
  { id: "de-adj-05", category: "de-adjektive", hanzi: "Ich sehe den lieben Mann.", pinyin: "", english: "I see the kind man." },
  { id: "de-adj-06", category: "de-adjektive", hanzi: "Ich sehe das kleine Kind.", pinyin: "", english: "I see the little child." },
  { id: "de-adj-07", category: "de-adjektive", hanzi: "Mit der schönen Frau.", pinyin: "", english: "With the beautiful woman." },
  { id: "de-adj-08", category: "de-adjektive", hanzi: "Mit dem lieben Mann.", pinyin: "", english: "With the kind man." },
  { id: "de-adj-09", category: "de-adjektive", hanzi: "Mit dem kleinen Kind.", pinyin: "", english: "With the little child." },
  { id: "de-adj-10", category: "de-adjektive", hanzi: "Eine schöne Frau ist hier.", pinyin: "", english: "A beautiful woman is here." },
  { id: "de-adj-11", category: "de-adjektive", hanzi: "Ein lieber Mann.", pinyin: "", english: "A kind man." },
  { id: "de-adj-12", category: "de-adjektive", hanzi: "Ein kleines Kind.", pinyin: "", english: "A little child." },
  { id: "de-adj-13", category: "de-adjektive", hanzi: "Mein lieber Schatz.", pinyin: "", english: "My dear love." },
  { id: "de-adj-14", category: "de-adjektive", hanzi: "Meine süße Freundin.", pinyin: "", english: "My sweet girlfriend." },
  { id: "de-adj-15", category: "de-adjektive", hanzi: "Ein guter Tag.", pinyin: "", english: "A good day." },
  { id: "de-adj-16", category: "de-adjektive", hanzi: "Mit meiner besten Freundin.", pinyin: "", english: "With my best (girl)friend." },
];

// Unit 16 — Wechselpräpositionen
const wechselCards = [
  { id: "de-wechsel-01", category: "de-wechsel", hanzi: "Ich gehe in die Küche.", pinyin: "", english: "I'm going into the kitchen." },
  { id: "de-wechsel-02", category: "de-wechsel", hanzi: "Ich bin in der Küche.", pinyin: "", english: "I am in the kitchen." },
  { id: "de-wechsel-03", category: "de-wechsel", hanzi: "Das Buch liegt auf dem Tisch.", pinyin: "", english: "The book is on the table." },
  { id: "de-wechsel-04", category: "de-wechsel", hanzi: "Ich lege das Buch auf den Tisch.", pinyin: "", english: "I put the book on the table." },
  { id: "de-wechsel-05", category: "de-wechsel", hanzi: "Wir gehen in den Park.", pinyin: "", english: "We're going to the park." },
  { id: "de-wechsel-06", category: "de-wechsel", hanzi: "Wir sind im Park.", pinyin: "", english: "We are in the park." },
  { id: "de-wechsel-07", category: "de-wechsel", hanzi: "Sie sitzt vor dem Fenster.", pinyin: "", english: "She is sitting in front of the window." },
  { id: "de-wechsel-08", category: "de-wechsel", hanzi: "Ich stelle es vor das Fenster.", pinyin: "", english: "I'm placing it in front of the window." },
  { id: "de-wechsel-09", category: "de-wechsel", hanzi: "Die Lampe hängt über dem Bett.", pinyin: "", english: "The lamp hangs above the bed." },
  { id: "de-wechsel-10", category: "de-wechsel", hanzi: "Ich hänge die Lampe über das Bett.", pinyin: "", english: "I'm hanging the lamp above the bed." },
  { id: "de-wechsel-11", category: "de-wechsel", hanzi: "Der Hund ist unter dem Tisch.", pinyin: "", english: "The dog is under the table." },
  { id: "de-wechsel-12", category: "de-wechsel", hanzi: "Der Hund läuft unter den Tisch.", pinyin: "", english: "The dog runs under the table." },
  { id: "de-wechsel-13", category: "de-wechsel", hanzi: "Ich warte vor der Tür.", pinyin: "", english: "I'm waiting in front of the door." },
  { id: "de-wechsel-14", category: "de-wechsel", hanzi: "Ich gehe an den Strand.", pinyin: "", english: "I'm going to the beach." },
  { id: "de-wechsel-15", category: "de-wechsel", hanzi: "Ich bin am Strand.", pinyin: "", english: "I am at the beach." },
  { id: "de-wechsel-16", category: "de-wechsel", hanzi: "Wir treffen uns zwischen den Häusern.", pinyin: "", english: "We're meeting between the houses." },
];

// Unit 17 — Smalltalk & Beziehung
const smalltalkCards = [
  { id: "de-talk-01", category: "de-smalltalk", hanzi: "Wie war dein Tag?", pinyin: "", english: "How was your day?" },
  { id: "de-talk-02", category: "de-smalltalk", hanzi: "Was möchtest du essen?", pinyin: "", english: "What would you like to eat?" },
  { id: "de-talk-03", category: "de-smalltalk", hanzi: "Ich vermisse dich.", pinyin: "", english: "I miss you." },
  { id: "de-talk-04", category: "de-smalltalk", hanzi: "Ich liebe dich.", pinyin: "", english: "I love you." },
  { id: "de-talk-05", category: "de-smalltalk", hanzi: "Bist du müde?", pinyin: "", english: "Are you tired?" },
  { id: "de-talk-06", category: "de-smalltalk", hanzi: "Hast du Hunger?", pinyin: "", english: "Are you hungry?" },
  { id: "de-talk-07", category: "de-smalltalk", hanzi: "Sollen wir zusammen kochen?", pinyin: "", english: "Shall we cook together?" },
  { id: "de-talk-08", category: "de-smalltalk", hanzi: "Was machst du heute Abend?", pinyin: "", english: "What are you doing tonight?" },
  { id: "de-talk-09", category: "de-smalltalk", hanzi: "Können wir reden?", pinyin: "", english: "Can we talk?" },
  { id: "de-talk-10", category: "de-smalltalk", hanzi: "Ich freue mich auf dich.", pinyin: "", english: "I'm looking forward to seeing you." },
  { id: "de-talk-11", category: "de-smalltalk", hanzi: "Ich denke an dich.", pinyin: "", english: "I'm thinking of you." },
  { id: "de-talk-12", category: "de-smalltalk", hanzi: "Schlaf gut.", pinyin: "", english: "Sleep well." },
  { id: "de-talk-13", category: "de-smalltalk", hanzi: "Träum süß.", pinyin: "", english: "Sweet dreams." },
  { id: "de-talk-14", category: "de-smalltalk", hanzi: "Bis bald.", pinyin: "", english: "See you soon." },
  { id: "de-talk-15", category: "de-smalltalk", hanzi: "Bis morgen.", pinyin: "", english: "See you tomorrow." },
  { id: "de-talk-16", category: "de-smalltalk", hanzi: "Pass auf dich auf.", pinyin: "", english: "Take care." },
  { id: "de-talk-17", category: "de-smalltalk", hanzi: "Ich bin gleich da.", pinyin: "", english: "I'll be there shortly." },
  { id: "de-talk-18", category: "de-smalltalk", hanzi: "Komm her.", pinyin: "", english: "Come here." },
  { id: "de-talk-19", category: "de-smalltalk", hanzi: "Du fehlst mir.", pinyin: "", english: "I miss you (idiom)." },
  { id: "de-talk-20", category: "de-smalltalk", hanzi: "Ich hab dich lieb.", pinyin: "", english: "I love you (softer)." },
];

// Append all new vocab cards
const allNewCards = [
  ...colorAdds, ...foodAdds, ...familyAdds, ...verbAdds, ...timeAdds,
  ...modalCards, ...perfektCards, ...adjCards, ...wechselCards, ...smalltalkCards,
];

// Sanity: check no id collisions with existing vocab
const existingIds = new Set(vocab.map((c) => c.id));
const collisions = allNewCards.filter((c) => existingIds.has(c.id));
if (collisions.length) {
  console.error("ID collisions:", collisions.map((c) => c.id));
  process.exit(1);
}

vocab.push(...allNewCards);

// === Update existing units to include new card IDs ===
function appendIds(unitId, ids) {
  const u = units.find((x) => x.id === unitId);
  if (!u) throw new Error(`Unit ${unitId} not found`);
  u.cardIds.push(...ids);
}

appendIds("de-colors", colorAdds.map((c) => c.id));
appendIds("de-food", foodAdds.map((c) => c.id));
appendIds("de-family", familyAdds.map((c) => c.id));
appendIds("de-verbs", verbAdds.map((c) => c.id));
appendIds("de-time", timeAdds.map((c) => c.id));

// === Add 5 new units ===
const newUnits = [
  {
    id: "de-modals",
    index: 13,
    title: "Modal Verbs",
    subtitle: "können, müssen, dürfen, sollen, wollen, mögen",
    emoji: "🎚️",
    category: "de-modals",
    cardIds: [
      "de-verb-09", "de-verb-10", "de-verb-08",
      ...modalCards.map((c) => c.id),
    ],
  },
  {
    id: "de-perfekt",
    index: 14,
    title: "Perfekt",
    subtitle: "Past tense — haben/sein + past participle",
    emoji: "⏪",
    category: "de-perfekt",
    cardIds: perfektCards.map((c) => c.id),
  },
  {
    id: "de-adjektive",
    index: 15,
    title: "Adjective Endings",
    subtitle: "der schöne / die schöne / das schöne",
    emoji: "🎨",
    category: "de-adjektive",
    cardIds: adjCards.map((c) => c.id),
  },
  {
    id: "de-wechsel",
    index: 16,
    title: "Two-way Prepositions",
    subtitle: "in / an / auf — accusative vs dative",
    emoji: "↔️",
    category: "de-wechsel",
    cardIds: wechselCards.map((c) => c.id),
  },
  {
    id: "de-smalltalk",
    index: 17,
    title: "Smalltalk & Relationship",
    subtitle: "Everyday phrases for daily conversation",
    emoji: "💬",
    category: "de-smalltalk",
    cardIds: smalltalkCards.map((c) => c.id),
  },
];

units.push(...newUnits);

fs.writeFileSync(vocabPath, JSON.stringify(vocab, null, 2) + "\n");
fs.writeFileSync(unitsPath, JSON.stringify(units, null, 2) + "\n");

console.log(`Added ${allNewCards.length} new cards (${vocab.length} total)`);
console.log(`Added ${newUnits.length} new units (${units.length} total)`);
