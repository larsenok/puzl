export const STORAGE_KEY = 'puzl-daily-state-v1';

export const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    return parsed;
  } catch (error) {
    console.error('Failed to read stored puzzle state', error);
    return {};
  }
};

export const writeStorage = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to store puzzle state', error);
  }
};

export const getTimestamp = () => new Date().toISOString();

export const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
