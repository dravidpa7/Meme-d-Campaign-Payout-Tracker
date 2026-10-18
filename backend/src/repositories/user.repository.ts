import { Role } from '../constants/roles';
import { IUser, UserModel } from '../models/user.model';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export const userRepository = {
  async create(data: CreateUserData): Promise<IUser> {
    const doc = await UserModel.create(data);
    return doc.toObject() as IUser;
  },

  /** Includes passwordHash (normally excluded) because login needs it. */
  findByEmailWithPassword(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').lean<IUser>().exec();
  },

  findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).lean<IUser>().exec();
  },
};
