# CR - AI Code Review Tool for Miaosila

CR 是一个现代化的命令行风格代码审查工具，旨在通过 AI 为您提供即时的代码分析、问题检测和重构建议。

灵感来源于 Claude Code 和 Xcode 的界面设计，旨在提供最优雅的开发者体验。

## 功能特性

*   **自动捕获变更**: 启动时自动读取当前项目的 git diff，无需手动复制粘贴。
*   **智能分析**: 连接 AI 模型，深度分析代码逻辑，支持自定义 AI 接口
*   **可视化差异**: 优雅的 Diff 高亮显示。
*   **交互式报告**: 生成包含评分、问题列表（Bug/安全/风格）的详细报告。
*   **一键优化**: 直接查看并应用 AI 建议的重构代码。

## 前置要求

1.  **Node.js v20+**: 运行开发环境。
2.  **Git**: 必须在 Git 仓库目录下运行。
3.  **AI 服务**:
    *   需要一个兼容 OpenAI Chat Completions 接口的服务。

## 快速使用

### 1. 配置

```bash
cp ./constants.bac ./constants.ts
```
修改 `constants.ts` 中的接口、ApiKey、模型等配置

### 2. 编译

```bash
# 安装依赖
$ npm install

# 正式编译
$ npm run build

# link 全局 cr 命令
$ npm link
```

### 3. 在项目中使用
在任意 Git 项目根目录下，运行 `cr` 命令：

```bash
# 打开命令行工具，cd 到需要 code review 的应用目录
$ cd your_app_dir

# 启动 AI code review
$ cr
```

浏览器将自动打开，并**自动加载**您当前未提交的代码变更。
点击右下角 **"开始审查"** 即可生成报告。如果不满意，可以点击`重新审查`按钮重试

> Tip: 为了提升 CR 效果，最好在开头补充上技术方案名称或者调整的需求名称，或者贴上您需要关注的 CR 重点

## 故障排除

**未检测到 Git 变更**
确保您在项目根目录运行，且确实有未提交的更改（尝试 `git status` 确认）。

**连接 AI 失败**
检查 AI 服务是否运行

## 贡献

欢迎提交 Issue 或 PR 来改进 CR！
