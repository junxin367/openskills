import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, join, sep } from 'path';
import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { findAllSkills } from '../utils/skills.js';
import { generateSkillsXml, replaceSkillsSection, parseCurrentSkills, removeSkillsSection } from '../utils/agents-md.js';
import { t } from '../utils/i18n.js';

export interface SyncOptions {
  yes?: boolean;
  output?: string;
}

/**
 * Get default output path for AGENTS.md
 * Prioritizes .cursor/rules/AGENTS.md if .cursor directory exists
 */
function getDefaultOutputPath(): string {
  const cursorRulesPath = join(process.cwd(), '.cursor', 'rules', 'AGENTS.md');
  if (existsSync(join(process.cwd(), '.cursor'))) {
    return cursorRulesPath;
  }
  return 'AGENTS.md';
}

/**
 * Format output path for display
 * Returns filename if in root directory, otherwise returns relative path
 */
function formatOutputPath(filePath: string): string {
  // If path is already relative and just a filename, return it
  if (filePath === basename(filePath) || dirname(filePath) === '.' || dirname(filePath) === '') {
    return basename(filePath);
  }
  
  // Convert absolute path to relative path
  const cwd = process.cwd();
  let relativePath = filePath;
  
  if (filePath.startsWith(cwd)) {
    relativePath = filePath.replace(cwd + sep, '').replace(cwd, '');
  }
  
  // Normalize path separators for display
  relativePath = relativePath.replace(/\\/g, '/');
  
  // If it's just the filename after normalization, return filename
  if (relativePath === basename(filePath) || relativePath.split('/').length === 1) {
    return basename(filePath);
  }
  
  return relativePath;
}

/**
 * Sync installed skills to a markdown file
 */
export async function syncAgentsMd(options: SyncOptions = {}): Promise<void> {
  const outputPath = options.output || getDefaultOutputPath();
  const outputName = basename(outputPath);

  // Validate output file is markdown
  if (!outputPath.endsWith('.md')) {
    console.error(chalk.red(t('sync.error_markdown')));
    process.exit(1);
  }

  // Create file if it doesn't exist
  if (!existsSync(outputPath)) {
    const dir = dirname(outputPath);
    if (dir && dir !== '.' && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(outputPath, `# ${outputName.replace('.md', '')}\n\n`);
    console.log(chalk.dim(t('sync.created', { path: outputPath })));
  }

  let skills = findAllSkills();

  if (skills.length === 0) {
    console.log(t('sync.no_skills_installed'));
    console.log(`  ${chalk.cyan('openskills install anthropics/skills --project')}`);
    return;
  }

  // Interactive mode by default (unless -y flag)
  if (!options.yes) {
    try {
      // Parse what's currently in output file
      const content = readFileSync(outputPath, 'utf-8');
      const currentSkills = parseCurrentSkills(content);

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
        description: skill.description.slice(0, 70),
        // Pre-select if currently in file, otherwise default to project skills
        checked: currentSkills.includes(skill.name) || (currentSkills.length === 0 && skill.location === 'project'),
      }));

      const selected = await checkbox({
        message: t('sync.select_skills', { file: outputName }),
        choices,
        pageSize: 15,
        instructions: t('sync.instructions'),
      });

      if (selected.length === 0) {
        // User unchecked everything - remove skills section
        const content = readFileSync(outputPath, 'utf-8');
        const updated = removeSkillsSection(content);
        writeFileSync(outputPath, updated);
        const displayPath = formatOutputPath(outputPath);
        console.log(chalk.green(`✅ ${t('sync.removed_all', { path: displayPath })}`));
        return;
      }

      // Clear the checkbox's output and replace with multi-line format
      const selectedSkills = sorted.filter((s) => selected.includes(s.name));
      
      // Clear the checkbox output line(s) - estimate based on terminal width
      const terminalWidth = process.stdout.columns || 80;
      // Each skill entry is roughly 40-50 chars, so calculate lines needed
      const totalChars = selected.length * 45; // Rough estimate per skill
      const linesToClear = Math.max(1, Math.ceil(totalChars / terminalWidth));
      
      // Move cursor up and clear the checkbox output lines
      for (let i = 0; i < linesToClear; i++) {
        process.stdout.write('\x1b[1A\x1b[2K'); // Move up one line and clear it
      }
      
      // Display formatted output with each skill on a new line (replacing the checkbox output)
      console.log(chalk.dim(`✔ ${t('sync.select_skills', { file: outputName })}`));
      selectedSkills.forEach((skill) => {
        const location = skill.location === 'project' ? chalk.blue(t('location.project')) : chalk.dim(t('location.global'));
        console.log(chalk.dim(`  ${chalk.bold(skill.name.padEnd(25))} ${location}`));
      });

      // Filter skills to selected ones
      skills = selectedSkills;
    } catch (error) {
      if (error instanceof ExitPromptError) {
        console.log(chalk.yellow(`\n\n${t('cancelled')}`));
        process.exit(0);
      }
      throw error;
    }
  }

  const xml = generateSkillsXml(skills);
  const content = readFileSync(outputPath, 'utf-8');
  const updated = replaceSkillsSection(content, xml);

  writeFileSync(outputPath, updated);

  const hadMarkers =
    content.includes('<skills_system') || content.includes('<!-- SKILLS_TABLE_START -->');

  const displayPath = formatOutputPath(outputPath);
  if (hadMarkers) {
    console.log(chalk.green(`✅ ${t('sync.synced', { count: skills.length.toString(), path: displayPath })}`));
  } else {
    console.log(chalk.green(`✅ ${t('sync.added', { path: displayPath, count: skills.length.toString() })}`));
  }
}
