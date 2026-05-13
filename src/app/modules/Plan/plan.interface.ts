export interface IPlanPrice {
    duration: 'Monthly' | 'Annually';
    price: number;
}

export interface IPlanFeature {
    name: string;
    isActive: boolean;
}

export interface ISubscriptionPlan {
    category: 'BASIC' | 'PROFESSIONAL' | 'EUROPEAN';
    name: string;
    description: string;
    prices: IPlanPrice[];
    currency?: string;
    technicianLimit: number;
    hasTrial: boolean;
    features: IPlanFeature[];
    isActive?: boolean;
}
