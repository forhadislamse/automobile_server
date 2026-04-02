export interface ISubscriptionPlan {
    name: string;
    price: number;
    currency?: string;
    duration?: string;
    technicianLimit: number;
    hasTrial: boolean;
    features: string[];
    isPopular?: boolean;
    isActive?: boolean;
}
