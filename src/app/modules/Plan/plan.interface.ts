export interface ISubscriptionPlan {
    name: string;
    category: 'BASIC_SHOP_PLAN' | 'PROFESSIONAL_SHOP_PLAN' | 'EUROPEAN_SPECIALIST_PLAN';
    descriptionName: string;
    description: string;
    price: number;
    currency?: string;
    duration?: string;
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isActive?: boolean;
}
