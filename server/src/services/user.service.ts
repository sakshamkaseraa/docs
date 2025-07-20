import { genSalt, hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../db/models/user.model';
import { mailService } from './mail.service';
import { RefreshToken } from '../db/models/refresh-token.model';
import env from '../config/env.config';

class UserService {
  public findUserByEmail = async (email: string): Promise<User | null> => {
    return await User.findOne({ where: { email } });
  };

  public findUserById = async (id: number): Promise<User | null> => {
    return await User.findByPk(id);
  };

  public findUserByVerificationToken = async (
    email: string,
    verificationToken: string
  ): Promise<User | null> => {
    return await User.findOne({
      where: {
        email,
        verificationToken,
      },
    });
  };

  public findUserByPasswordResetToken = async (
    email: string,
    passwordResetToken: string
  ): Promise<User | null> => {
    return await User.findOne({
      where: {
        email,
        passwordResetToken,
      },
    });
  };

  public createUser = async (email: string, password: string) => {
    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);
    const verificationToken = jwt.sign({ email }, env.VERIFY_EMAIL_SECRET);

    const user = await User.create({
      email,
      password: hashedPassword,
      verificationToken,
    });

    await this.sendVerificationEmail(user);
  };

  public checkPassword = async (
    user: User,
    password: string
  ): Promise<boolean> => {
    return await compare(password, user.password);
  };

  public generateAuthResponse = async (
    user: RequestUser | User
  ): Promise<TokenPair> => {
    const requestUser = await this.getRequestUser(user);

    const accessToken = jwt.sign(requestUser, env.ACCESS_TOKEN_SECRET, {
      expiresIn: env.ACCESS_TOKEN_EXPIRATION,
    });

    const refreshToken = jwt.sign(requestUser, env.REFRESH_TOKEN_SECRET, {
      expiresIn: env.REFRESH_TOKEN_EXPIRATION,
    });

    await RefreshToken.destroy({ where: { userId: requestUser.id } });
    await RefreshToken.create({ token: refreshToken, userId: requestUser.id });

    return { accessToken, refreshToken };
  };

  public getIsTokenActive = async (token: string): Promise<boolean> => {
    const refreshToken = await RefreshToken.findOne({ where: { token } });
    return refreshToken !== null;
  };

  public logoutUser = async (userId: number) => {
    await RefreshToken.destroy({ where: { userId } });
  };

  public resetPassword = async (user: User) => {
    const passwordResetToken = jwt.sign(
      { id: user.id, email: user.email },
      env.PASSWORD_RESET_SECRET,
      { expiresIn: env.PASSWORD_RESET_EXPIRATION }
    );

    await user.update({ passwordResetToken });
    await this.sendPasswordResetEmail(user);
  };

  public updatePassword = async (user: User, password: string) => {
    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);
    await user.update({ password: hashedPassword });
  };

  public updateIsVerified = async (user: User, isVerified: boolean) => {
    await user.update({ isVerified });
  };

  private sendPasswordResetEmail = async (user: User) => {
    const mail = {
      from: process.env.SMTP_USER || 'sakshamkaseraa@gmail.com',
      to: user.email,
      subject: 'Reset your password!',
      text: `${env.FRONT_END_URL}/user/reset-email/${user.passwordResetToken}`,
    };

    try {
      await mailService.sendMail(mail);
      console.log(`📧 Password reset email sent to ${user.email}`);
    } catch (err) {
      console.error(`❌ Failed to send password reset email to ${user.email}`, err);
    }
  };

  private sendVerificationEmail = async (user: User) => {
    const mail = {
      from: process.env.SMTP_USER || 'sakshamkaseraa@gmail.com',
      to: user.email,
      subject: 'Welcome to Docs!',
      text: `Click the following link to verify your email: ${env.FRONT_END_URL}/user/verify-email/${user.verificationToken}`,
    };

    try {
      await mailService.sendMail(mail);
      console.log(`📧 Verification email sent to ${user.email}`);
    } catch (err) {
      console.error(`❌ Failed to send verification email to ${user.email}`, err);
    }
  };

  private getRequestUser = async (
    user: User | RequestUser
  ): Promise<RequestUser> => {
    if (user instanceof User) {
      const userWithRoles = await User.scope('withRoles').findByPk(user.id);
      const roles = userWithRoles?.userRoles.map((ur) => ur.role.name);
      return {
        id: user.id,
        email: user.email,
        roles,
      } as RequestUser;
    }
    return user;
  };
}

const userService = new UserService();
export { userService };
