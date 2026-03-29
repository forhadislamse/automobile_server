export interface ISubscriptionPlan {
    name: string;
    price: number;
    currency?: string;
    duration?: string;
    features: string[];
    isPopular?: boolean;
    isActive?: boolean;
}
