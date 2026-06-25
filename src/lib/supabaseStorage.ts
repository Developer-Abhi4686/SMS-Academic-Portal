import { createClient } from '../../utils/supabase/client';

const supabase = createClient();

// Helper to check if a table query failed due to "table not found" / "relation does not exist"
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  const code = error.code || '';
  return msg.includes('relation') && msg.includes('does not exist') || code === '42P01';
}

// Low-level LocalStorage Fallback Helpers
const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`school_portal_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setLocal = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(`school_portal_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
};

// Helper to parse class and section which may be combined as "IX-D" or separate
function parseClassAndSection(userClass: string, section: string) {
  let selectedClass = (userClass || '').trim().toUpperCase();
  let selectedSection = (section || '').trim().toUpperCase();

  if (selectedClass.includes('-')) {
    const parts = selectedClass.split('-');
    selectedClass = parts[0].trim().toUpperCase();
    selectedSection = parts[1].trim().toUpperCase();
  }
  return { selectedClass, selectedSection };
}

// --------------------------------------------------
// STUDENTS TABLE OPERATIONS
// --------------------------------------------------
export interface SupabaseStudent {
  id: string;
  name: string;
  class: string;
  section: string;
}

export const supabaseStorage = {
  getStudents: async (userClass: string, section: string): Promise<SupabaseStudent[]> => {
    try {
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      
      console.log('Retrieving students from Supabase:', {
        classColumnFilter: selectedClass,
        sectionColumnFilter: selectedSection
      });

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection);

      if (error) {
        if (isTableMissingError(error)) {
          console.warn("Supabase 'students' table not found, fallback to local storage");
          return getLocal<SupabaseStudent>('students').filter(
            s => s.class === selectedClass && s.section === selectedSection
          );
        }
        throw error;
      }

      return (data || []).map((s: any) => ({
        id: String(s.id),
        name: s.name,
        class: s.class,
        section: s.section
      }));
    } catch (err) {
      console.error('Error fetching students from Supabase:', err);
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      // Fallback
      return getLocal<SupabaseStudent>('students').filter(
        s => s.class === selectedClass && s.section === selectedSection
      );
    }
  },

  addStudent: async (name: string, userClass: string, section: string): Promise<SupabaseStudent> => {
    try {
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      const { data, error } = await supabase
        .from('students')
        .insert({ name, class: selectedClass, section: selectedSection })
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          const fresh: SupabaseStudent = {
            id: `local-${Date.now()}`,
            name,
            class: selectedClass,
            section: selectedSection
          };
          const all = getLocal<SupabaseStudent>('students');
          setLocal('students', [...all, fresh]);
          return fresh;
        }
        throw error;
      }

      return {
        id: String(data.id),
        name: data.name,
        class: data.class,
        section: data.section
      };
    } catch (err) {
      console.error('Error inserting student:', err);
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      const fresh: SupabaseStudent = {
        id: `local-${Date.now()}`,
        name,
        class: selectedClass,
        section: selectedSection
      };
      const all = getLocal<SupabaseStudent>('students');
      setLocal('students', [...all, fresh]);
      return fresh;
    }
  },

  deleteStudent: async (id: string): Promise<boolean> => {
    if (id.startsWith('local-')) {
      const all = getLocal<SupabaseStudent>('students');
      setLocal('students', all.filter(s => s.id !== id));
      return true;
    }
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) {
        if (isTableMissingError(error)) {
          const all = getLocal<SupabaseStudent>('students');
          setLocal('students', all.filter(s => s.id !== id));
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      const all = getLocal<SupabaseStudent>('students');
      setLocal('students', all.filter(s => s.id !== id));
      return true;
    }
  },

  // --------------------------------------------------
  // ATTENDANCE OPERATIONS
  // --------------------------------------------------
  getAttendance: async (userClass: string, section: string, date: string): Promise<any | null> => {
    try {
      const students = await supabaseStorage.getStudents(userClass, section);
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);

      // Query the 'attendance' table
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection)
        .eq('date', date);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const records: Record<string, 'P' | 'A' | 'L'> = {};
        data.forEach((row: any) => {
          const matchedStudent = students.find(
            s => s.name.trim().toLowerCase() === row.student_name.trim().toLowerCase()
          );
          if (matchedStudent) {
            let statusChar: 'P' | 'A' | 'L' = 'A';
            if (row.status === 'Present') {
              statusChar = 'P';
            } else if (row.status === 'Late') {
              statusChar = 'L';
            } else if (row.status === 'Absent') {
              statusChar = 'A';
            }
            records[matchedStudent.id] = statusChar;
          }
        });
        return { records };
      }

      // If no database data found, fallback to local storage
      const all = getLocal<any>('attendance');
      const foundLocal = all.find(
        a => a.class === selectedClass && a.section === selectedSection && a.date === date
      );
      if (foundLocal) {
        return foundLocal;
      }
      return null;
    } catch (err) {
      console.error('Error in getAttendance:', err);
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      const all = getLocal<any>('attendance');
      return all.find(
        a => a.class === selectedClass && a.section === selectedSection && a.date === date
      ) || null;
    }
  },

  saveAttendance: async (userClass: string, section: string, date: string, records: Record<string, 'P' | 'A' | 'L'>): Promise<void> => {
    const studentIds = Object.keys(records);
    if (studentIds.length === 0) return;

    const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);

    try {
      // 1. Try deleting existing rows in the 'attendance' table to prevent duplicates
      // We wrap this delete operation in a try/catch block because if DELETE policy is missing under RLS,
      // it might fail, and we want to try to insert anyway.
      try {
        const { error: deleteErr } = await supabase
          .from('attendance')
          .delete()
          .eq('class', selectedClass)
          .eq('section', selectedSection)
          .eq('date', date);
        if (deleteErr) {
          console.warn('Could not clear older attendance records via delete:', deleteErr);
        }
      } catch (clearErr) {
        console.warn('Failed to clear older attendance records:', clearErr);
      }

      // 2. Fetch students to map student IDs to names
      const students = await supabaseStorage.getStudents(userClass, section);

      // 3. Map records to insertion rows matching the exact DB schema
      const rowsToInsert = Object.entries(records).map(([studentId, status]) => {
        const student = students.find(s => s.id === studentId);
        const studentName = student ? student.name : 'Unknown Student';
        
        let statusStr = 'Absent';
        if (status === 'P' || status === 'L') statusStr = 'Present';
        else statusStr = 'Absent';

        return {
          student_name: studentName,
          class: selectedClass,
          section: selectedSection,
          status: statusStr,
          date
        };
      });

      // 4. Insert into the database and throw error if it fails
      const { error: insertErr } = await supabase
        .from('attendance')
        .insert(rowsToInsert);

      if (insertErr) {
        throw insertErr;
      }
      
      console.log('Successfully saved attendance to database.');
    } catch (err) {
      console.error("Failed saving to database 'attendance' table, falling back to localStorage:", err);
      
      // Save to localStorage as a robust offline fallback
      const all = getLocal<any>('attendance');
      const filtered = all.filter(a => !(a.class === selectedClass && a.section === selectedSection && a.date === date));
      const localPayload = {
        class: selectedClass,
        section: selectedSection,
        date,
        records,
        updatedAt: new Date().toISOString()
      };
      setLocal('attendance', [...filtered, { id: `local-${Date.now()}`, ...localPayload }]);
      
      // Re-throw so that the caller is aware that the cloud DB save failed
      throw err;
    }
  },

  // --------------------------------------------------
  // MEMORY BOX OPERATIONS
  // --------------------------------------------------
  getMemories: async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          return getLocal<any>('memories').filter(m => m.userId === userId);
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Error reading memories from Supabase:', err);
      return getLocal<any>('memories').filter(m => m.userId === userId);
    }
  },

  addMemory: async (userId: string, type: string, title: string, content: string): Promise<any> => {
    const payload = {
      userId,
      type,
      title,
      content,
      createdAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('memories')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          const fresh = { id: `local-${Date.now()}`, ...payload };
          const all = getLocal<any>('memories');
          setLocal('memories', [fresh, ...all]);
          return fresh;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error inserting memory:', err);
      const fresh = { id: `local-${Date.now()}`, ...payload };
      const all = getLocal<any>('memories');
      setLocal('memories', [fresh, ...all]);
      return fresh;
    }
  },

  deleteMemory: async (id: string): Promise<boolean> => {
    if (String(id).startsWith('local-')) {
      const all = getLocal<any>('memories');
      setLocal('memories', all.filter(m => m.id !== id));
      return true;
    }
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) {
        if (isTableMissingError(error)) {
          const all = getLocal<any>('memories');
          setLocal('memories', all.filter(m => m.id !== id));
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error deleting memory:', err);
      const all = getLocal<any>('memories');
      setLocal('memories', all.filter(m => m.id !== id));
      return true;
    }
  },

  // --------------------------------------------------
  // SUBMISSIONS OPERATIONS
  // --------------------------------------------------
  getSubmissions: async (userClass: string, section: string): Promise<any[]> => {
    try {
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('class', selectedClass)
        .eq('section', selectedSection);

      if (error) {
        if (isTableMissingError(error)) {
          return getLocal<any>('submissions').filter(sub => sub.class === selectedClass && sub.section === selectedSection);
        }
        throw error;
      }

      return (data || []).map((sub: any) => ({
        ...sub,
        id: String(sub.id)
      }));
    } catch (err) {
      console.error('Error reading submissions from Supabase:', err);
      const { selectedClass, selectedSection } = parseClassAndSection(userClass, section);
      return getLocal<any>('submissions').filter(sub => sub.class === selectedClass && sub.section === selectedSection);
    }
  },

  addSubmission: async (payload: any): Promise<any> => {
    const freshPayload = {
      ...payload,
      createdAt: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert(freshPayload)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          const fresh = { id: `local-${Date.now()}`, ...freshPayload };
          const all = getLocal<any>('submissions');
          setLocal('submissions', [fresh, ...all]);
          return fresh;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error writing submission to Supabase:', err);
      const fresh = { id: `local-${Date.now()}`, ...freshPayload };
      const all = getLocal<any>('submissions');
      setLocal('submissions', [fresh, ...all]);
      return fresh;
    }
  },

  updateSubmissionStatus: async (id: string, status: string): Promise<boolean> => {
    if (String(id).startsWith('local-')) {
      const all = getLocal<any>('submissions');
      setLocal('submissions', all.map(sub => sub.id === id ? { ...sub, status } : sub));
      return true;
    }
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', id);

      if (error) {
        if (isTableMissingError(error)) {
          const all = getLocal<any>('submissions');
          setLocal('submissions', all.map(sub => sub.id === id ? { ...sub, status } : sub));
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error updating submission status:', err);
      const all = getLocal<any>('submissions');
      setLocal('submissions', all.map(sub => sub.id === id ? { ...sub, status } : sub));
      return true;
    }
  },

  // --------------------------------------------------
  // PORTAL CLOUD VAULT OPERATIONS
  // --------------------------------------------------
  getVaults: async (ownerId: string, email: string): Promise<any[]> => {
    try {
      const isAdmin = email === 'ram.chandra.abc1@gmail.com';
      let queryBuilder = supabase.from('vaults').select('*');
      if (!isAdmin) {
        queryBuilder = queryBuilder.or(`ownerId.eq.${ownerId},ownerId.eq.${email}`);
      }

      const { data, error } = await queryBuilder;
      if (error) {
        if (isTableMissingError(error)) {
          const localVaults = getLocal<any>('vaults');
          if (isAdmin) return localVaults;
          return localVaults.filter(v => v.ownerId === ownerId || v.ownerId === email);
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching vaults from Supabase:', err);
      const localVaults = getLocal<any>('vaults');
      const isAdmin = email === 'ram.chandra.abc1@gmail.com';
      if (isAdmin) return localVaults;
      return localVaults.filter(v => v.ownerId === ownerId || v.ownerId === email);
    }
  },

  getVaultById: async (vaultId: string): Promise<any | null> => {
    try {
      const { data, error } = await supabase
        .from('vaults')
        .select('*')
        .eq('id', vaultId)
        .maybeSingle();

      if (error) {
        if (isTableMissingError(error)) {
          const localVaults = getLocal<any>('vaults');
          return localVaults.find(v => v.id === vaultId) || null;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error fetching vault by id:', err);
      const localVaults = getLocal<any>('vaults');
      return localVaults.find(v => v.id === vaultId) || null;
    }
  },

  addVault: async (vaultData: { ownerId: string; name: string; roleType: string; subject: string; passwordHash: string; createdAt?: string }): Promise<any> => {
    const payload = {
      ...vaultData,
      createdAt: vaultData.createdAt || new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('vaults')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          const fresh = { id: `local-${Date.now()}`, ...payload };
          const all = getLocal<any>('vaults');
          setLocal('vaults', [...all, fresh]);
          return fresh;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error creating vault:', err);
      const fresh = { id: `local-${Date.now()}`, ...payload };
      const all = getLocal<any>('vaults');
      setLocal('vaults', [...all, fresh]);
      return fresh;
    }
  },

  deleteVault: async (vaultId: string): Promise<boolean> => {
    if (String(vaultId).startsWith('local-')) {
      const all = getLocal<any>('vaults');
      setLocal('vaults', all.filter(v => v.id !== vaultId));
      return true;
    }
    try {
      const { error } = await supabase
        .from('vaults')
        .delete()
        .eq('id', vaultId);

      if (error) {
        if (isTableMissingError(error)) {
          const all = getLocal<any>('vaults');
          setLocal('vaults', all.filter(v => v.id !== vaultId));
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error deleting vault:', err);
      const all = getLocal<any>('vaults');
      setLocal('vaults', all.filter(v => v.id !== vaultId));
      return true;
    }
  },

  getVaultFiles: async (vaultId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vault_files')
        .select('*')
        .eq('vaultId', vaultId);

      if (error) {
        if (isTableMissingError(error)) {
          const localFiles = getLocal<any>('vault_files');
          return localFiles.filter(item => item.vaultId === vaultId);
        }
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching vault files from Supabase:', err);
      const localFiles = getLocal<any>('vault_files');
      return localFiles.filter(item => item.vaultId === vaultId);
    }
  },

  addVaultFile: async (vaultId: string, fileData: any): Promise<any> => {
    const payload = {
      vaultId,
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      url: fileData.url || '',
      uploadDate: fileData.uploadDate || new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('vault_files')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (isTableMissingError(error)) {
          const fresh = { id: `local-${Date.now()}`, ...payload };
          const all = getLocal<any>('vault_files');
          setLocal('vault_files', [...all, fresh]);
          return fresh;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error adding vault file:', err);
      const fresh = { id: `local-${Date.now()}`, ...payload };
      const all = getLocal<any>('vault_files');
      setLocal('vault_files', [...all, fresh]);
      return fresh;
    }
  },

  deleteVaultFile: async (fileId: string): Promise<boolean> => {
    if (String(fileId).startsWith('local-')) {
      const all = getLocal<any>('vault_files');
      setLocal('vault_files', all.filter(f => f.id !== fileId));
      return true;
    }
    try {
      const { error } = await supabase
        .from('vault_files')
        .delete()
        .eq('id', fileId);

      if (error) {
        if (isTableMissingError(error)) {
          const all = getLocal<any>('vault_files');
          setLocal('vault_files', all.filter(f => f.id !== fileId));
          return true;
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error deleting vault file:', err);
      const all = getLocal<any>('vault_files');
      setLocal('vault_files', all.filter(f => f.id !== fileId));
      return true;
    }
  }
};
