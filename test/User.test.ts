import 'mocha';
import { expect } from 'chai';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

import { Pool, PoolConfig, createPool } from 'mariadb';

import 'reflect-metadata';
import { container } from 'tsyringe';

import { UserEntity } from '../src/server/repository/User.entity';
import { UserRepository } from '../src/server/repository/User.repository';
import { UserResource } from 'redemrpg-user-server-public-api';
import { UserResourceFactory } from '../src/server/factory/UserResource.factory';

let mariadbContainer: StartedTestContainer;
let dbPool: Pool;
let userRepository: UserRepository;
let userResourceFactory: UserResourceFactory;

before(async function () {
    this.timeout(120 * 1000); // declare timeout of up to 2 mins

    const dir = process.cwd();
    mariadbContainer = await new GenericContainer("mariadb", "10.5.1")
        .withEnv("MYSQL_DATABASE", "redemrpg")
        .withEnv("MYSQL_ROOT_PASSWORD", "test")
        .withBindMount(`${dir}/sql/0001-user-table.sql`, "/docker-entrypoint-initdb.d/0001.sql")
        .withExposedPorts(3306)
        .start();

    const config: PoolConfig = {
        host: mariadbContainer.getContainerIpAddress(),
        port: mariadbContainer.getMappedPort(3306),
        user: "root",
        password: "test",
        database: "redemrpg",
        connectTimeout: 1000,
        socketTimeout: 1000,
        initializationTimeout: 1000,
        acquireTimeout: 1000
    };

    dbPool = createPool(config);
    container.register<Pool>('dbPool', { useValue: dbPool });
    userRepository = container.resolve(UserRepository);
    userResourceFactory = container.resolve(UserResourceFactory);
});

after(async function () {
    if (dbPool) {
        await dbPool.end();
    }
    if (mariadbContainer) {
        await mariadbContainer.stop();
    }
});

describe('User.repository operations',
    () => {
        it('save and get', async () => {
            const steamId = "steam:110000102b0dc11";
            const steamName = "koko";
            await userRepository.save(steamId, steamName)
                .catch((err) => Promise.reject(err));
            const user: UserEntity = await userRepository.get(steamId)
                .catch((err) => Promise.reject(err));

            expect(user.id).to.equal(1);
            expect(user.steamId).to.equal(steamId);
            expect(user.steamName).to.equal(steamName);
            expect(user.version).to.equal(0);
        });
        it('save duplicate', async () => {
            const steamId = "steam:110000102b0de11";

            await Promise.all([userRepository.save(steamId, "dd1"), userRepository.save(steamId, "dd2")])
                .then(() => Promise.reject(new Error("Expected operation to fail with an exception")))
                .catch((err) => {
                    expect(err.message).contains(`Duplicate entry '${steamId}' for key 'steam_id_idx'`);
                });
        });
    }
);

describe('UserResource.factory operations',
    () => {
        it('create from UserEntity', () => {
            const entity: UserEntity = {
                id: 1,
                steamId: "steam:110000102b0de11",
                steamName: "kalapala",
                created: new Date(),
                version: 0
            };
            const result: UserResource = userResourceFactory.create(entity);
            expect(result.id).to.equal(entity.id);
            expect(result.steamId).to.equal(entity.steamId);
            expect(result.steamName).to.equal(entity.steamName);
        });
    }
);
