export const meta = {
  name: 'metalform-localise',
  description: 'Localise the Metal Form site into eight languages, preserving JSON structure exactly',
  phases: [
    { title: 'Core + flagships', detail: 'site-wide strings, home, capabilities, about, contact, medical, beverage' },
    { title: 'Remaining chapters', detail: 'the other eleven industry chapters, matching the terminology already set' },
  ],
}

const ROOT = '/home/namiral/Projects/Playground/metal-form-2'
const EN = `${ROOT}/src/content/en`

const LOCALES = [
  {
    code: 'ru', name: 'Russian', native: 'Русский', dir: 'ltr',
    note: `Market: Russia and the CIS, plus Russian-speaking industrial buyers across Armenia, Central Asia and the Caucasus — which is a real audience for this company, not a theoretical one.
Register: professional technical Russian. Use «вы» forms, no «ты». Avoid the calqued marketing register that reads as a machine translation of an American site; write the way a Russian engineering supplier writes to a plant director.
Terminology: пресс-форма (not «форма» alone), литьё под давлением, гнездо / гнёздность for cavity and cavitation, горячеканальная система, литник, толкатель, разъём формы (parting line), знак / пуансон, усадка, коробление, утяжина (sink mark), линия спая (weld line), облой (flash), техническое задание.
Text runs roughly 15% longer than English. Keep display headlines short.
Use « » guillemets for quotation marks and a proper em dash — with spaces around it, as Russian typography requires.`,
  },
  {
    code: 'hy', name: 'Armenian', native: 'Հայերեն', dir: 'ltr',
    note: `Market: Armenia. This is the company's first active sales market and the beverage chapter is aimed at a specific Armenian bottler, so this locale gets read by a real customer before any other translation does. Treat it accordingly.
Use Eastern Armenian, the standard in Armenia. Not Western Armenian.
Register: professional and technical, addressing a plant owner or production director. Armenian industrial vocabulary borrows heavily from Russian in this sector — where the borrowed term is what practitioners actually say, use it rather than a purist coinage nobody uses on a shop floor.
Text runs roughly 12% longer than English.`,
  },
  {
    code: 'tr', name: 'Turkish', native: 'Türkçe', dir: 'ltr',
    note: `Market: Türkiye, which has a large and sophisticated domestic mould-making industry. A Turkish reader will know this subject well, so imprecise terminology will be noticed immediately.
Register: professional business Turkish, "siz" throughout.
Terminology: kalıp (mould), kalıpçılık, enjeksiyon kalıbı, göz / gözlü (cavity, e.g. 32 gözlü kalıp), sıcak yolluk (hot runner), yolluk (runner), itici (ejector), maça (core), çekme payı (shrinkage), çarpılma (warpage), çöküntü izi (sink mark), birleşme çizgisi (weld line), çapak (flash), çevrim süresi (cycle time), ayırma yüzeyi (parting line).
Turkish agglutination produces long compounds — keep display headlines short and check they do not break.
Text runs roughly 10% longer than English.`,
  },
  {
    code: 'th', name: 'Thai', native: 'ไทย', dir: 'ltr',
    note: `Market: Thailand, a major regional moulding and packaging hub.
Register: formal business Thai, polite but not deferential. This is one manufacturer writing to another.
Thai has no spaces between words and no capital letters, so English typographic devices do not transfer: never letterspace Thai, never uppercase it. The site's CSS already handles this — write natural Thai and it will be set correctly.
Technical terms: many are used in English by Thai practitioners (hot runner, cavity, cycle time). Where the English term is genuinely what a Thai engineer says, keep it in Latin script rather than forcing an unfamiliar Thai coinage; where a settled Thai term exists (แม่พิมพ์ for mould, การฉีดพลาสติก for injection moulding), use it.
Thai text is typically slightly shorter than English but needs much more line-height, which the CSS already provides.`,
  },
  {
    code: 'zh', name: 'Simplified Chinese', native: '中文', dir: 'ltr',
    note: `Market: mainland China and Chinese-speaking industrial buyers. Simplified characters, mainland conventions.
Register: professional written Chinese for a B2B industrial audience. Direct and concrete. Avoid the four-character-idiom marketing register that Chinese corporate sites overuse — it reads as filler to an engineer.
Terminology: 模具 (mould), 注塑模具, 型腔 (cavity), 型芯 (core), 热流道 (hot runner), 冷流道, 浇口 (gate), 流道 (runner), 分型面 (parting line), 顶针 (ejector pin), 滑块 (slide), 收缩率 (shrinkage), 翘曲 (warpage), 缩痕 (sink mark), 熔接线 (weld line), 飞边 (flash), 成型周期 (cycle time), 一模多腔 (multi-cavity).
Use full-width Chinese punctuation: ，。、；：（）「」 and so on. Never mix half-width commas into Chinese prose.
Chinese runs roughly 40% SHORTER than English — headlines will look sparse. That is correct; do not pad them.
Note that this company is, in part, competing with Chinese suppliers. Do not write copy that disparages them; write copy that is specific enough to stand next to them.`,
  },
  {
    code: 'ur', name: 'Urdu', native: 'اردو', dir: 'rtl',
    note: `Market: Pakistan. RIGHT-TO-LEFT.
Set in Nastaliq (Noto Nastaliq Urdu), which is what Urdu readers expect and which the CSS already handles with extra line-height. Keep headlines SHORT — Nastaliq is tall and a long headline will break the composition.
Register: formal business Urdu. Technical vocabulary in this sector is heavily English-borrowed in Pakistan; where an engineer would say the English word, transliterate or keep it in Latin rather than inventing an unfamiliar Urdu term. Mould is مولڈ in practice, not a purist alternative.
Western digits throughout — Urdu prose often uses Eastern digits, but engineering specifications and export documents do not, and this is a technical site.
Text length is close to English.`,
  },
  {
    code: 'ar', name: 'Arabic', native: 'العربية', dir: 'rtl',
    note: `Market: the Gulf, the Levant and North Africa. RIGHT-TO-LEFT.
Modern Standard Arabic, in the register used for commerce and industry across the region — not a dialect and not literary Arabic.
Register: formal, professional, addressing a factory owner or procurement director.
Terminology: قالب (mould), قوالب الحقن (injection moulds), تجويف (cavity), متعدد التجاويف (multi-cavity), القناة الساخنة (hot runner), البوابة (gate), خط الانفصال (parting line), القاذف (ejector), الانكماش (shrinkage), الالتواء (warpage), زمن الدورة (cycle time).
Western digits throughout — this is the convention in Gulf industrial and corporate writing and in all international commerce.
Text length is roughly equal to English.`,
  },
  {
    code: 'fa', name: 'Persian', native: 'فارسی', dir: 'rtl',
    note: `Market: Iran, and Persian-speaking buyers. RIGHT-TO-LEFT. This is also the company's own language, so it will be read most critically of all — a Persian reader who spots a machine-translated phrase will discount everything else on the site.
Register: professional technical Persian as used in Iranian industry. Not literary Persian, not a calque of English.
Terminology: قالب (mould), قالب تزریق پلاستیک, حفره / کویتی (cavity — کویتی is what practitioners actually say), چند حفره‌ای, سیستم هات‌رانر, گیت, خط جدایش (parting line), پران (ejector), انقباض (shrinkage), تاب‌برداشتن (warpage), زمان سیکل (cycle time), مهندسی معکوس (reverse engineering), تولید انبوه (mass production).
Use ZWNJ (نیم‌فاصله, U+200C) correctly — می‌شود not میشود, چند حفره‌ای not چند حفرهای. This is the single clearest marker of a native versus a machine translation in Persian.
Western digits throughout — Persian prose commonly uses Eastern digits, but engineering drawings, specifications, catalogues and export documents use Western ones, and this is a technical site whose spec tables cannot change.
Note: in Persian copy the company's own country may be referred to normally as ایران.`,
  },
]

const CORE = [
  'common', 'home', 'capabilities', 'about', 'contact', 'industries-index',
  'industries/medical', 'industries/beverage',
]

const REST = [
  'industries/automotive', 'industries/cosmetics', 'industries/appliances',
  'industries/chemical', 'industries/electrical', 'industries/toys',
  'industries/agriculture', 'industries/plumbing', 'industries/furniture',
  'industries/marine', 'industries/custom',
]

const RULES = `
You are localising a finished, production-quality industrial B2B website. It sells engineering, tooling, manufacturing and supply of moulded plastic components to manufacturers.

═══ THE ABSOLUTE RULE ═══
Every output file must have EXACTLY the same JSON structure as its English source: the same keys, in the same order, with arrays of the same length and objects with the same shape. You replace leaf STRING VALUES only. You never add a key, never remove one, never rename one, never reorder an array, never merge two strings into one, never split one into two.

The site's layout is driven by these key paths. A renamed key or a shortened array renders "undefined" on a live page in one language only — the kind of bug nobody notices until a customer does.

═══ WHAT MUST NOT BE TRANSLATED ═══
· Any value whose key is "id", "key" or "slug" — these are DOM identifiers wired to tab controls and anchors. Copy them byte for byte.
· Index values like "01", "02", "08".
· The company name "Metal Form" — it is a registered name. Never translate, transliterate or localise it. In Arabic-script languages it stays in Latin characters.
· Software and file formats: CATIA, SolidWorks, STEP, IGES, X_T, STL.
· Material and resin designations: PET, HDPE, PP, PA66, PBT, PC, ABS, POM, PVC, PEX, PP-R, PE, COC, COP.
· Standard designations: PCO 1881, PCO 1810, 29/25, 30/25, 26/22, GME 30.37, SPI Class 101/102/103/104/105, ISO 13485, GMP, EN 71, ASTM F963, IEC, UL, ISO 8317, WRAS.
· Units and symbols: mm, g, s, h, t, Rc, BHN, ppm, dL/g, °C, °F, Ø, ±, %.
· All numerals stay in WESTERN DIGITS (0–9) in every language, including Persian, Urdu and Arabic. This is a technical site; its specification tables cannot use one numeral system while its prose uses another.

═══ HOW TO TRANSLATE ═══
· ADAPT, do not transliterate. Headlines, taglines and calls to action must work as native industrial copy in the target language. A literal rendering of an English headline usually reads badly; find the sentence a supplier in that language would actually write. Preserve the MEANING and the ARGUMENT, not the word order.
· Keep the register: concise, industrial, direct, technically literate, commercially aware. Short sentences, concrete nouns. This is one manufacturer writing to another, not a brochure.
· Never introduce marketing filler that the English deliberately avoids. Banned in every language: the equivalents of "world-class", "cutting-edge", "state-of-the-art", "innovative solutions", "one-stop shop", "we pride ourselves", "excellence", "passion".
· NEVER introduce a capability or certification the English does not claim. Several sections exist specifically to say what the company does NOT do — ISO 13485, GMP, cleanroom, sterile manufacture, UL testing, simulation software, published prices. Translate those as DENIALS. A translator who softens a denial into an implication has broken the most important thing on this site.
· The WhatsApp pre-fill messages (key "prefill") are written in the first person, as a message the customer sends. Translate them so a buyer in that language could press send without editing. Keep the line breaks (\\n) and the field labels.
· Keys ending in "Note", "note", "source", "disclosure", "boundary", "honesty" carry honesty statements. Translate them fully and faithfully — do not soften, do not shorten, do not drop.

═══ LENGTH DISCIPLINE ═══
Two categories have HARD length limits because they are drawn inside SVG figures or set at display size and cannot wrap:
· Anything under "diagram" in home.json — these are labels inside technical drawings. One or two words each. If the natural translation is long, use the shortest professionally correct form.
· Any "headline" array — these are display-size lines. Keep each line close to the English line's length. If a line would be much longer, restructure across the existing number of lines; do not add a line and do not let one line run to double length.

Everything else may run longer naturally; the layout is built for it.

═══ REFERENCE ═══
Read ${ROOT}/research/_terminology.json before you begin. It contains verified professional terminology for about 55 core moulding and tooling terms in all nine languages, plus adapted (not literal) renderings of the site's key commercial phrases, plus per-language register and punctuation guidance. Use it. Where it conflicts with your instinct, prefer it — it was checked against native-language industry sources.

═══ METHOD ═══
For each file: read the English source, then write the translated file to the same relative path under your locale folder. Verify each file parses with:
  node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"
Then verify the structure matches by comparing key counts:
  node -e "const f=o=>{const r=[];const w=(v,p='')=>{if(Array.isArray(v))v.forEach((x,i)=>w(x,p+'['+i+']'));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>w(x,p?p+'.'+k:k));else r.push(p)};w(o);return r};const a=f(require('<EN PATH>')),b=f(require('<YOUR PATH>'));const miss=a.filter(k=>!b.includes(k));console.log(miss.length?'MISSING: '+miss.join(', '):'STRUCTURE OK')"
Fix anything that reports missing before you finish.
`

phase('Core + flagships')

const results = await pipeline(
  LOCALES,

  // Stage 1 — the site-wide strings and the two flagship chapters. This is
  // where the terminology for the whole locale gets decided.
  (loc) => agent(
    `${RULES}\n\n═══ YOUR LANGUAGE ═══\n${loc.name} (${loc.native}), locale code "${loc.code}", direction ${loc.dir}.\n\n${loc.note}\n\n═══ YOUR FILES — STAGE 1 ═══\nTranslate each of these from ${EN}/<path>.json into ${ROOT}/src/content/${loc.code}/<path>.json (create directories as needed):\n${CORE.map((f) => `  · ${f}`).join('\n')}\n\nStart with "common" — it sets the vocabulary the rest of the site reuses. Then "home". Then the rest.\n\nThe two industry chapters here are the flagship verticals and the most technical content on the site. The medical chapter turns on a section that states exactly where the regulatory line falls; the beverage chapter turns on the argument that the lightest cavity in a tool sets the weight of every bottle. Both arguments must survive translation intact — they are what makes the pages credible to a real manufacturer.\n\nReturn: {"locale":"${loc.code}","stage":1,"files":N,"terminologyDecisions":["3-6 key term choices you made that stage 2 must match"],"hardestPhrase":"..."}`,
    {
      label: `l10n:${loc.code}:core`,
      phase: 'Core + flagships',
      schema: {
        type: 'object', additionalProperties: true,
        required: ['locale', 'files'],
        properties: {
          locale: { type: 'string' }, stage: { type: 'number' }, files: { type: 'number' },
          terminologyDecisions: { type: 'array', items: { type: 'string' } },
          hardestPhrase: { type: 'string' },
        },
      },
    },
  ),

  // Stage 2 — the remaining eleven chapters, matching what stage 1 established.
  (prev, loc) => agent(
    `${RULES}\n\n═══ YOUR LANGUAGE ═══\n${loc.name} (${loc.native}), locale code "${loc.code}", direction ${loc.dir}.\n\n${loc.note}\n\n═══ CONSISTENCY ═══\nThe site-wide strings and the two flagship chapters for this locale are already translated and sitting in ${ROOT}/src/content/${loc.code}/. READ ${ROOT}/src/content/${loc.code}/common.json and ${ROOT}/src/content/${loc.code}/industries/medical.json FIRST and match their terminology exactly. A reader moving between chapters must not meet two different words for "cavity".\n\nTerminology already fixed for this locale:\n${(prev?.terminologyDecisions ?? ['(none recorded — derive from the files)']).map((t) => `  · ${t}`).join('\n')}\n\n═══ YOUR FILES — STAGE 2 ═══\nTranslate each of these from ${EN}/<path>.json into ${ROOT}/src/content/${loc.code}/<path>.json:\n${REST.map((f) => `  · ${f}`).join('\n')}\n\nEach chapter is written for a different sector and uses that sector's own vocabulary. Research the correct term in your language where you are unsure rather than guessing — a plumbing fitting, an irrigation dripper, a cosmetic closure and a connector housing each have a settled name in every industrial language, and using the wrong one is immediately visible to the buyer the page is aimed at.\n\nReturn: {"locale":"${loc.code}","stage":2,"files":N,"sectorsHardest":["..."],"notes":"..."}`,
    {
      label: `l10n:${loc.code}:chapters`,
      phase: 'Remaining chapters',
      schema: {
        type: 'object', additionalProperties: true,
        required: ['locale', 'files'],
        properties: {
          locale: { type: 'string' }, stage: { type: 'number' }, files: { type: 'number' },
          sectorsHardest: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' },
        },
      },
    },
  ),
)

const done = results.filter(Boolean)
log(`localisation finished for ${done.length}/${LOCALES.length} languages`)
return done
