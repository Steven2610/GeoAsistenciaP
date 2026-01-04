/*import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();*/
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Exporta ambas formas para evitar errores en todo el proyecto
export default prisma;
export { prisma };

