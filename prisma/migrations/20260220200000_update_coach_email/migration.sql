-- Update coach email from old domain to Gmail
UPDATE "Coach" SET email = 'cannoli.strength@gmail.com' WHERE email = 'joe@cannolistrength.com';
UPDATE "User" SET email = 'cannoli.strength@gmail.com' WHERE email = 'joe@cannolistrength.com';
