/**
 * Internationalization (i18n) support for OpenSkills
 * Detects system locale and provides translations
 */

// Detect system locale
function getSystemLocale(): string {
  // Check environment variables first (Unix/Linux)
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || process.env.LC_MESSAGES;
  
  if (lang) {
    // Extract language code (e.g., "zh_CN.UTF-8" -> "zh")
    const langCode = lang.split('_')[0].split('.')[0].toLowerCase();
    if (langCode.startsWith('zh')) {
      return 'zh';
    }
  }
  
  // Check Windows environment variables
  const winLang = process.env.LANG || process.env.LOCALE;
  if (winLang) {
    const langCode = winLang.split('_')[0].split('.')[0].toLowerCase();
    if (langCode.startsWith('zh')) {
      return 'zh';
    }
  }
  
  // Check Intl API (Node.js 13+) - most reliable
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const langCode = locale.split('-')[0].toLowerCase();
    if (langCode === 'zh') {
      return 'zh';
    }
  } catch {
    // Fallback to English
  }
  
  // Default to English
  return 'en';
}

// Translation strings
const translations = {
  en: {
    // Common
    'error': 'Error',
    'success': 'Success',
    'cancelled': 'Cancelled by user',
    
    // List command
    'list.available_skills': 'Available Skills:',
    'list.no_skills': 'No skills installed.',
    'list.install_skills': 'Install skills:',
    'list.project_default': 'Project (default)',
    'list.global_advanced': 'Global (advanced)',
    'list.summary': 'Summary: {project} project, {global} global ({total} total)',
    
    // Install command
    'install.installing_from': 'Installing from:',
    'install.location': 'Location:',
    'install.cloning_repo': 'Cloning repository...',
    'install.repo_cloned': 'Repository cloned',
    'install.failed_clone': 'Failed to clone repository',
    'install.tip_private_repo': 'Tip: For private repos, ensure git SSH keys or credentials are configured',
    'install.url_normalized': '⚠️  GitHub URL has been normalized (removed branch/tree path)',
    'install.original_url': 'Original URL',
    'install.using_url': 'Using URL',
    'install.suggestion': 'Suggestion',
    'install.invalid_source_format': 'Invalid source format',
    'install.expected_formats': 'Expected: owner/repo, owner/repo/skill-name, git URL, or local path',
    'install.found_skills': 'Found {count} skill(s)',
    'install.select_skills': 'Select skills to install',
    'install.instructions': '(Use ↑↓ to move, Space to select, a to toggle all, i to invert, Enter to submit)',
    'install.no_skills_selected': 'No skills selected. Installation cancelled.',
    'install.no_skills_found': 'Error: No SKILL.md files found in repository',
    'install.no_valid_skills': 'Error: No valid SKILL.md files found',
    'install.installed': 'Installed:',
    'install.installation_complete': 'Installation complete: {count} skill(s) installed',
    'install.skipped': 'Skipped:',
    'install.overwriting': 'Overwriting:',
    'install.skill_exists': "Skill '{name}' already exists. Overwrite?",
    'install.marketplace_warning': "Warning: '{name}' matches an Anthropic marketplace skill",
    'install.marketplace_conflict': 'Installing globally may conflict with Claude Code plugins.',
    'install.marketplace_overwrite': 'If you re-enable Claude plugins, this will be overwritten.',
    'install.recommend_project': 'Recommend: Use --project flag for conflict-free installation.',
    
    // Sync command
    'sync.created': 'Created {path}',
    'sync.no_skills_installed': 'No skills installed. Install skills first:',
    'sync.select_skills': 'Select skills to sync to {file}',
    'sync.instructions': '(Use ↑↓ to move, Space to select, a to toggle all, i to invert, Enter to submit)',
    'sync.removed_all': 'Removed all skills from {path}',
    'sync.synced': 'Synced {count} skill(s) to {path}',
    'sync.added': 'Added skills section to {path} ({count} skill(s))',
    'sync.error_markdown': 'Error: Output file must be a markdown file (.md)',
    
    // Read command
    'read.error_not_found': "Error: Skill '{name}' not found",
    'read.searched': 'Searched:',
    'read.install_skills': 'Install skills: openskills install owner/repo',
    'read.reading': 'Reading:',
    'read.base_directory': 'Base directory:',
    'read.skill_read': 'Skill read:',
    
    // Manage command
    'manage.no_skills': 'No skills installed.',
    'manage.select_remove': 'Select skills to remove',
    'manage.instructions': '(Use ↑↓ to move, Space to select, a to toggle all, i to invert, Enter to submit)',
    'manage.no_selected': 'No skills selected for removal.',
    'manage.removed': 'Removed:',
    'manage.removed_count': 'Removed {count} skill(s)',
    
    // Remove command
    'remove.not_found': "Skill '{name}' not found",
    'remove.removed': 'Removed:',
    
    // Common locations
    'location.project': '(project)',
    'location.global': '(global)',
  },
  zh: {
    // Common
    'error': '错误',
    'success': '成功',
    'cancelled': '用户已取消',
    
    // List command
    'list.available_skills': '可用技能：',
    'list.no_skills': '未安装任何技能。',
    'list.install_skills': '安装技能：',
    'list.project_default': '项目（默认）',
    'list.global_advanced': '全局（高级）',
    'list.summary': '摘要：{project} 个项目技能，{global} 个全局技能（共 {total} 个）',
    
    // Install command
    'install.installing_from': '正在从以下位置安装：',
    'install.location': '安装位置：',
    'install.cloning_repo': '正在克隆仓库...',
    'install.repo_cloned': '仓库已克隆',
    'install.failed_clone': '克隆仓库失败',
    'install.repo_not_found': '仓库未找到或不存在',
    'install.check_url': '检查 URL',
    'install.original_source': '原始源',
    'install.try_shorthand': '尝试使用简写格式',
    'install.tip_private_repo': '提示：对于私有仓库，请确保已配置 git SSH 密钥或凭据',
    'install.url_normalized': '⚠️  GitHub URL 已规范化（已移除分支/tree 路径）',
    'install.original_url': '原始 URL',
    'install.using_url': '使用 URL',
    'install.suggestion': '建议',
    'install.invalid_source_format': '无效的源格式',
    'install.expected_formats': '期望格式：owner/repo、owner/repo/skill-name、git URL 或本地路径',
    'install.found_skills': '找到 {count} 个技能',
    'install.select_skills': '选择要安装的技能',
    'install.instructions': '(使用 ↑↓ 移动，空格选择，a 全选/取消全选，i 反选，回车确认)',
    'install.no_skills_selected': '未选择任何技能。安装已取消。',
    'install.no_skills_found': '错误：在仓库中未找到 SKILL.md 文件',
    'install.no_valid_skills': '错误：未找到有效的 SKILL.md 文件',
    'install.installed': '已安装：',
    'install.installation_complete': '安装完成：已安装 {count} 个技能',
    'install.skipped': '已跳过：',
    'install.overwriting': '正在覆盖：',
    'install.skill_exists': "技能 '{name}' 已存在。是否覆盖？",
    'install.marketplace_warning': "警告：'{name}' 与 Anthropic 市场技能匹配",
    'install.marketplace_conflict': '全局安装可能与 Claude Code 插件冲突。',
    'install.marketplace_overwrite': '如果您重新启用 Claude 插件，这将被覆盖。',
    'install.recommend_project': '建议：使用 --project 标志进行无冲突安装。',
    
    // Sync command
    'sync.created': '已创建 {path}',
    'sync.no_skills_installed': '未安装任何技能。请先安装技能：',
    'sync.select_skills': '选择要同步到 {file} 的技能',
    'sync.instructions': '(使用 ↑↓ 移动，空格选择，a 全选/取消全选，i 反选，回车确认)',
    'sync.removed_all': '已从 {path} 移除所有技能',
    'sync.synced': '已同步 {count} 个技能到 {path}',
    'sync.added': '已添加技能部分到 {path}（{count} 个技能）',
    'sync.error_markdown': '错误：输出文件必须是 markdown 文件 (.md)',
    
    // Read command
    'read.error_not_found': "错误：未找到技能 '{name}'",
    'read.searched': '已搜索：',
    'read.install_skills': '安装技能：openskills install owner/repo',
    'read.reading': '正在读取：',
    'read.base_directory': '基础目录：',
    'read.skill_read': '技能已读取：',
    
    // Manage command
    'manage.no_skills': '未安装任何技能。',
    'manage.select_remove': '选择要删除的技能',
    'manage.instructions': '(使用 ↑↓ 移动，空格选择，a 全选/取消全选，i 反选，回车确认)',
    'manage.no_selected': '未选择要删除的技能。',
    'manage.removed': '已删除：',
    'manage.removed_count': '已删除 {count} 个技能',
    
    // Remove command
    'remove.not_found': "未找到技能 '{name}'",
    'remove.removed': '已删除：',
    
    // Common locations
    'location.project': '（项目）',
    'location.global': '（全局）',
  },
};

// Get current locale
const currentLocale = getSystemLocale();

/**
 * Get translation for a key
 * Supports simple placeholder replacement with {key} syntax
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translation = translations[currentLocale]?.[key] || translations.en[key] || key;
  
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return translation;
}

/**
 * Get current locale code
 */
export function getLocale(): string {
  return currentLocale;
}

/**
 * Check if current locale is Chinese
 */
export function isChinese(): boolean {
  return currentLocale === 'zh';
}
