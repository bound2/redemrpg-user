import { singleton } from 'tsyringe';
import { UserEntity } from '../repository/User.entity';
import { UserResource } from 'redemrpg-user-server-public-api';

@singleton()
export class UserResourceFactory {

    public create(user: UserEntity): UserResource {
        const resource: UserResource = {
            id: user.id,
            steamId: user.steamId,
            steamName: user.steamName
        };
        return resource;
    }
}