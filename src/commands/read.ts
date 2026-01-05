import { readFileSync } from 'fs';
import { findSkill } from '../utils/skills.js';
import { t } from '../utils/i18n.js';

/**
 * Read skill to stdout (for AI agents)
 */
export function readSkill(skillName: string): void {
  const skill = findSkill(skillName);

  if (!skill) {
    console.error(t('read.error_not_found', { name: skillName }));
    console.error(`\n${t('read.searched')}:`);
    console.error('  .agent/skills/ (project universal)');
    console.error('  ~/.agent/skills/ (global universal)');
    console.error('  .claude/skills/ (project)');
    console.error('  ~/.claude/skills/ (global)');
    console.error(`\n${t('read.install_skills')}`);
    process.exit(1);
  }

  const content = readFileSync(skill.path, 'utf-8');

  // Output in Claude Code format
  console.log(`${t('read.reading')} ${skillName}`);
  console.log(`${t('read.base_directory')} ${skill.baseDir}`);
  console.log('');
  console.log(content);
  console.log('');
  console.log(`${t('read.skill_read')} ${skillName}`);
}
