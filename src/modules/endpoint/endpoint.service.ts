import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { endpoints } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';
import { ApiSpecParserFactory } from './parser';

@Injectable()
export class EndpointService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async getAll(projectId: string, page: number, limit: number) {
    const [[{ total }], endpointList] = await Promise.all([
      this.db.select({ total: count() }).from(endpoints)
        .where(eq(endpoints.projectId, projectId)),
      this.db.select().from(endpoints)
        .where(eq(endpoints.projectId, projectId))
        .limit(limit)
        .offset((page - 1) * limit)
    ]);

    return {
      total,
      data: endpointList
    }

  }

  async getById(projectId: string, id: string) {
    const [endpoint] = await this.db
      .select()
      .from(endpoints)
      .where(and(
        eq(endpoints.projectId, projectId),
        eq(endpoints.id, id)
      ));

    if (!endpoint) {
      throw new HttpException('Endpoint not found', 404);
    }

    return endpoint;
  }

  async upload(projectId: string, file: Express.Multer.File) {
    try {
      const parser = ApiSpecParserFactory.createParser(file.mimetype);
      const endpointList = parser.parse(file.buffer.toString());
      const data = endpointList.map((endpoint) => ({ ...endpoint, projectId }))
      const req = await this.db.insert(endpoints).values(data).onConflictDoUpdate({
        target: [endpoints.method, endpoints.url],
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          method: sql`excluded.method`,
          url: sql`excluded.url`,
          headers: sql`excluded.headers`,
          body: sql`excluded.body`,
          parameters: sql`excluded.parameters`,
          preProcessors: sql`excluded.pre_processors`,
          postProcessors: sql`excluded.post_processors`,
          updatedAt: new Date().toISOString()
        }
      });
      return { message: `${req.rowsAffected} endpoints upserted` };
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new HttpException("Invalid file", 400);
    }
  }

  async update(projectId: string, id: string, body: any) {
  }
}
