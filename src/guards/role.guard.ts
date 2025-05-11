import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { UserInterface } from 'src/common/types';
import { DRIZZLE } from 'src/database/drizzle.module';
import { projectMembers } from 'src/database/schema';
import { DrizzleDB } from 'src/database/types/drizzle';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const user: UserInterface = request.user;
        const projectId = String(request.params.projectId);

        if (!projectId || projectId.trim() === '') {
            throw new ForbiddenException('Missing projectId in route');
        }

        const [membership] = await this.db.select()
            .from(projectMembers)
            .where(and(
                eq(projectMembers.userId, user.sub),
                eq(projectMembers.projectId, projectId)
            ))

        if (!membership) {
            throw new ForbiddenException('You are not a member of this project');
        }

        user.role = membership.role;
        request.user = user;
        return true;
    }
}
