export const HOUSE_FIELD_GROUPS = {
  contract: {
    label: "Contract & Listing",
    label_et: "Leping & kuulutus",
    fields: [
      { key: "ID", label: "External ID", label_et: "Väline ID", type: "text" },
      { key: "Projektijuht", label: "Project manager", label_et: "Projektijuht", type: "text" },
      { key: "Kuulutuse kontakt", label: "Listing contact", label_et: "Kuulutuse kontakt", type: "text" },
      { key: "Lepingu number", label: "Contract number", label_et: "Lepingu number", type: "text" },
      { key: "Lepingu algus", label: "Contract start", label_et: "Lepingu algus", type: "date" },
      { key: "Lepingu lõpp", label: "Contract end", label_et: "Lepingu lõpp", type: "date" },
      { key: "Lepingu tüüp", label: "Contract type", label_et: "Lepingu tüüp", type: "text" },
      { key: "Teenustasu ilma km-ta", label: "Service fee (excl. VAT)", label_et: "Teenustasu (ilma KM-ta)", type: "currency" },
    ],
  },

  transaction: {
    label: "Transaction",
    label_et: "Tehing",
    fields: [
      { key: "Tehing", label: "Transaction type", label_et: "Tehingu tüüp", type: "text" },
      { key: "Tehingu hind", label: "Transaction price", label_et: "Tehingu hind", type: "currency" },
      { key: "m2 hind", label: "Price per m²", label_et: "Hind m² kohta", type: "currency2" },
      { key: "Hind sisaldab käibemaksu", label: "Price includes VAT", label_et: "Hind sisaldab KM-i", type: "boolean" },
      { key: "Hinnale lisandub KM", label: "VAT added to price", label_et: "Hinnale lisandub KM", type: "boolean" },
      { key: "Algne pakkumise hind ilma km-ta (€)", label: "Original listing price (excl. VAT)", label_et: "Algne pakkumishind (ilma KM-ta)", type: "currency" },
    ],
  },

  classification: {
    label: "Property classification",
    label_et: "Objekti klassifikatsioon",
    fields: [
      { key: "Objekti liik", label: "Property type", label_et: "Objekti liik", type: "text" },
      { key: "Objekti täpsustus", label: "Property subtype", label_et: "Objekti täpsustus", type: "text" },
      { key: "Omandivorm", label: "Ownership type", label_et: "Omandivorm", type: "text" },
      { key: "Valmidus", label: "Completion status", label_et: "Valmidus", type: "text" },
      { key: "Seisukord", label: "Condition", label_et: "Seisukord", type: "text" },
      { key: "Piirangud", label: "Restrictions", label_et: "Piirangud", type: "text" },
    ],
  },

  location: {
    label: "Location & registry",
    label_et: "Asukoht & register",
    fields: [
      { key: "Maakond", label: "County", label_et: "Maakond", type: "text" },
      { key: "Linn", label: "City", label_et: "Linn", type: "text" },
      { key: "Vald", label: "Municipality", label_et: "Vald", type: "text" },
      { key: "Linnaosa", label: "District", label_et: "Linnaosa", type: "text" },
      { key: "Asula", label: "Settlement", label_et: "Asula", type: "text" },
      { key: "Tänav", label: "Street", label_et: "Tänav", type: "text" },
      { key: "Maja nr", label: "Building number", label_et: "Maja nr", type: "text" },
      { key: "Korteri nr", label: "Apartment number", label_et: "Korteri nr", type: "text" },
      { key: "Katastritunnus", label: "Cadastral ID", label_et: "Katastritunnus", type: "text" },
      { key: "Registriosa nr", label: "Registry unit number", label_et: "Registriosa nr", type: "text" },
    ],
  },

  layout: {
    label: "Building & layout",
    label_et: "Hoone & plaan",
    fields: [
      { key: "Korrus", label: "Floor", label_et: "Korrus", type: "number" },
      { key: "Korruseid", label: "Total floors", label_et: "Korruseid", type: "number" },
      { key: "Tube", label: "Rooms", label_et: "Tube", type: "number" },
      { key: "Elutube", label: "Living rooms", label_et: "Elutube", type: "number" },
      { key: "Magamistube", label: "Bedrooms", label_et: "Magamistube", type: "number" },
      { key: "Kööke", label: "Kitchens", label_et: "Kööke", type: "number" },
      { key: "Vannitube", label: "Bathrooms", label_et: "Vannitube", type: "number" },
      { key: "Wc-d", label: "Toilets", label_et: "WC-sid", type: "number" },
    ],
  },

  areas: {
    label: "Areas & surfaces",
    label_et: "Pinnad",
    fields: [
      { key: "Üldpind (m2)", label: "Total area (m²)", label_et: "Üldpind (m²)", type: "number" },
      { key: "Köögi pind (m2)", label: "Kitchen area (m²)", label_et: "Köögi pind (m²)", type: "number" },
      { key: "Krundi suurus (m2)", label: "Plot size (m²)", label_et: "Krundi suurus (m²)", type: "number" },
      { key: "Rõdusid", label: "Balconies", label_et: "Rõdud", type: "number" },
      { key: "Rõdupind (m2)", label: "Balcony area (m²)", label_et: "Rõdupind (m²)", type: "number" },
      { key: "Terrasse", label: "Terraces", label_et: "Terrassid", type: "number" },
      { key: "Terrassipind (m2)", label: "Terrace area (m²)", label_et: "Terrassipind (m²)", type: "number" },
    ],
  },

  storage: {
    label: "Storage",
    label_et: "Panipaik",
    fields: [
      { key: "Keldreid / panipaiku", label: "Storage units", label_et: "Panipaigad", type: "number" },
      { key: "Keldri / panipaiga suurus (m2)", label: "Storage area (m²)", label_et: "Panipaiga suurus (m²)", type: "number" },
      { key: "Panipaiga nr (tähis)", label: "Storage ID", label_et: "Panipaiga nr", type: "text" },
      { key: "Panipaiga hind sisaldub objekti hinnas", label: "Storage included in price", label_et: "Panipaiga hind sisaldub hinnas", type: "boolean" },
      { key: "Panipaiga hind", label: "Storage price", label_et: "Panipaiga hind", type: "currency" },
    ],
  },

  parking: {
    label: "Parking",
    label_et: "Parkimine",
    fields: [
      { key: "Parkimine", label: "Parking type", label_et: "Parkimine", type: "text" },
      { key: "Parkimiskohti", label: "Parking spaces", label_et: "Parkimiskohti", type: "number" },
      { key: "Parkimiskoha nr (tähis)", label: "Parking space ID", label_et: "Parkimiskoha nr", type: "text" },
      { key: "Parkimiskoht sisaldub objekti hinnas", label: "Parking included in price", label_et: "Parkimiskoha hind sisaldub hinnas", type: "boolean" },
      { key: "Parkimiskoha hind", label: "Parking price", label_et: "Parkimiskoha hind", type: "currency" },
    ],
  },

  construction: {
    label: "Construction & utilities",
    label_et: "Ehitus & tehnosüsteemid",
    fields: [
      { key: "Ehitusaasta", label: "Year built", label_et: "Ehitusaasta", type: "number" },
      { key: "Ehitise materjal", label: "Building material", label_et: "Ehitise materjal", type: "text" },
      { key: "Aknad", label: "Windows", label_et: "Aknad", type: "text" },
      { key: "Uksed", label: "Doors", label_et: "Uksed", type: "text" },
      { key: "Katus", label: "Roof", label_et: "Katus", type: "text" },
      { key: "Küte", label: "Heating", label_et: "Küte", type: "text" },
      { key: "Energiamärgis", label: "Energy class", label_et: "Energiamärgis", type: "text" },
    ],
  },

  environment: {
    label: "Environment",
    label_et: "Keskkond",
    fields: [
      { key: "Veekogu", label: "Water body nearby", label_et: "Veekogu lähedal", type: "boolean" },
      { key: "Veekogu nimi", label: "Water body name", label_et: "Veekogu nimi", type: "text" },
      { key: "Veekogu kaugus (m)", label: "Distance to water (m)", label_et: "Kaugus veekogust (m)", type: "number" },
    ],
  },
};
