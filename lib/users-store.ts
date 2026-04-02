import { sql } from "@vercel/postgres";

export type UserRole = "student" | "teacher";
export type UserStatus = "pending" | "active";

export type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  class: string | null;
  subject: string | null;
  status: UserStatus;
  pin: string | null;
  created_at: string;
};

export type PublicUser = Omit<User, "pin">;

export async function getUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, name, email, mobile, role, class, subject, status, pin, created_at
    FROM users
    ORDER BY
      CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
      created_at DESC
  `;
  return result.rows as User[];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `;
  return (result.rows[0] as User) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return (result.rows[0] as User) ?? null;
}

export async function createUser(
  data: Omit<User, "id" | "status" | "pin" | "created_at">
): Promise<User> {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const result = await sql`
    INSERT INTO users (id, name, email, mobile, role, class, subject, status, pin, created_at)
    VALUES (
      ${id},
      ${data.name},
      ${data.email},
      ${data.mobile},
      ${data.role},
      ${data.class ?? null},
      ${data.subject ?? null},
      'pending',
      NULL,
      NOW()
    )
    RETURNING *
  `;
  return result.rows[0] as User;
}

export async function assignPin(userId: string, pin: string): Promise<boolean> {
  const result = await sql`
    UPDATE users SET pin = ${pin}, status = 'active'
    WHERE id = ${userId}
  `;
  return (result.rowCount ?? 0) > 0;
}

export function toPublicUser(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { pin, ...rest } = user;
  return rest;
}

export function generatePin(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}
