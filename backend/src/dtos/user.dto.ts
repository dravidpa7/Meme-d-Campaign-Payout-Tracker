import { Role } from '../constants/roles';
import { IUser } from '../models/user.model';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** Never exposes passwordHash. */
export const toUserDto = (u: IUser): UserDto => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  role: u.role,
});
