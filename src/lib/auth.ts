export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

type AuthResult =
  | { ok: true; user: User }
  | { ok: false; message: string };

const USERS_KEY = "tripnest_users";
const CURRENT_USER_KEY = "tripnest_current_user";

function isBrowser() {
  return typeof window !== "undefined";
}

function createId() {
  if (isBrowser() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getUsers(): User[] {
  if (!isBrowser()) return [];

  const users = localStorage.getItem(USERS_KEY);

  if (!users) return [];

  try {
    return JSON.parse(users) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(
  name: string,
  email: string,
  password: string
): AuthResult {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password) {
    return { ok: false, message: "Please fill in all fields." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  const users = getUsers();

  const userExists = users.some((user) => user.email === cleanEmail);

  if (userExists) {
    return { ok: false, message: "An account with this email already exists." };
  }

  const newUser: User = {
    id: createId(),
    name: cleanName,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

  return { ok: true, user: newUser };
}

export function loginUser(email: string, password: string): AuthResult {
  const cleanEmail = email.trim().toLowerCase();

  const users = getUsers();

  const foundUser = users.find(
    (user) => user.email === cleanEmail && user.password === password
  );

  if (!foundUser) {
    return { ok: false, message: "Invalid email or password." };
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));

  return { ok: true, user: foundUser };
}

export function getCurrentUser(): User | null {
  if (!isBrowser()) return null;

  const user = localStorage.getItem(CURRENT_USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user) as User;
  } catch {
    return null;
  }
}

export function logoutUser() {
  if (!isBrowser()) return;
  localStorage.removeItem(CURRENT_USER_KEY);
}