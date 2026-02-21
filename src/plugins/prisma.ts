import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// 1. Extend Fastify's type definition so TypeScript knows `fastify.prisma` exists
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

const prismaPlugin: FastifyPluginAsync = async (fastify, options) => {
  // 2. Setup the connection pool using your env var
  const connectionString = process.env.DATABASE_URL
  const pool = new Pool({ connectionString })

  // 3. Create the Prisma Adapter (The Fix for Prisma 7)
  const adapter = new PrismaPg(pool)

  // 4. Instantiate Prisma with the adapter
  const prisma = new PrismaClient({ adapter })

  // 5. Connect to the database
  await prisma.$connect()

  // 6. Decorate Fastify so you can use `fastify.prisma` in your routes
  fastify.decorate('prisma', prisma)

  // 7. Graceful shutdown: disconnect when Fastify closes
  fastify.addHook('onClose', async (server) => {
    await server.prisma.$disconnect()
  })
}

// Export with fastify-plugin so the decorator is available globally
export default fp(prismaPlugin)