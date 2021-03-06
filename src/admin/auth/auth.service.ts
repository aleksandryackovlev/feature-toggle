import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { Bcrypt } from './auth.bcrypt';

/* eslint-disable @typescript-eslint/no-unused-vars */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcrypt: Bcrypt,
  ) {}

  async validateUser(username: string, pwd: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);

    if (!user || !(await this.bcrypt.compare(pwd, user.password))) {
      return null;
    }

    const { password, ...result } = user;

    return result;
  }

  async login(user: any) {
    return {
      data: {
        access_token: this.jwtService.sign({ id: user.id }),
      },
    };
  }
}
