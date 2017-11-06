const pgp = require('pg-promise')({});
const db = pgp({database: 'restaurantv2'});
const pbkdf2 = require('pbkdf2');
const crypto = require('crypto');
//as of november 10, 2017, pbkdf2 is the strongest next to bcrypt.
//generate a random salt unique to each user.
var salt = crypto.randomBytes(20).toString('hex');
//retrieve the user-entered password
var password = 'some-password';
//churcn it through pbkdf2 along with the salt 36000 times via sha256.
var key = pbkdf2.pbkdf2Sync(
  password, salt, 36000, 256, 'sha256'
);
//the key might be in binary, idk
//convert it to a hex string(i think hex means alphanumeric)
var hash = key.toString('hex');
//storing the password
//store it with the crypy library you used, the encode version, the # of iterations, with the unique salt, and the churned out hash.
var stored_pass = `pbkdf2_sha256$36000$${salt}$${hash}`;
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// checking a password
//break the stored password into parts
var pass_parts = stored_pass.split('$');
//take the user-entered password and churn that just like before.
var key = pbkdf2.pbkdf2Sync(
  'some-password',
  pass_parts[2],
  parseInt(pass_parts[1]),
  256, 'sha256'
);
//convert the churned out result into a hash
//now match now the freshly churned out hash with the old stored hash
//pro-tip: keep log of datetime. keep count of how many times user tries to login, if over 3 times, lock out until datetime(now) + 15 minutes. 
var hash = key.toString('hex');
if (hash === pass_parts[3]) {
  console.log('Passwords Matched!');
}
