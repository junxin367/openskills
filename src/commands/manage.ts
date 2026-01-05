import { rmSync } from 'fs';
import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { findAllSkills, findSkill } from '../utils/skills.js';
import { t } from '../utils/i18n.js';

/**
 * Interactively manage (remove) installed skills
 */
export async function manageSkills(): Promise<void> {
  const skills = findAllSkills();

  if (skills.length === 0) {
    console.log(t('manage.no_skills'));
    return;
  }

  try {
    // Sort: project first
    const sorted = skills.sort((a, b) => {
      if (a.location !== b.location) {
        return a.location === 'project' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const choices = sorted.map((skill) => ({
      name: `${chalk.bold(skill.name.padEnd(25))} ${skill.location === 'project' ? chalk.blue(t('location.project')) : chalk.dim(t('location.global'))}`,
      value: skill.name,
      checked: false, // Nothing checked by default
    }));

    const toRemove = await checkbox({
      message: t('manage.select_remove'),
      choices,
      pageSize: 15,
      instructions: t('manage.instructions'),
    });

    if (toRemove.length === 0) {
      console.log(chalk.yellow(t('manage.no_selected')));
      return;
    }

    // Remove selected skills
    for (const skillName of toRemove) {
      const skill = findSkill(skillName);
      if (skill) {
        rmSync(skill.baseDir, { recursive: true, force: true });
        const location = skill.source.includes(process.cwd()) ? 'project' : 'global';
        const locationLabel = location === 'project' ? t('location.project') : t('location.global');
        console.log(chalk.green(`✅ ${t('manage.removed')} ${skillName} ${locationLabel}`));
      }
    }

    console.log(chalk.green(`\n✅ ${t('manage.removed_count', { count: toRemove.length.toString() })}`));
  } catch (error) {
    if (error instanceof ExitPromptError) {
      console.log(chalk.yellow(`\n\n${t('cancelled')}`));
      process.exit(0);
    }
    throw error;
  }
}
