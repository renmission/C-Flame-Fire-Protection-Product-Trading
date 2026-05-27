/**
 * Seed script: inserts fire protection products, categories, and units.
 * Run: pnpm db:seed:products
 * Requires DATABASE_URL in env. Safe to re-run (idempotent).
 */
import "dotenv/config";
import {
  db,
  products,
  stockLevels,
  stockMovements,
  inventoryCategories,
  inventoryUnits,
} from "../lib/db";
import { eq } from "drizzle-orm";

const FIRE_CATEGORIES = [
  "Fire Extinguishers",
  "Fire Detection",
  "Fire Suppression",
  "Protective Equipment",
  "Hose & Fittings",
  "Signage & Safety",
];

const FIRE_UNITS = ["set"];

/** Fire protection products. listPrice in PHP (₱). */
const FIRE_PRODUCTS = [
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

async function seedFireProducts() {
  for (const name of FIRE_CATEGORIES) {
    await db
      .insert(inventoryCategories)
      .values({ name })
      .onConflictDoNothing({ target: inventoryCategories.name });
  }

  for (const name of FIRE_UNITS) {
    await db
      .insert(inventoryUnits)
      .values({ name })
      .onConflictDoNothing({ target: inventoryUnits.name });
  }

  for (const p of FIRE_PRODUCTS) {
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
        quantity: Math.floor(Math.random() * 70) + 10,
      });
    }
  }

  // Update listPrice on subsequent runs
  for (const p of FIRE_PRODUCTS) {
    await db
      .update(products)
      .set({ listPrice: String(p.listPrice), updatedAt: new Date() })
      .where(eq(products.sku, p.sku));
  }

  const productRows = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.archived, 0));

  for (let i = 0; i < Math.min(5, productRows.length); i++) {
    await db.insert(stockMovements).values({
      productId: productRows[i]!.id,
      type: "in",
      quantity: 40 + i * 10,
      reference: "SEED-IN",
      note: "Initial stock",
    });
  }

  console.log(
    `Seed done. Products: ${FIRE_PRODUCTS.length} | Categories: ${FIRE_CATEGORIES.length} | New units: ${FIRE_UNITS.length}`
  );
  process.exit(0);
}

seedFireProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
