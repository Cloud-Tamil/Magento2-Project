-- Magento 2 database initialization script
-- Compatible with MySQL 8.0 authentication
CREATE USER IF NOT EXISTS 'magento'@'%' IDENTIFIED BY 'magento_secret_pw';
ALTER USER 'magento'@'%' IDENTIFIED BY 'magento_secret_pw';
GRANT ALL PRIVILEGES ON *.* TO 'magento'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
