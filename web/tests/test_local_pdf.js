const assert = require('assert');
const { LocalPdfExtractor } = require('../js/local_pdf.js');

console.log("=== 开始执行 LocalPdfExtractor 测试 ===");

// 模拟 Mozilla pdf.js API
global.pdfjsLib = {
  GlobalWorkerOptions: {},
  getDocument({ data }) {
    return {
      promise: Promise.resolve({
        numPages: 2,
        getPage(pageNumber) {
          return Promise.resolve({
            getTextContent() {
              if (pageNumber === 1) {
                return Promise.resolve({
                  items: [{ str: "申论高分之道" }, { str: "第一章" }, { str: "立意与总分论点" }]
                });
              } else {
                return Promise.resolve({
                  items: [{ str: "第二章" }, { str: "公文规范与三轨判分" }]
                });
              }
            }
          });
        }
      })
    };
  }
};

(async () => {
  const mockFile = {
    arrayBuffer: async () => new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer
  };

  const res = await LocalPdfExtractor.extractText(mockFile);
  assert.strictEqual(res.page_count, 2);
  assert(res.text.includes("申论高分之道"));
  assert(res.text.includes("公文规范与三轨判分"));
  assert(res.char_count > 20);

  console.log("✓ LocalPdfExtractor 浏览器纯前端文字图层解析通过！");
})();
