export interface ISubscriptionPlan {
    category: 'BASIC' | 'PROFESSIONAL' | 'EUROPEAN';
    name: string;
    description: string;
    price: number;
    currency?: string;
    duration?: string;
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isActive?: boolean;
}
