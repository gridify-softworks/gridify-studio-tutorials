/** The file when the tutorial starts: the settings of a shop in YAML, with two mistakes and a warning. */
export const START_TEXT = `# The settings of the shop
name: Corner Coffee
city: Prague
opens: 8:00
closes: 18:0
seats: twenty
wifi: yes
parking: no
`;

/** Settings that are in order: the tool Example shows them. */
export const EXAMPLE_TEXT = `# The settings of the shop
name: Corner Coffee
city: Prague
opens: 8:00
closes: 18:00
seats: 24
wifi: yes
`;

/** A problem of the settings: where it is (both from 1), and what is wrong. */
export interface Problem {
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** What the value of each setting must look like. */
const RULES: Record<string, { pattern: RegExp; hint: string }> = {
  name: { pattern: /./, hint: 'a text' },
  city: { pattern: /./, hint: 'a text' },
  opens: { pattern: TIME, hint: 'a time, such as 8:00' },
  closes: { pattern: TIME, hint: 'a time, such as 18:00' },
  seats: { pattern: /^\d+$/, hint: 'a whole number' },
  wifi: { pattern: /^(yes|no)$/, hint: 'yes or no' },
};

/** A line `key: value`: the key, and the value (the rest of the line). */
const SETTING = /^(\w+):\s*(.*)$/;

/** Checks the text line by line: a line is a setting (`key: value`), a comment (`#`) or empty. */
export function checkSettings(text: string): Problem[] {
  const problems: Problem[] = [];
  text.split('\n').forEach((content, index) => {
    const line = index + 1;
    if (content.trim() === '' || content.trim().startsWith('#')) return;

    const match = SETTING.exec(content);
    if (!match) {
      const message = 'Write a setting as "key: value".';
      problems.push({ line, column: 1, severity: 'error', message });
      return;
    }
    const [, key, value] = match;
    // Only a key of RULES itself: every object also has inherited members, such as `constructor`.
    const rule = Object.hasOwn(RULES, key) ? RULES[key] : undefined;
    if (!rule) {
      const message = `"${key}" is not a setting of the shop.`;
      problems.push({ line, column: 1, severity: 'warning', message });
    } else if (!rule.pattern.test(value.trim())) {
      // The value is the end of the line: it starts at this column.
      const column = content.length - value.length + 1;
      problems.push({ line, column, severity: 'error', message: `"${key}" must be ${rule.hint}.` });
    }
  });
  return problems;
}

/** The value of a setting, or undefined when the text does not have it. */
export function readSetting(text: string, key: string): string | undefined {
  for (const content of text.split('\n')) {
    const match = SETTING.exec(content);
    if (match && match[1] === key) return match[2].trim();
  }
  return undefined;
}

/** The text with a new value of a setting, or null when the text does not have the setting. */
export function writeSetting(text: string, key: string, value: string): string | null {
  const lines = text.split('\n');
  const index = lines.findIndex((content) => SETTING.exec(content)?.[1] === key);
  if (index < 0) return null;
  lines[index] = `${key}: ${value}`;
  return lines.join('\n');
}
