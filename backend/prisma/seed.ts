import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
    const user = await prisma.user.upsert({
        where: { email: "duc@example.com" },
        update: {},
        create: {
            email: "duc@example.com",
            name: "Duc",
            settings: { create: { unit: "kg" } },
        },
        include: { settings: true },
    });

    // Tạo 1 GymDay + focus tags + exercises trong transaction
    await prisma.$transaction(async (tx) => {
        const day = await tx.gymDay.create({
            data: { userId: user.id, dateYmd: new Date("2025-09-23"), note: "Leg day" },
        });

        await tx.gymDayFocus.createMany({
            data: [
                { dayId: day.id, tag: "legs" },
                { dayId: day.id, tag: "glutes" },
            ],
        });

        await tx.gymExercise.createMany({
            data: [
                {
                    dayId: day.id,
                    name: "Squat",
                    sets: 4,
                    reps: 8,
                    // Dùng Prisma.Decimal cho Decimal(6,1)
                    weightKg: new Prisma.Decimal("80.0"),
                },
                {
                    dayId: day.id,
                    name: "Leg Press",
                    sets: 3,
                    reps: 12,
                    weightKg: new Prisma.Decimal("120.0"),
                },
            ],
        });
    });

    // Playlist + tracks
    const playlist = await prisma.playlist.create({
        data: { userId: user.id, title: "Gym Mix" },
    });

    await prisma.track.createMany({
        data: [
            { playlistId: playlist.id, title: "Song A", artist: "Artist", youtubeId: "xxx", position: 1 },
            { playlistId: playlist.id, title: "Song B", artist: "Artist", youtubeId: "yyy", position: 2 },
        ],
    });

    // Spending template + entry
    const tpl = await prisma.spendingTemplate.create({
        data: {
            userId: user.id,
            title: "Internet",
            defaultAmount: new Prisma.Decimal("60.00"),
            defaultDueDay: 10,
        },
    });

    await prisma.spendingEntry.create({
        data: {
            userId: user.id,
            templateId: tpl.id,
            title: "Internet Sep 2025",
            dueDate: new Date("2025-09-10"),
            amount: new Prisma.Decimal("60.00"),
            status: "Process", // enum SpendingStatus
            monthKey: "2025-09",
        },
    });

    console.log("Seed done.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
