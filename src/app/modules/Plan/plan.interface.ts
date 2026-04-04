export interface ISubscriptionPlan {
    category: 'BASIC' | 'PROFESSIONAL' | 'EUROPEAN';
    name: string;
    description: string;
    price: number;
    currency?: string;
    duration: 'MONTHLY' | 'YEARLY';
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isActive?: boolean;
}
