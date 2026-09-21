/**
 * 温和主动数据防护与全量 JSON 导出导入引擎 (Data Safety Manager)
 */
class BackupManager {
  static async exportFullBackup() {
    const db = window.clientDB;
    const memories = await db.getAll('memories');
    const submissions = await db.getAll('submissions');
    const reports = await db.getAll('reports');
    const dossier = await db.getAll('dossier');
    const customSkills = await db.getAll('custom_skills');

    const backupPayload = {
      app: "ShenlunStudy",
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      stats: {
        memoriesCount: memories.length,
        submissionsCount: submissions.length,
        reportsCount: reports.length,
        dossierCount: dossier.length,
        customSkillsCount: customSkills.length
      },
      data: {
        memories,
        submissions,
        reports,
        dossier,
        customSkills
      }
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shenlun_study_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    localStorage.setItem('shenlun_last_backup', Date.now().toString());
    return backupPayload.stats;
  }

  static async importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed.data || parsed.app !== "ShenlunStudy") {
            return reject(new Error("无效的备份文件格式"));
          }
          const db = window.clientDB;
          // 恢复 memories
          if (Array.isArray(parsed.data.memories)) {
            for (const m of parsed.data.memories) {
              await db.put('memories', m);
            }
          }
          // 恢复 submissions
          if (Array.isArray(parsed.data.submissions)) {
            for (const s of parsed.data.submissions) {
              await db.put('submissions', s);
            }
          }
          // 恢复 reports
          if (Array.isArray(parsed.data.reports)) {
            for (const r of parsed.data.reports) {
              await db.put('reports', r);
            }
          }
          // 恢复 dossier
          if (Array.isArray(parsed.data.dossier)) {
            for (const d of parsed.data.dossier) {
              await db.put('dossier', d);
            }
          }
          // 恢复 customSkills
          if (Array.isArray(parsed.data.customSkills)) {
            for (const cs of parsed.data.customSkills) {
              await db.put('custom_skills', cs);
            }
          }
          resolve(parsed.stats || {});
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("读取文件失败"));
      reader.readAsText(file);
    });
  }

  static checkBackupReminder() {
    const lastBackup = parseInt(localStorage.getItem('shenlun_last_backup') || '0', 10);
    const daysSince = (Date.now() - lastBackup) / (1000 * 3600 * 24);
    return daysSince >= 7;
  }
}

window.BackupManager = BackupManager;
