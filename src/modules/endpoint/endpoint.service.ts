import { HttpException, Inject, Injectable } from '@nestjs/common';
import { count, eq, like, sql } from 'drizzle-orm';
import { DRIZZLE } from 'src/database/drizzle.module';
import { endpoints } from 'src/database/schema';
import { DrizzleDB } from 'src/common/types/drizzle';
import { ParserService } from '../parser/parser.service';
import { RunnerService } from '../runner/runner.service';
import { ActionNode, Endpoint } from 'src/common/types';

@Injectable()
export class EndpointService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly parserService: ParserService,
    private readonly runnerService: RunnerService
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

  async upload(file: Express.Multer.File, projectName: string) {
    try {
      const data = this.parserService.createParser(file.mimetype).parse(file.buffer.toString());
      data.forEach((item: Endpoint) => {
        item.name = `${projectName}/${item.name}`;
      });
      const req = await this.db.insert(endpoints).values(data).onConflictDoUpdate({
        target: [endpoints.name, endpoints.method, endpoints.url],
        set: {
          name: `${projectName}` + sql`excluded.name`,
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

  async delete(id: string) {
    await this.getById(id);

    await this.db.delete(endpoints).where(eq(endpoints.id, id));

    return {};
  }

  async deleteAll() {
    await this.db.delete(endpoints);

    return {};
  }

  async search(name: string, page: number, limit: number) {
    const term = `%${name}%`;
    const [[{ total }], endpointList] = await Promise.all([
      this.db.select({ total: count() }).from(endpoints).where(like(endpoints.name, term)),
      this.db.select()
        .from(endpoints)
        .where(like(endpoints.name, term))
        .limit(10)
        .offset((page - 1) * limit)
    ]);

    return {
      total,
      data: endpointList
    }
  }

  async run(id: string, data: Record<string, any>) {
    const endpoint = (await this.getById(id)) as ActionNode;

    try {
      const { response } = await this.runnerService.run(endpoint, data);
      return response;
    } catch (error) {
      console.error('Error running endpoint:', error);
      throw new HttpException('Failed to run endpoint', 500);
    }
  }
}
