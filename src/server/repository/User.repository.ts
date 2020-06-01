import { injectable, inject } from 'tsyringe';
import { Pool, PoolConnection } from 'mariadb';
import { UserEntity } from './entity/User.entity';

@injectable()
export class UserRepository {
    public constructor(@inject('dbPool') private pool: Pool) {}

    public async save(steamId: string, steamName: string): Promise<void> {
        const conn: PoolConnection = await this.pool.getConnection();
        await conn.beginTransaction();

        return conn
            .query(
                `
                INSERT INTO user
                    (created, steam_id, steam_name)
                VALUES
                    (?, ?, ?)
                `,
                [new Date(), steamId, steamName],
            )
            .then(() => conn.commit())
            .catch(err => {
                conn.rollback();
                return Promise.reject(err);
            })
            .finally(() => conn.release());
    }

    public async get(steamId: string): Promise<UserEntity | undefined> {
        const conn: PoolConnection = await this.pool.getConnection();
        await conn.beginTransaction();

        return conn
            .query(
                `
                SELECT 
                    id as id,
                    created as created,
                    steam_id as steamId,
                    steam_name as steamName,
                    version as version
                FROM user
                WHERE steam_id = ?
                `,
                [steamId],
            )
            .then((rows: Array<UserEntity>) => {
                conn.commit();
                const user = rows[0];
                if (!user) {
                    return undefined;
                }
                return user;
            })
            .catch(err => {
                conn.rollback();
                return Promise.reject(err);
            })
            .finally(() => conn.release());
    }
}
