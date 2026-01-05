# OpenSkills

[English](README.en.md) | [中文](README.md)

[![npm version](https://img.shields.io/npm/v/@junxin367%2Fopenskills.svg)](https://www.npmjs.com/package/@junxin367/openskills)
[![npm downloads](https://img.shields.io/npm/dm/@junxin367%2Fopenskills.svg)](https://www.npmjs.com/package/@junxin367/openskills)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**最接近 Claude Code 技能系统的实现** — 相同的提示格式、相同的市场、相同的文件夹，只是使用 CLI 而不是工具。

```bash
npm i -g @junxin367/openskills
openskills install anthropics/skills
openskills sync
```

> 本项目 fork 自 [numman-ali/openskills](https://github.com/numman-ali/openskills/)

## Fork 改进

本 fork 版本在保持与原版完全兼容的基础上，针对实际使用场景进行了以下改进：

### 1. Windows 环境路径问题修复

- ✅ **跨平台路径处理**：修复了 Windows 环境下路径分隔符（`/` vs `\`）导致的路径问题
- ✅ **路径规范化**：自动处理不同操作系统的路径格式，确保在所有平台上正常工作
- ✅ **路径显示优化**：统一使用 `/` 作为路径显示分隔符，提升可读性

### 2. 国际化（i18n）支持

- ✅ **自动语言检测**：根据系统环境变量和 `Intl` API 自动检测用户语言环境
- ✅ **中英文切换**：支持中文和英文界面，自动适配系统语言
- ✅ **完整翻译覆盖**：所有交互提示、错误信息、帮助文本均已本地化
- ✅ **智能回退机制**：当翻译缺失时自动回退到英文，确保功能可用性

**语言检测优先级：**

1. 系统环境变量（`LANG`, `LANGUAGE`, `LC_ALL`, `LC_MESSAGES`）
2. Windows 环境变量（`LANG`, `LOCALE`）
3. `Intl.DateTimeFormat` API（最可靠）
4. 默认英文

### 3. GitHub 链接安装防呆处理

- ✅ **URL 自动规范化**：自动处理各种 GitHub URL 格式，包括：
  - 完整 URL：`https://github.com/owner/repo`
  - 带分支路径：`https://github.com/owner/repo/tree/main`
  - 带文件路径：`https://github.com/owner/repo/blob/main/path/to/skill`
  - 简写格式：`owner/repo` 或 `owner/repo/skill-path`
- ✅ **智能错误提示**：当仓库不存在或无法访问时，提供清晰的错误信息和解决建议
- ✅ **友好建议**：自动检测 URL 格式问题并提供正确的安装命令建议
- ✅ **私有仓库支持**：提供私有仓库访问的配置提示

**示例：**

```bash
# 以下命令都能正确工作
openskills install https://github.com/anthropics/skills/tree/main
openskills install https://github.com/anthropics/skills/blob/main/pdf
openskills install anthropics/skills
openskills install anthropics/skills/pdf
```

---

## 这是什么？

OpenSkills 将 **Anthropic 的技能系统** 带到所有 AI 编程助手（Claude Code、Cursor、Windsurf、Aider）。

**对于 Claude Code 用户：**

- 从任何 GitHub 仓库安装技能，不仅仅是市场
- 从本地路径或私有 git 仓库安装
- 在多个助手之间共享技能
- 在仓库中版本控制您的技能
- 使用符号链接进行本地开发

**对于其他助手（Cursor、Windsurf、Aider）：**

- 通用地获得 Claude Code 的技能系统
- 通过 GitHub 访问 Anthropic 的市场技能
- 使用渐进式披露（按需加载技能）

---

## 如何完全匹配 Claude Code

OpenSkills 以 **100% 兼容性** 复制 Claude Code 的技能系统：

- ✅ **相同的提示格式** — 带有技能标签的 `<available_skills>` XML
- ✅ **相同的市场** — 从 [anthropics/skills](https://github.com/anthropics/skills) 安装
- ✅ **相同的文件夹** — 默认使用 `.claude/skills/`
- ✅ **相同的 SKILL.md 格式** — YAML 前置元数据 + markdown 指令
- ✅ **相同的渐进式披露** — 按需加载技能，而不是预先加载

**唯一区别：** Claude Code 使用 `Skill` 工具，OpenSkills 使用 `openskills read <name>` CLI 命令。

**高级：** 使用 `--universal` 标志安装到 `.agent/skills/`，适用于 Claude Code + 其他共享一个 AGENTS.md 的助手。

---

## 快速开始

### 1. 安装

```bash
npm i -g @junxin367/openskills
```

### 2. 安装技能

```bash
# 从 Anthropic 市场安装（交互式选择，默认：项目安装）
openskills install anthropics/skills

# 全局安装（跨项目共享，安装到 ~/.claude/skills）
openskills install anthropics/skills --global

# 或从任何 GitHub 仓库安装
openskills install your-org/custom-skills

# 全局安装自定义技能
openskills install your-org/custom-skills --global
```

### 3. 同步到 AGENTS.md

_注意：您必须有一个预先存在的 AGENTS.md 文件才能进行同步更新。_

```bash
openskills sync
```

完成！您的助手现在拥有与 Claude Code 相同的 `<available_skills>` 格式的技能。

---

## 工作原理（技术深入）

### Claude Code 的技能系统

当您使用安装了技能的 Claude Code 时，Claude 的系统提示包括：

```xml
<skills_instructions>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see <command-message>The "{name}" skill is loading</command-message>
- The skill's prompt will expand and provide detailed instructions

Important:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already running
</skills_instructions>

<available_skills>
<skill>
<name>pdf</name>
<description>Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms...</description>
<location>plugin</location>
</skill>

<skill>
<name>xlsx</name>
<description>Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis...</description>
<location>plugin</location>
</skill>
</available_skills>
```

**Claude 如何使用它：**

1. 用户询问："从这个 PDF 中提取数据"
2. Claude 扫描 `<available_skills>` → 找到 "pdf" 技能
3. Claude 调用：`Skill("pdf")`
4. SKILL.md 内容加载并提供详细指令
5. Claude 按照指令完成任务

### OpenSkills 的系统（相同格式）

OpenSkills 在您的 AGENTS.md 中生成 **完全相同的** `<available_skills>` XML：

```xml
<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions
- Base directory provided in output for resolving bundled resources

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
</usage>

<available_skills>

<skill>
<name>pdf</name>
<description>Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms...</description>
<location>project</location>
</skill>

<skill>
<name>xlsx</name>
<description>Comprehensive spreadsheet creation, editing, and analysis with support for formulas, formatting, data analysis...</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
```

**助手如何使用它：**

1. 用户询问："从这个 PDF 中提取数据"
2. 助手扫描 `<available_skills>` → 找到 "pdf" 技能
3. 助手调用：`Bash("openskills read pdf")`
4. SKILL.md 内容输出到助手的上下文
5. 助手按照指令完成任务

### 并排比较

| 方面              | Claude Code                          | OpenSkills                                   |
| ----------------- | ------------------------------------ | -------------------------------------------- |
| **系统提示**      | 内置到 Claude Code                   | 在 AGENTS.md 中                              |
| **调用方式**      | `Skill("pdf")` 工具                  | `openskills read pdf` CLI                    |
| **提示格式**      | `<available_skills>` XML             | `<available_skills>` XML（相同）             |
| **文件夹结构**    | `.claude/skills/`                    | `.claude/skills/`（相同）                    |
| **SKILL.md 格式** | YAML + markdown                      | YAML + markdown（相同）                      |
| **渐进式披露**    | 是                                   | 是                                           |
| **捆绑资源**      | `references/`、`scripts/`、`assets/` | `references/`、`scripts/`、`assets/`（相同） |
| **市场**          | Anthropic 市场                       | GitHub (anthropics/skills)                   |

**除了调用方法外，其他都完全相同。**

### SKILL.md 格式

两者使用完全相同的格式：

```markdown
---
name: pdf
description: Comprehensive PDF manipulation toolkit for extracting text and tables, creating new PDFs, merging/splitting documents, and handling forms.
---

# PDF Skill Instructions

When the user asks you to work with PDFs, follow these steps:

1. Install dependencies: `pip install pypdf2`
2. Extract text using the extract_text.py script in scripts/
3. For bundled resources, use the base directory provided in the skill output
4. ...

[Detailed instructions that Claude/agent follows]
```

**渐进式披露：** 完整的指令只在技能被调用时加载，保持助手的上下文清洁。

---

## 为什么使用 CLI 而不是 MCP？

**MCP（模型上下文协议）** 是 Anthropic 用于将 AI 连接到外部工具和数据源的协议。它适用于：

- 数据库连接
- API 集成
- 实时数据获取
- 外部服务集成

**技能（SKILL.md 格式）** 是不同的 — 它们用于：

- 专门的工作流（PDF 操作、电子表格编辑）
- 捆绑资源（脚本、模板、参考资料）
- 渐进式披露（仅在需要时加载指令）
- 静态、可重用的模式

**为什么不通过 MCP 实现技能？**

1. **技能是静态指令，不是动态工具**
   MCP 用于服务器-客户端连接。技能是带有指令的 markdown 文件。

2. **不需要服务器**
   技能只是文件。MCP 需要运行服务器。

3. **通用兼容性**
   CLI 适用于任何助手（Claude Code、Cursor、Windsurf、Aider）。MCP 需要 MCP 支持。

4. **遵循 Anthropic 的设计**
   Anthropic 将技能创建为 SKILL.md 文件，而不是 MCP 服务器。我们正在实现他们的规范。

5. **对用户更简单**
   `openskills install anthropics/skills` vs "配置 MCP 服务器、设置身份验证、管理服务器生命周期"

**MCP 和技能解决不同的问题。** OpenSkills 按照设计的方式实现 Anthropic 的技能规范（SKILL.md 格式）— 作为渐进式加载的 markdown 指令。

---

## Claude Code 兼容性

您可以 **同时** 使用 Claude Code 插件和 OpenSkills 项目技能：

**在您的 `<available_skills>` 列表中：**

```xml
<skill>
<name>pdf</name>
<description>...</description>
<location>plugin</location>  <!-- Claude Code 市场 -->
</skill>

<skill>
<name>custom-skill</name>
<description>...</description>
<location>project</location>  <!-- 来自 GitHub 的 OpenSkills -->
</skill>
```

它们完美共存。Claude 通过 `Skill` 工具调用市场插件，通过 CLI 调用 OpenSkills 技能。没有冲突。

### 高级：多助手设置的通用模式

**问题：** 如果您使用 Claude Code + 其他助手（Cursor、Windsurf、Aider）并共享一个 AGENTS.md，安装到 `.claude/skills/` 可能会与 Claude Code 的市场插件创建重复。

**解决方案：** 使用 `--universal` 安装到 `.agent/skills/` 代替：

```bash
openskills install anthropics/skills --universal
```

这将技能安装到 `.agent/skills/`，它：

- ✅ 通过 AGENTS.md 适用于所有助手
- ✅ 不与 Claude Code 的原生市场插件冲突
- ✅ 将 Claude Code 的 `<available_skills>` 与 AGENTS.md 技能分开

**何时使用：**

- ✅ 您使用 Claude Code + Cursor/Windsurf/Aider 并共享一个 AGENTS.md
- ✅ 您想避免重复的技能定义
- ✅ 您更喜欢 `.agent/` 用于基础设施（保持 `.claude/` 仅用于 Claude Code）

**何时不使用：**

- ❌ 您只使用 Claude Code（默认 `.claude/skills/` 即可）
- ❌ 您只使用非 Claude 助手（默认 `.claude/skills/` 即可）

**优先级顺序：**
OpenSkills 按优先级顺序搜索 4 个位置：

1. `./.agent/skills/`（项目通用）
2. `~/.agent/skills/`（全局通用）
3. `./.claude/skills/`（项目）
4. `~/.claude/skills/`（全局）

同名技能只出现一次（最高优先级获胜）。

---

## 命令

```bash
openskills install <source> [options]  # 从 GitHub、本地路径或私有仓库安装
openskills sync [-y] [-o <path>]       # 更新 AGENTS.md（或自定义输出）
openskills list                        # 显示已安装的技能
openskills read <name>                 # 加载技能（供助手使用）
openskills manage                      # 管理技能（交互式删除）
openskills remove <name>               # 删除特定技能
```

### 标志

- `--global` — 全局安装到 `~/.claude/skills`（默认：项目安装）
- `--universal` — 安装到 `.agent/skills/` 而不是 `.claude/skills/`（高级）
- `-y, --yes` — 跳过所有提示，包括覆盖（用于脚本/CI）
- `-o, --output <path>` — 同步的自定义输出文件（默认：如果存在 `.cursor` 目录则使用 `.cursor/rules/AGENTS.md`，否则使用 `AGENTS.md`）
- `-v, --version` — 显示版本号

### 安装模式

**默认（推荐）- 项目安装：**

```bash
openskills install anthropics/skills
# → 安装到 ./.claude/skills（项目本地，gitignored）
# → 仅当前项目可用
```

**全局安装：**

```bash
openskills install anthropics/skills --global
# → 安装到 ~/.claude/skills（用户主目录）
# → 所有项目都可以使用
# → 适合安装常用技能，避免在每个项目中重复安装
```

**何时使用全局安装：**

- ✅ 您想在多个项目中使用相同的技能
- ✅ 您想安装常用的基础技能（如 pdf、xlsx 等）
- ✅ 您不想在每个项目中重复安装技能

**何时使用项目安装（默认）：**

- ✅ 项目特定的技能
- ✅ 需要版本控制的技能
- ✅ 团队协作项目，技能应该随项目一起管理

**通用模式（高级）：**

```bash
openskills install anthropics/skills --universal
# → 安装到 ./.agent/skills（适用于 Claude Code + 其他助手）
```

### 从本地路径安装

```bash
# 绝对路径
openskills install /path/to/my-skill

# 相对路径
openskills install ./local-skills/my-skill

# 主目录
openskills install ~/my-skills/custom-skill

# 从目录安装所有技能
openskills install ./my-skills-folder
```

### 从私有 Git 仓库安装

```bash
# SSH（使用您的 SSH 密钥）
openskills install git@github.com:your-org/private-skills.git

# HTTPS（可能提示输入凭据）
openskills install https://github.com/your-org/private-skills.git
```

### 同步选项

```bash
# 同步到默认路径（如果存在 .cursor 目录则使用 .cursor/rules/AGENTS.md，否则使用 AGENTS.md）
openskills sync

# 同步到自定义文件（如果缺失则自动创建）
openskills sync --output .ruler/AGENTS.md
openskills sync -o custom-rules.md

# 非交互式（用于 CI/CD）
openskills sync -y
```

**默认路径说明：**

- 如果项目根目录存在 `.cursor` 目录，默认输出到 `.cursor/rules/AGENTS.md`（适用于 Cursor IDE）
- 否则，默认输出到根目录的 `AGENTS.md`

### 默认交互式

所有命令默认使用美观的 TUI：

**安装：**

```bash
openskills install anthropics/skills
# → 复选框选择要安装的技能
# → 显示技能名称、描述、大小
# → 默认全部选中
```

**同步：**

```bash
openskills sync
# → 复选框选择要包含在 AGENTS.md 中的技能
# → 预选已在 AGENTS.md 中的技能
# → 空选择会删除技能部分
```

**管理：**

```bash
openskills manage
# → 复选框选择要删除的技能
# → 默认不选中任何内容（安全）
```

---

## 示例技能

来自 Anthropic 的[技能仓库](https://github.com/anthropics/skills)：

- **xlsx** — 电子表格创建、编辑、公式、数据分析
- **docx** — 带跟踪更改和评论的文档创建
- **pdf** — PDF 操作（提取、合并、拆分、表单）
- **pptx** — 演示文稿创建和编辑
- **canvas-design** — 创建海报和视觉设计
- **mcp-builder** — 构建模型上下文协议服务器
- **skill-creator** — 编写技能的详细指南

浏览全部：[github.com/anthropics/skills](https://github.com/anthropics/skills)

---

## 创建您自己的技能

### 最小结构

```
my-skill/
└── SKILL.md
    ---
    name: my-skill
    description: What this does and when to use it
    ---

    # Instructions in imperative form

    When the user asks you to X, do Y...
```

### 带捆绑资源

```
my-skill/
├── SKILL.md
├── references/
│   └── api-docs.md      # 支持文档
├── scripts/
│   └── process.py       # 辅助脚本
└── assets/
    └── template.json    # 模板、配置
```

在您的 SKILL.md 中，引用资源：

```markdown
1. Read the API documentation in references/api-docs.md
2. Run the process.py script from scripts/
3. Use the template from assets/template.json
```

助手在加载技能时看到基础目录：

```
Loading: my-skill
Base directory: /path/to/.claude/skills/my-skill

[SKILL.md content]
```

### 发布

1. 推送到 GitHub：`your-username/my-skill`
2. 用户使用以下命令安装：`openskills install your-username/my-skill`

### 使用符号链接进行本地开发

对于活跃的技能开发，将您的技能符号链接到技能目录：

```bash
# 克隆您正在开发的技能仓库
git clone git@github.com:your-org/my-skills.git ~/dev/my-skills

# 符号链接到项目的技能目录
mkdir -p .claude/skills
ln -s ~/dev/my-skills/my-skill .claude/skills/my-skill

# 现在对 ~/dev/my-skills/my-skill 的更改会立即反映
openskills list  # 显示 my-skill
openskills sync  # 在 AGENTS.md 中包含 my-skill
```

这种方法让您可以：

- 在首选位置编辑技能
- 在版本控制下保持技能
- 无需重新安装即可立即测试更改
- 通过符号链接在多个项目之间共享技能

### 编写指南

使用 Anthropic 的 skill-creator 获取详细指导：

```bash
openskills install anthropics/skills
openskills read skill-creator
```

这将加载关于以下内容的全面指令：

- 编写有效的技能描述
- 为助手构建指令结构
- 使用捆绑资源
- 测试和迭代

---

## 开发：工具链接脚本

对于开发 OpenSkills 的开发者，这些脚本可以帮助将项目安装为全局工具以便测试。

### 使用方法

**NPM 快捷命令（推荐）：**

```bash
# 安装工具（链接到全局）
npm run link

# 卸载工具（取消全局链接）
npm run unlink

# 查看状态
npm run link:status
```

**Node.js 脚本（跨平台）：**

```bash
# 安装工具
node scripts/link-tool.js install

# 卸载工具
node scripts/link-tool.js uninstall

# 查看状态
node scripts/link-tool.js status

# 显示帮助
node scripts/link-tool.js help
```

**PowerShell 脚本（Windows）：**

```powershell
# 安装工具
.\scripts\link-tool.ps1 install

# 卸载工具
.\scripts\link-tool.ps1 uninstall

# 查看状态
.\scripts\link-tool.ps1 status

# 显示帮助
.\scripts\link-tool.ps1 help
```

### 功能说明

**安装（link）：**

- 自动检查项目是否已构建，如未构建会自动构建
- 检查是否已安装，避免重复安装
- 创建全局符号链接，使 `openskills` 命令在任意位置可用

**卸载（unlink）：**

- 检查是否已安装，避免不必要的操作
- 移除全局符号链接
- 从系统中移除 `openskills` 命令

**状态（status）：**

- 显示项目路径和构建目录
- 检查 CLI 文件是否已构建
- 检查全局链接状态
- 如果已安装，显示版本信息

### 注意事项

1. **安装前**：确保项目已构建（脚本会自动检查并构建）
2. **卸载后**：`openskills` 命令将不再可用
3. **重新安装**：如需重新安装，请先卸载再安装

### 工作原理

- **安装**：使用 `npm link` 创建全局符号链接
- **卸载**：使用 `npm unlink -g` 移除全局符号链接
- **状态检查**：通过 `npm list -g` 检查链接状态

---

## 要求

- **Node.js** 20.6+（用于 ora 依赖）
- **Git**（用于克隆仓库）

---

## 许可证

Apache 2.0

## 归属

实现 [Anthropic 的 Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 规范。

**与 Anthropic 无关。** Claude、Claude Code 和 Agent Skills 是 Anthropic, PBC 的商标。
