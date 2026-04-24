/**
 * AI Tool Types based on the Master Config JSON
 */
export const AI_TOOLS = {
  SHOP_FOREMAN: 'shop_foreman_gpt',
  MECHANICAL_DIAGNOSTICS: 'mechanical_diagnostics_gpt',
  OBD2_INTERPRETER: 'obd2_code_interpreter_gpt',
  ELECTRICAL_DIAGNOSTICS: 'electrical_diagnostics_gpt',
  TRANSMISSION_DIAGNOSTICS: 'transmission_diagnostics_gpt',
  EUROPEAN_SPECIALIST: 'european_vehicle_specialist_gpt',
} as const;

export type AIToolType = typeof AI_TOOLS[keyof typeof AI_TOOLS];

/**
 * Subscription Tier Mapping
 * Standard tier includes everything except European Specialist
 * Premium (European) tier includes everything
 */
export const AI_ACCESS_MAP: Record<string, AIToolType[]> = {
  BASIC: [
    AI_TOOLS.SHOP_FOREMAN,
    AI_TOOLS.MECHANICAL_DIAGNOSTICS,
    AI_TOOLS.OBD2_INTERPRETER,
  ],
  PROFESSIONAL: [
    AI_TOOLS.SHOP_FOREMAN,
    AI_TOOLS.MECHANICAL_DIAGNOSTICS,
    AI_TOOLS.OBD2_INTERPRETER,
    AI_TOOLS.ELECTRICAL_DIAGNOSTICS,
    AI_TOOLS.TRANSMISSION_DIAGNOSTICS,
  ],
  EUROPEAN: [
    AI_TOOLS.SHOP_FOREMAN,
    AI_TOOLS.MECHANICAL_DIAGNOSTICS,
    AI_TOOLS.OBD2_INTERPRETER,
    AI_TOOLS.ELECTRICAL_DIAGNOSTICS,
    AI_TOOLS.TRANSMISSION_DIAGNOSTICS,
    AI_TOOLS.EUROPEAN_SPECIALIST,
  ],
};

/**
 * European Brands for automatic routing logic
 */
export const EUROPEAN_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Porsche', 'Volkswagen', 'VW', 
  'Volvo', 'Land Rover', 'Jaguar', 'Ferrari', 'Lamborghini', 'Fiat', 
  'Alfa Romeo', 'Peugeot', 'Renault', 'Citroen', 'Skoda', 'SEAT', 'Saab', 
  'Mini Cooper', 'Mini', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'Maserati',
  'McLaren', 'Bugatti', 'Lotus', 'Pagani', 'Lancia', 'Smart', 'Dacia', 'Opel',
  'Vauxhall', 'Iveco', 'MAN', 'DS Automobiles', 'DS', 'Alpine', 'Abarth', 'Cupra'
];
