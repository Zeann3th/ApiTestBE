import { HttpException, Inject, Injectable } from '@nestjs/common';
import { and, eq, count } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { projectMembers, projects } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class ProjectService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

    async getAll(user: UserInterface, page: number, limit: number) {
        const [[{ total }], data] = await Promise.all([this.db
            .select({ total: count() })
            .from(projects)
            .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
            .where(eq(projectMembers.userId, user.sub)),
        this.db
            .select({ project: projects })
            .from(projects)
            .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
            .where(eq(projectMembers.userId, user.sub))
            .limit(limit)
            .offset((page - 1) * limit)
        ]);

        return {
            total,
            data: data.map((item) => item.project)
        }
    }

    async getById(id: string) {
        const [project] = await this.db
            .select()
            .from(projects)
            .where(eq(projects.id, id));

        if (!project) {
            throw new HttpException('Project not found', 404);
        }

        return project;
    }


    async create(user: UserInterface, body: { name: string; description: string }) {
        const project = await this.db.insert(projects).values(body).returning().get()
        await this.db.insert(projectMembers).values({
            projectId: project.id,
            userId: user.sub,
            role: "OWNER",
        });
        return project;
    }

    async update(id: string, body: { name?: string; description?: string }) {
        return await this.db.update(projects).set(body).where(eq(projects.id, id));
    }

    async delete(id: string) {
        await this.db.delete(projects).where(eq(projects.id, id));
        return {};
    }
}
