#!/usr/bin/env node
/**
 * Guard against the literal English calques removed in the final copy pass.
 * Structural parity cannot catch grammatically valid but culturally unnatural
 * wording, so these patterns protect the known failure modes explicitly.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../src/content/', import.meta.url).pathname;
const rules = {
  fa: [/هندسهٔ? متفاوتی می‌خرد/u, /صنعت خودتان را باز/u, /دهانه،? همان قرارداد/u, /موقعیت تجاری تزریق‌کار/u, /جغرافیای دوم/u, /قالب همان جایی/u, /ردیف آخر همان/u, /پول کجاست/u, /سیاههٔ قطعات/u, /حساب و کتاب/u],
  ar: [/يشتري هندسة مختلفة/u, /افتح القطاع الذي تعمل فيه/u, /العنق هو العقد/u, /الموقف التجاري.*يتغير/u, /جغرافيا ثانية/u, /أين المال/u],
  ur: [/جیومیٹری خریدتا/u, /شعبہ کھولیے/u, /نیک ہی اصل معاہدہ/u, /تجارتی پوزیشن/u, /دوسری جغرافیہ/u, /پیسہ کہاں ہے/u],
  ru: [/покупает свою геометрию/iu, /Откройте ту, в которой работаете/iu, /Горловина — это договор/iu, /коммерческая позиция/iu, /во второй географии/iu, /Где лежат деньги/iu],
  hy: [/երկրաչափություն է գնում/u, /Բացեք այն ոլորտը/u, /Վզիկը պայմանագիրն է/u, /առևտրային դիրքը/u, /երկրորդ աշխարհագրությունում/u, /Որտեղ է փողը/u],
  tr: [/geometri satın alır/iu, /Çalıştığınız sektörü açın/iu, /Boyun, sözleşmenin kendisidir/iu, /ticari pozisyon/iu, /ikinci coğrafya/iu, /Para nerede/iu],
  th: [/ซื้อรูปทรงต่างกัน/u, /เปิดอุตสาหกรรมที่คุณทำอยู่/u, /ปากขวดคือข้อตกลง/u, /สถานะทางการค้า/u, /ภูมิศาสตร์ที่สอง/u, /เงินอยู่ตรงไหน/u],
  zh: [/买的几何不同/u, /打开您所在的那个/u, /瓶口就是那份合同/u, /商业地位/u, /第二地理/u, /最后一行才是商业/u],
};

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

const failures = [];
for (const [locale, patterns] of Object.entries(rules)) {
  for (const file of files(join(root, locale)).filter((name) => name.endsWith('.json'))) {
    const content = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) failures.push(`${locale}: ${file.replace(root, '')}: “${match[0]}”`);
    }
  }
}

if (failures.length) {
  console.error('\nLiteral-calque regression detected:\n');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('  ✓ Native-copy regression check passed.');
