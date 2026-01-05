# OpenSkills 工具链接脚本 (PowerShell)
# 用于将当前项目安装为全局工具或卸载
#
# 使用方法:
#   .\scripts\link-tool.ps1 install   # 安装（链接）工具
#   .\scripts\link-tool.ps1 uninstall # 卸载（取消链接）工具
#   .\scripts\link-tool.ps1 status     # 查看当前状态

param(
    [Parameter(Position=0)]
    [ValidateSet('install', 'uninstall', 'remove', 'status', 'info', 'help')]
    [string]$Command = 'help'
)

$ErrorActionPreference = 'Stop'
$PACKAGE_NAME = 'openskills'
$PROJECT_ROOT = $PSScriptRoot | Split-Path -Parent
$DIST_DIR = Join-Path $PROJECT_ROOT 'dist'
$CLI_FILE = Join-Path $DIST_DIR 'cli.js'

function Test-IsLinked {
    try {
        $result = npm list -g --depth=0 $PACKAGE_NAME 2>&1
        return $result -match $PACKAGE_NAME -and $result -match $PROJECT_ROOT
    } catch {
        return $false
    }
}

function Install-Tool {
    Write-Host "🔧 正在安装 OpenSkills 工具...`n" -ForegroundColor Cyan

    # 检查构建
    if (-not (Test-Path $CLI_FILE)) {
        Write-Host "⚠️  检测到项目尚未构建，正在构建...`n" -ForegroundColor Yellow
        npm run build
        Write-Host ""
    }

    # 检查是否已链接
    if (Test-IsLinked) {
        Write-Host "ℹ️  工具已经安装，无需重复安装" -ForegroundColor Yellow
        Write-Host "   如需重新安装，请先运行: .\scripts\link-tool.ps1 uninstall`n"
        return
    }

    try {
        Write-Host "📦 正在创建全局链接..." -ForegroundColor Cyan
        npm link
        Write-Host "`n✅ 安装成功！" -ForegroundColor Green
        Write-Host "`n现在可以在任何位置使用 '$PACKAGE_NAME' 命令了" -ForegroundColor Green
        Write-Host "   测试: openskills --version`n" -ForegroundColor Gray
    } catch {
        Write-Host "`n❌ 安装失败" -ForegroundColor Red
        exit 1
    }
}

function Uninstall-Tool {
    Write-Host "🗑️  正在卸载 OpenSkills 工具...`n" -ForegroundColor Cyan

    # 检查是否已链接
    if (-not (Test-IsLinked)) {
        Write-Host "ℹ️  工具未安装，无需卸载`n" -ForegroundColor Yellow
        return
    }

    try {
        Write-Host "🔗 正在移除全局链接..." -ForegroundColor Cyan
        npm unlink -g openskills
        Write-Host "`n✅ 卸载成功！" -ForegroundColor Green
        Write-Host "   openskills 命令已从系统中移除`n" -ForegroundColor Gray
    } catch {
        Write-Host "`n❌ 卸载失败" -ForegroundColor Red
        exit 1
    }
}

function Show-Status {
    Write-Host "📊 OpenSkills 工具状态`n" -ForegroundColor Cyan
    Write-Host "项目路径: $PROJECT_ROOT"
    Write-Host "构建目录: $DIST_DIR"
    
    $buildStatus = if (Test-Path $CLI_FILE) { "✅ 已构建" } else { "❌ 未构建" }
    Write-Host "CLI 文件: $buildStatus"
    
    $linkStatus = if (Test-IsLinked) { "✅ 已安装" } else { "❌ 未安装" }
    Write-Host "全局链接: $linkStatus"
    
    if (Test-IsLinked) {
        try {
            $version = openskills --version 2>&1 | Out-String
            $version = $version.Trim()
            Write-Host "版本信息: $version"
        } catch {
            Write-Host "版本信息: 无法获取"
        }
    }
    Write-Host ""
}

function Show-Help {
    Write-Host "OpenSkills 工具链接脚本`n" -ForegroundColor Cyan
    Write-Host "使用方法:"
    Write-Host "  .\scripts\link-tool.ps1 install    # 安装（链接）工具"
    Write-Host "  .\scripts\link-tool.ps1 uninstall # 卸载（取消链接）工具"
    Write-Host "  .\scripts\link-tool.ps1 status     # 查看当前状态"
    Write-Host "  .\scripts\link-tool.ps1 help       # 显示帮助信息`n"
}

# 主逻辑
switch ($Command) {
    'install' {
        Install-Tool
    }
    'uninstall' {
        Uninstall-Tool
    }
    'remove' {
        Uninstall-Tool
    }
    'status' {
        Show-Status
    }
    'info' {
        Show-Status
    }
    'help' {
        Show-Help
    }
    default {
        Write-Host "❌ 未知命令: $Command`n" -ForegroundColor Red
        Show-Help
        exit 1
    }
}
