import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IFindEntitiesDto as FindDtoType } from '../crud/interfaces';

import { RolesService } from './roles.service';
import { Role } from './role.entity';

const role = new Role();
role.id = '935a38e8-ec14-41b8-8066-2bc5c818577a';
role.name = 'admin';
role.users = [];
role.description = 'Description';

const resultArr = [role];

const query = {
  where: jest.fn(),
  andWhere: jest.fn(),
  offset: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  getManyAndCount: jest.fn().mockReturnValue([resultArr, 1]),
};

describe('RolesService', () => {
  let service: RolesService;
  let repo: Repository<Role>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(query),
            findOne: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    jest.clearAllMocks();

    service = module.get<RolesService>(RolesService);
    repo = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  describe('isRoleExists', () => {
    it('should return false if an role with the given id does not exist', () => {
      const repoSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(null);

      expect(service.isRoleExists('uid')).resolves.toEqual(false);
      expect(repoSpy).toBeCalledTimes(1);
      expect(repoSpy).toBeCalledWith('uid');
    });

    it('should return true if an role with the given id does not exist', async () => {
      const repoSpy = jest
        .spyOn(repo, 'findOne')
        .mockResolvedValueOnce(<Role>{ name: 'name' });

      await expect(service.isRoleExists('uid')).resolves.toEqual(true);
      expect(repoSpy).toBeCalledTimes(1);
      expect(repoSpy).toBeCalledWith('uid');
    });
  });

  describe('find', () => {
    it('should query the repository with the default params if no args are given', async () => {
      await expect(service.find(<FindDtoType>{})).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.where).toBeCalledTimes(0);
      expect(query.andWhere).toBeCalledTimes(0);
      expect(query.offset).toBeCalledTimes(0);

      expect(query.orderBy).toBeCalledTimes(1);
      expect(query.orderBy).toBeCalledWith('role.updatedAt', 'DESC');

      expect(query.limit).toBeCalledTimes(1);
      expect(query.limit).toBeCalledWith(10);

      expect(query.getManyAndCount).toBeCalledTimes(1);
    });

    it('should be able to filter roles by the creation date range', async () => {
      await expect(
        service.find(<FindDtoType>{
          createdFrom: new Date('2020-09-09'),
          createdTo: new Date('2020-09-14'),
        }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.where).toBeCalledTimes(1);
      expect(query.where).toBeCalledWith(
        'CAST (role.createdAt AS DATE) >= :createdFrom',
        {
          createdFrom: new Date('2020-09-09'),
        },
      );

      expect(query.andWhere).toBeCalledTimes(1);
      expect(query.andWhere).toBeCalledWith(
        'CAST (role.createdAt AS DATE) <= :createdTo',
        {
          createdTo: new Date('2020-09-14'),
        },
      );
    });

    it('should be able to filter roles by the update date range', async () => {
      await expect(
        service.find(<FindDtoType>{
          updatedFrom: new Date('2020-09-09'),
          updatedTo: new Date('2020-09-14'),
        }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.where).toBeCalledTimes(1);
      expect(query.where).toBeCalledWith(
        'CAST (role.updatedAt AS DATE) >= :updatedFrom',
        {
          updatedFrom: new Date('2020-09-09'),
        },
      );

      expect(query.andWhere).toBeCalledTimes(1);
      expect(query.andWhere).toBeCalledWith(
        'CAST (role.updatedAt AS DATE) <= :updatedTo',
        {
          updatedTo: new Date('2020-09-14'),
        },
      );
    });

    it('should be able to filter roles by substring of the name', async () => {
      await expect(
        service.find(<FindDtoType>{ search: 'some name' }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.where).toBeCalledTimes(1);
      expect(query.where).toBeCalledWith('role.name LIKE :search', {
        search: '%some name%',
      });
    });

    it('should skip the given amount on entities if offset is set', async () => {
      await expect(
        service.find(<FindDtoType>{ search: 'some name', offset: 300 }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.offset).toBeCalledTimes(1);
      expect(query.offset).toBeCalledWith(300);
    });

    it('should sort entities by given params', async () => {
      await expect(
        service.find(<FindDtoType>{
          sortBy: 'name',
          sortDirection: 'asc',
        }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.orderBy).toBeCalledTimes(1);
      expect(query.orderBy).toBeCalledWith('role.name', 'ASC');
    });

    it('should return the given amount of entities if limit is set', async () => {
      await expect(
        service.find(<FindDtoType>{
          limit: 200,
          sortBy: 'name',
          sortDirection: 'asc',
        }),
      ).resolves.toEqual({
        data: resultArr,
        total: 1,
      });

      expect(query.limit).toBeCalledTimes(1);
      expect(query.limit).toBeCalledWith(200);
    });
  });
});
