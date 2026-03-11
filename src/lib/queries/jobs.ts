import { db } from "@/lib/db";
import type { JobStatus } from "@prisma/client";

export async function getJobsForClient(clientProfileId: string) {
  return db.job.findMany({
    where: { clientId: clientProfileId, deletedAt: null },
    include: {
      category: true,
      images: true,
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getJobById(jobId: string) {
  return db.job.findUnique({
    where: { id: jobId },
    include: {
      category: true,
      images: true,
      client: { include: { user: true } },
      bids: {
        include: {
          provider: {
            include: { user: true, categories: { include: { category: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      awardedBid: {
        include: { provider: { include: { user: true } } },
      },
      reviews: true,
      _count: { select: { bids: true, messages: true } },
    },
  });
}

export async function getAvailableJobsForProvider(
  providerProfileId: string,
  categoryIds: string[],
  filters?: {
    categoryId?: string;
    city?: string;
    search?: string;
  }
) {
  const provider = await db.providerProfile.findUnique({
    where: { id: providerProfileId },
    include: { subscription: true },
  });

  const isPremium = provider?.subscription?.tier === "PREMIUM" &&
    (provider?.subscription?.status === "ACTIVE" || provider?.subscription?.status === "TRIALING");

  const where: Record<string, unknown> = {
    status: "OPEN" as JobStatus,
    deletedAt: null,
  };

  // Category filter
  if (filters?.categoryId && filters.categoryId !== "all") {
    where.categoryId = filters.categoryId;
  } else if (!filters?.categoryId && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }
  // filters.categoryId === "all" → no restriction, show all categories

  // City filter
  if (filters?.city) {
    where.city = { contains: filters.city, mode: "insensitive" };
  }

  // Combine premium window + search with AND to avoid OR overwrite
  const andConditions: Record<string, unknown>[] = [];

  if (!isPremium) {
    andConditions.push({
      OR: [
        { premiumAccessUntil: null },
        { premiumAccessUntil: { lt: new Date() } },
      ],
    });
  }

  if (filters?.search) {
    andConditions.push({
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return db.job.findMany({
    where,
    include: {
      category: true,
      images: true,
      client: { include: { user: { select: { name: true } } } },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getProviderJobs(providerProfileId: string) {
  return db.job.findMany({
    where: {
      awardedBid: { providerId: providerProfileId },
      status: { in: ["AWARDED", "IN_PROGRESS", "COMPLETED", "REVIEWED"] },
    },
    include: {
      category: true,
      client: { include: { user: true } },
      awardedBid: true,
      reviews: true,
    },
    orderBy: { awardedAt: "desc" },
  });
}

export async function getJobStats(clientProfileId: string) {
  const [active, completed, totalBids] = await Promise.all([
    db.job.count({
      where: {
        clientId: clientProfileId,
        status: { in: ["OPEN", "AWARDED", "IN_PROGRESS"] },
        deletedAt: null,
      },
    }),
    db.job.count({
      where: {
        clientId: clientProfileId,
        status: { in: ["COMPLETED", "REVIEWED"] },
        deletedAt: null,
      },
    }),
    db.bid.count({
      where: {
        job: { clientId: clientProfileId },
      },
    }),
  ]);

  return { active, completed, totalBids };
}
