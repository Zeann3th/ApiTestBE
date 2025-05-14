import { Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserInterface } from 'src/common/types';
import { RoleGuard } from 'src/guards/role.guard';
import { Roles } from 'src/decorators/role.decorator';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @ApiOperation({ summary: 'Get all projects' })
  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAll(
    @User() user: UserInterface,
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('limit', new DefaultValuePipe(20)) limit: number,
  ) {
    return await this.projectService.getAll(user, page, limit);
  }

  @ApiOperation({ summary: 'Get project by ID' })
  @UseGuards(RoleGuard)
  @Get(':projectId')
  @ApiParam({ name: 'projectId', required: true, type: String })
  async getById(@Param('projectId', new ParseUUIDPipe()) id: string) {
    return await this.projectService.getById(id);
  }

  @ApiOperation({ summary: 'Create a new project' })
  @Post()
  @ApiBody({
    description: 'Project data',
    schema: {
      properties: {
        name: { type: 'string', example: "VDT" },
        description: { type: 'string', example: "VDT project" },
      }
    },
  })
  async create(@User() user: UserInterface, @Body() body: { name: string; description: string }) {
    return await this.projectService.create(user, body);
  }

  @ApiOperation({ summary: "Update a project" })
  @UseGuards(RoleGuard)
  @Roles("OWNER")
  @ApiParam({ name: 'projectId', required: true, type: String })
  @ApiBody({
    description: 'Project data',
    type: UpdateProjectDto,
  })
  @Patch(':projectId')
  async update(@Param('projectId', new ParseUUIDPipe()) id: string, @Body() body: UpdateProjectDto) {
    return await this.projectService.update(id, body);
  }

  @Post(':projectId/members')
  async addMember(@User() user: UserInterface, @Param('projectId', new ParseUUIDPipe()) id: string, @Body() body: { userId: string; role: string }) {

  }

  @Delete(':projectId/members/:userId')
  async removeMember(@User() user: UserInterface, @Param('projectId', new ParseUUIDPipe()) id: string, @Param('userId', new ParseUUIDPipe()) userId: string) {

  }

  @Delete(':projectId')
  @HttpCode(204)
  async delete(@Param('projectId', new ParseUUIDPipe()) id: string) {
    return await this.projectService.delete(id);
  }
}
