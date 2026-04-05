export interface IPlanPrice {
    duration: 'MONTHLY' | 'YEARLY';
    price: number;
}

export interface ISubscriptionPlan {
    category: 'BASIC' | 'PROFESSIONAL' | 'EUROPEAN';
    name: string;
    description: string;
    prices: IPlanPrice[];
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isActive?: boolean;
}
