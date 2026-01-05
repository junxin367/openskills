import { rmSync } from 'fs';
import { homedir } from 'os';
import chalk from 'chalk';
import { findSkill } from '../utils/skills.js';
import { t } from '../utils/i18n.js';

/**
 * Remove installed skill
 */
export function removeSkill(skillName: string): void {
  const skill = findSkill(skillName);

  if (!skill) {
    console.error(chalk.red(t('remove.not_found', { name: skillName })));
    process.exit(1);
  }

  rmSync(skill.baseDir, { recursive: true, force: true });

  const location = skill.source.includes(homedir()) ? 'global' : 'project';
  console.log(chalk.green(`✅ ${t('remove.removed')} ${skillName}`));
  console.log(`   From: ${location} (${skill.source})`);
}
