const dns = require('dns');
dns.lookup('db.kxkabnahclcsitfkllvg.supabase.co', { all: true }, (err, addresses) => {
  if (err) console.error(err);
  else console.log(addresses);
});
