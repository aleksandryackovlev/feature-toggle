import { BadRequestException } from '@nestjs/common';

import { CrudService } from '../../core/crud/crud.service';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersDto } from './dto/find-users.dto';

export class UsersService extends CrudService({
  Entity: User,
  name: 'user',
  searchBy: 'username',
  CreateDto: CreateUserDto,
  UpdateDto: UpdateUserDto,
  FindDto: FindUsersDto,
}) {
  async create(createUserDto: CreateUserDto): Promise<User> {
    if (await this.findByUsername(createUserDto.username)) {
      throw new BadRequestException('User already exists');
    }

    const entity = this.repository.create(createUserDto);

    await this.repository.save(entity);

    return entity;
  }

  findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ username });
  }

  getUserWithPermissions(id: string): Promise<User | null> {
    const query = this.repository.createQueryBuilder('user');

    query.where('user.id = :id', { id });
    query.andWhere('permission.isAllowed = true');
    query.leftJoinAndMapMany(
      'user.permissions',
      'permission',
      'permission',
      'permission.roleId = user.roleId',
    );

    return query.getOne();
  }
}
