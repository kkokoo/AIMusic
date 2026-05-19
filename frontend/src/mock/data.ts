import type {
  User,
  AIModel,
  GenerationTask,
  CreditTransaction,
  CreditPackage,
  CreditOrder,
  DashboardStats,
  AdminLog,
} from '@/types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function generateOrderNo(): string {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase();
}

const STORAGE_KEYS = {
  users: 'mock_users',
  models: 'mock_models',
  tasks: 'mock_tasks',
  transactions: 'mock_transactions',
  packages: 'mock_packages',
  orders: 'mock_orders',
  configs: 'mock_configs',
  logs: 'mock_logs',
};

function getStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function setStore<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function seedOnce<T>(key: string, seedData: T): void {
  const isSeedVersionKey = key + '_seed_v2';
  if (localStorage.getItem(isSeedVersionKey)) return;
  setStore(key, seedData);
  localStorage.setItem(isSeedVersionKey, '1');
}

function initMockData(): void {
  if (typeof window === 'undefined') return;

  seedOnce(STORAGE_KEYS.models, [
    {
      id: 1, name: 'SonicWave Pro', code: 'sonicwave_pro',
      description: '专业纯音乐生成模型，支持多种风格与乐器组合',
      supportedModes: ['instrumental'], supportsLyrics: false,
      maxDurationSec: 120, pricePerSecond: 2, pricePerSong: 0,
      tags: ['高音质', '多风格'], apiConfig: {}, adapterName: 'sonicwave',
      maxConcurrent: 5, isActive: true, consecutiveFailures: 0,
    },
    {
      id: 2, name: 'VocalSynth AI', code: 'vocalsynth_ai',
      description: '全能型歌曲生成模型，支持人声合成与多语言歌词',
      supportedModes: ['instrumental', 'song'], supportsLyrics: true,
      maxDurationSec: 180, pricePerSecond: 3, pricePerSong: 0,
      tags: ['人声', '多语言'], apiConfig: {}, adapterName: 'vocalsynth',
      maxConcurrent: 3, isActive: true, consecutiveFailures: 0,
    },
    {
      id: 3, name: 'BeatMaster X', code: 'beatmaster_x',
      description: '节拍与节奏专用模型，适合电子音乐与HIP-HOP制作',
      supportedModes: ['instrumental'], supportsLyrics: false,
      maxDurationSec: 150, pricePerSecond: 4, pricePerSong: 0,
      tags: ['节拍', '电子'], apiConfig: {}, adapterName: 'sonicwave',
      maxConcurrent: 4, isActive: true, consecutiveFailures: 0,
    },
  ] as AIModel[]);

  seedOnce(STORAGE_KEYS.packages, [
    { id: 1, name: '入门套餐', priceCents: 600, credits: 100, bonusCredits: 0, isRecommended: false, isActive: true },
    { id: 2, name: '进阶套餐', priceCents: 3000, credits: 600, bonusCredits: 50, isRecommended: true, isActive: true },
    { id: 3, name: '专业套餐', priceCents: 6000, credits: 1500, bonusCredits: 200, isRecommended: false, isActive: true },
    { id: 4, name: '大师套餐', priceCents: 12000, credits: 3000, bonusCredits: 500, isRecommended: false, isActive: true },
  ] as CreditPackage[]);

  seedOnce(STORAGE_KEYS.configs, {
    initialCredits: 100,
    maxConcurrent: 3,
    autoRefund: true,
    creditPricePerUnit: 0.06,
  });

  const now = Date.now();
  const dayMs = 86400000;

  seedOnce(STORAGE_KEYS.users, [
    { id: 1, username: 'admin', email: 'admin@example.com', credits: 9999, totalCreditsEarned: 9999, totalCreditsSpent: 0, isActive: true, isAdmin: true, createdAt: new Date(now - 30 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, username: '音乐爱好者小明', email: 'xiaoming@example.com', credits: 850, totalCreditsEarned: 1000, totalCreditsSpent: 150, isActive: true, isAdmin: false, createdAt: new Date(now - 25 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, username: '创作达人小芳', email: 'xiaofang@example.com', credits: 2340, totalCreditsEarned: 3000, totalCreditsSpent: 660, isActive: true, isAdmin: false, createdAt: new Date(now - 20 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, username: '音乐制作人Leo', email: 'leo@example.com', credits: 5200, totalCreditsEarned: 6000, totalCreditsSpent: 800, isActive: true, isAdmin: false, createdAt: new Date(now - 18 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, username: '混音师王老师', email: 'wang@example.com', credits: 180, totalCreditsEarned: 1500, totalCreditsSpent: 1320, isActive: false, isAdmin: false, createdAt: new Date(now - 15 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 6, username: '业余歌手小美', email: 'xiaomei@example.com', credits: 430, totalCreditsEarned: 500, totalCreditsSpent: 70, isActive: true, isAdmin: false, createdAt: new Date(now - 12 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 7, username: '编曲师阿杰', email: 'ajie@example.com', credits: 3100, totalCreditsEarned: 3500, totalCreditsSpent: 400, isActive: true, isAdmin: false, createdAt: new Date(now - 10 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 8, username: '音效设计Lily', email: 'lily@example.com', credits: 760, totalCreditsEarned: 1200, totalCreditsSpent: 440, isActive: true, isAdmin: false, createdAt: new Date(now - 8 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 9, username: '钢琴师Ken', email: 'ken@example.com', credits: 950, totalCreditsEarned: 1000, totalCreditsSpent: 50, isActive: true, isAdmin: false, createdAt: new Date(now - 5 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
    { id: 10, username: '测试账号', email: 'test@example.com', credits: 0, totalCreditsEarned: 100, totalCreditsSpent: 100, isActive: true, isAdmin: false, createdAt: new Date(now - 2 * dayMs).toISOString(), updatedAt: new Date().toISOString() },
  ] as User[]);

  seedOnce(STORAGE_KEYS.tasks, [
    { id: 1, userId: 2, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '轻快的钢琴曲', durationSec: 60, actualDurationSec: 58, costCredits: 120, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 3600000).toISOString(), completedAt: new Date(now - 3500000).toISOString() },
    { id: 2, userId: 3, modelId: 2, modelName: 'VocalSynth AI', mode: 'song', prompt: '流行情歌', lyrics: '你是我心中最美的风景...', durationSec: 120, actualDurationSec: 118, costCredits: 360, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 7200000).toISOString(), completedAt: new Date(now - 7000000).toISOString() },
    { id: 3, userId: 4, modelId: 3, modelName: 'BeatMaster X', mode: 'instrumental', prompt: '电子舞曲节拍', durationSec: 90, actualDurationSec: 88, costCredits: 360, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 10800000).toISOString(), completedAt: new Date(now - 10600000).toISOString() },
    { id: 4, userId: 2, modelId: 2, modelName: 'VocalSynth AI', mode: 'song', prompt: '古风歌曲', lyrics: '山水之间，烟雨朦胧...', durationSec: 150, costCredits: 450, status: 'processing', isDeleted: false, createdAt: new Date(now - 300000).toISOString() },
    { id: 5, userId: 6, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '宁静的夜晚', durationSec: 45, costCredits: 90, status: 'failed', errorMessage: 'AI模型生成失败，请稍后重试', isDeleted: false, createdAt: new Date(now - 14400000).toISOString(), completedAt: new Date(now - 14000000).toISOString() },
    { id: 6, userId: 7, modelId: 2, modelName: 'VocalSynth AI', mode: 'instrumental', prompt: '电影配乐风格', durationSec: 180, actualDurationSec: 175, costCredits: 540, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 21600000).toISOString(), completedAt: new Date(now - 21000000).toISOString() },
    { id: 7, userId: 3, modelId: 3, modelName: 'BeatMaster X', mode: 'instrumental', prompt: 'HIP-HOP节奏', durationSec: 60, actualDurationSec: 58, costCredits: 240, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 28800000).toISOString(), completedAt: new Date(now - 28200000).toISOString() },
    { id: 8, userId: 8, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '欢快的尤克里里', durationSec: 30, costCredits: 60, status: 'pending', isDeleted: false, createdAt: new Date(now - 600000).toISOString() },
    { id: 9, userId: 4, modelId: 2, modelName: 'VocalSynth AI', mode: 'song', prompt: '摇滚风格', lyrics: '燃烧吧，我的青春！', durationSec: 120, actualDurationSec: 120, costCredits: 360, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 43200000).toISOString(), completedAt: new Date(now - 42500000).toISOString() },
    { id: 10, userId: 9, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '古典吉他独奏', durationSec: 90, actualDurationSec: 88, costCredits: 180, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 54000000).toISOString(), completedAt: new Date(now - 53500000).toISOString() },
    { id: 11, userId: 2, modelId: 3, modelName: 'BeatMaster X', mode: 'instrumental', prompt: 'Lo-Fi 节奏', durationSec: 120, actualDurationSec: 118, costCredits: 480, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - dayMs).toISOString(), completedAt: new Date(now - dayMs + 120000).toISOString() },
    { id: 12, userId: 5, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '悲伤的大提琴', durationSec: 60, costCredits: 120, status: 'failed', errorMessage: 'API超时', isDeleted: false, createdAt: new Date(now - dayMs - 3600000).toISOString(), completedAt: new Date(now - dayMs - 3500000).toISOString() },
    { id: 13, userId: 7, modelId: 2, modelName: 'VocalSynth AI', mode: 'song', prompt: 'R&B情歌', lyrics: '你的微笑像阳光...', durationSec: 150, actualDurationSec: 148, costCredits: 450, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - dayMs - 7200000).toISOString(), completedAt: new Date(now - dayMs - 7000000).toISOString() },
    { id: 14, userId: 3, modelId: 1, modelName: 'SonicWave Pro', mode: 'instrumental', prompt: '海浪声背景音乐', durationSec: 180, actualDurationSec: 176, costCredits: 360, status: 'completed', audioUrl: '/sample-audio.mp3', isDeleted: false, createdAt: new Date(now - 2 * dayMs).toISOString(), completedAt: new Date(now - 2 * dayMs + 180000).toISOString() },
    { id: 15, userId: 6, modelId: 3, modelName: 'BeatMaster X', mode: 'instrumental', prompt: 'Trap 节拍', durationSec: 90, costCredits: 360, status: 'processing', isDeleted: false, createdAt: new Date(now - 120000).toISOString() },
  ] as GenerationTask[]);

  seedOnce(STORAGE_KEYS.orders, [
    { id: 1, orderNo: 'ORD202505191001', userId: 2, packageId: 2, amountCents: 3000, creditsBought: 600, bonusCredits: 50, status: 'success', paymentMethod: 'wechat', paidAt: new Date(now - 3 * dayMs).toISOString(), createdAt: new Date(now - 3 * dayMs - 60000).toISOString() },
    { id: 2, orderNo: 'ORD202505181002', userId: 3, packageId: 3, amountCents: 6000, creditsBought: 1500, bonusCredits: 200, status: 'success', paymentMethod: 'alipay', paidAt: new Date(now - 5 * dayMs).toISOString(), createdAt: new Date(now - 5 * dayMs - 120000).toISOString() },
    { id: 3, orderNo: 'ORD202505171003', userId: 4, packageId: 4, amountCents: 12000, creditsBought: 3000, bonusCredits: 500, status: 'success', paymentMethod: 'wechat', paidAt: new Date(now - 7 * dayMs).toISOString(), createdAt: new Date(now - 7 * dayMs - 30000).toISOString() },
    { id: 4, orderNo: 'ORD202505161004', userId: 7, packageId: 2, amountCents: 3000, creditsBought: 600, bonusCredits: 50, status: 'success', paymentMethod: 'alipay', paidAt: new Date(now - 10 * dayMs).toISOString(), createdAt: new Date(now - 10 * dayMs - 90000).toISOString() },
    { id: 5, orderNo: 'ORD202505151005', userId: 5, packageId: 1, amountCents: 600, creditsBought: 100, bonusCredits: 0, status: 'success', paymentMethod: 'wechat', paidAt: new Date(now - 12 * dayMs).toISOString(), createdAt: new Date(now - 12 * dayMs - 60000).toISOString() },
    { id: 6, orderNo: 'ORD202505141006', userId: 8, packageId: 1, amountCents: 600, creditsBought: 100, bonusCredits: 0, status: 'pending', paymentMethod: 'alipay', createdAt: new Date(now - 3600000).toISOString() },
    { id: 7, orderNo: 'ORD202505131007', userId: 9, packageId: 2, amountCents: 3000, creditsBought: 600, bonusCredits: 50, status: 'pending', paymentMethod: 'wechat', createdAt: new Date(now - 7200000).toISOString() },
    { id: 8, orderNo: 'ORD202505121008', userId: 2, packageId: 3, amountCents: 6000, creditsBought: 1500, bonusCredits: 200, status: 'failed', paymentMethod: 'alipay', createdAt: new Date(now - 8 * dayMs).toISOString() },
  ] as CreditOrder[]);

  seedOnce(STORAGE_KEYS.transactions, [
    { id: 1, userId: 2, amount: 650, balanceAfter: 650, type: 'purchase', description: '购买进阶套餐，赠送50积分', createdAt: new Date(now - 3 * dayMs).toISOString() },
    { id: 2, userId: 2, amount: -120, balanceAfter: 530, type: 'consumption', description: '音乐生成消耗 - SonicWave Pro', createdAt: new Date(now - 3600000).toISOString() },
    { id: 3, userId: 2, amount: -450, balanceAfter: 80, type: 'consumption', description: '音乐生成消耗 - VocalSynth AI', createdAt: new Date(now - 7200000).toISOString() },
    { id: 4, userId: 3, amount: 1700, balanceAfter: 1700, type: 'purchase', description: '购买专业套餐，赠送200积分', createdAt: new Date(now - 5 * dayMs).toISOString() },
    { id: 5, userId: 3, amount: -360, balanceAfter: 1340, type: 'consumption', description: '音乐生成消耗 - VocalSynth AI', createdAt: new Date(now - 7200000).toISOString() },
    { id: 6, userId: 3, amount: -240, balanceAfter: 1100, type: 'consumption', description: '音乐生成消耗 - BeatMaster X', createdAt: new Date(now - 28800000).toISOString() },
    { id: 7, userId: 4, amount: 3500, balanceAfter: 3500, type: 'purchase', description: '购买大师套餐，赠送500积分', createdAt: new Date(now - 7 * dayMs).toISOString() },
    { id: 8, userId: 4, amount: -360, balanceAfter: 3140, type: 'consumption', description: '音乐生成消耗 - BeatMaster X', createdAt: new Date(now - 10800000).toISOString() },
    { id: 9, userId: 1, amount: 100, balanceAfter: 9999, type: 'manual', description: '系统初始化赠送', createdAt: new Date(now - 30 * dayMs).toISOString() },
    { id: 10, userId: 6, amount: 100, balanceAfter: 100, type: 'purchase', description: '购买入门套餐', createdAt: new Date(now - 8 * dayMs).toISOString() },
    { id: 11, userId: 6, amount: -90, balanceAfter: 10, type: 'consumption', description: '音乐生成消耗 - SonicWave Pro', createdAt: new Date(now - 14400000).toISOString() },
    { id: 12, userId: 6, amount: 90, balanceAfter: 100, type: 'refund', description: '生成失败退款 - SonicWave Pro', createdAt: new Date(now - 14000000).toISOString() },
    { id: 13, userId: 7, amount: 650, balanceAfter: 650, type: 'purchase', description: '购买进阶套餐，赠送50积分', createdAt: new Date(now - 10 * dayMs).toISOString() },
    { id: 14, userId: 7, amount: -540, balanceAfter: 110, type: 'consumption', description: '音乐生成消耗 - VocalSynth AI', createdAt: new Date(now - 21600000).toISOString() },
    { id: 15, userId: 8, amount: 100, balanceAfter: 100, type: 'purchase', description: '购买入门套餐', createdAt: new Date(now - 12 * dayMs).toISOString() },
    { id: 16, userId: 9, amount: 100, balanceAfter: 100, type: 'initial', description: '新用户注册赠送100积分', createdAt: new Date(now - 5 * dayMs).toISOString() },
  ] as CreditTransaction[]);

  seedOnce(STORAGE_KEYS.logs, [
    { id: 1, adminId: 1, action: 'login', targetType: 'user', targetId: 1, details: { ip: '127.0.0.1' }, ip: '127.0.0.1', createdAt: new Date(now - 60000).toISOString() },
    { id: 2, adminId: 1, action: 'update', targetType: 'config', details: { key: 'initialCredits', from: 0, to: 100 }, ip: '127.0.0.1', createdAt: new Date(now - 180000).toISOString() },
    { id: 3, adminId: 1, action: 'create', targetType: 'model', targetId: 3, details: { name: 'BeatMaster X' }, ip: '127.0.0.1', createdAt: new Date(now - 360000).toISOString() },
    { id: 4, adminId: 1, action: 'toggle', targetType: 'user', targetId: 5, details: { active: false }, ip: '192.168.1.1', createdAt: new Date(now - 720000).toISOString() },
    { id: 5, adminId: 1, action: 'adjust', targetType: 'user', targetId: 3, details: { amount: 500, reason: '活动奖励' }, ip: '127.0.0.1', createdAt: new Date(now - 1440000).toISOString() },
    { id: 6, adminId: 1, action: 'delete', targetType: 'model', targetId: 4, details: { name: 'OldModel' }, ip: '127.0.0.1', createdAt: new Date(now - 2880000).toISOString() },
    { id: 7, adminId: 1, action: 'update', targetType: 'package', targetId: 2, details: { priceCents: { from: 2500, to: 3000 } }, ip: '10.0.0.1', createdAt: new Date(now - 5760000).toISOString() },
    { id: 8, adminId: 1, action: 'create', targetType: 'order', targetId: 1, details: { userId: 2, amount: 6000 }, ip: '127.0.0.1', createdAt: new Date(now - 8640000).toISOString() },
    { id: 9, adminId: 1, action: 'toggle', targetType: 'model', targetId: 1, details: { active: false }, ip: '192.168.1.1', createdAt: new Date(now - 17280000).toISOString() },
    { id: 10, adminId: 1, action: 'login', targetType: 'user', targetId: 1, details: { ip: '127.0.0.1' }, ip: '127.0.0.1', createdAt: new Date(now - 86400000).toISOString() },
    { id: 11, adminId: 1, action: 'update', targetType: 'model', targetId: 2, details: { pricePerSecond: { from: 2, to: 3 } }, ip: '127.0.0.1', createdAt: new Date(now - 2 * dayMs).toISOString() },
    { id: 12, adminId: 1, action: 'create', targetType: 'user', targetId: 10, details: { username: '测试账号' }, ip: '10.0.0.1', createdAt: new Date(now - 2 * dayMs).toISOString() },
  ] as AdminLog[]);
}

initMockData();

export const mockApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(600);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    let user = users.find((u) => u.email === email);

    if (email === 'admin@example.com' && password === 'admin123') {
      user = user!;
    } else if (!user) {
      throw { success: false, error: '用户不存在' };
    } else if (password !== '123456') {
      throw { success: false, error: '密码错误' };
    }

    if (!user.isActive) throw { success: false, error: '账号已被禁用' };

    const token = 'mock_jwt_' + user.id + '_' + Date.now();
    return { user, token };
  },

  async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
    await delay(600);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    if (users.find((u) => u.email === email)) throw { success: false, error: '邮箱已被注册' };
    if (users.find((u) => u.username === username)) throw { success: false, error: '用户名已被使用' };

    const configs = getStore<Record<string, number>>(STORAGE_KEYS.configs, {});
    const initialCredits = configs.initialCredits || 0;

    const newUser: User = {
      id: generateId(), username, email, credits: initialCredits,
      totalCreditsEarned: initialCredits, totalCreditsSpent: 0,
      isActive: true, isAdmin: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    setStore(STORAGE_KEYS.users, [...users, newUser]);

    if (initialCredits > 0) {
      addTransaction(newUser.id, initialCredits, 'initial', `新用户注册赠送${initialCredits}积分`);
    }

    const token = 'mock_jwt_' + newUser.id + '_' + Date.now();
    return { user: newUser, token };
  },

  async getProfile(userId: number): Promise<User> {
    await delay(300);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw { success: false, error: '用户不存在' };
    return { ...user };
  },

  async updateProfile(userId: number, data: Partial<User>): Promise<User> {
    await delay(300);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw { success: false, error: '用户不存在' };
    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    setStore(STORAGE_KEYS.users, users);
    return { ...users[idx] };
  },

  async getModels(mode?: string): Promise<AIModel[]> {
    await delay(300);
    const models = getStore<AIModel[]>(STORAGE_KEYS.models, []);
    const active = models.filter((m) => m.isActive);
    if (!mode) return active;
    return active.filter((m) => m.supportedModes.includes(mode as 'instrumental' | 'song'));
  },

  async submitTask(params: { userId: number; modelId: number; mode: string; prompt?: string; lyrics?: string; durationSec: number }): Promise<GenerationTask> {
    await delay(400);

    const models = getStore<AIModel[]>(STORAGE_KEYS.models, []);
    const model = models.find((m) => m.id === params.modelId);
    if (!model) throw { success: false, error: '模型不存在' };

    const costCredits = Math.ceil(params.durationSec * model.pricePerSecond);

    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const userIdx = users.findIndex((u) => u.id === params.userId);
    if (userIdx === -1) throw { success: false, error: '用户不存在' };
    if (users[userIdx].credits < costCredits) throw { success: false, error: '积分不足' };

    users[userIdx].credits -= costCredits;
    users[userIdx].totalCreditsSpent += costCredits;
    setStore(STORAGE_KEYS.users, users);

    const task: GenerationTask = {
      id: generateId(),
      userId: params.userId,
      modelId: params.modelId,
      modelName: model.name,
      mode: params.mode as 'instrumental' | 'song',
      prompt: params.prompt,
      lyrics: params.lyrics,
      durationSec: params.durationSec,
      costCredits,
      status: 'processing',
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    const tasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
    setStore(STORAGE_KEYS.tasks, [task, ...tasks]);

    addTransaction(params.userId, -costCredits, 'consumption', `音乐生成消耗 - ${model.name}`);

    setTimeout(() => {
      const currentTasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
      const taskIdx = currentTasks.findIndex((t) => t.id === task.id);
      if (taskIdx !== -1) {
        const success = Math.random() > 0.15;
        if (success) {
          currentTasks[taskIdx].status = 'completed';
          currentTasks[taskIdx].actualDurationSec = Math.max(5, params.durationSec - Math.floor(Math.random() * 5));
          currentTasks[taskIdx].audioUrl = '/sample-audio.mp3';
          currentTasks[taskIdx].completedAt = new Date().toISOString();
        } else {
          currentTasks[taskIdx].status = 'failed';
          currentTasks[taskIdx].errorMessage = 'AI模型生成失败，请稍后重试';
          currentTasks[taskIdx].completedAt = new Date().toISOString();

          const refundUsers = getStore<User[]>(STORAGE_KEYS.users, []);
          const ruIdx = refundUsers.findIndex((u) => u.id === params.userId);
          if (ruIdx !== -1) {
            refundUsers[ruIdx].credits += costCredits;
            refundUsers[ruIdx].totalCreditsSpent -= costCredits;
            setStore(STORAGE_KEYS.users, refundUsers);
            addTransaction(params.userId, costCredits, 'refund', `生成失败退款 - ${model.name}`);
          }
        }
        setStore(STORAGE_KEYS.tasks, currentTasks);
      }
    }, 3000 + Math.random() * 4000);

    return task;
  },

  async getTask(taskId: number): Promise<GenerationTask> {
    await delay(200);
    const tasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw { success: false, error: '任务不存在' };
    return { ...task };
  },

  async getHistory(userId: number, page: number = 1, pageSize: number = 12): Promise<{ items: GenerationTask[]; total: number }> {
    await delay(300);
    const tasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
    const userTasks = tasks.filter((t) => t.userId === userId && !t.isDeleted);
    const start = (page - 1) * pageSize;
    return {
      items: userTasks.slice(start, start + pageSize),
      total: userTasks.length,
    };
  },

  async deleteTask(taskId: number): Promise<void> {
    await delay(200);
    const tasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].isDeleted = true;
      setStore(STORAGE_KEYS.tasks, tasks);
    }
  },

  async getBalance(userId: number): Promise<number> {
    await delay(200);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const user = users.find((u) => u.id === userId);
    return user?.credits ?? 0;
  },

  async getTransactions(userId: number): Promise<CreditTransaction[]> {
    await delay(300);
    return getStore<CreditTransaction[]>(STORAGE_KEYS.transactions, [])
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPackages(): Promise<CreditPackage[]> {
    await delay(200);
    return getStore<CreditPackage[]>(STORAGE_KEYS.packages, []).filter((p) => p.isActive);
  },

  async createOrder(userId: number, params: { packageId?: number; paymentMethod: string }): Promise<CreditOrder> {
    await delay(400);
    const packages = getStore<CreditPackage[]>(STORAGE_KEYS.packages, []);

    let amountCents: number;
    let creditsBought: number;
    let bonusCredits = 0;

    if (params.packageId) {
      const pkg = packages.find((p) => p.id === params.packageId);
      if (!pkg) throw { success: false, error: '套餐不存在' };
      amountCents = pkg.priceCents;
      creditsBought = pkg.credits;
      bonusCredits = pkg.bonusCredits;
    } else {
      amountCents = 600;
      creditsBought = 100;
    }

    const order: CreditOrder = {
      id: generateId(), orderNo: generateOrderNo(), userId, packageId: params.packageId,
      amountCents, creditsBought, bonusCredits,
      status: 'pending', paymentMethod: params.paymentMethod as 'wechat' | 'alipay',
      createdAt: new Date().toISOString(),
    };

    const orders = getStore<CreditOrder[]>(STORAGE_KEYS.orders, []);
    setStore(STORAGE_KEYS.orders, [order, ...orders]);

    return order;
  },

  async payOrder(orderId: number, userId: number): Promise<CreditOrder> {
    await delay(1000);

    const orders = getStore<CreditOrder[]>(STORAGE_KEYS.orders, []);
    const orderIdx = orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) throw { success: false, error: '订单不存在' };

    orders[orderIdx].status = 'success';
    orders[orderIdx].paidAt = new Date().toISOString();
    setStore(STORAGE_KEYS.orders, orders);

    const totalCredits = orders[orderIdx].creditsBought + orders[orderIdx].bonusCredits;
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const userIdx = users.findIndex((u) => u.id === userId);
    if (userIdx !== -1) {
      users[userIdx].credits += totalCredits;
      users[userIdx].totalCreditsEarned += totalCredits;
      setStore(STORAGE_KEYS.users, users);
    }

    addTransaction(userId, totalCredits, 'purchase', `购买${orders[orderIdx].creditsBought}积分` + (orders[orderIdx].bonusCredits > 0 ? `，赠送${orders[orderIdx].bonusCredits}积分` : ''));

    return { ...orders[orderIdx] };
  },

  async getDashboard(): Promise<DashboardStats> {
    await delay(300);
    const tasks = getStore<GenerationTask[]>(STORAGE_KEYS.tasks, []);
    const today = new Date().toDateString();
    const todayTasks = tasks.filter((t) => new Date(t.createdAt).toDateString() === today);

    const modelUsageMap: Record<string, number> = {};
    tasks.forEach((t) => {
      modelUsageMap[t.modelName] = (modelUsageMap[t.modelName] || 0) + 1;
    });

    return {
      todayGenerations: todayTasks.length,
      todayRevenue: Math.floor(Math.random() * 50000) + 10000,
      activeUsers: Math.floor(Math.random() * 30) + 5,
      modelUsage: Object.entries(modelUsageMap).map(([name, count]) => ({ name, count })),
    };
  },

  async getAdminModels(): Promise<AIModel[]> {
    await delay(300);
    return getStore<AIModel[]>(STORAGE_KEYS.models, []);
  },

  async createModel(data: Partial<AIModel>): Promise<AIModel> {
    await delay(400);
    const models = getStore<AIModel[]>(STORAGE_KEYS.models, []);
    const newModel: AIModel = {
      id: generateId(), name: data.name || '', code: data.code || '',
      description: data.description || '', supportedModes: data.supportedModes || ['instrumental'],
      supportsLyrics: data.supportsLyrics || false, maxDurationSec: data.maxDurationSec || 60,
      pricePerSecond: data.pricePerSecond || 1, pricePerSong: data.pricePerSong ?? 0, tags: data.tags || [],
      apiConfig: data.apiConfig || {}, adapterName: data.adapterName || null,
      maxConcurrent: data.maxConcurrent || 5, isActive: true, consecutiveFailures: 0,
    };
    setStore(STORAGE_KEYS.models, [...models, newModel]);
    return newModel;
  },

  async updateModel(id: number, data: Partial<AIModel>): Promise<AIModel> {
    await delay(300);
    const models = getStore<AIModel[]>(STORAGE_KEYS.models, []);
    const idx = models.findIndex((m) => m.id === id);
    if (idx === -1) throw { success: false, error: '模型不存在' };
    models[idx] = { ...models[idx], ...data };
    setStore(STORAGE_KEYS.models, models);
    return { ...models[idx] };
  },

  async deleteModel(id: number): Promise<void> {
    await delay(200);
    const models = getStore<AIModel[]>(STORAGE_KEYS.models, []);
    setStore(STORAGE_KEYS.models, models.filter((m) => m.id !== id));
  },

  async getAdminPackages(): Promise<CreditPackage[]> {
    await delay(200);
    return getStore<CreditPackage[]>(STORAGE_KEYS.packages, []);
  },

  async createPackage(data: Partial<CreditPackage>): Promise<CreditPackage> {
    await delay(300);
    const packages = getStore<CreditPackage[]>(STORAGE_KEYS.packages, []);
    const newPkg: CreditPackage = {
      id: generateId(), name: data.name || '', priceCents: data.priceCents || 0,
      credits: data.credits || 0, bonusCredits: data.bonusCredits || 0,
      isRecommended: data.isRecommended || false, isActive: data.isActive ?? true,
    };
    setStore(STORAGE_KEYS.packages, [...packages, newPkg]);
    return newPkg;
  },

  async updatePackage(id: number, data: Partial<CreditPackage>): Promise<CreditPackage> {
    await delay(300);
    const packages = getStore<CreditPackage[]>(STORAGE_KEYS.packages, []);
    const idx = packages.findIndex((p) => p.id === id);
    if (idx === -1) throw { success: false, error: '套餐不存在' };
    packages[idx] = { ...packages[idx], ...data };
    setStore(STORAGE_KEYS.packages, packages);
    return { ...packages[idx] };
  },

  async deletePackage(id: number): Promise<void> {
    await delay(200);
    const packages = getStore<CreditPackage[]>(STORAGE_KEYS.packages, []);
    setStore(STORAGE_KEYS.packages, packages.filter((p) => p.id !== id));
  },

  async getAdminOrders(): Promise<CreditOrder[]> {
    await delay(300);
    return getStore<CreditOrder[]>(STORAGE_KEYS.orders, []);
  },

  async completeOrder(orderId: number, userId: number): Promise<CreditOrder> {
    return this.payOrder(orderId, userId);
  },

  async getAdminUsers(): Promise<User[]> {
    await delay(300);
    return getStore<User[]>(STORAGE_KEYS.users, []);
  },

  async adjustCredits(userId: number, amount: number, reason: string): Promise<User> {
    await delay(300);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw { success: false, error: '用户不存在' };
    users[idx].credits += amount;
    if (amount > 0) users[idx].totalCreditsEarned += amount;
    else users[idx].totalCreditsSpent += Math.abs(amount);
    setStore(STORAGE_KEYS.users, users);

    addTransaction(userId, amount, 'manual', reason);
    return { ...users[idx] };
  },

  async toggleUserStatus(userId: number): Promise<User> {
    await delay(200);
    const users = getStore<User[]>(STORAGE_KEYS.users, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw { success: false, error: '用户不存在' };
    users[idx].isActive = !users[idx].isActive;
    setStore(STORAGE_KEYS.users, users);
    return { ...users[idx] };
  },

  async getConfigs(): Promise<Record<string, unknown>> {
    await delay(200);
    return { ...getStore<Record<string, unknown>>(STORAGE_KEYS.configs, {}) };
  },

  async updateConfigs(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    await delay(300);
    const configs = getStore<Record<string, unknown>>(STORAGE_KEYS.configs, {});
    const merged = { ...configs, ...data };
    setStore(STORAGE_KEYS.configs, merged);
    return merged;
  },

  async getAdminLogs(): Promise<AdminLog[]> {
    await delay(300);
    return getStore<AdminLog[]>(STORAGE_KEYS.logs, []);
  },
};

function addTransaction(userId: number, amount: number, type: string, description: string): void {
  const users = getStore<User[]>(STORAGE_KEYS.users, []);
  const user = users.find((u) => u.id === userId);
  const balanceAfter = user?.credits ?? 0;

  const tx: CreditTransaction = {
    id: generateId(), userId, amount, balanceAfter,
    type: type as CreditTransaction['type'], description,
    createdAt: new Date().toISOString(),
  };

  const transactions = getStore<CreditTransaction[]>(STORAGE_KEYS.transactions, []);
  setStore(STORAGE_KEYS.transactions, [tx, ...transactions]);
}