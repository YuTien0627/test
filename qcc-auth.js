/**
 * QCC 奇美醫院品質改善平台 — RBAC 認證與權限模組
 * 
 * 角色定義：
 *   admin   管理員   — 可管理用戶、所有功能、查看統計
 *   editor  編輯者   — 可編輯內容、使用所有功能
 *   viewer  一般同仁 — 可瀏覽所有內容（預設登入角色）
 *   guest   訪客     — 僅可瀏覽首頁與參考資料
 */

const QCC_AUTH = (() => {

  /* ── 使用者資料庫（示範用，實際部署應替換為後端API）── */
  const USERS_DB = [
    { id: 'u001', username: 'admin',   password: 'admin123',   name: '系統管理員',   dept: '品質管理部', role: 'admin',  avatar: '👑' },
    { id: 'u002', username: 'editor1', password: 'edit123',    name: '王品質',       dept: '品質管理部', role: 'editor', avatar: '✏️' },
    { id: 'u003', username: 'staff1',  password: 'staff123',   name: '李護理師',     dept: '護理部',     role: 'viewer', avatar: '👤' },
    { id: 'u004', username: 'staff2',  password: 'staff456',   name: '陳醫師',       dept: '內科部',     role: 'viewer', avatar: '👤' },
    { id: 'u005', username: 'guest',   password: 'guest000',   name: '訪客',         dept: '—',          role: 'guest',  avatar: '👁️' },
  ];

  /* ── 角色顯示設定 ── */
  const ROLE_CONFIG = {
    admin:  { label: '管理員',   color: 'role-admin',  icon: '👑', desc: '完整系統管理權限' },
    editor: { label: '編輯者',   color: 'role-editor', icon: '✏️', desc: '可編輯及使用所有功能' },
    viewer: { label: '一般同仁', color: 'role-viewer', icon: '👤', desc: '可瀏覽所有學習資源' },
    guest:  { label: '訪客',     color: 'role-guest',  icon: '👁️', desc: '有限瀏覽權限' },
  };

  /* ── 功能權限矩陣 ── */
  const PERMISSIONS = {
    viewHome:       ['admin', 'editor', 'viewer', 'guest'],
    viewTools:      ['admin', 'editor', 'viewer'],
    viewFormat:     ['admin', 'editor', 'viewer'],
    viewReference:  ['admin', 'editor', 'viewer', 'guest'],
    viewQuiz:       ['admin', 'editor', 'viewer'],
    editContent:    ['admin', 'editor'],
    manageUsers:    ['admin'],
    viewStats:      ['admin'],
    exportData:     ['admin', 'editor'],
  };

  /* ── 內部方法 ── */
  const STORAGE_KEY = 'qcc_session';

  function _save(user) {
    const session = { ...user, loginAt: new Date().toISOString() };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch(e) {}
  }

  function _load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  /* ── 公開 API ── */
  return {
    /** 登入，成功回傳用戶物件，失敗回傳 null */
    login(username, password) {
      const user = USERS_DB.find(u =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password
      );
      if (user) {
        const safe = { id: user.id, username: user.username, name: user.name, dept: user.dept, role: user.role, avatar: user.avatar };
        _save(safe);
        return safe;
      }
      return null;
    },

    /** 取得目前登入的用戶，未登入回傳 null */
    getUser() { return _load(); },

    /** 登出 */
    logout() {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch(e) {}
    },

    /** 檢查是否有特定權限 */
    can(permission) {
      const user = _load();
      if (!user) return false;
      const allowed = PERMISSIONS[permission];
      return allowed ? allowed.includes(user.role) : false;
    },

    /** 取得角色設定 */
    roleConfig(role) {
      return ROLE_CONFIG[role] || ROLE_CONFIG.guest;
    },

    /** 取得所有角色設定（管理用） */
    allRoles() { return { ...ROLE_CONFIG }; },

    /** 取得所有用戶（僅 admin） */
    getUsers() {
      const user = _load();
      if (!user || user.role !== 'admin') return [];
      return USERS_DB.map(u => ({
        id: u.id, username: u.username, name: u.name,
        dept: u.dept, role: u.role, avatar: u.avatar
      }));
    },

    /** 若未登入，重導向至登錄頁 */
    requireAuth(redirectUrl = 'login.html') {
      if (!_load()) {
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    },

    /** 若未有特定權限，顯示無權限提示 */
    requirePermission(permission) {
      if (!this.can(permission)) {
        return false;
      }
      return true;
    },

    PERMISSIONS,
    ROLE_CONFIG,
  };
})();
