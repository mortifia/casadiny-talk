import postgres from 'postgres'

// postgres connection
const sqlClient = postgres('postgres://t:t@localhost:5432/casadiny_talk')

export default sqlClient