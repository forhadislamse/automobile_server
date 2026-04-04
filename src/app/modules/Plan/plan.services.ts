import { ISubscriptionPlan } from './plan.interface';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';

const createPlan = async (payload: ISubscriptionPlan) => {
    const existing = await prisma.subscriptionPlan.findUnique({
        where: { category: payload.category }
    });

    if (existing) {
        throw new ApiError(409, `Plan with category "${payload.category}" already exists`);
    }

    const plan = await prisma.subscriptionPlan.create({
        data: payload
    });

    return plan;
};

const getAllPlans = async () => {
    const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
    });
    return plans;
};

const getPlanById = async (id: string) => {
    const plan = await prisma.subscriptionPlan.findUnique({
        where: { id }
    });

    if (!plan) throw new ApiError(404, 'Plan not found');
    return plan;
};

// const updatePlan = async (id: string, payload: Partial<ISubscriptionPlan>) => {
//     const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
//     if (!existing) throw new ApiError(404, 'Plan not found');

//     // Only allow specific fields to be updated by admin to prevent logic breakdown
//     const allowedUpdates: Partial<ISubscriptionPlan> = {};
//     if (payload.price !== undefined) allowedUpdates.price = payload.price;
//     if (payload.isActive !== undefined) allowedUpdates.isActive = payload.isActive;
//     if (payload.isPopular !== undefined) allowedUpdates.isPopular = payload.isPopular;

//     if (Object.keys(allowedUpdates).length === 0) {
//         throw new ApiError(400, 'Only price, isPopular, and isActive can be updated');
//     }

//     const updated = await prisma.subscriptionPlan.update({
//         where: { id },
//         data: allowedUpdates
//     });

//     return updated;
// };
const updatePlan = async (id: string, payload: Partial<ISubscriptionPlan>) => {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Plan not found');

    // Prevent 'category' from being updated via regular CRUD to ensure AI logic stability
    const { category, ...updateData } = payload;

    const updated = await prisma.subscriptionPlan.update({
        where: { id },
        data: updateData
    });

    return updated;
};

const deletePlan = async (id: string) => {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Plan not found');

    await prisma.subscriptionPlan.delete({ where: { id } });
    return { message: 'Plan deleted successfully' };
};

export const PlanServices = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan
};
