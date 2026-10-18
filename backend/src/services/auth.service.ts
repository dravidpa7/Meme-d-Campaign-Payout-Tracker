import { Role } from '../constants/roles';
import { toUserDto, UserDto } from '../dtos/user.dto';
import { ConflictError, UnauthorizedError } from '../errors/http-errors';
import { userRepository } from '../repositories/user.repository';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';

export interface AuthResult {
  user: UserDto;
  token: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export const authService = {
  async signup(input: SignupInput): Promise<AuthResult> {
    const existing = await userRepository.findByEmailWithPassword(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
    });

    return { user: toUserDto(user), token: signToken({ sub: user._id.toString(), role: user.role }) };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmailWithPassword(email);
    // Same message for unknown email and wrong password: don't reveal which accounts exist.
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return { user: toUserDto(user), token: signToken({ sub: user._id.toString(), role: user.role }) };
  },
};
