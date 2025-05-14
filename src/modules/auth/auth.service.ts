import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { LoginUserDto, RegisterUserDto } from './auth.dto';
import * as bcrypt from 'bcrypt';
import { users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import env from 'src/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private readonly jwtService: JwtService,
  ) { }

  async register({ username, email, password }: RegisterUserDto) {
    password = await bcrypt.hash(password, 10);
    try {
      const user = await this.db.insert(users).values({ username, password, email }).returning().get();

      const payload = { sub: user.id, username: user.username, email: user.email };

      const accessToken = this.createToken(payload, 'access');
      const refreshToken = this.createToken(payload, 'refresh');

      await this.db.update(users)
        .set({ refreshToken })
        .where(eq(users.id, user.id));

      return { accessToken, refreshToken };
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT') {
        throw new HttpException("User already exists", 409);
      }
      throw new HttpException("Failed to register user", 500);
    }
  }

  async login({ username, email, password }: LoginUserDto) {
    let user: any;
    if (username) {
      [user] = await this.db.select().from(users)
        .where(eq(users.username, username));
    } else if (email) {
      [user] = await this.db.select().from(users)
        .where(eq(users.email, email));
    }

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    if (!await bcrypt.compare(password, user.password)) {
      throw new HttpException("Invalid password", 401);
    }

    const payload = { sub: user.id, username: user.username, email: user.email };

    const accessToken = this.createToken(payload, 'access');
    const refreshToken = this.createToken(payload, 'refresh');

    await this.db.update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id));

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.db.update(users)
        .set({ refreshToken: null })
        .where(eq(users.refreshToken, refreshToken));
    }
    return;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new HttpException("Refresh token is required", 401);

    try {
      this.jwtService.verify(refreshToken, { secret: env.JWT_REFRESH_SECRET });

      const [user] = await this.db.select().from(users).where(eq(users.refreshToken, refreshToken));
      if (!user) throw new HttpException("Invalid refresh token", 403);

      const accessToken = this.createToken({ sub: user.id, username: user.username, email: user.email }, 'access');

      return { access_token: accessToken };
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new HttpException("Refresh token expired", 401);
      }
      if (e.name === 'JsonWebTokenError') {
        throw new HttpException("Invalid refresh token", 403);
      }
      throw new HttpException("Failed to refresh user's access token", 500);
    }
  }

  private createToken(payload: object, type: string): string {
    if (type === 'access') {
      return this.jwtService.sign(payload, {
        secret: env.JWT_ACCESS_SECRET,
        expiresIn: "15m"
      });
    }
    if (type === 'refresh') {
      return this.jwtService.sign(payload, {
        secret: env.JWT_REFRESH_SECRET,
        expiresIn: "7d"
      });
    }
    throw new HttpException("Invalid token type", 400);
  }
}
