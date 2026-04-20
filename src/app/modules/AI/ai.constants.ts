import { PlanCategory } from '@prisma/client';

export const AI_TOOLS = {
  SHOP_FOREMAN: 'Shop Foreman AI',
  MECHANICAL_DIAGNOSTICS: 'Mechanical Diagnostics AI',
  OBD2_INTERPRETER: 'OBD-II Code Interpreter AI',
  ELECTRICAL_DIAGNOSTICS: 'Electrical Diagnostics AI',
  TRANSMISSION_DIAGNOSTICS: 'Transmission Diagnostics AI',
  EUROPEAN_SPECIALIST: 'European Vehicle Specialist AI',
} as const;

export type AIToolType = (typeof AI_TOOLS)[keyof typeof AI_TOOLS];

// Mapping AI Tools to Plan Categories
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

export const EUROPEAN_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Porsche', 'Volkswagen', 'VW', 
  'Volvo', 'Land Rover', 'Jaguar', 'Ferrari', 'Lamborghini', 'Fiat', 
  'Alfa Romeo', 'Peugeot', 'Renault', 'Citroen', 'Skoda', 'SEAT', 'Saab', 
  'Mini Cooper', 'Mini', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'Maserati'
];
