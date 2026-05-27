import { NextRequest } from "next/server";
import { db, users, userRoles, roles, customers } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input. Please check your details." }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      })
      .returning({ id: users.id });

    if (!newUser) {
      return Response.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    const [customerRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, ROLES.CUSTOMER))
      .limit(1);

    if (customerRole) {
      await db
        .insert(userRoles)
        .values({ userId: newUser.id, roleId: customerRole.id })
        .onConflictDoNothing();
    }

    await db.insert(customers).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      address: "",
      createdById: newUser.id,
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[register] Registration failed:", err);
    return Response.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
