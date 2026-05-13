import { PrismaClient } from "@prisma/client";
import { DEFAULT_HOTEL_ID } from "../src/config/hotels";

const prisma = new PrismaClient();

async function main() {
  const hotelId = DEFAULT_HOTEL_ID;

  const locations = [
    { hotelId, floor: "1F", roomName: "リネン庫", sortOrder: 10 },
    { hotelId, floor: "1F", roomName: "アメニティ倉庫", sortOrder: 20 },
    { hotelId, floor: "2F", roomName: "清掃ワゴン置場", sortOrder: 30 },
    { hotelId, floor: "3F", roomName: "客室備品庫", sortOrder: 40 },
  ];

  for (const loc of locations) {
    const exists = await prisma.location.findFirst({
      where: { hotelId: loc.hotelId, floor: loc.floor, roomName: loc.roomName },
    });
    if (!exists) {
      await prisma.location.create({ data: loc });
    }
  }

  const items = [
    {
      hotelId,
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
      hotelId,
      name: "シャンプー(小)",
      category: "アメニティ",
      baseUnit: "本",
      unitRates: [{ name: "箱", rate: 100 }],
      alertEnabled: true,
      alertThreshold: 50,
    },
    {
      hotelId,
      name: "バスタオル",
      category: "リネン",
      baseUnit: "枚",
      unitRates: [{ name: "束", rate: 10 }],
      alertEnabled: false,
    },
  ];

  for (const item of items) {
    const exists = await prisma.item.findFirst({
      where: { hotelId: item.hotelId, name: item.name },
    });
    if (!exists) {
      await prisma.item.create({ data: item });
    }
  }

  console.log(`Seed completed for hotel: ${hotelId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
