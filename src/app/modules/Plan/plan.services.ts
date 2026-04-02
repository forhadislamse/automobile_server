import { ISubscriptionPlan } from './plan.interface';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';

const createPlan = async (payload: ISubscriptionPlan) => {
    const existing = await prisma.subscriptionPlan.findUnique({
        where: { name: payload.name }
    });

    if (existing) {
        throw new ApiError(409, `Plan with name "${payload.name}" already exists`);
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

const updatePlan = async (id: string, payload: Partial<ISubscriptionPlan>) => {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Plan not found');

    if (payload.name && payload.name !== existing.name) {
        const duplicate = await prisma.subscriptionPlan.findUnique({ where: { name: payload.name } });
        if (duplicate) throw new ApiError(409, `Plan with name "${payload.name}" already exists`);
    }

    const updated = await prisma.subscriptionPlan.update({
        where: { id },
        data: payload
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
