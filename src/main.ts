import env from './common/env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

const setMiddleware = (app: NestExpressApplication) => {
  app.set("trust proxy", 1);

  app.use(compression());

  app.use(helmet());

  app.enableCors({
    origin: env.APP_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  });

  app.use(morgan("combined"));

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new Logger("[]"),
  });

  const logger = new Logger("APP");
  app.useLogger(logger);

  app.setGlobalPrefix("v1");

  setMiddleware(app);

  if (env.NODE_ENV !== "production" && process.pkg === undefined) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Postman BE")
      .setDescription('API documentation for Postman Backend')
      .setVersion('alpha')
      .addBearerAuth()
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('swagger', app, swaggerDocument, {
      jsonDocumentUrl: 'swagger/json',
    });
  }


  await app.listen(env.PORT, () => {
    logger.log(`🚀 Postman BE 0.0.1 on http://localhost:${env.PORT}`);
  });
}

bootstrap();
