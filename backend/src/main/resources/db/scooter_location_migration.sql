ALTER TABLE `scooter`
    ADD COLUMN `longitude` DECIMAL(10, 6) DEFAULT NULL COMMENT 'GCJ-02 longitude for map display' AFTER `location`,
    ADD COLUMN `latitude` DECIMAL(10, 6) DEFAULT NULL COMMENT 'GCJ-02 latitude for map display' AFTER `longitude`;

UPDATE `scooter` SET `location` = 'Campus North Gate', `longitude` = 113.323912, `latitude` = 23.097891 WHERE `scooter_code` = 'SC001';
UPDATE `scooter` SET `location` = 'Library Plaza', `longitude` = 113.324865, `latitude` = 23.098214 WHERE `scooter_code` = 'SC002';
UPDATE `scooter` SET `location` = 'Sports Center', `longitude` = 113.325742, `latitude` = 23.096845 WHERE `scooter_code` = 'SC003';
UPDATE `scooter` SET `location` = 'Student Dorm A', `longitude` = 113.322768, `latitude` = 23.095932 WHERE `scooter_code` = 'SC004';
UPDATE `scooter` SET `location` = 'Campus South Gate', `longitude` = 113.321954, `latitude` = 23.094821 WHERE `scooter_code` = 'SC005';
UPDATE `scooter` SET `location` = 'Cafeteria Square', `longitude` = 113.323247, `latitude` = 23.096374 WHERE `scooter_code` = 'SC006';
UPDATE `scooter` SET `location` = 'Teaching Building B', `longitude` = 113.326184, `latitude` = 23.097402 WHERE `scooter_code` = 'SC007';
UPDATE `scooter` SET `location` = 'Parking Lot P1', `longitude` = 113.327015, `latitude` = 23.095648 WHERE `scooter_code` = 'SC008';
UPDATE `scooter` SET `location` = 'Main Entrance', `longitude` = 113.320986, `latitude` = 23.098653 WHERE `scooter_code` = 'SC009';
UPDATE `scooter` SET `location` = 'Gymnasium', `longitude` = 113.325116, `latitude` = 23.094973 WHERE `scooter_code` = 'SC010';
