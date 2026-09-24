/**
 * 申论研习台 - 考友留言与反馈领域逻辑引擎
 * 采用纯前端无状态设计，组装 GitHub Issue 协议直通参数
 * 仅聚焦：💡 功能建议 (feature) 与 🐞 缺陷报错 (bug)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const helper = factory();
    helper.FeedbackHelper = helper;
    module.exports = helper;
  } else {
    root.FeedbackHelper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_REPO = 'qqxdxdxxd-hash/shenlun-study';

  const TYPE_CONFIG = {
    feature: { label: 'enhancement', prefix: '【功能建议】', sectionTitle: '💡 建议详情 / Description' },
    bug: { label: 'bug', prefix: '【缺陷报错】', sectionTitle: '🐞 缺陷表现 / Bug Description' }
  };

  const FeedbackHelper = {
    /**
     * 根据留言类型映射 GitHub Issue Label
     */
    getLabelByType(type) {
      return (TYPE_CONFIG[type] && TYPE_CONFIG[type].label) || 'enhancement';
    },

    /**
     * 根据留言类型获取 Issue 标题前缀
     */
    getTitlePrefix(type) {
      return (TYPE_CONFIG[type] && TYPE_CONFIG[type].prefix) || '【功能建议】';
    },

    /**
     * 格式化排版整洁的 Markdown 正文
     */
    formatMarkdownBody(payload = {}) {
      const type = (payload.type === 'bug') ? 'bug' : 'feature';
      const config = TYPE_CONFIG[type];
      const content = (payload.content || '').trim() || '（未填写详细描述）';
      const contact = (payload.contact || '').trim() || '未提供';
      const ctx = payload.context || {};

      const lines = [
        `### ${config.sectionTitle}`,
        content,
        '',
        '---',
        '### 👤 联系方式 / Contact',
        contact,
        '',
        '---',
        '### 🛠️ 客户端运行环境 / System Context',
        '| 环境项 | 诊断参数值 |',
        '| :--- | :--- |',
        `| **系统版本** | Shenlun Exam OS v${ctx.appVersion || '2.0.0'} |`,
        `| **当前试卷** | ${ctx.examTitle || '未关联试卷'} |`,
        `| **作答题型** | ${ctx.questionType || '未指定'} |`,
        `| **操作系统/平台** | ${ctx.platform || (typeof navigator !== 'undefined' ? navigator.platform : '未知')} |`,
        `| **浏览器内核** | ${ctx.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js')} |`,
        `| **提交时间戳** | ${new Date().toISOString()} |`,
        '',
        '> *由申论智能研习台 (Shenlun Exam OS) 客户端纯前端一键生成*'
      ];

      return lines.join('\n');
    },

    /**
     * 组装带参数的 GitHub Issue 创建 URL
     */
    buildIssueUrl(options = {}) {
      const repo = options.repo || DEFAULT_REPO;
      const type = (options.type === 'bug') ? 'bug' : 'feature';
      const rawTitle = (options.title || '').trim() || (type === 'bug' ? '发现系统异常缺陷' : '希望增加研习新功能');
      const fullTitle = `${this.getTitlePrefix(type)}${rawTitle}`;
      const label = this.getLabelByType(type);
      const body = this.formatMarkdownBody(options);

      const baseUrl = `https://github.com/${repo}/issues/new`;
      const queryParams = [
        `title=${encodeURIComponent(fullTitle)}`,
        `labels=${encodeURIComponent(label)}`,
        `body=${encodeURIComponent(body)}`
      ];

      return `${baseUrl}?${queryParams.join('&')}`;
    }
  };

  return FeedbackHelper;
});
