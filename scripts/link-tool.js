#!/usr/bin/env node

/**
 * OpenSkills 工具链接脚本
 * 用于将当前项目安装为全局工具或卸载
 * 
 * 使用方法:
 *   node scripts/link-tool.js install   # 安装（链接）工具
 *   node scripts/link-tool.js uninstall # 卸载（取消链接）工具
 *   node scripts/link-tool.js status    # 查看当前状态
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const PACKAGE_NAME = 'openskills';
const DIST_DIR = join(projectRoot, 'dist');
const CLI_FILE = join(DIST_DIR, 'cli.js');

/**
 * 执行命令并返回输出
 */
function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: projectRoot,
      ...options,
    });
  } catch (error) {
    if (!options.silent) {
      console.error(`\n❌ 执行失败: ${command}`);
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
    }
    throw error;
  }
}

/**
 * 检查是否已构建
 */
function checkBuild() {
  if (!existsSync(CLI_FILE)) {
    console.log('⚠️  检测到项目尚未构建，正在构建...\n');
    exec('npm run build');
    console.log('');
  }
}

/**
 * 检查是否已链接
 */
function isLinked() {
  try {
    const result = execSync(`npm list -g --depth=0 ${PACKAGE_NAME}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    return result.includes(PACKAGE_NAME) && result.includes(projectRoot);
  } catch {
    return false;
  }
}

/**
 * 安装（链接）工具
 */
function install() {
  console.log('🔧 正在安装 OpenSkills 工具...\n');

  // 检查构建
  checkBuild();

  // 检查是否已链接
  if (isLinked()) {
    console.log('ℹ️  工具已经安装，无需重复安装');
    console.log('   如需重新安装，请先运行: node scripts/link-tool.js uninstall\n');
    return;
  }

  try {
    // 执行 npm link
    console.log('📦 正在创建全局链接...');
    exec('npm link');
    console.log('\n✅ 安装成功！');
    console.log(`\n现在可以在任何位置使用 '${PACKAGE_NAME}' 命令了`);
    console.log('   测试: openskills --version\n');
  } catch (error) {
    console.error('\n❌ 安装失败');
    process.exit(1);
  }
}

/**
 * 卸载（取消链接）工具
 */
function uninstall() {
  console.log('🗑️  正在卸载 OpenSkills 工具...\n');

  // 检查是否已链接
  if (!isLinked()) {
    console.log('ℹ️  工具未安装，无需卸载\n');
    return;
  }

  try {
    // 执行 npm unlink
    console.log('🔗 正在移除全局链接...');
    exec('npm unlink -g openskills');
    console.log('\n✅ 卸载成功！');
    console.log('   openskills 命令已从系统中移除\n');
  } catch (error) {
    console.error('\n❌ 卸载失败');
    process.exit(1);
  }
}

/**
 * 查看状态
 */
function status() {
  console.log('📊 OpenSkills 工具状态\n');
  console.log(`项目路径: ${projectRoot}`);
  console.log(`构建目录: ${DIST_DIR}`);
  console.log(`CLI 文件: ${existsSync(CLI_FILE) ? '✅ 已构建' : '❌ 未构建'}`);
  console.log(`全局链接: ${isLinked() ? '✅ 已安装' : '❌ 未安装'}`);
  
  if (isLinked()) {
    try {
      const version = execSync('openskills --version', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      console.log(`版本信息: ${version}`);
    } catch {
      console.log('版本信息: 无法获取');
    }
  }
  console.log('');
}

/**
 * 显示帮助信息
 */
function help() {
  console.log('OpenSkills 工具链接脚本\n');
  console.log('使用方法:');
  console.log('  node scripts/link-tool.js install    # 安装（链接）工具');
  console.log('  node scripts/link-tool.js uninstall  # 卸载（取消链接）工具');
  console.log('  node scripts/link-tool.js status     # 查看当前状态');
  console.log('  node scripts/link-tool.js help       # 显示帮助信息\n');
}

// 主函数
function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'install':
      install();
      break;
    case 'uninstall':
    case 'remove':
      uninstall();
      break;
    case 'status':
    case 'info':
      status();
      break;
    case 'help':
    case '--help':
    case '-h':
      help();
      break;
    default:
      console.error(`❌ 未知命令: ${command}\n`);
      help();
      process.exit(1);
  }
}

main();
