/**
 * Seed script: creates roles, admin user, fire protection inventory, categories, units, and departments.
 * Run: pnpm db:seed
 * Requires DATABASE_URL and optionally ADMIN_EMAIL, ADMIN_PASSWORD in env.
 */
import "dotenv/config";
import {
  db,
  users,
  roles,
  userRoles,
  products,
  stockLevels,
  stockMovements,
  inventoryCategories,
  inventoryUnits,
  employees,
  departments,
} from "../lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ROLES } from "../lib/auth/permissions";

/** Fire protection product inventory. listPrice in PHP (₱). */
const SAMPLE_PRODUCTS = [
  // Fire Extinguishers
  { sku: "FE-ABC-1", name: "ABC Dry Chemical Fire Extinguisher 1kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 850, reorderLevel: 10 },
  { sku: "FE-ABC-3", name: "ABC Dry Chemical Fire Extinguisher 3kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 1200, reorderLevel: 15 },
  { sku: "FE-ABC-6", name: "ABC Dry Chemical Fire Extinguisher 6kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 1800, reorderLevel: 10 },
  { sku: "FE-ABC-10", name: "ABC Dry Chemical Fire Extinguisher 10kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 2800, reorderLevel: 8 },
  { sku: "FE-CO2-23", name: "Carbon Dioxide Fire Extinguisher 2.3kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 2500, reorderLevel: 10 },
  { sku: "FE-CO2-45", name: "Carbon Dioxide Fire Extinguisher 4.5kg", category: "Fire Extinguishers", unit: "pcs", listPrice: 3800, reorderLevel: 8 },
  { sku: "FE-WC-2L", name: "Wet Chemical Fire Extinguisher 2L", category: "Fire Extinguishers", unit: "pcs", listPrice: 2200, reorderLevel: 5 },
  // Fire Detection
  { sku: "FD-AFACP", name: "Addressable Fire Alarm Control Panel 2-Loop", category: "Fire Detection", unit: "pcs", listPrice: 28500, reorderLevel: 2 },
  { sku: "FD-CFACP", name: "Conventional Fire Alarm Control Panel 4-Zone", category: "Fire Detection", unit: "pcs", listPrice: 9500, reorderLevel: 3 },
  { sku: "FD-SMA", name: "Smoke Detector Addressable", category: "Fire Detection", unit: "pcs", listPrice: 1250, reorderLevel: 20 },
  { sku: "FD-SMC", name: "Smoke Detector Conventional", category: "Fire Detection", unit: "pcs", listPrice: 450, reorderLevel: 30 },
  { sku: "FD-HT", name: "Heat Detector", category: "Fire Detection", unit: "pcs", listPrice: 380, reorderLevel: 20 },
  { sku: "FD-MCP", name: "Manual Call Point / Break Glass", category: "Fire Detection", unit: "pcs", listPrice: 650, reorderLevel: 15 },
  { sku: "FD-SND", name: "Sounder/Strobe Alarm Unit", category: "Fire Detection", unit: "pcs", listPrice: 1100, reorderLevel: 15 },
  // Fire Suppression
  { sku: "FS-SPH-STD", name: "Standard Sprinkler Head", category: "Fire Suppression", unit: "pcs", listPrice: 285, reorderLevel: 50 },
  { sku: "FS-SPH-UPR", name: "Upright Sprinkler Head", category: "Fire Suppression", unit: "pcs", listPrice: 310, reorderLevel: 40 },
  { sku: "FS-FBL", name: "Fire Blanket 1.2m x 1.8m", category: "Fire Suppression", unit: "pcs", listPrice: 950, reorderLevel: 10 },
  // Hose & Fittings
  { sku: "HF-FH-15", name: 'Fire Hose 1.5" x 30m', category: "Hose & Fittings", unit: "pcs", listPrice: 1850, reorderLevel: 10 },
  { sku: "HF-FH-25", name: 'Fire Hose 2.5" x 30m', category: "Hose & Fittings", unit: "pcs", listPrice: 2650, reorderLevel: 8 },
  { sku: "HF-FHC", name: "Fire Hose Cabinet", category: "Hose & Fittings", unit: "pcs", listPrice: 3500, reorderLevel: 5 },
  // Protective Equipment
  { sku: "PE-FFS", name: "Firefighter Protective Suit (Full Set)", category: "Protective Equipment", unit: "set", listPrice: 12500, reorderLevel: 3 },
  { sku: "PE-FFH", name: "Firefighter Helmet", category: "Protective Equipment", unit: "pcs", listPrice: 2800, reorderLevel: 5 },
  { sku: "PE-FFG", name: "Firefighter Gloves", category: "Protective Equipment", unit: "pcs", listPrice: 650, reorderLevel: 10 },
  { sku: "PE-SCBA", name: "Self-Contained Breathing Apparatus", category: "Protective Equipment", unit: "set", listPrice: 35000, reorderLevel: 2 },
  // Signage & Safety
  { sku: "SS-FES", name: "Fire Exit Sign LED", category: "Signage & Safety", unit: "pcs", listPrice: 850, reorderLevel: 10 },
  { sku: "SS-ELU", name: "Emergency Lighting Unit", category: "Signage & Safety", unit: "pcs", listPrice: 1250, reorderLevel: 8 },
  { sku: "SS-FEB", name: "Fire Extinguisher Bracket", category: "Signage & Safety", unit: "pcs", listPrice: 180, reorderLevel: 20 },
];

/** Inventory categories for fire protection products. */
const SAMPLE_CATEGORIES = [
  "Fire Extinguishers",
  "Fire Detection",
  "Fire Suppression",
  "Hose & Fittings",
  "Protective Equipment",
  "Signage & Safety",
];

/** Inventory units. */
const SAMPLE_UNITS = ["pcs", "set", "m", "kg", "roll", "box"];

/** Departments for C'FLAME Fire Protection Product Trading. */
const SAMPLE_DEPARTMENTS = [
  "Administration",
  "Sales",
  "Logistics",
  "Warehouse",
  "Finance",
  "Technical Services",
];

const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  admin: "Administration",
  payroll_manager: "Finance",
  inventory_manager: "Warehouse",
  delivery_staff: "Logistics",
  pos_cashier: "Sales",
  viewer: "Administration",
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@cflame.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

async function seed() {
  const roleNames = Object.values(ROLES);

  for (const name of roleNames) {
    await db.insert(roles).values({ name }).onConflictDoNothing({ target: roles.name });
  }

  const roleRows = await db.select().from(roles).where(eq(roles.name, ROLES.ADMIN));
  const adminRoleId = roleRows[0]?.id;
  if (!adminRoleId) throw new Error("Admin role not found after insert");

  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existing.length === 0) {
    const [inserted] = await db
      .insert(users)
      .values({ email: ADMIN_EMAIL, name: "Admin", passwordHash })
      .returning({ id: users.id });
    if (inserted?.id) {
      await db
        .insert(userRoles)
        .values({ userId: inserted.id, roleId: adminRoleId })
        .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
      console.log("Created admin user:", ADMIN_EMAIL);
    }
  } else {
    await db.update(users).set({ passwordHash }).where(eq(users.id, existing[0].id));
    const ur = await db.select().from(userRoles).where(eq(userRoles.userId, existing[0].id));
    if (ur.length === 0) {
      await db
        .insert(userRoles)
        .values({ userId: existing[0].id, roleId: adminRoleId })
        .onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
    }
    console.log("Updated existing admin user:", ADMIN_EMAIL);
  }

  // --- Inventory ---
  for (const p of SAMPLE_PRODUCTS) {
    const [inserted] = await db
      .insert(products)
      .values({
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        reorderLevel: p.reorderLevel,
        listPrice: String(p.listPrice),
      })
      .onConflictDoNothing({ target: products.sku })
      .returning({ id: products.id });
    if (inserted?.id) {
      await db.insert(stockLevels).values({
        productId: inserted.id,
        quantity: Math.floor(Math.random() * 80) + 10,
      });
    }
  }

  for (const p of SAMPLE_PRODUCTS) {
    await db
      .update(products)
      .set({ listPrice: String(p.listPrice), updatedAt: new Date() })
      .where(eq(products.sku, p.sku));
  }

  const productRows = await db.select({ id: products.id }).from(products);
  const adminId = existing.length > 0 ? existing[0].id : null;
  for (let i = 0; i < Math.min(5, productRows.length); i++) {
    await db.insert(stockMovements).values({
      productId: productRows[i]!.id,
      type: "in",
      quantity: 40 + i * 15,
      reference: "SEED-IN",
      note: "Initial stock",
      createdById: adminId ?? undefined,
    });
  }

  for (const name of SAMPLE_CATEGORIES) {
    await db
      .insert(inventoryCategories)
      .values({ name })
      .onConflictDoNothing({ target: inventoryCategories.name });
  }
  for (const name of SAMPLE_UNITS) {
    await db
      .insert(inventoryUnits)
      .values({ name })
      .onConflictDoNothing({ target: inventoryUnits.name });
  }

  // --- Departments ---
  for (const name of SAMPLE_DEPARTMENTS) {
    await db.insert(departments).values({ name }).onConflictDoNothing({ target: departments.name });
  }

  // --- Assign departments to existing users based on roles ---
  const allUsers = await db.select().from(users);
  const allDepartments = await db.select().from(departments);

  const departmentMap = new Map(allDepartments.map((d) => [d.name.toLowerCase(), d.id]));

  for (const user of allUsers) {
    if (user.departmentId) continue;

    const userRoleRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const userRolesList = userRoleRows.map((r) => r.roleName).filter(Boolean);
    if (userRolesList.length === 0) continue;

    const primaryRole = userRolesList.includes("admin") ? "admin" : (userRolesList[0] ?? "");
    const departmentName = ROLE_DEPARTMENT_MAP[primaryRole];
    if (!departmentName) continue;

    const departmentId = departmentMap.get(departmentName.toLowerCase());
    if (!departmentId) continue;

    await db.update(users).set({ departmentId }).where(eq(users.id, user.id));
    console.log(`Assigned ${user.email} (${primaryRole}) → ${departmentName}`);
  }

  // --- Create employee records for non-admin users ---
  const allUsersForEmployees = await db.select().from(users);

  for (const u of allUsersForEmployees) {
    if (!u.email) continue;

    const userRoleRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, u.id));

    const userRolesList = userRoleRows.map((r) => r.roleName).filter(Boolean);
    const isAdmin = userRolesList.includes(ROLES.ADMIN);
    const isCustomer = userRolesList.includes(ROLES.CUSTOMER);
    if (isAdmin || isCustomer) continue;

    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.email, u.email))
      .limit(1);

    if (existingEmployee.length === 0) {
      const primaryRole = userRolesList[0] ?? "viewer";
      const departmentName = ROLE_DEPARTMENT_MAP[primaryRole] ?? "Administration";

      await db.insert(employees).values({
        userId: u.id,
        name: u.name ?? u.email.split("@")[0],
        email: u.email,
        department: departmentName,
        rate: "1000.00",
        active: 1,
      });
      console.log(`Created employee record for: ${u.email} (${primaryRole})`);
    } else if (!existingEmployee[0].userId) {
      await db
        .update(employees)
        .set({ userId: u.id })
        .where(eq(employees.id, existingEmployee[0].id));
      console.log(`Linked existing employee record to user for: ${u.email}`);
    }
  }

  console.log(
    "Seed done. Roles:",
    roleNames.join(", "),
    "| Products:",
    SAMPLE_PRODUCTS.length,
    "| Categories:",
    SAMPLE_CATEGORIES.length,
    "| Units:",
    SAMPLE_UNITS.length,
    "| Departments:",
    SAMPLE_DEPARTMENTS.length
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
