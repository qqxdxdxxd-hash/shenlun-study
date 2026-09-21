/**
 * 申论研习台 - 客户端数据中枢 (IndexedDB Storage)
 * 100% 运行于当前浏览器本地，服务端零存储
 */
const DB_NAME = 'ShenlunStudyDB';
const DB_VERSION = 4;

class ClientDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. 个人申论记忆库 (SM-2 艾宾浩斯)
        if (!db.objectStoreNames.contains('memories')) {
          const store = db.createObjectStore('memories', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('nextReview', 'nextReview', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 2. 作答记录
        if (!db.objectStoreNames.contains('submissions')) {
          const store = db.createObjectStore('submissions', { keyPath: 'id' });
          store.createIndex('questionType', 'questionType', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 3. 色谱批改报告
        if (!db.objectStoreNames.contains('reports')) {
          const store = db.createObjectStore('reports', { keyPath: 'id' });
          store.createIndex('submissionId', 'submissionId', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 4. 作答短板档案 (Dossier) - 升级支持题型与通用元维度索引
        let dossierStore;
        if (!db.objectStoreNames.contains('dossier')) {
          dossierStore = db.createObjectStore('dossier', { keyPath: 'id' });
        } else {
          dossierStore = event.target.transaction.objectStore('dossier');
        }
        if (!dossierStore.indexNames.contains('errorDimension')) {
          dossierStore.createIndex('errorDimension', 'errorDimension', { unique: false });
        }
        if (!dossierStore.indexNames.contains('severity')) {
          dossierStore.createIndex('severity', 'severity', { unique: false });
        }
        if (!dossierStore.indexNames.contains('questionType')) {
          dossierStore.createIndex('questionType', 'questionType', { unique: false });
        }
        if (!dossierStore.indexNames.contains('dimensionKey')) {
          dossierStore.createIndex('dimensionKey', 'dimensionKey', { unique: false });
        }
        if (!dossierStore.indexNames.contains('cleared')) {
          dossierStore.createIndex('cleared', 'cleared', { unique: false });
        }
        if (!dossierStore.indexNames.contains('submissionId')) {
          dossierStore.createIndex('submissionId', 'submissionId', { unique: false });
        }

        // 5. 自定义私有 Skill
        if (!db.objectStoreNames.contains('custom_skills')) {
          const store = db.createObjectStore('custom_skills', { keyPath: 'id' });
          store.createIndex('questionType', 'questionType', { unique: false });
        }

        // 6. 私有学习资料库
        if (!db.objectStoreNames.contains('private_kb')) {
          const store = db.createObjectStore('private_kb', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 7. 离线/真题库缓存 (exams)
        if (!db.objectStoreNames.contains('exams')) {
          const store = db.createObjectStore('exams', { keyPath: 'id' });
          store.createIndex('questionType', 'questionType', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getExamById(examId) {
    return await this.get('exams', examId);
  }

  async saveExam(exam) {
    return await this.put('exams', exam);
  }

  async getAll(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

// 导出全局单例
window.clientDB = new ClientDB();
