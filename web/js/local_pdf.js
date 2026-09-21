/**
 * 纯前端 Mozilla PDF.js 文本图层提取器 (LocalPdfExtractor)
 * 100% 在当前浏览器内存中解析，私人讲义与考卷绝对零上传，毫秒级就绪。
 */
class LocalPdfExtractor {
  /**
   * 从 File 或 Blob 对象直接提取纯文本图层
   * @param {File|Blob} file 浏览器本地选择的 PDF 文件
   * @returns {Promise<{text: string, page_count: number, char_count: number}>}
   */
  static async extractText(file) {
    const pdfjs = (typeof window !== 'undefined' ? window.pdfjsLib : (typeof globalThis !== 'undefined' ? globalThis.pdfjsLib : null));
    if (!pdfjs) {
      throw new Error("PDF.js 解析引擎尚未加载，请检查网络或刷新页面。");
    }

    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += `\n--- [第 ${i} 页] ---\n` + pageText;
    }

    const cleanText = fullText.trim();
    return {
      text: cleanText,
      page_count: pdf.numPages,
      char_count: cleanText.length
    };
  }
}

if (typeof window !== 'undefined') {
  window.LocalPdfExtractor = LocalPdfExtractor;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalPdfExtractor };
}
