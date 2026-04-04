export interface ISubscriptionPlan {
    name: string;
    category: 'BASIC' | 'PROFESSIONAL' | 'EUROPEAN';
    price: number;
    currency?: string;
    duration?: string;
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isActive?: boolean;
}
