import dotenv from 'dotenv';

dotenv.config();

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? '',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  enableCron: (process.env.ENABLE_CRON ?? 'true') === 'true',
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID ?? '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET ?? '',
    username: process.env.REDDIT_USERNAME ?? '',
    password: process.env.REDDIT_PASSWORD ?? '',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'radar-dev-secret-cambiar-en-produccion',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
};

export function assertDbConfigured(): void {
  if (!env.mongodbUri) {
    console.error(
      '\n[Radar] Falta MONGODB_URI en backend/.env — pega tu cadena de conexión de MongoDB Atlas.\n'
    );
    process.exit(1);
  }
}
