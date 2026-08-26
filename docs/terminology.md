# Terminology map — internal

Not published. This exists so that "cavity", "gate" and "tolerance stack" are
the same word on every page of a language, and so that a term an engineer in
that market actually uses is not replaced by a dictionary equivalent nobody
says out loud.

## Rules that apply to every language

1. **Keep the abbreviations engineers keep.** CAD, DFM, CATIA, SolidWorks,
   STEP, IGES, X_T, STL, PET, PP, PE, PVC, ABS, PA, POM, PBT, PC, HDPE, LDPE,
   ASA, SAN, PMMA, TPE, TPU, PCR, PCO 1881, PCO 1810, GPI/SPI, VDI 3400,
   ISO/ASTM/DIN/EN/IEC standard numbers, IQ, OQ, PQ, GMP, ISO 13485, NDA, RFQ,
   HRC, BHN, Ra, µm, mm, °C, MPa, l/h, kPa. These stay in Latin script in all
   nine languages, including the right-to-left ones.
2. **Western digits everywhere.** `numerals: 'latn'` in `src/i18n/locales.ts`.
   A part number, a shot count and a tolerance are read by the same engineers
   in every market; Eastern Arabic-Indic digits in Persian, Arabic or Urdu
   would make a drawing dimension unreadable to half the audience.
3. **Thousands separator follows the locale**, but never in a way that could be
   read as a decimal point: `1,000` (en, zh, th, tr uses `1.000`), Persian and
   Arabic use `1,000`. Never `1.000` in fa/ar/ur — it reads as one.
4. **Never translate a claim into a stronger one.** "Tooling experience to 46
   cavities" is experience, not a capacity guarantee. "Readiness, not reserved
   capacity" must stay a distinction in every language.
5. **Boundary sentences keep their exact scope.** Where English says Metal Form
   does *not* hold a certification, the target sentence must be a denial, not a
   hedge. `scripts/check-content.mjs` enforces this by key path.

## Core terms

| English | ru | hy | tr | th | zh | ur | ar | fa |
|---|---|---|---|---|---|---|---|---|
| mould (noun) | пресс-форма | կաղապար | kalıp | แม่พิมพ์ | 模具 | مولڈ | قالب | قالب |
| mould making / tooling | изготовление пресс-форм | կաղապարաշինություն | kalıpçılık | งานแม่พิมพ์ | 模具制造 | ٹولنگ | تصنيع القوالب | قالب‌سازی |
| cavity | гнездо | խոռոչ | göz | คาวิตี้ | 型腔 | کیویٹی | تجويف | حفره |
| cavity count / cavitation | гнёздность | խոռոչների թիվ | göz sayısı | จำนวนคาวิตี้ | 型腔数 | کیویٹی کاؤنٹ | عدد التجاويف | تعداد حفره |
| core | пуансон | միջուկ | maça | คอร์ | 型芯 | کور | القلب | ماهیچه |
| insert | вставка | ներդիր | insert | อินเสิร์ท | 镶件 | انسرٹ | إدراج | اینسرت |
| gate | впуск | ներարկման կետ | yolluk girişi | เกต | 浇口 | گیٹ | البوابة | گیت |
| runner (hot/cold) | литник (горячий/холодный) | հոսքուղի | yolluk (sıcak/soğuk) | รันเนอร์ | 流道（热/冷） | رنر | القناة (ساخنة/باردة) | رانر (گرم/سرد) |
| cooling / cooling circuit | охлаждение / контур охлаждения | հովացում | soğutma / soğutma kanalı | ระบบหล่อเย็น | 冷却水路 | کولنگ | التبريد | خنک‌کاری |
| cycle time | время цикла | ցիկլի տևողություն | çevrim süresi | รอบการฉีด | 成型周期 | سائیکل ٹائم | زمن الدورة | زمان سیکل |
| shot | впрыск | ներարկում | baskı | ช็อต | 模次 | شاٹ | الطلقة | شات |
| tolerance | допуск | թույլատրելի շեղում | tolerans | ค่าพิกัด | 公差 | ٹالرنس | التفاوت | تلرانس |
| tolerance stack | накопление допусков | շեղումների կուտակում | tolerans yığılması | การสะสมค่าพิกัด | 公差累积 | ٹالرنس اسٹیک | تراكم التفاوتات | انباشت تلرانس |
| shrinkage | усадка | կծկում | çekme | การหดตัว | 收缩率 | شرنکیج | الانكماش | جمع‌شدگی |
| warpage | коробление | ծռվածք | çarpılma | การบิดงอ | 翘曲 | وارپیج | الالتواء | تاب‌برداشتن |
| weld line / knit line | линия спая | եռակցման գիծ | birleşme izi | เส้นเชื่อมประสาน | 熔接线 | ویلڈ لائن | خط اللحام | خط جوش |
| parting line | линия разъёма | բաժանման գիծ | ayırma çizgisi | เส้นแบ่งแม่พิมพ์ | 分型线 | پارٹنگ لائن | خط الانفصال | خط جدایش |
| draft | уклон | թեքություն | çıkma açısı | มุมถอดแบบ | 脱模斜度 | ڈرافٹ | زاوية السحب | زاویه شیب |
| undercut | поднутрение | ենթակտրվածք | ters açı | อันเดอร์คัต | 倒扣 | انڈر کٹ | التجويف الخلفي | زیربرش |
| slide / lifter | ползун / толкатель-наклонный | սահիչ / բարձրացնող | maça kaydırıcı / lifter | สไลด์ / ลิฟเตอร์ | 滑块 / 斜顶 | سلائیڈ / لفٹر | المنزلق / الرافع | اسلاید / لیفتر |
| unscrewing core | вывинчивающийся стержень | պտուտակազերծվող միջուկ | döner maça | คอร์ถอดเกลียว | 旋转脱螺纹芯 | ان اسکروئنگ کور | القلب اللولبي | ماهیچه بازشونده |
| preform | преформа | նախաձև | preform | พรีฟอร์ม | 瓶坯 | پری فارم | البريفورم | پریفرم |
| neck finish | горловина | վզիկի պրոֆիլ | boyun profili | ปากขวด | 瓶口规格 | نیک فنش | فوهة العنق | دهانه |
| blow moulding | выдувное формование | փչման ձևավորում | şişirme kalıplama | การเป่าขึ้นรูป | 吹塑 | بلو مولڈنگ | النفخ | بادزنی |
| injection moulding | литьё под давлением | ներարկային ձուլում | enjeksiyon kalıplama | การฉีดขึ้นรูป | 注塑 | انجیکشن مولڈنگ | الحقن | تزریق پلاستیک |
| maintenance | обслуживание | սպասարկում | bakım | การบำรุงรักษา | 维护 | مینٹیننس | الصيانة | نگهداری |
| validation / qualification | валидация / квалификация | վալիդացիա / որակավորում | validasyon / kalifikasyon | การตรวจรับรอง | 验证 / 确认 | ویلیڈیشن | التحقق / التأهيل | اعتبارسنجی / صلاحیت‌سنجی |
| production volume | объём производства | արտադրության ծավալ | üretim adedi | ปริมาณการผลิต | 生产量 | پروڈکشن والیوم | حجم الإنتاج | حجم تولید |
| repeatability | повторяемость | կրկնելիություն | tekrarlanabilirlik | ความสามารถทำซ้ำ | 重复性 | ریپیٹ ایبلٹی | قابلية التكرار | تکرارپذیری |
| dimensional consistency | стабильность размеров | չափային կայունություն | boyutsal tutarlılık | ความคงที่ของขนาด | 尺寸一致性 | ڈائمینشنل کنسسٹنسی | ثبات الأبعاد | یکنواختی ابعادی |
| tooling life | ресурс пресс-формы | կաղապարի ռեսուրս | kalıp ömrü | อายุแม่พิมพ์ | 模具寿命 | ٹول لائف | عمر القالب | عمر قالب |
| programme life | срок программы | ծրագրի տևողություն | program ömrü | อายุโครงการ | 项目周期 | پروگرام لائف | عمر البرنامج | طول برنامه |
| spare parts | запасные части | պահեստամասեր | yedek parça | อะไหล่ | 备件 | اسپیئر پارٹس | قطع الغيار | قطعات یدکی |
| second-source tooling | дублирующая оснастка | երկրորդ աղբյուրի կաղապար | ikinci kaynak kalıbı | แม่พิมพ์สำรอง | 第二来源模具 | سیکنڈ سورس ٹولنگ | قالب المصدر الثاني | قالب منبع دوم |
| reverse engineering | реверс-инжиниринг | հակադարձ ինժեներիա | tersine mühendislik | วิศวกรรมย้อนกลับ | 逆向工程 | ریورس انجینئرنگ | الهندسة العكسية | مهندسی معکوس |
| DFM | DFM | DFM | DFM | DFM | DFM（可制造性设计） | DFM | DFM | DFM |
| CAD | CAD | CAD | CAD | CAD | CAD | CAD | CAD | CAD |

## Voice per language

- **ru** — technical/business Russian. Short verbal sentences, no marketing
  nominalisation chains. Headings are noun phrases or short statements.
- **hy** — Eastern Armenian, professional register. Retain Latin abbreviations.
- **tr** — modern professional Turkish. Short clauses, decisive headlines,
  no English-style relative-clause chains.
- **th** — Thai reading rhythm, clarity first. Keep the English engineering
  terms Thai manufacturing actually uses.
- **zh** — concise Simplified Chinese, more compact than the English. Established
  mould-industry vocabulary, no marketing filler.
- **ur** — professional Urdu for Pakistani manufacturing buyers. Keep English
  engineering terms; avoid heavy Persian/Arabic literary constructions.
- **ar** — professional MSA for industrial B2B. Not literary, not verbose.
- **fa** — natural professional Iranian Persian. Correct نیم‌فاصله. Avoid
  bureaucratic register, long passives and calqued English noun phrases.

## Transcreation guardrails

- Treat English headlines and commercial metaphors as concepts, never as
  sentence templates. If the metaphor is not idiomatic in the target language,
  state the engineering or purchasing consequence directly.
- Industry navigation uses the native equivalent of “choose”, “review” or
  “explore”. Never use a literal equivalent of “open an industry”.
- Words such as *lever*, *contract*, *money* and *arithmetic* are retained only
  when they refer to an actual mechanism, agreement, currency or calculation.
  Otherwise use the locale's normal terms for factor, interface, cost driver or
  production economics.
- `scripts/polish/native-copy-qa.mjs` blocks the known literal-calque patterns
  across all eight non-English locales.

## Right-to-left mechanics (fa, ar, ur)

- Latin runs inside RTL sentences (`PCO 1881`, `CATIA`, `48 Rc`) are isolated by
  the browser's bidi algorithm because the paragraph direction is RTL and the
  runs are neutral-terminated. Where a run ends in a bracket, a slash or a
  percent sign, wrap it or reorder the sentence so the neutral character is not
  the last thing before Persian/Arabic text.
- Ranges use an en dash with the *smaller number first in logical order*:
  `12.7 – 13.7`. Do not reverse them for RTL; the bidi algorithm handles it.
- Units follow the number with a normal space: `46 حفره`, `2 mm`.
- Slashes between Latin terms (`IQ / OQ / PQ`) keep spaces so the run stays one
  bidi segment.
