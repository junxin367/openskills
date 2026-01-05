import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, cpSync, statSync } from 'fs';
import { join, basename, resolve, sep } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import { checkbox, confirm } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { hasValidFrontmatter, extractYamlField } from '../utils/yaml.js';
import { ANTHROPIC_MARKETPLACE_SKILLS } from '../utils/marketplace-skills.js';
import type { InstallOptions } from '../types.js';
import { t } from '../utils/i18n.js';

/**
 * Check if source is a local path
 */
function isLocalPath(source: string): boolean {
  return (
    source.startsWith('/') ||
    source.startsWith('./') ||
    source.startsWith('../') ||
    source.startsWith('~/')
  );
}

/**
 * Check if source is a git URL (SSH, git://, or HTTPS)
 */
function isGitUrl(source: string): boolean {
  return (
    source.startsWith('git@') ||
    source.startsWith('git://') ||
    source.startsWith('http://') ||
    source.startsWith('https://') ||
    source.endsWith('.git')
  );
}

/**
 * Normalize GitHub URL by removing branch/tree paths and converting to clone URL
 * Examples:
 *   https://github.com/owner/repo/tree/main -> https://github.com/owner/repo
 *   https://github.com/owner/repo/blob/main/path -> https://github.com/owner/repo
 *   https://github.com/owner/repo -> https://github.com/owner/repo
 */
function normalizeGitHubUrl(url: string): { repoUrl: string; suggestedUrl: string } {
  // Only process GitHub URLs
  if (!url.includes('github.com')) {
    return { repoUrl: url, suggestedUrl: url };
  }

  try {
    const urlObj = new URL(url);
    
    // Remove /tree/branch, /blob/branch, /commit/hash, etc.
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // GitHub URL structure: /owner/repo/...
    if (pathParts.length >= 2) {
      const owner = pathParts[0];
      const repo = pathParts[1];
      
      // Remove .git suffix if present
      const repoName = repo.endsWith('.git') ? repo.slice(0, -4) : repo;
      
      // Check if there are branch/tree/blob paths
      const hasBranchPath = pathParts.length > 2 && 
        (pathParts[2] === 'tree' || pathParts[2] === 'blob' || pathParts[2] === 'commit');
      
      const cleanUrl = `https://github.com/${owner}/${repoName}`;
      
      if (hasBranchPath) {
        // Extract subpath if it exists (e.g., /tree/main/skill-path -> skill-path)
        let subpath = '';
        if (pathParts.length > 3) {
          subpath = pathParts.slice(3).join('/');
        }
        
        return {
          repoUrl: cleanUrl,
          suggestedUrl: subpath ? `${owner}/${repoName}/${subpath}` : `${owner}/${repoName}`
        };
      }
      
      // Check if there's a subpath after repo name (e.g., /owner/repo/skill-path)
      if (pathParts.length > 2 && pathParts[2] !== 'tree' && pathParts[2] !== 'blob' && pathParts[2] !== 'commit') {
        const subpath = pathParts.slice(2).join('/');
        return {
          repoUrl: cleanUrl,
          suggestedUrl: `${owner}/${repoName}/${subpath}`
        };
      }
      
      return { repoUrl: cleanUrl, suggestedUrl: `${owner}/${repoName}` };
    }
  } catch {
    // If URL parsing fails, return as-is
  }
  
  return { repoUrl: url, suggestedUrl: url };
}

/**
 * Expand ~ to home directory
 */
function expandPath(source: string): string {
  if (source.startsWith('~/')) {
    return join(homedir(), source.slice(2));
  }
  return resolve(source);
}

/**
 * Install skill from local path, GitHub, or Git URL
 */
export async function installSkill(source: string, options: InstallOptions): Promise<void> {
  const folder = options.universal ? '.agent/skills' : '.claude/skills';
  const isProject = !options.global; // Default to project unless --global specified
  const targetDir = isProject
    ? join(process.cwd(), folder)
    : join(homedir(), folder);

  const location = isProject
    ? chalk.blue(`project (${folder})`)
    : chalk.dim(`global (~/${folder})`);

  console.log(`${t('install.installing_from')} ${chalk.cyan(source)}`);
  console.log(`${t('install.location')} ${location}\n`);

  // Handle local path installation
  if (isLocalPath(source)) {
    const localPath = expandPath(source);
    await installFromLocal(localPath, targetDir, options);
    printPostInstallHints(isProject);
    return;
  }

  // Parse git source
  let repoUrl: string;
  let skillSubpath: string = '';
  let originalSource = source;

  if (isGitUrl(source)) {
    // Full git URL (SSH, HTTPS, git://)
    // Normalize GitHub URLs to remove branch/tree paths
    const normalized = normalizeGitHubUrl(source);
    repoUrl = normalized.repoUrl;
    
    // If URL was modified, show a helpful message
    if (normalized.repoUrl !== source && normalized.suggestedUrl) {
      console.log(chalk.yellow(`\n${t('install.url_normalized')}`));
      console.log(chalk.dim(`  ${t('install.original_url')}: ${source}`));
      console.log(chalk.dim(`  ${t('install.using_url')}: ${normalized.repoUrl}`));
      if (normalized.suggestedUrl !== normalized.repoUrl) {
        console.log(chalk.dim(`  ${t('install.suggestion')}: ${chalk.cyan(`openskills install ${normalized.suggestedUrl}`)}`));
      }
      console.log();
    }
  } else {
    // GitHub shorthand: owner/repo or owner/repo/skill-path
    const parts = source.split('/');
    if (parts.length === 2) {
      repoUrl = `https://github.com/${source}`;
    } else if (parts.length > 2) {
      repoUrl = `https://github.com/${parts[0]}/${parts[1]}`;
      skillSubpath = parts.slice(2).join('/');
    } else {
      console.error(chalk.red(t('error') + ': ' + t('install.invalid_source_format')));
      console.error(chalk.dim(t('install.expected_formats')));
      process.exit(1);
    }
  }

  // Clone and install from git
  const tempDir = join(homedir(), `.openskills-temp-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    const spinner = ora(t('install.cloning_repo')).start();
    try {
      execSync(`git clone --depth 1 --quiet "${repoUrl}" "${tempDir}/repo"`, {
        stdio: 'pipe',
      });
      spinner.succeed(t('install.repo_cloned'));
    } catch (error) {
      spinner.fail(t('install.failed_clone'));
      const err = error as { stderr?: Buffer; message?: string };
      
      // Show error details
      if (err.stderr) {
        const errorMsg = err.stderr.toString().trim();
        console.error(chalk.dim(errorMsg));
        
        // Check for common errors and provide helpful suggestions
        if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
          console.error(chalk.yellow(`\n${t('install.repo_not_found')}`));
          console.error(chalk.dim(`  ${t('install.check_url')}: ${chalk.cyan(repoUrl)}`));
          if (originalSource !== repoUrl) {
            console.error(chalk.dim(`  ${t('install.original_source')}: ${chalk.cyan(originalSource)}`));
          }
          console.error(chalk.dim(`  ${t('install.try_shorthand')}: ${chalk.cyan(`openskills install ${repoUrl.replace('https://github.com/', '')}`)}`));
        } else if (errorMsg.includes('Permission denied') || errorMsg.includes('authentication')) {
          console.error(chalk.yellow(`\n${t('install.tip_private_repo')}`));
        } else {
          console.error(chalk.yellow(`\n${t('install.tip_private_repo')}`));
        }
      } else {
        console.error(chalk.yellow(`\n${t('install.tip_private_repo')}`));
      }
      process.exit(1);
    }

    const repoDir = join(tempDir, 'repo');

    if (skillSubpath) {
      await installSpecificSkill(repoDir, skillSubpath, targetDir, isProject, options);
    } else {
      await installFromRepo(repoDir, targetDir, options);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  printPostInstallHints(isProject);
}

/**
 * Print post-install hints
 */
function printPostInstallHints(isProject: boolean): void {
  console.log(`\n${chalk.dim('Read skill:')} ${chalk.cyan('openskills read <skill-name>')}`);
  if (isProject) {
    console.log(`${chalk.dim('Sync to AGENTS.md:')} ${chalk.cyan('openskills sync')}`);
  }
}

/**
 * Install from local path (directory containing skills or single skill)
 */
async function installFromLocal(localPath: string, targetDir: string, options: InstallOptions): Promise<void> {
  if (!existsSync(localPath)) {
    console.error(chalk.red(t('error') + `: Path does not exist: ${localPath}`));
    process.exit(1);
  }

  const stats = statSync(localPath);
  if (!stats.isDirectory()) {
    console.error(chalk.red(t('error') + ': Path must be a directory'));
    process.exit(1);
  }

  // Check if this is a single skill (has SKILL.md) or a directory of skills
  const skillMdPath = join(localPath, 'SKILL.md');
  if (existsSync(skillMdPath)) {
    // Single skill directory
    const isProject = targetDir.includes(process.cwd());
    await installSingleLocalSkill(localPath, targetDir, isProject, options);
  } else {
    // Directory containing multiple skills
    await installFromRepo(localPath, targetDir, options);
  }
}

/**
 * Install a single local skill directory
 */
async function installSingleLocalSkill(
  skillDir: string,
  targetDir: string,
  isProject: boolean,
  options: InstallOptions
): Promise<void> {
  const skillMdPath = join(skillDir, 'SKILL.md');
  const content = readFileSync(skillMdPath, 'utf-8');

  if (!hasValidFrontmatter(content)) {
    console.error(chalk.red(t('error') + ': Invalid SKILL.md (missing YAML frontmatter)'));
    process.exit(1);
  }

  const skillName = basename(skillDir);
  const targetPath = join(targetDir, skillName);

  const shouldInstall = await warnIfConflict(skillName, targetPath, isProject, options.yes);
  if (!shouldInstall) {
    console.log(chalk.yellow(`Skipped: ${skillName}`));
    return;
  }

  mkdirSync(targetDir, { recursive: true });
  // Security: ensure target path stays within target directory
  const resolvedTargetPath = resolve(targetPath);
  const resolvedTargetDir = resolve(targetDir);
  if (!resolvedTargetPath.startsWith(resolvedTargetDir + sep)) {
    console.error(chalk.red(t('error') + ': Installation path outside target directory'));
    process.exit(1);
  }

  cpSync(skillDir, targetPath, { recursive: true, dereference: true });

  console.log(chalk.green(`✅ ${t('install.installed')} ${skillName}`));
  console.log(`   ${t('install.location')}: ${targetPath}`);
}

/**
 * Install specific skill from subpath (no interaction needed)
 */
async function installSpecificSkill(
  repoDir: string,
  skillSubpath: string,
  targetDir: string,
  isProject: boolean,
  options: InstallOptions
): Promise<void> {
  const skillDir = join(repoDir, skillSubpath);
  const skillMdPath = join(skillDir, 'SKILL.md');

  if (!existsSync(skillMdPath)) {
    console.error(chalk.red(t('error') + `: SKILL.md not found at ${skillSubpath}`));
    process.exit(1);
  }

  // Validate
  const content = readFileSync(skillMdPath, 'utf-8');
  if (!hasValidFrontmatter(content)) {
    console.error(chalk.red(t('error') + ': Invalid SKILL.md (missing YAML frontmatter)'));
    process.exit(1);
  }

  const skillName = basename(skillSubpath);
  const targetPath = join(targetDir, skillName);

  // Warn about potential conflicts
  const shouldInstall = await warnIfConflict(skillName, targetPath, isProject, options.yes);
  if (!shouldInstall) {
    console.log(chalk.yellow(`Skipped: ${skillName}`));
    return;
  }

  mkdirSync(targetDir, { recursive: true });
  // Security: ensure target path stays within target directory
  const resolvedTargetPath = resolve(targetPath);
  const resolvedTargetDir = resolve(targetDir);
  if (!resolvedTargetPath.startsWith(resolvedTargetDir + sep)) {
    console.error(chalk.red(t('error') + ': Installation path outside target directory'));
    process.exit(1);
  }
  cpSync(skillDir, targetPath, { recursive: true, dereference: true });

  console.log(chalk.green(`✅ Installed: ${skillName}`));
  console.log(`   Location: ${targetPath}`);
}

/**
 * Install from repository (with interactive selection unless -y flag)
 */
async function installFromRepo(
  repoDir: string,
  targetDir: string,
  options: InstallOptions
): Promise<void> {
  // Find all skills
  const findSkills = (dir: string): string[] => {
    const skills: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (existsSync(join(fullPath, 'SKILL.md'))) {
          skills.push(fullPath);
        } else {
          skills.push(...findSkills(fullPath));
        }
      }
    }
    return skills;
  };

  const skillDirs = findSkills(repoDir);

  if (skillDirs.length === 0) {
    console.error(chalk.red(t('install.no_skills_found')));
    process.exit(1);
  }

  console.log(chalk.dim(`${t('install.found_skills', { count: skillDirs.length.toString() })}\n`));

  // Build skill info list
  const skillInfos = skillDirs
    .map((skillDir) => {
      const skillMdPath = join(skillDir, 'SKILL.md');
      const content = readFileSync(skillMdPath, 'utf-8');

      if (!hasValidFrontmatter(content)) {
        return null;
      }

      const skillName = basename(skillDir);
      const description = extractYamlField(content, 'description');
      const targetPath = join(targetDir, skillName);

      // Get size
      const size = getDirectorySize(skillDir);

      return {
        skillDir,
        skillName,
        description,
        targetPath,
        size,
      };
    })
    .filter((info) => info !== null);

  if (skillInfos.length === 0) {
    console.error(chalk.red(t('install.no_valid_skills')));
    process.exit(1);
  }

  // Interactive selection (unless -y flag or single skill)
  let skillsToInstall = skillInfos;

  if (!options.yes && skillInfos.length > 1) {
    try {
      const choices = skillInfos.map((info) => ({
        name: `${chalk.bold(info.skillName.padEnd(25))} ${chalk.dim(formatSize(info.size))}`,
        value: info.skillName,
        description: info.description.slice(0, 80),
        checked: true, // Check all by default
      }));

      const selected = await checkbox({
        message: t('install.select_skills'),
        choices,
        pageSize: 15,
        instructions: t('install.instructions'),
      });

      if (selected.length === 0) {
        console.log(chalk.yellow(t('install.no_skills_selected')));
        return;
      }

      skillsToInstall = skillInfos.filter((info) => selected.includes(info.skillName));
    } catch (error) {
      if (error instanceof ExitPromptError) {
        console.log(chalk.yellow('\n\nCancelled by user'));
        process.exit(0);
      }
      throw error;
    }
  }

  // Install selected skills
  const isProject = targetDir === join(process.cwd(), '.claude/skills');
  let installedCount = 0;

  for (const info of skillsToInstall) {
    // Warn about conflicts
    const shouldInstall = await warnIfConflict(info.skillName, info.targetPath, isProject, options.yes);
    if (!shouldInstall) {
      console.log(chalk.yellow(`${t('install.skipped')} ${info.skillName}`));
      continue; // Skip this skill, continue with next
    }

    mkdirSync(targetDir, { recursive: true });
    // Security: ensure target path stays within target directory
    const resolvedTargetPath = resolve(info.targetPath);
    const resolvedTargetDir = resolve(targetDir);
    if (!resolvedTargetPath.startsWith(resolvedTargetDir + sep)) {
      console.error(chalk.red(t('error') + ': Installation path outside target directory'));
      continue;
    }
    cpSync(info.skillDir, info.targetPath, { recursive: true, dereference: true });

    console.log(chalk.green(`✅ ${t('install.installed')} ${info.skillName}`));
    installedCount++;
  }

  console.log(chalk.green(`\n✅ ${t('install.installation_complete', { count: installedCount.toString() })}`));
}

/**
 * Warn if installing could conflict with Claude Code marketplace
 * Returns true if should proceed, false if should skip
 */
async function warnIfConflict(skillName: string, targetPath: string, isProject: boolean, skipPrompt = false): Promise<boolean> {
  // Check if overwriting existing skill
  if (existsSync(targetPath)) {
    if (skipPrompt) {
      // Auto-overwrite in non-interactive mode
      console.log(chalk.dim(`${t('install.overwriting')} ${skillName}`));
      return true;
    }
    try {
      const shouldOverwrite = await confirm({
        message: chalk.yellow(t('install.skill_exists', { name: skillName })),
        default: false,
      });

      if (!shouldOverwrite) {
        return false; // Skip this skill, continue with others
      }
    } catch (error) {
      if (error instanceof ExitPromptError) {
        console.log(chalk.yellow(`\n\n${t('cancelled')}`));
        process.exit(0);
      }
      throw error;
    }
  }

  // Warn about marketplace conflicts (global install only)
  if (!isProject && ANTHROPIC_MARKETPLACE_SKILLS.includes(skillName)) {
    console.warn(chalk.yellow(`\n⚠️  ${t('install.marketplace_warning', { name: skillName })}`));
    console.warn(chalk.dim(`   ${t('install.marketplace_conflict')}`));
    console.warn(chalk.dim(`   ${t('install.marketplace_overwrite')}`));
    console.warn(chalk.dim(`   ${t('install.recommend_project')}\n`));
  }

  return true; // OK to proceed
}

/**
 * Get directory size in bytes
 */
function getDirectorySize(dirPath: string): number {
  let size = 0;

  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isFile()) {
      size += statSync(fullPath).size;
    } else if (entry.isDirectory()) {
      size += getDirectorySize(fullPath);
    }
  }

  return size;
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
