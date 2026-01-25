
import { User, UserRole, TestResult, Question, SystemConfig, Resource } from '../types';
import { DEFAULT_BRANDING, MATH_LEVELS, TELUGU_STAGES } from '../constants';
import { supabase } from './supabase';
import { db, MasterWord } from './db';

const STORAGE_KEYS = {
  USERS: 'cm_users',
  RESULTS: 'cm_results',
  CONFIG: 'cm_config',
  RESOURCES: 'cm_resources',
  ACTIVE_USER: 'cm_active_user',
  GEN_LOCK: 'cm_generation_lock',
  LAST_SYNC: 'cm_last_sync'
};

let isSyncingInternal = false;

/**
 * Normalizes user data from any source (Supabase snake_case or Local camelCase)
 */
export const normalizeUser = (u: any): User => {
  if (!u) return u;
  
  let modules: string[] = [];
  
  // Try all possible module field names
  const fromSnake = Array.isArray(u.allowed_modules) ? u.allowed_modules : [];
  const fromCamel = Array.isArray(u.allowedModules) ? u.allowedModules : [];
  
  if (fromSnake.length > 0) {
    modules = fromSnake;
  } else if (fromCamel.length > 0) {
    modules = fromCamel;
  } else if (typeof u.allowed_modules === 'string') {
    try { modules = JSON.parse(u.allowed_modules); } catch(e) { modules = []; }
  } else if (typeof u.allowedModules === 'string') {
    try { modules = JSON.parse(u.allowedModules); } catch(e) { modules = []; }
  }

  return {
    ...u,
    id: u.id,
    username: u.username?.toUpperCase() || '',
    fullName: u.fullName || u.full_name || 'User',
    role: u.role || UserRole.STUDENT,
    active: u.active ?? true,
    allowedModules: Array.isArray(modules) ? modules : [],
    institute: u.institute || u.institute_name || '',
    school: u.school || u.school_branch || '',
    assignedTeacherId: u.assignedTeacherId || u.assigned_teacher_id || '',
    teacherNotes: u.teacherNotes || u.teacher_notes || '',
    avatarUrl: u.avatarUrl || u.avatar_url || ''
  };
};

export const mockDb = {
  getUsers: (): User[] => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      return raw.map(normalizeUser);
    } catch (e) {
      return [];
    }
  },

  getUserProfile: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data ? normalizeUser(data) : null;
    } catch (e) {
      console.error("Failed to fetch user profile:", e);
      return null;
    }
  },
  
  saveUser: async (user: User) => {
    const cleanUser = normalizeUser(user);
    
    let users = mockDb.getUsers();
    users = users.filter(u => u.username !== cleanUser.username && u.id !== cleanUser.id);
    users.push(cleanUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    try {
      const dbPayload = {
        id: cleanUser.id,
        username: cleanUser.username,
        role: cleanUser.role,
        fullName: cleanUser.fullName,
        email: cleanUser.email || null,
        password: cleanUser.password || null,
        active: cleanUser.active,
        allowed_modules: cleanUser.allowedModules,
        institute: cleanUser.institute || null,
        school: cleanUser.school || null,
        assigned_teacher_id: cleanUser.assignedTeacherId || null,
        // Fix: Changed teacher_notes property access to match User interface (teacherNotes)
        teacher_notes: cleanUser.teacherNotes || null,
        avatar_url: cleanUser.avatarUrl || null
      };
      
      await supabase.from('users').upsert(dbPayload);
    } catch (e) {
      console.error("Cloud User Sync Failure:", e);
    }
  },

  getResources: (): Resource[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.RESOURCES) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveResource: (resource: Resource) => {
    const resources = mockDb.getResources();
    const existingIdx = resources.findIndex(r => r.id === resource.id);
    if (existingIdx >= 0) resources[existingIdx] = resource;
    else resources.push(resource);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
  },

  deleteResource: (id: string) => {
    const resources = mockDb.getResources().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
  },

  getResults: (userId?: string): TestResult[] => {
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]') as TestResult[];
    return userId ? results.filter(r => r.userId === userId) : results;
  },

  saveResult: async (result: TestResult) => {
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]') as TestResult[];
    results.push(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));

    try {
      await supabase.from('test_results').insert(result);
    } catch (e) {
      console.error("Supabase Result Sync Failed:", e);
    }

    const config = mockDb.getConfig();
    if (config.googleSheetsUrl && result.wordScores) {
      const activeUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) || '{}');
      try {
        await fetch(config.googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'saveResult',
            code: activeUser.username || 'GUEST',
            name: activeUser.fullName || 'Unknown',
            timestamp: result.timestamp,
            levelName: result.level,
            stage: result.level.split('-')[1] || '1',
            gap: result.speedGap || 'N/A',
            set: result.testId,
            marks: result.correctAnswers,
            total: result.totalQuestions,
            wordScores: result.wordScores
          })
        });
      } catch (e) {
        console.error("Google Sheets Webhook Failed:", e);
      }
    }
  },

  getQuestions: async (levelId?: string): Promise<Question[]> => {
    if (levelId) return await db.getQuestionsByLevel(levelId);
    return await db.getAllQuestions();
  },

  saveQuestions: async (newQuestions: Question[]) => {
    if (newQuestions.length === 0) return;
    try {
      await db.saveQuestions(newQuestions);
      const BATCH_SIZE = 1000;
      for (let i = 0; i < newQuestions.length; i += BATCH_SIZE) {
        const batch = newQuestions.slice(i, i + BATCH_SIZE);
        await supabase.from('questions').upsert(batch);
      }
    } catch (e) {
      console.error("Supabase Question Sync Failed:", e);
    }
  },

  syncMasterRegistry: async (gasUrl: string, onProgress?: (msg: string) => void) => {
    let allMasterWords: MasterWord[] = [];
    
    for (let i = 1; i <= 18; i++) {
      const stageId = `stage-${i}`;
      if (onProgress) onProgress(`Fetching Registry: ${stageId.toUpperCase()}...`);
      
      const response = await fetch(`${gasUrl}?action=getQuestions&stage=${i}`);
      const data = await response.json();
      
      if (data.error) {
        console.warn(`Registry sync error for stage ${i}:`, data.error);
        continue;
      }

      const stageWords: MasterWord[] = data.questions.map((w: any, idx: number) => ({
        id: `${stageId}-${(idx + 1).toString().padStart(3, '0')}`,
        stage: stageId,
        telugu: w.text,
        // Mapping from Google Apps Script 'definition' and 'context'
        english: w.definition || w.english || '', 
        hindi: w.context || w.hindi || '' 
      }));

      allMasterWords = [...allMasterWords, ...stageWords];
    }

    if (allMasterWords.length === 0) throw new Error("Could not fetch any words from Registry.");

    await db.saveMasterWords(allMasterWords);
    
    try {
      const BATCH = 500;
      for (let i = 0; i < allMasterWords.length; i += BATCH) {
        await supabase.from('master_words').upsert(allMasterWords.slice(i, i + BATCH));
      }
    } catch (e) {
      console.error("Supabase Master Backup Failed:", e);
    }

    return allMasterWords.length;
  },

  generateSetsFromRegistry: async (stageId: string) => {
    const rawWords = await db.getMasterWordsByStage(stageId);
    if (rawWords.length === 0) throw new Error(`No master registry data for ${stageId}`);

    const sortedWords = [...rawWords].sort((a, b) => a.id.localeCompare(b.id));

    const generatedSets: Question[] = [];
    const TOTAL_SETS = 50;
    const TOTAL_BLOCKS = 40;
    const WORDS_PER_BLOCK = 5;

    for (let setNum = 1; setNum <= TOTAL_SETS; setNum++) {
      const testIdStr = setNum.toString();
      
      for (let blockIdx = 0; blockIdx < TOTAL_BLOCKS; blockIdx++) {
        const blockStart = blockIdx * WORDS_PER_BLOCK;
        const blockEnd = blockStart + WORDS_PER_BLOCK;
        const block = sortedWords.slice(blockStart, blockEnd);
        
        if (block.length > 0) {
          const randomIndex = Math.floor(Math.random() * block.length);
          const selectedWord = block[randomIndex];
          
          const englishPrompt = selectedWord.english || 'No Prompt';
          const hindiPrompt = selectedWord.hindi || '';
          
          generatedSets.push({
            id: `telugu-${stageId.toLowerCase()}-t${testIdStr}-q${blockIdx + 1}`,
            level: stageId.toLowerCase(),
            testId: testIdStr,
            questionNum: blockIdx + 1,
            subQuestion: '',
            text: hindiPrompt ? `${englishPrompt} - ${hindiPrompt}` : englishPrompt,
            answer: selectedWord.telugu,
            definition: selectedWord.english,
            context: selectedWord.hindi
          });
        }
      }
    }

    await mockDb.saveQuestions(generatedSets);
    return generatedSets.length;
  },

  syncTeluguFromSheets: async (stageId: string, gasUrl: string) => {
    const stageNum = stageId.split('-')[1];
    const response = await fetch(`${gasUrl}?action=getQuestions&stage=${stageNum}`);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);
    
    const stageWords: MasterWord[] = data.questions.map((w: any, idx: number) => ({
      id: `${stageId.toLowerCase()}-${(idx + 1).toString().padStart(3, '0')}`,
      stage: stageId.toLowerCase(),
      telugu: w.text,
      // Mapping from Google Apps Script 'definition' and 'context'
      english: w.definition || w.english || '',
      hindi: w.context || w.hindi || ''
    }));

    await db.saveMasterWords(stageWords);
    return await mockDb.generateSetsFromRegistry(stageId);
  },

  clearQuestionsByLevel: async (levelId: string) => {
    const lowerLevelId = levelId.toLowerCase();
    await db.clearLevel(lowerLevelId);
    try {
      await supabase.from('questions').delete().eq('level', lowerLevelId);
    } catch (e) {
      console.error("Supabase clear error:", e);
    }
  },

  getConfig: (): SystemConfig => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!saved) return DEFAULT_BRANDING;
    try {
      const parsed = JSON.parse(saved);
      return { 
        ...DEFAULT_BRANDING, 
        ...parsed,
        mathImageUrl: DEFAULT_BRANDING.mathImageUrl,
        teluguImageUrl: DEFAULT_BRANDING.teluguImageUrl,
        promptImageUrl: DEFAULT_BRANDING.promptImageUrl
      };
    } catch (e) {
      return DEFAULT_BRANDING;
    }
  },

  updateConfig: (config: SystemConfig): boolean => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    supabase.from('system_config').upsert({ id: 'global', ...config }).then();
    return true;
  },

  syncFromSupabase: async (force = false) => {
    if (isSyncingInternal) return;

    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!force && lastSync && (Date.now() - new Date(lastSync).getTime() < oneDay)) {
      const localCount = (await db.getAllQuestions()).length;
      if (localCount > 100) return;
    }

    isSyncingInternal = true;
    try {
      const allLevels = [
        ...MATH_LEVELS.map(l => l.id.toLowerCase()),
        ...TELUGU_STAGES.map(s => s.id.toLowerCase())
      ];

      for (const levelId of allLevels) {
        let allData: any[] = [];
        let from = 0, to = 999, hasMore = true;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('level', levelId)
            .range(from, to);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < 1000) hasMore = false;
            else { from += 1000; to += 1000; }
          } else hasMore = false;
        }
        
        if (allData.length > 0) {
          await db.saveQuestions(allData);
        }
      }
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (e) {
      console.warn("Offline Sync Note: Using local cache only.", e);
    } finally {
      isSyncingInternal = false;
    }
  },

  init: async () => {
    const allQs = await db.getAllQuestions();
    if (allQs.length === 0) {
      await mockDb.syncFromSupabase(true);
    }
  }
};
