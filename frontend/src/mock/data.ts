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

function initMockData(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.models)) {
    setStore(STORAGE_KEYS.models, [
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
    ] as AIModel[]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.packages)) {
    setStore(STORAGE_KEYS.packages, [
      { id: 1, name: '入门套餐', priceCents: 600, credits: 100, bonusCredits: 0, isRecommended: false, isActive: true },
      { id: 2, name: '进阶套餐', priceCents: 3000, credits: 600, bonusCredits: 50, isRecommended: true, isActive: true },
      { id: 3, name: '专业套餐', priceCents: 6000, credits: 1500, bonusCredits: 200, isRecommended: false, isActive: true },
      { id: 4, name: '大师套餐', priceCents: 12000, credits: 3000, bonusCredits: 500, isRecommended: false, isActive: true },
    ] as CreditPackage[]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.configs)) {
    setStore(STORAGE_KEYS.configs, {
      initialCredits: 0,
      maxConcurrent: 3,
      autoRefund: true,
      creditPricePerUnit: 0.06,
    });
  }

  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    const adminUser: User = {
      id: 1, username: 'admin', email: 'admin@example.com',
      credits: 9999, totalCreditsEarned: 0, totalCreditsSpent: 0,
      isActive: true, isAdmin: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setStore(STORAGE_KEYS.users, [adminUser]);
  }

  if (!localStorage.getItem(STORAGE_KEYS.tasks)) setStore(STORAGE_KEYS.tasks, [] as GenerationTask[]);
  if (!localStorage.getItem(STORAGE_KEYS.transactions)) setStore(STORAGE_KEYS.transactions, [] as CreditTransaction[]);
  if (!localStorage.getItem(STORAGE_KEYS.orders)) setStore(STORAGE_KEYS.orders, [] as CreditOrder[]);
  if (!localStorage.getItem(STORAGE_KEYS.logs)) setStore(STORAGE_KEYS.logs, [] as AdminLog[]);
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