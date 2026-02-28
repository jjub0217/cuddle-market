import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { NextRequest } from 'next/server'
import { typeDefs } from '@/graphql/schema'
import { resolvers } from '@/graphql/resolvers'

const server = new ApolloServer({ typeDefs, resolvers })
const handler = startServerAndCreateNextHandler<NextRequest>(server)

// Must wrap - direct export causes Next.js 16 type error
export async function GET(req: NextRequest) {
  return handler(req)
}

export async function POST(req: NextRequest) {
  return handler(req)
}
