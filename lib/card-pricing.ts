import { db } from "@/lib/db";

export interface CardTierPricing {
  name: string;
  price: number;
  description: string;
  features: string[];
  enabled: boolean;
}

export interface PhysicalCardPricingSettings {
  currency: "USD" | "SLE";
  shippingFee: number;
  codEnabled: boolean;
  stripeEnabled: boolean;
  tiers: {
    STANDARD_PVC: CardTierPricing;
    GOLD_RFID_SMART: CardTierPricing;
    EXECUTIVE_TITANIUM: CardTierPricing;
  };
}

export const DEFAULT_CARD_PRICING: PhysicalCardPricingSettings = {
  currency: "USD",
  shippingFee: 0,
  codEnabled: true,
  stripeEnabled: true,
  tiers: {
    STANDARD_PVC: {
      name: "Standard PVC Card",
      price: 15,
      description: "High-durability laminated PVC card with embedded QR identifier and campus barcode.",
      features: [
        "UV-resistant laminated PVC body",
        "High-contrast QR code for instant scan",
        "Standard tracked postal courier",
      ],
      enabled: true,
    },
    GOLD_RFID_SMART: {
      name: "Gold RFID Smart Card",
      price: 35,
      description: "Smart 13.56MHz RFID chip card with metallic gold foil finish for contactless campus gate access.",
      features: [
        "13.56MHz high-frequency RFID contactless chip",
        "Reflective metallic gold leaf border & insignia",
        "Direct turnstile, library & faculty gate tap access",
        "Priority express courier dispatch",
      ],
      enabled: true,
    },
    EXECUTIVE_TITANIUM: {
      name: "Executive Titanium Card",
      price: 75,
      description: "Heavy solid metal titanium card with precision laser engraving and dual RFID + NFC chips.",
      features: [
        "Solid aerospace-grade titanium core (18g)",
        "Deep fiber-laser precision engraving",
        "Dual-frequency smart chip (NFC + RFID)",
        "Priority global DHL/FedEx courier with signature tracking",
        "Lifetime card replacement warranty",
      ],
      enabled: true,
    },
  },
};

export const SETTING_KEY_CARD_PRICING = "physical_card_pricing";

export async function getPhysicalCardPricing(): Promise<PhysicalCardPricingSettings> {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SETTING_KEY_CARD_PRICING },
    });
    if (!record || !record.value) {
      return DEFAULT_CARD_PRICING;
    }

    const val = record.value as Partial<PhysicalCardPricingSettings>;
    return {
      currency: val.currency === "SLE" ? "SLE" : "USD",
      shippingFee: typeof val.shippingFee === "number" ? val.shippingFee : DEFAULT_CARD_PRICING.shippingFee,
      codEnabled: val.codEnabled ?? DEFAULT_CARD_PRICING.codEnabled,
      stripeEnabled: val.stripeEnabled ?? DEFAULT_CARD_PRICING.stripeEnabled,
      tiers: {
        STANDARD_PVC: {
          ...DEFAULT_CARD_PRICING.tiers.STANDARD_PVC,
          ...(val.tiers?.STANDARD_PVC || {}),
        },
        GOLD_RFID_SMART: {
          ...DEFAULT_CARD_PRICING.tiers.GOLD_RFID_SMART,
          ...(val.tiers?.GOLD_RFID_SMART || {}),
        },
        EXECUTIVE_TITANIUM: {
          ...DEFAULT_CARD_PRICING.tiers.EXECUTIVE_TITANIUM,
          ...(val.tiers?.EXECUTIVE_TITANIUM || {}),
        },
      },
    };
  } catch (err) {
    console.error("Failed to load physical card pricing setting:", err);
    return DEFAULT_CARD_PRICING;
  }
}
