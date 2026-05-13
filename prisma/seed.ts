import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locations = [
    { floor: "1F", roomName: "リネン庫", sortOrder: 10 },
    { floor: "1F", roomName: "アメニティ倉庫", sortOrder: 20 },
    { floor: "2F", roomName: "清掃ワゴン置場", sortOrder: 30 },
    { floor: "3F", roomName: "客室備品庫", sortOrder: 40 },
  ];

  for (const loc of locations) {
    const exists = await prisma.location.findFirst({
      where: { floor: loc.floor, roomName: loc.roomName },
    });
    if (!exists) {
      await prisma.location.create({ data: loc });
    }
  }

  const items = [
    {
      name: "歯ブラシ",
      category: "アメニティ",
      baseUnit: "本",
      unitRates: [
        { name: "ケース", rate: 400 },
        { name: "箱", rate: 50 },
      ],
      alertEnabled: true,
      alertThreshold: 100,
    },
    {
      name: "シャンプー(小)",
      category: "アメニティ",
      baseUnit: "本",
      unitRates: [{ name: "箱", rate: 100 }],
      alertEnabled: true,
      alertThreshold: 50,
    },
    {
      name: "バスタオル",
      category: "リネン",
      baseUnit: "枚",
      unitRates: [{ name: "束", rate: 10 }],
      alertEnabled: false,
    },
  ];

  for (const item of items) {
    const exists = await prisma.item.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.item.create({ data: item });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
