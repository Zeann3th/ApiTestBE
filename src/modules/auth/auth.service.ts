import { HttpException, Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/drizzle.module';
import { DrizzleDB } from 'src/database/types/drizzle';
import { LoginUserDto, RegisterUserDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { users } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import env from 'src/common';
import { MailService } from './mail.service';
import { ResetUserPasswordDto, VerifyUserEmailDto } from './dto/verify-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) { }

  async register({ username, email, password, name }: RegisterUserDto) {
    password = await bcrypt.hash(password, 10);
    try {
      const user = await this.db.insert(users).values({ username, email, password, name }).returning().get();

      const payload = { sub: user.id, username: user.username, email: user.email };

      const accessToken = this.createToken(payload, 'access');
      const verifyToken = this.createToken(payload, 'verify');
      const refreshToken = this.createToken(payload, 'refresh');

      this.mailService.sendVerifyEmail(email, verifyToken);

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

  async forgotPassword(email: string) {
    if (!email) throw new HttpException("Email is required", 400);

    const [user] = await this.db.select().from(users)
      .where(eq(users.email, email));

    if (!user) throw new HttpException("User not found", 404);

    const verifyToken = this.createToken({ sub: user.id, username: user.username, email: user.email }, 'verify');

    try {
      await this.mailService.sendResetPasswordEmail(email, verifyToken);
    } catch (e) {
      throw new HttpException("Failed to send email", 500);
    }

    return { message: "Password reset email sent" };
  }

  async resetPassword({ password, token }: ResetUserPasswordDto) {
    try {
      const decoded = this.jwtService.verify(token, { secret: env.JWT_VERIFY_SECRET });
      const email = decoded.email;

      if (!email) throw new HttpException("Invalid token", 403);

      const [user] = await this.db.select().from(users)
        .where(eq(users.email, email));

      if (!user) throw new HttpException("User not found", 404);

      const hashedPassword = await bcrypt.hash(password, 10);

      await this.db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, email));

      return { message: "Password reset successfully" };
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new HttpException("Token expired", 401);
      }
      if (e.name === 'JsonWebTokenError') {
        throw new HttpException("Invalid token", 403);
      }
      throw new HttpException("Failed to reset password", 500);
    }
  }

  async verifyEmail({ token }: VerifyUserEmailDto) {
    try {
      const decoded = this.jwtService.verify(token, { secret: env.JWT_VERIFY_SECRET });
      const email = decoded.email;

      if (!email) throw new HttpException("Invalid token", 403);

      const [user] = await this.db.select().from(users)
        .where(eq(users.email, email));

      if (!user) throw new HttpException("User not found", 404);

      await this.db.update(users)
        .set({ isVerified: 1 })
        .where(eq(users.email, email));

      return { message: "Email verified successfully" };
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new HttpException("Token expired", 401);
      }
      if (e.name === 'JsonWebTokenError') {
        throw new HttpException("Invalid token", 403);
      }
      throw new HttpException("Failed to verify email", 500);
    }
  }

  async resendEmail(email: string, action: string) {
    if (!email || !action) throw new HttpException("Email and action are required", 400);
    if (action !== 'verify' && action !== 'reset') throw new HttpException("Invalid action", 400);

    const [user] = await this.db.select().from(users)
      .where(eq(users.email, email));

    if (!user) throw new HttpException("User not found", 404);

    const verifyToken = this.createToken({ sub: user.id, username: user.username, email: user.email }, 'verify');

    try {
      if (action === 'verify') {
        await this.mailService.sendVerifyEmail(email, verifyToken);
      } else if (action === 'reset') {
        await this.mailService.sendResetPasswordEmail(email, verifyToken);
      }
    } catch (e) {
      throw new HttpException("Failed to send email", 500);
    }

    return { message: "Email sent successfully" };
  }

  private createToken(payload: object, type: string): string {
    if (type === 'verify') {
      return this.jwtService.sign(payload, {
        secret: env.JWT_VERIFY_SECRET,
        expiresIn: "10m"
      });
    }
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
