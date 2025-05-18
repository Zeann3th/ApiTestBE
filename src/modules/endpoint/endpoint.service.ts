import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { endpoints } from 'src/database/schema';
import { DrizzleDB } from 'src/common/types/drizzle';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class EndpointService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly parserService: ParserService
  ) { }

  async getAll(page: number, limit: number) {
    const [[{ total }], endpointList] = await Promise.all([
      this.db.select({ total: count() }).from(endpoints),
      this.db.select().from(endpoints)
        .limit(limit)
        .offset((page - 1) * limit)
    ]);

    return {
      total,
      data: endpointList
    }
  }

  async getById(id: string) {
    const [endpoint] = await this.db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, id));

    if (!endpoint) {
      throw new HttpException('Endpoint not found', 404);
    }

    return endpoint;
  }

  async upload(file: Express.Multer.File) {
    try {
      const data = this.parserService.createParser(file.mimetype).parse(file.buffer.toString());
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
          updatedAt: new Date().toISOString()
        }
      });
      return { message: `${req.rowsAffected} endpoints upserted` };
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new HttpException("Invalid file", 400);
    }
  }

  async update(id: string, body: any) {
  }
}
