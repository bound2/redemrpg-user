-- changeset:bound2-redpg-user-table
CREATE TABLE IF NOT EXISTS `user` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `created` datetime(3) NOT NULL,
    `steam_id` varchar(190) NOT NULL,
    `steam_name` varchar(190) NOT NULL,
    `version` int(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `steam_id_idx` (`steam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
