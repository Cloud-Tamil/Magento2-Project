-- Magento 2 database initialization script
-- Grants and privilege preparation
GRANT ALL PRIVILEGES ON *.* TO 'magento'@'%' IDENTIFIED BY 'magento_secret_pw' WITH GRANT OPTION;
FLUSH PRIVILEGES;
