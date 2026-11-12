import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 人教版初高中知识库的学科文件（04-数学/物理/化学/生物/信息科技.md）
const KB_FILES = ['04-数学.md', '04-物理.md', '04-化学.md', '04-生物.md', '04-信息科技.md'];

// 解析 markdown 表格为对象数组。表头行作为字段名，分隔行（---）跳过。
export function parseTable(md) {
  const rows = [];
  let header = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue; // 分隔行
    if (!header) {
      header = cells;
      continue;
    }
    const row = {};
    header.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

// 加载 dataDir 下全部知识库条目；缺失文件不致命，记录后返回。
export async function loadKb(dataDir) {
  const entries = [];
  const missing = [];
  for (const f of KB_FILES) {
    try {
      const md = await readFile(join(dataDir, f), 'utf8');
      entries.push(...parseTable(md));
    } catch {
      missing.push(f);
    }
  }
  return { entries, missing };
}
